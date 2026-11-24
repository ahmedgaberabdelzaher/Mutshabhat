/**
 * Best-effort word / letter difference finder for mutashabihat pairs (QMT-26).
 *
 * Runs at BUILD time (scripts/lib/auto-diff.mjs) to produce data-driven highlight rules, and is unit-tested.
 * It never changes the Quran text: it only returns indexes into the Tanzil tokens (text.split(' ')).
 * Kept free of path aliases and runtime-only TS syntax so Node can import it with type stripping.
 */

export type Side = { ayahId: string; words: string[] }[];
export type DiffWordRange = { ayahId: string; startWord: number; endWord: number };
export type DiffLetterRange = { ayahId: string; word: number; start: number; end: number };
export type DiffType = 'زيادة' | 'نقص' | 'تقديم/تأخير' | 'إبدال';

export type PairDiff = {
  a: { ranges: DiffWordRange[]; letters: DiffLetterRange[] };
  b: { ranges: DiffWordRange[]; letters: DiffLetterRange[] };
  granularity: 'word' | 'letter' | 'none';
  /** Only set when the pattern is unambiguous. Relative to side A. */
  type?: DiffType;
  /** Share of comparable words that matched (0–1). */
  matchRatio: number;
  confidence: 'high' | 'medium' | 'low';
};

// Arabic harakat, Quranic annotation marks, small letters, tatweel — ignored when COMPARING (never removed from text).
const MARKS = /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u0640\u08D3-\u08FF]/g;
const ALEF_FORMS = /[\u0622\u0623\u0625\u0671\u0672\u0673]/g; // آ أ إ ٱ → ا

/** Comparison key for a token: letters only, alef forms unified. Empty for pause-mark-only tokens. */
export function comparisonKey(token: string): string {
  return token.replace(MARKS, '').replace(ALEF_FORMS, '\u0627').replace(/\u0649/g, '\u064A');
}

/** Grapheme-ish clusters: a base character followed by its combining marks. Offsets are UTF-16. */
export function clusters(word: string): { text: string; start: number; end: number; base: string }[] {
  const out: { text: string; start: number; end: number; base: string }[] = [];
  const isMark = (ch: string) => /[\u0610-\u061A\u064B-\u065F\u0670\u06D6-\u06ED\u08D3-\u08FF]/.test(ch);
  for (let i = 0; i < word.length; i++) {
    const ch = word[i];
    if (out.length && isMark(ch)) {
      const last = out[out.length - 1];
      last.text += ch;
      last.end = i + 1;
    } else {
      out.push({ text: ch, start: i, end: i + 1, base: comparisonKey(ch) });
    }
  }
  return out;
}

/** Classic LCS returning matched index pairs, in order. */
export function lcsPairs<T>(a: T[], b: T[], eq: (x: T, y: T) => boolean): [number, number][] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = eq(a[i], b[j]) ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const pairs: [number, number][] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (eq(a[i], b[j])) {
      pairs.push([i, j]);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++;
    else j++;
  }
  return pairs;
}

type Tok = { ayahId: string; word: number; raw: string; key: string };

function flatten(side: Side): Tok[] {
  const toks: Tok[] = [];
  for (const a of side) {
    a.words.forEach((raw, word) => {
      const key = comparisonKey(raw);
      if (key) toks.push({ ayahId: a.ayahId, word, raw, key }); // skip pause marks / empty tokens
    });
  }
  return toks;
}

function toRanges(toks: Tok[]): DiffWordRange[] {
  const ranges: DiffWordRange[] = [];
  for (const t of toks) {
    const last = ranges[ranges.length - 1];
    if (last && last.ayahId === t.ayahId && last.endWord === t.word - 1) last.endWord = t.word;
    else ranges.push({ ayahId: t.ayahId, startWord: t.word, endWord: t.word });
  }
  return ranges;
}

/** Letter-level difference between two words (by clusters). Returns differing cluster spans for each side. */
export function letterDiff(x: string, y: string): { a: [number, number][]; b: [number, number][] } {
  const cx = clusters(x);
  const cy = clusters(y);
  const pairs = lcsPairs(cx, cy, (p, q) => p.text === q.text);
  const keepA = new Set(pairs.map((p) => p[0]));
  const keepB = new Set(pairs.map((p) => p[1]));
  const spans = (cs: ReturnType<typeof clusters>, keep: Set<number>) => {
    const out: [number, number][] = [];
    cs.forEach((c, i) => {
      if (keep.has(i)) return;
      const last = out[out.length - 1];
      if (last && last[1] === c.start) last[1] = c.end;
      else out.push([c.start, c.end]);
    });
    return out;
  };
  return { a: spans(cx, keepA), b: spans(cy, keepB) };
}

function similarity(x: string, y: string): number {
  const p = lcsPairs([...x], [...y], (s, t) => s === t).length;
  return (2 * p) / (x.length + y.length || 1);
}

const EDGE_WINDOW = 3;

function letterRangesFor(x: Tok, y: Tok, outA: DiffLetterRange[], outB: DiffLetterRange[]) {
  const d = letterDiff(x.raw, y.raw);
  d.a.forEach(([s, e]) => outA.push({ ayahId: x.ayahId, word: x.word, start: s, end: e }));
  d.b.forEach(([s, e]) => outB.push({ ayahId: y.ayahId, word: y.word, start: s, end: e }));
}

/**
 * Compare two members (each one or more ayahs).
 *
 * 1. Word LCS on comparison keys (letters only) aligns the shared wording.
 * 2. Differences are the unmatched words INSIDE the aligned region, plus edge words when both sides
 *    diverge at the same edge (substitution, up to 3 words) or one side adds a short (≤ 3 words) edge.
 *    Longer one-sided edges are treated as surrounding context, not as the difference.
 * 3. Same letters with different diacritics, or a 1↔1 substitution of similar words, get letter ranges.
 * 4. With < 30% overlap (or a single shared word in a longer ayah) the similarity is thematic: no ranges (no false precision).
 *    Such pairs are classified `semantic` (see similarityOf); everything else is `lafzi`.
 */
export function diffPair(sideA: Side, sideB: Side): PairDiff {
  const A = flatten(sideA);
  const B = flatten(sideB);
  const pairs = lcsPairs(A, B, (x, y) => x.key === y.key);
  const shorter = Math.min(A.length, B.length) || 1;
  const overlap = pairs.length / shorter;
  const matchRatio = Math.round((pairs.length / (Math.max(A.length, B.length) || 1)) * 100) / 100;
  const confidence: PairDiff['confidence'] = overlap >= 0.6 ? 'high' : overlap >= 0.3 ? 'medium' : 'low';
  const empty = { ranges: [], letters: [] };

  // A single shared word only counts for very short ayahs (e.g. هُدًى لِّلْمُتَّقِينَ / هُدًى وَبُشْرَىٰ لِلْمُؤْمِنِينَ).
  if (pairs.length === 0 || (pairs.length === 1 && shorter > 4) || confidence === 'low') {
    return { a: empty, b: empty, granularity: 'none', matchRatio, confidence: 'low' };
  }

  const lettersA: DiffLetterRange[] = [];
  const lettersB: DiffLetterRange[] = [];
  const diffA: Tok[] = [];
  const diffB: Tok[] = [];

  // Same letters, different diacritics (e.g. ٱلرَّحِيمِ / ٱلرَّحِيمُ): letter-level only.
  for (const [i, j] of pairs) if (A[i].raw !== B[j].raw) letterRangesFor(A[i], B[j], lettersA, lettersB);

  const handleGap = (gapA: Tok[], gapB: Tok[]) => {
    diffA.push(...gapA);
    diffB.push(...gapB);
    if (gapA.length === 1 && gapB.length === 1 && similarity(gapA[0].key, gapB[0].key) >= 0.6) {
      letterRangesFor(gapA[0], gapB[0], lettersA, lettersB);
    }
  };

  // Inner gaps (between consecutive matches).
  for (let k = 0; k + 1 < pairs.length; k++) {
    handleGap(A.slice(pairs[k][0] + 1, pairs[k + 1][0]), B.slice(pairs[k][1] + 1, pairs[k + 1][1]));
  }

  // Edges.
  const edge = (gapA: Tok[], gapB: Tok[], nearEnd: boolean) => {
    const near = (g: Tok[]) => (nearEnd ? g.slice(-EDGE_WINDOW) : g.slice(0, EDGE_WINDOW));
    if (gapA.length && gapB.length) handleGap(near(gapA), near(gapB));
    else if (gapA.length && gapA.length <= EDGE_WINDOW) diffA.push(...gapA);
    else if (gapB.length && gapB.length <= EDGE_WINDOW) diffB.push(...gapB);
  };
  const [fa, fb] = pairs[0];
  const [la, lb] = pairs[pairs.length - 1];
  edge(A.slice(0, fa), B.slice(0, fb), true);
  edge(A.slice(la + 1), B.slice(lb + 1), false);

  const order = (t: Tok[]) => [...t].sort((x, y) => (x.ayahId === y.ayahId ? x.word - y.word : 0));
  const ranges = { a: toRanges(order(diffA)), b: toRanges(order(diffB)) };

  let type: DiffType | undefined;
  if (diffA.length && !diffB.length) type = 'زيادة';
  else if (!diffA.length && diffB.length) type = 'نقص';
  else if (diffA.length && diffB.length) {
    const sortKeys = (t: Tok[]) => t.map((x) => x.key).sort().join(' ');
    type = sortKeys(diffA) === sortKeys(diffB) ? 'تقديم/تأخير' : 'إبدال';
  }

  const hasWords = ranges.a.length + ranges.b.length > 0;
  const hasLetters = lettersA.length + lettersB.length > 0;
  return {
    a: { ranges: ranges.a, letters: lettersA },
    b: { ranges: ranges.b, letters: lettersB },
    granularity: hasLetters ? 'letter' : hasWords ? 'word' : 'none',
    type,
    matchRatio,
    confidence,
  };
}

/**
 * Lafzi vs semantic classification (PO decision, MVP = lafzi only). A pair is `semantic` when diffPair
 * finds little shared wording: no shared word, a single shared word while the shorter side has > 4 words,
 * or LCS overlap < 30% of the shorter side's words (letter-only keys). Otherwise `lafzi`.
 */
export function similarityOf(d: Pick<PairDiff, 'confidence'>): 'lafzi' | 'semantic' {
  return d.confidence === 'low' ? 'semantic' : 'lafzi';
}

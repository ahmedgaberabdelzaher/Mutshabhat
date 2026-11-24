/**
 * QMT-26: generate data-driven highlight rules for every pair of members in the review dataset.
 * Each rule: source = auto_diff, status = draft, with a confidence score — committee edits replace
 * or correct rules in the dataset (no app rebuild).
 *
 * Every pair also gets `similarityType` (lafzi | semantic, see similarityOf in src/domain/diff.ts).
 * Semantic pairs get a rule with no ranges (granularity none) so the classification is stored as data.
 * Groups are tagged in place: lafzi if at least one of their pairs is lafzi, else semantic.
 */
import {
  comparisonKey,
  diffPair,
  extendToTwoWords,
  findKeySequence,
  meaningfulSharedSpan,
  phraseDiff,
  similarityOf,
} from '../../src/domain/diff.ts';

/** Words shown when a pair/group has no displayable shared part (title basis = fallback). */
export const FALLBACK_TITLE_WORDS = 5;

export const ALGORITHM =
  'auto_diff/lcs-word-v1: LCS on letter-only word keys (diacritics, Quranic marks and alef forms ignored for matching); letter ranges for diacritic-only or 1:1 similar-word substitutions; auto_diff/phrase-anchor-v1 (method=phrase): low-overlap pairs sharing a contiguous phrase of >= 3 words are lafzi, highlighted in the 2 words around each shared phrase';

export function buildHighlightRules(groups, quranSurahs) {
  const words = (id) => {
    const [s, a] = id.split(':').map(Number);
    return quranSurahs[s - 1][a - 1].split(' ');
  };
  const pos = (id) => {
    const [s, a] = id.split(':').map(Number);
    return s * 1000 + a;
  };
  const side = (m) => (m.ayahIds ?? [m.ayahId]).map((id) => ({ ayahId: id, words: words(id) }));
  const span = (r) => ({
    ...r,
    text: words(r.ayahId)
      .slice(r.startWord, r.endWord + 1)
      .join(' '),
  });
  const beginning = (m) => {
    const id = (m.ayahIds ?? [m.ayahId])[0];
    const n = Math.min(FALLBACK_TITLE_WORDS, words(id).length);
    return span({ ayahId: id, startWord: 0, endWord: n - 1 });
  };
  const rules = new Map();
  /** Build-only: per pair key, the shared (meaningful) part's letter keys + whether it moved off a particle. */
  const sharedOf = new Map();
  const methodOf = (moved, extended) =>
    moved ? (extended ? 'meaningful_word_extended' : 'meaningful_word') : extended ? 'extended' : 'shared';
  for (const g of groups) {
    for (let i = 0; i < g.members.length; i++) {
      for (let j = i + 1; j < g.members.length; j++) {
        let [x, y] = [g.members[i], g.members[j]];
        if (pos(x.ayahId) > pos(y.ayahId)) [x, y] = [y, x];
        if (x.ayahId === y.ayahId) continue;
        const key = `${x.ayahId}|${y.ayahId}`;
        if (rules.has(key)) continue; // first group wins (HifzLink groups are listed first)
        const whole = diffPair(side(x), side(y));
        const similarityType = similarityOf(whole);
        // Low overall overlap but a shared phrase of ≥ 3 words: lafzi, highlighted around the phrase.
        const method = similarityType === 'semantic' ? undefined : whole.confidence === 'low' ? 'phrase' : 'lcs';
        const d = method === 'phrase' ? phraseDiff(side(x), side(y)) : whole;
        const rule = {
          id: `auto:${key}`,
          pair: [x.ayahId, y.ayahId],
          // Semantic pairs: no ranges, the UI says no precise difference location is available.
          ranges: [...d.a.ranges, ...d.b.ranges],
          granularity: d.granularity,
          similarityType,
          source: 'auto_diff',
          algorithm: method === 'phrase' ? 'phrase-anchor-v1' : 'lcs-word-v1',
          ...(method ? { method } : {}),
          ...(method === 'phrase' ? { phrases: d.phrases } : {}),
          confidence: d.confidence,
          matchRatio: d.matchRatio,
          status: 'draft',
          review: { version: 1 },
        };
        const letters = [...d.a.letters, ...d.b.letters];
        if (letters.length) rule.letterRanges = letters;
        if (d.type) rule.type = d.type;
        // List title (docs/DATA_MODEL.md «List titles»): the longest common contiguous part (inside one ayah per
        // side) that contains a meaningful, non-particle word; a 1-word part is extended to 2 words from each
        // ayah's own text. No meaningful shared word → beginning of each ayah (fallback).
        const shared = meaningfulSharedSpan(side(x), side(y));
        if (shared) {
          const ea = extendToTwoWords(shared.a, words(shared.a.ayahId));
          const eb = extendToTwoWords(shared.b, words(shared.b.ayahId));
          rule.titles = [span(ea.range), span(eb.range)];
          rule.titleBasis = method === 'phrase' ? 'phrase' : 'lcs';
          rule.titleMethod = methodOf(shared.movedOffParticle, ea.extended || eb.extended);
          sharedOf.set(key, {
            keys: span(shared.a).text.split(' ').map(comparisonKey).filter(Boolean),
            moved: shared.movedOffParticle,
          });
        } else {
          rule.titles = [beginning(x), beginning(y)];
          rule.titleBasis = 'fallback';
          rule.titleMethod = 'fallback';
        }
        rules.set(key, rule);
      }
    }
  }
  for (const g of groups) {
    let lafzi = false;
    for (let i = 0; i < g.members.length && !lafzi; i++) {
      for (let j = i + 1; j < g.members.length && !lafzi; j++) {
        const [x, y] = [g.members[i].ayahId, g.members[j].ayahId].sort((p, q) => pos(p) - pos(q));
        if (rules.get(`${x}|${y}`)?.similarityType === 'lafzi') lafzi = true;
      }
    }
    g.similarityType = lafzi ? 'lafzi' : 'semantic';
    Object.assign(g, groupTitle(g));
  }
  return [...rules.values()];

  /**
   * Group title: among the (non-fallback) titles of the group's pairs, pick the phrase found in the MOST
   * members (letter-only keys, contiguous, inside one ayah); ties → more words, then first found.
   * The text is taken from the first member (group order) that contains it. No candidate → fallback.
   */
  function groupTitle(g) {
    const seen = new Set();
    let best = null;
    for (let i = 0; i < g.members.length; i++) {
      for (let j = i + 1; j < g.members.length; j++) {
        const [x, y] = [g.members[i].ayahId, g.members[j].ayahId].sort((p, q) => pos(p) - pos(q));
        const r = rules.get(`${x}|${y}`);
        const sh = sharedOf.get(`${x}|${y}`);
        if (!r || !sh) continue;
        const keys = sh.keys; // the shared, meaningful part (not the per-ayah extension)
        const sig = keys.join(' ');
        if (seen.has(sig)) continue;
        seen.add(sig);
        const hits = g.members.map((m) => findKeySequence(side(m), keys));
        const coverage = hits.filter(Boolean).length;
        // < 2: the pair's rule came from another group whose members span different ayahs.
        if (coverage < 2) continue;
        // Prefer multi-word shared parts (a lone word in more members loses to a phrase); then the most
        // members; then more words.
        const multi = keys.length >= 2 ? 1 : 0;
        if (
          !best ||
          multi > best.multi ||
          (multi === best.multi && (coverage > best.coverage || (coverage === best.coverage && keys.length > best.len)))
        ) {
          best = {
            multi,
            coverage,
            len: keys.length,
            at: hits.find(Boolean),
            basis: r.titleBasis,
            moved: sh.moved,
          };
        }
      }
    }
    if (!best)
      return {
        title: beginning(g.members[0]),
        titleBasis: 'fallback',
        titleMethod: 'fallback',
        titleCoverage: 1,
      };
    const e = extendToTwoWords(best.at, words(best.at.ayahId));
    return {
      title: span(e.range),
      titleBasis: best.basis,
      titleMethod: methodOf(best.moved, e.extended),
      titleCoverage: best.coverage,
    };
  }
}

/**
 * QMT-26: generate data-driven highlight rules for every pair of members in the review dataset.
 * Each rule: source = auto_diff, status = draft, with a confidence score — committee edits replace
 * or correct rules in the dataset (no app rebuild).
 *
 * Every pair also gets `similarityType` (lafzi | semantic, see similarityOf in src/domain/diff.ts).
 * Semantic pairs get a rule with no ranges (granularity none) so the classification is stored as data.
 * Groups are tagged in place: lafzi if at least one of their pairs is lafzi, else semantic.
 */
import { MIN_TITLE_WORDS, comparisonKey, diffPair, findKeySequence, phraseDiff, sharedSpan, similarityOf } from '../../src/domain/diff.ts';

/** Words shown when a pair/group has no displayable shared part (title basis = fallback). */
export const FALLBACK_TITLE_WORDS = 5;

export const ALGORITHM = 'auto_diff/lcs-word-v1: LCS on letter-only word keys (diacritics, Quranic marks and alef forms ignored for matching); letter ranges for diacritic-only or 1:1 similar-word substitutions; auto_diff/phrase-anchor-v1 (method=phrase): low-overlap pairs sharing a contiguous phrase of >= 3 words are lafzi, highlighted in the 2 words around each shared phrase';

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
  const span = (r) => ({ ...r, text: words(r.ayahId).slice(r.startWord, r.endWord + 1).join(' ') });
  const beginning = (m) => {
    const id = (m.ayahIds ?? [m.ayahId])[0];
    const n = Math.min(FALLBACK_TITLE_WORDS, words(id).length);
    return span({ ayahId: id, startWord: 0, endWord: n - 1 });
  };
  const rules = new Map();
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
        // List title: the longest common contiguous part, inside one ayah per side (lafzi: ≥ 1 word, e.g.
        // «هُدًى» for 2:2 ~ 27:2; semantic: ≥ 2 words, a lone shared word there is noise). For method=phrase
        // this is the (longest) shared phrase. Otherwise the beginning of each ayah (fallback).
        const shared = sharedSpan(side(x), side(y), similarityType === 'lafzi' ? 1 : MIN_TITLE_WORDS);
        if (shared) {
          rule.titles = [span(shared.a), span(shared.b)];
          rule.titleBasis = method === 'phrase' ? 'phrase' : 'lcs';
        } else {
          rule.titles = [beginning(x), beginning(y)];
          rule.titleBasis = 'fallback';
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
        if (!r || r.titleBasis === 'fallback') continue;
        const keys = r.titles[0].text.split(' ').map(comparisonKey).filter(Boolean);
        const sig = keys.join(' ');
        if (seen.has(sig)) continue;
        seen.add(sig);
        const hits = g.members.map((m) => findKeySequence(side(m), keys));
        const coverage = hits.filter(Boolean).length;
        // < 2: the pair's rule came from another group whose members span different ayahs.
        if (coverage < 2) continue;
        if (!best || coverage > best.coverage || (coverage === best.coverage && keys.length > best.len)) {
          best = { coverage, len: keys.length, at: hits.find(Boolean), basis: r.titleBasis };
        }
      }
    }
    if (!best) return { title: beginning(g.members[0]), titleBasis: 'fallback', titleCoverage: 1 };
    return { title: span(best.at), titleBasis: best.basis, titleCoverage: best.coverage };
  }
}

/**
 * QMT-26: generate data-driven highlight rules for every pair of members in the review dataset.
 * Each rule: source = auto_diff, status = draft, with a confidence score — committee edits replace
 * or correct rules in the dataset (no app rebuild).
 *
 * Every pair also gets `similarityType` (lafzi | semantic, see similarityOf in src/domain/diff.ts).
 * Semantic pairs get a rule with no ranges (granularity none) so the classification is stored as data.
 * Groups are tagged in place: lafzi if at least one of their pairs is lafzi, else semantic.
 */
import { diffPair, similarityOf } from '../../src/domain/diff.ts';

export const ALGORITHM = 'auto_diff/lcs-word-v1: LCS on letter-only word keys (diacritics, Quranic marks and alef forms ignored for matching); letter ranges for diacritic-only or 1:1 similar-word substitutions';

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
  const rules = new Map();
  for (const g of groups) {
    for (let i = 0; i < g.members.length; i++) {
      for (let j = i + 1; j < g.members.length; j++) {
        let [x, y] = [g.members[i], g.members[j]];
        if (pos(x.ayahId) > pos(y.ayahId)) [x, y] = [y, x];
        if (x.ayahId === y.ayahId) continue;
        const key = `${x.ayahId}|${y.ayahId}`;
        if (rules.has(key)) continue; // first group wins (HifzLink groups are listed first)
        const d = diffPair(side(x), side(y));
        const similarityType = similarityOf(d);
        const rule = {
          id: `auto:${key}`,
          pair: [x.ayahId, y.ayahId],
          // Semantic pairs: no ranges, the UI says no precise difference location is available.
          ranges: [...d.a.ranges, ...d.b.ranges],
          granularity: d.granularity,
          similarityType,
          source: 'auto_diff',
          algorithm: 'lcs-word-v1',
          confidence: d.confidence,
          matchRatio: d.matchRatio,
          status: 'draft',
          review: { version: 1 },
        };
        const letters = [...d.a.letters, ...d.b.letters];
        if (letters.length) rule.letterRanges = letters;
        if (d.type) rule.type = d.type;
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
  }
  return [...rules.values()];
}

/**
 * QMT-26: generate data-driven highlight rules for every pair of members in the review dataset.
 * Each rule: source = auto_diff, status = draft, with a confidence score — committee edits replace
 * or correct rules in the dataset (no app rebuild).
 */
import { diffPair } from '../../src/domain/diff.ts';

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
        // Thematic / low-overlap pairs get no rule: the UI then says no precise range is available.
        if (d.confidence === 'low') {
          rules.set(key, null);
          continue;
        }
        const rule = {
          id: `auto:${key}`,
          pair: [x.ayahId, y.ayahId],
          ranges: [...d.a.ranges, ...d.b.ranges],
          granularity: d.granularity,
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
  return [...rules.values()].filter(Boolean);
}

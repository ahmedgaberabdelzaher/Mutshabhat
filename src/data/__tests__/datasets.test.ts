import { loadBundledDataset } from '@/data/datasets';
import { getQuranRepository } from '@/data';

const quran = getQuranRepository();

describe('bundled datasets (QMT-48 AC2)', () => {
  const review = loadBundledDataset('review');
  const production = loadBundledDataset('production');

  it('keeps review and production datasets separate', () => {
    expect(review.kind).toBe('review');
    expect(production.kind).toBe('production');
    expect(production.groups.every((g) => g.status === 'approved')).toBe(true);
    expect(production.highlightRules.every((r) => r.status === 'approved')).toBe(true);
  });

  it('production dataset is empty until the committee approves records', () => {
    expect(production.groups).toHaveLength(0);
  });

  it('review dataset holds candidate records only, each with source, version and valid ayah ids', () => {
    expect(review.groups.length).toBeGreaterThan(2000);
    for (const g of review.groups) {
      expect(['draft', 'under_review']).toContain(g.status);
      expect(['quranpedia', 'waqar144', 'hifzlink']).toContain(g.source.name);
      expect(g.review.version).toBeGreaterThanOrEqual(1);
      expect(g.members.length).toBeGreaterThanOrEqual(2);
      for (const m of g.members) for (const id of m.ayahIds ?? [m.ayahId]) expect(quran.getAyah(id)).toBeDefined();
    }
  });

  it('flags the 285 HifzLink curated pairs as the QMT-49 pilot', () => {
    const pilot = review.groups.filter((g) => g.pilot);
    expect(pilot).toHaveLength(285);
    expect(pilot.every((g) => g.source.name === 'hifzlink' && g.reviewCycle === 'QMT-49')).toBe(true);
  });

  it('includes all Waqar144 entries', () => {
    expect(review.groups.filter((g) => g.source.name === 'waqar144')).toHaveLength(1348);
  });

  it('stores highlight rules as data: auto_diff drafts with valid ranges (QMT-26)', () => {
    expect(review.highlightRules.length).toBeGreaterThan(1000);
    const pairs = new Set<string>();
    for (const g of review.groups) {
      const ids = g.members.map((m) => m.ayahId);
      for (const a of ids) for (const b of ids) if (a !== b) pairs.add(`${a}|${b}`);
    }
    for (const r of review.highlightRules) {
      expect(r.source).toBe('auto_diff');
      expect(r.status).toBe('draft');
      expect(['word', 'letter', 'none']).toContain(r.granularity);
      expect(pairs.has(`${r.pair[0]}|${r.pair[1]}`)).toBe(true);
      for (const range of r.ranges) {
        const words = quran.getAyah(range.ayahId)!.words;
        expect(range.startWord).toBeGreaterThanOrEqual(0);
        expect(range.endWord).toBeLessThan(words.length);
      }
      for (const l of r.letterRanges ?? []) {
        expect(l.end).toBeLessThanOrEqual(quran.getAyah(l.ayahId)!.words[l.word].length);
      }
    }
  });
});

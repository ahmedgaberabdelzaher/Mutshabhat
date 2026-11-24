import { visibilityFor } from '@/config/flavor';
import { loadBundledDataset } from '@/data/datasets';
import { LocalMutashabihatRepository } from '@/data/mutashabihat-repository';
import { getQuranRepository } from '@/data';
import type { MutashabihatDataset } from '@/domain/mutashabihat';

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

  it('classifies every pair and group as lafzi or semantic (PO: MVP = lafzi)', () => {
    for (const r of review.highlightRules) {
      expect(['lafzi', 'semantic']).toContain(r.similarityType);
      // Rule: semantic ⇔ the auto diff found little shared wording (confidence low) ⇒ no ranges.
      expect(r.similarityType === 'semantic').toBe(r.confidence === 'low');
      if (r.similarityType === 'semantic') {
        expect(r.ranges).toEqual([]);
        expect(r.granularity).toBe('none');
      }
    }
    for (const g of review.groups) expect(['lafzi', 'semantic']).toContain(g.similarityType);
    const count = (t: string) => review.highlightRules.filter((r) => r.similarityType === t).length;
    expect(count('lafzi')).toBeGreaterThan(1000);
    expect(count('semantic')).toBeGreaterThan(1000);
  });

  it('semantic pairs never reach beta/production — even if the whole review set were approved', () => {
    const approvedAll: MutashabihatDataset = {
      ...review,
      kind: 'production',
      groups: review.groups.map((g) => ({ ...g, status: 'approved' })),
      highlightRules: review.highlightRules.map((r) => ({ ...r, status: 'approved' })),
    };
    const semanticPairs = new Set(
      review.highlightRules.filter((r) => r.similarityType === 'semantic').map((r) => r.pair.join('|')),
    );
    for (const flavor of ['beta', 'production'] as const) {
      const repo = new LocalMutashabihatRepository(approvedAll, visibilityFor(flavor), (id) => quran.absoluteIndex(id));
      expect(repo.getGroups('all', 'any').every((g) => g.similarityType === 'lafzi')).toBe(true);
      expect(repo.getDatasetInfo().similarityCounts.semantic).toBe(0);
      for (const id of repo.getPositionAyahIds('all', 'any')) {
        for (const a of repo.getAnalogues(id, 'all', 'any')) {
          expect(a.similarityType).toBe('lafzi');
          const key = [a.selfAyahIds[0], a.ayahId].sort((x, y) => quran.absoluteIndex(x) - quran.absoluteIndex(y)).join('|');
          expect(semanticPairs.has(key)).toBe(false);
        }
      }
    }
  });
});

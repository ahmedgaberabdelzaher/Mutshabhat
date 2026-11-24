import { parseFlavor, visibilityFor } from '@/config/flavor';
import { productionFixture, reviewFixture } from '@/data/__fixtures__/mutashabihat.fixture';
import { DatasetPolicyError, LocalMutashabihatRepository } from '@/data/mutashabihat-repository';
import { getQuranRepository } from '@/data';

const pos = (id: string) => getQuranRepository().absoluteIndex(id);

describe('flavor config', () => {
  it('defaults to the safe production flavor', () => {
    expect(parseFlavor(undefined)).toBe('production');
    expect(parseFlavor('nonsense')).toBe('production');
    expect(parseFlavor('review')).toBe('review');
    expect(parseFlavor('beta')).toBe('beta');
  });
});

describe('review build (QMT-48 AC4, QMT-25 AC3)', () => {
  const repo = new LocalMutashabihatRepository(reviewFixture, visibilityFor('review'), pos);

  it('shows draft, under_review AND approved records with a status badge; never rejected (PO decision)', () => {
    expect(repo.policy.showStatusBadge).toBe(true);
    const statuses = repo.getGroups().map((g) => g.status);
    expect(statuses).toEqual(expect.arrayContaining(['draft', 'under_review', 'approved']));
    expect(statuses).not.toContain('rejected');
    const approved = repo.getAnalogues('2:5');
    expect(approved.map((a) => [a.ayahId, a.status])).toEqual([['31:5', 'approved']]);
    expect(repo.getDatasetInfo().statusCounts).toMatchObject({ approved: 1, rejected: 0 });
  });

  it('hides semantic pairs from the default (lafzi) view and lists them only via the filter', () => {
    expect(repo.getAnalogues('2:2').map((a) => a.ayahId)).not.toContain('2:255');
    expect(repo.getGroups().map((g) => g.id)).not.toContain('g-semantic');
    const semantic = repo.getAnalogues('2:2', 'all', 'semantic');
    expect(semantic.map((a) => [a.ayahId, a.similarityType])).toEqual([['2:255', 'semantic']]);
    expect(repo.getGroups('all', 'semantic').map((g) => g.id)).toEqual(['g-semantic']);
    expect(repo.getPositionAyahIds()).not.toContain('2:255');
    expect(repo.getPositionAyahIds('all', 'semantic')).toEqual(['2:2', '2:255']);
    expect(repo.getDatasetInfo().similarityCounts).toEqual({ lafzi: 4, semantic: 1 });
  });

  it('returns candidate analogues of an ayah, preferring HifzLink for a shared pair', () => {
    const analogues = repo.getAnalogues('2:2');
    expect(analogues.map((a) => a.ayahId)).toEqual(['27:2', '31:3']); // pilot first, then mushaf order
    const p = analogues[0];
    expect(p.primary.source.name).toBe('hifzlink');
    expect(p.status).toBe('under_review');
    expect(p.pilot).toBe(true);
    expect(p.sources).toEqual(['hifzlink', 'waqar144']);
    expect(analogues[1].status).toBe('draft');
  });

  it('filters the pilot set', () => {
    expect(repo.getAnalogues('2:2', 'pilot').map((a) => a.ayahId)).toEqual(['27:2']);
    expect(repo.getGroups('pilot').map((g) => g.id)).toEqual(['g-review']);
  });

  it('never shows rejected analogues', () => {
    expect(repo.getAnalogues('2:5').map((a) => a.ayahId)).toEqual(['31:5']);
  });

  it('reports the dataset version and status counts', () => {
    expect(repo.getDatasetInfo()).toMatchObject({ kind: 'review', datasetVersion: 7, pilotCount: 1 });
  });
});

describe('beta / production builds (QMT-48 AC2, QMT-25 AC1/2/4, DAT-06)', () => {
  for (const flavor of ['beta', 'production'] as const) {
    const repo = new LocalMutashabihatRepository(productionFixture, visibilityFor(flavor), pos);

    it(`${flavor}: shows approved records only`, () => {
      expect(repo.getGroups().map((g) => g.id)).toEqual(['p-approved', 'p-mixed']);
      expect(repo.getAnalogues('2:5').map((a) => a.ayahId)).toEqual(['31:5']);
      expect(repo.getAnalogues('2:2')).toEqual([]); // draft / under_review / rejected never leak
      expect(repo.getPositionAyahIds()).toEqual(['2:5', '2:255', '3:2', '3:3', '31:5']);
      expect(repo.policy.showStatusBadge).toBe(false);
    });

    it(`${flavor}: semantic pairs never appear, even approved or explicitly requested`, () => {
      for (const filter of ['lafzi', 'semantic', 'any'] as const) {
        expect(repo.getAnalogues('2:2', 'all', filter)).toEqual([]);
        // 2:255 is in p-semantic (hidden) and p-mixed, where only its pair with 3:3 is lafzi.
        const expected = filter === 'semantic' ? [] : ['3:3'];
        expect(repo.getAnalogues('2:255', 'all', filter).map((a) => a.ayahId)).toEqual(expected);
        expect(repo.getAnalogues('3:2', 'all', filter).map((a) => a.ayahId)).toEqual(expected);
        expect(repo.getGroups('all', filter).map((g) => g.similarityType)).not.toContain('semantic');
        expect(repo.getPositionAyahIds('all', filter)).not.toContain('2:2');
      }
      expect(repo.getHighlightRule('3:2', '2:255')).toBeUndefined();
      expect(repo.getDatasetInfo().similarityCounts.semantic).toBe(0);
    });

    it(`${flavor}: hides approved records that were never classified (must be tagged lafzi)`, () => {
      expect(repo.getAnalogues('3:1', 'all', 'any')).toEqual([]);
      expect(repo.getGroups('all', 'any').map((g) => g.id)).not.toContain('p-untagged');
    });

    it(`${flavor}: refuses to load the candidate (review) dataset`, () => {
      expect(() => new LocalMutashabihatRepository(reviewFixture, visibilityFor(flavor), pos)).toThrow(
        DatasetPolicyError,
      );
    });
  }

  it('review flavor refuses the production dataset (datasets stay separate)', () => {
    expect(() => new LocalMutashabihatRepository(productionFixture, visibilityFor('review'), pos)).toThrow(
      DatasetPolicyError,
    );
  });

  it('handles an empty approved dataset gracefully', () => {
    const empty = { ...productionFixture, groups: [] };
    const repo = new LocalMutashabihatRepository(empty, visibilityFor('production'), pos);
    expect(repo.getAnalogues('2:2')).toEqual([]);
    expect(repo.getDatasetInfo().groupCount).toBe(0);
  });
});

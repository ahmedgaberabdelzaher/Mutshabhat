import { parseFlavor, visibilityFor } from '@/config/flavor';
import { productionFixture, reviewFixture, rule } from '@/data/__fixtures__/mutashabihat.fixture';
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

  it('shows draft and under_review candidate records with a status badge', () => {
    expect(repo.policy.showStatusBadge).toBe(true);
    const statuses = repo.getGroups().map((g) => g.status);
    expect(statuses).toEqual(expect.arrayContaining(['draft', 'under_review']));
    expect(statuses).not.toContain('rejected');
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
      expect(repo.getGroups().map((g) => g.id)).toEqual(['p-approved']);
      expect(repo.getAnalogues('2:5').map((a) => a.ayahId)).toEqual(['31:5']);
      expect(repo.getAnalogues('2:2')).toEqual([]); // draft / under_review / rejected never leak
      expect(repo.getPositionAyahIds()).toEqual(['2:5', '31:5']);
      expect(repo.policy.showStatusBadge).toBe(false);
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

describe('highlight rules per flavor (QMT-26 AC3/AC4)', () => {
  const withRules = (ds: typeof productionFixture) => ({
    ...ds,
    highlightRules: [rule('2:5', '31:5', 'approved'), rule('2:2', '31:3', 'draft'), rule('2:2', '27:2', 'under_review')],
  });

  it('beta/production highlight approved records only', () => {
    for (const flavor of ['beta', 'production'] as const) {
      const repo = new LocalMutashabihatRepository(withRules(productionFixture), visibilityFor(flavor), pos);
      expect(repo.getHighlightRule('31:5', '2:5')?.status).toBe('approved');
      expect(repo.getHighlightRule('2:2', '31:3')).toBeUndefined();
      expect(repo.getHighlightRule('27:2', '2:2')).toBeUndefined();
    }
  });

  it('review build exposes candidate highlight rules, in either pair order', () => {
    const repo = new LocalMutashabihatRepository(withRules(reviewFixture), visibilityFor('review'), pos);
    expect(repo.getHighlightRule('31:3', '2:2')?.status).toBe('draft');
    expect(repo.getHighlightRule('2:2', '27:2')?.status).toBe('under_review');
  });
});


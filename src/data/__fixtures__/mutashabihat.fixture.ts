import type { MutashabihGroup, MutashabihatDataset, ReviewStatus, SourceName } from '@/domain/mutashabihat';

/** Test fixtures covering every review status (QMT-48 DoD). */
export function group(
  id: string,
  ayahs: string[],
  status: ReviewStatus,
  source: SourceName = 'waqar144',
  extra: Partial<MutashabihGroup> = {},
): MutashabihGroup {
  return {
    id,
    members: ayahs.map((a) => ({ ayahId: a, differenceRanges: [] })),
    status,
    review: { version: 1 },
    source: { name: source },
    ...extra,
  };
}

export const reviewFixture: MutashabihatDataset = {
  schemaVersion: 1,
  kind: 'review',
  datasetVersion: 7,
  groups: [
    group('g-draft', ['2:2', '31:3'], 'draft'),
    group('g-review', ['2:2', '27:2'], 'under_review', 'hifzlink', { pilot: true, reviewCycle: 'QMT-49' }),
    group('g-review-dup', ['2:2', '27:2'], 'draft', 'waqar144'),
    group('g-approved', ['2:5', '31:5'], 'approved'),
    group('g-rejected', ['2:2', '2:5'], 'rejected'),
  ],
  highlightRules: [],
};

export const productionFixture: MutashabihatDataset = {
  schemaVersion: 1,
  kind: 'production',
  datasetVersion: 3,
  groups: [
    group('p-approved', ['2:5', '31:5'], 'approved', 'quranpedia'),
    // Must never leak even if mistakenly present in the production file:
    group('p-draft', ['2:2', '31:3'], 'draft'),
    group('p-review', ['2:2', '27:2'], 'under_review', 'hifzlink', { pilot: true }),
    group('p-rejected', ['2:2', '2:5'], 'rejected'),
  ],
  highlightRules: [],
};

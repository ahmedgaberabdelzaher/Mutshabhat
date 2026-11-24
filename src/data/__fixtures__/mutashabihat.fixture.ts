import type {
  HighlightRule,
  MutashabihGroup,
  MutashabihatDataset,
  ReviewStatus,
  SourceName,
} from '@/domain/mutashabihat';

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
    // Little shared wording: kept in review behind the similarity filter.
    group('g-semantic', ['2:2', '2:255'], 'draft', 'quranpedia', { similarityType: 'semantic' }),
  ],
  highlightRules: [],
};

export const productionFixture: MutashabihatDataset = {
  schemaVersion: 1,
  kind: 'production',
  datasetVersion: 3,
  groups: [
    group('p-approved', ['2:5', '31:5'], 'approved', 'quranpedia', { similarityType: 'lafzi' }),
    // Must never leak even if mistakenly present in the production file:
    group('p-draft', ['2:2', '31:3'], 'draft'),
    group('p-review', ['2:2', '27:2'], 'under_review', 'hifzlink', { pilot: true }),
    group('p-rejected', ['2:2', '2:5'], 'rejected'),
    // Semantic pairs must never reach beta/production, even if approved:
    group('p-semantic', ['2:2', '2:255'], 'approved', 'quranpedia', { similarityType: 'semantic' }),
    group('p-untagged', ['3:1', '29:1'], 'approved', 'quranpedia'), // unclassified ⇒ hidden
    // Lafzi group whose pair 3:2~2:255 is tagged semantic by its rule ⇒ only 3:2~3:3 shows.
    group('p-mixed', ['3:2', '3:3', '2:255'], 'approved', 'waqar144', { similarityType: 'lafzi' }),
  ],
  highlightRules: [
    {
      id: 'p-mixed:3:2~2:255',
      pair: ['3:2', '2:255'],
      granularity: 'none',
      ranges: [],
      similarityType: 'semantic',
      status: 'approved',
      review: { version: 1 },
      source: 'auto_diff',
    },
  ],
};

export function rule(a: string, b: string, status: ReviewStatus): HighlightRule {
  return {
    id: `t:${a}|${b}`,
    pair: [a, b],
    ranges: [{ ayahId: a, startWord: 0, endWord: 0 }],
    granularity: 'word',
    source: status === 'approved' ? 'committee' : 'auto_diff',
    status,
    review: { version: 1 },
  };
}

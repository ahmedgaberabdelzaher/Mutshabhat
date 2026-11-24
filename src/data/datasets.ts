import type { DatasetKind, MutashabihatDataset } from '@/domain/mutashabihat';

/**
 * Bundled datasets. The review (candidate) dataset is only required when the bundle is built for the
 * `review` flavor: EXPO_PUBLIC_APP_FLAVOR is inlined at bundle time, so Metro drops the require from
 * beta/production bundles and candidate data is never shipped there.
 *
 * Both files are plain JSON inside the JS bundle, so a new dataset or new highlight rules can ship
 * through an EAS Update on the matching channel without rebuilding the native app.
 */
export function loadBundledDataset(kind: DatasetKind): MutashabihatDataset {
  if (kind === 'review') {
    if (process.env.EXPO_PUBLIC_APP_FLAVOR === 'review' || process.env.NODE_ENV === 'test') {
      return require('../../assets/data/review/mutashabihat.review.json') as MutashabihatDataset;
    }
    throw new Error('The review dataset is not bundled in this build flavor.');
  }
  return require('../../assets/data/production/mutashabihat.production.json') as MutashabihatDataset;
}

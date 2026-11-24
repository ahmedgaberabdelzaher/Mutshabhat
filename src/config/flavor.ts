import type { ReviewStatus, SimilarityType } from '@/domain/mutashabihat';

/**
 * Build flavor (QMT-48). Set at build/bundle time through EXPO_PUBLIC_APP_FLAVOR
 * (eas.json build profiles, npm scripts). Defaults to the safest value, `production`.
 *
 *  - review:     candidate dataset, draft/under_review records visible with a status badge
 *  - beta:       production dataset, approved records only
 *  - production: production dataset, approved records only
 */
export type AppFlavor = 'review' | 'beta' | 'production';

export function parseFlavor(raw: string | undefined): AppFlavor {
  return raw === 'review' || raw === 'beta' ? raw : 'production';
}

export const APP_FLAVOR: AppFlavor = parseFlavor(process.env.EXPO_PUBLIC_APP_FLAVOR);

export type VisibilityPolicy = {
  flavor: AppFlavor;
  dataset: 'review' | 'production';
  visibleStatuses: readonly ReviewStatus[];
  /** Similarity types this build may show at all. */
  allowedSimilarity: readonly SimilarityType[];
  /** Beta/production: a record must be explicitly tagged lafzi to be shown. */
  requireExplicitLafzi: boolean;
  showStatusBadge: boolean;
};

export function visibilityFor(flavor: AppFlavor): VisibilityPolicy {
  if (flavor === 'review') {
    return {
      flavor,
      dataset: 'review',
      // Candidate records (draft / under_review) plus approved ones, so the committee can revisit
      // what it approved (PO decision). Rejected records are never shown.
      visibleStatuses: ['draft', 'under_review', 'approved'],
      // Semantic pairs stay in the review build, hidden from the default view (filter only).
      allowedSimilarity: ['lafzi', 'semantic'],
      requireExplicitLafzi: false,
      showStatusBadge: true,
    };
  }
  return {
    flavor,
    dataset: 'production',
    visibleStatuses: ['approved'],
    allowedSimilarity: ['lafzi'],
    requireExplicitLafzi: true,
    showStatusBadge: false,
  };
}

export const FLAVOR_LABELS: Record<AppFlavor, string> = {
  review: 'نسخة المراجعة',
  beta: 'النسخة التجريبية',
  production: 'النسخة العامة',
};

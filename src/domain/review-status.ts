import type { ReviewDecision, ReviewMeta, ReviewStatus } from './mutashabihat';

/**
 * QMT-48 status lifecycle:
 *   draft → under_review → approved | rejected
 *   any edit to an approved record returns it to under_review.
 * Every transition and every edit increments `review.version`.
 */
export type Reviewable = { status: ReviewStatus; review: ReviewMeta };

export type ReviewAction =
  | { type: 'submit' } // draft → under_review
  | { type: 'approve'; reviewer?: string; at: string; reason?: string }
  | { type: 'reject'; reviewer?: string; at: string; reason: string }
  | { type: 'edit'; reviewer?: string; at: string; reason?: string }; // data or highlight-rule change

export class InvalidTransitionError extends Error {
  constructor(from: ReviewStatus, action: ReviewAction['type']) {
    super(`Invalid review transition: ${action} from ${from}`);
  }
}

const ALLOWED: Record<ReviewAction['type'], ReviewStatus[]> = {
  submit: ['draft'],
  approve: ['under_review'],
  reject: ['under_review'],
  edit: ['draft', 'under_review', 'approved', 'rejected'],
};

function decide(meta: ReviewMeta, decision: ReviewDecision, a: { reviewer?: string; at: string; reason?: string }): ReviewMeta {
  return {
    version: meta.version + 1,
    reviewedAt: a.at,
    decision,
    decisionReason: a.reason,
    reviewer: a.reviewer,
  };
}

export function applyReviewAction<T extends Reviewable>(record: T, action: ReviewAction): T {
  if (!ALLOWED[action.type].includes(record.status)) {
    throw new InvalidTransitionError(record.status, action.type);
  }
  switch (action.type) {
    case 'submit':
      return { ...record, status: 'under_review', review: { ...record.review, version: record.review.version + 1 } };
    case 'approve':
      return { ...record, status: 'approved', review: decide(record.review, 'اعتماد', action) };
    case 'reject':
      return { ...record, status: 'rejected', review: decide(record.review, 'رفض', action) };
    case 'edit': {
      // Editing an approved (or rejected) record sends it back for review; drafts stay drafts.
      const next: ReviewStatus = record.status === 'draft' ? 'draft' : 'under_review';
      return { ...record, status: next, review: decide(record.review, 'تعديل', action) };
    }
  }
}

/** Legacy QMT-20 status names → QMT-48 model. */
export function fromLegacyStatus(legacy: string): ReviewStatus {
  switch (legacy.trim()) {
    case 'جديد':
      return 'draft';
    case 'موسوم':
    case 'بانتظار المراجعة':
      return 'under_review';
    case 'معتمد':
      return 'approved';
    case 'مرفوض':
      return 'rejected';
    default:
      throw new Error(`Unknown legacy status: ${legacy}`);
  }
}

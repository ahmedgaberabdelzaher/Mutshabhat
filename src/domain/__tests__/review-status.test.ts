import type { MutashabihGroup } from '@/domain/mutashabihat';
import { applyReviewAction, fromLegacyStatus, InvalidTransitionError } from '@/domain/review-status';
import { group } from '@/data/__fixtures__/mutashabihat.fixture';

const AT = '2026-12-01T10:00:00+03:00';

describe('review status lifecycle (QMT-48 AC1)', () => {
  const draft: MutashabihGroup = group('x', ['2:2', '27:2'], 'draft');

  it('moves draft → under_review → approved, recording version and decision fields', () => {
    const submitted = applyReviewAction(draft, { type: 'submit' });
    expect(submitted.status).toBe('under_review');
    expect(submitted.review.version).toBe(2);
    const approved = applyReviewAction(submitted, { type: 'approve', at: AT, reviewer: 'اللجنة العلمية' });
    expect(approved.status).toBe('approved');
    expect(approved.review).toEqual({
      version: 3,
      reviewedAt: AT,
      decision: 'اعتماد',
      decisionReason: undefined,
      reviewer: 'اللجنة العلمية',
    });
  });

  it('moves under_review → rejected with a reason', () => {
    const r = applyReviewAction(applyReviewAction(draft, { type: 'submit' }), {
      type: 'reject',
      at: AT,
      reason: 'ليس من المتشابه اللفظي',
    });
    expect(r.status).toBe('rejected');
    expect(r.review.decision).toBe('رفض');
    expect(r.review.decisionReason).toBe('ليس من المتشابه اللفظي');
  });

  it('any edit to an approved record returns it to under_review', () => {
    const approved: MutashabihGroup = { ...draft, status: 'approved', review: { version: 5 } };
    const edited = applyReviewAction(approved, { type: 'edit', at: AT, reason: 'تعديل موضع الإبراز' });
    expect(edited.status).toBe('under_review');
    expect(edited.review.version).toBe(6);
    expect(edited.review.decision).toBe('تعديل');
  });

  it('editing a draft keeps it a draft', () => {
    expect(applyReviewAction(draft, { type: 'edit', at: AT }).status).toBe('draft');
  });

  it('rejects invalid transitions', () => {
    expect(() => applyReviewAction(draft, { type: 'approve', at: AT })).toThrow(InvalidTransitionError);
    expect(() => applyReviewAction(draft, { type: 'reject', at: AT, reason: 'x' })).toThrow(InvalidTransitionError);
    const approved = { ...draft, status: 'approved' as const };
    expect(() => applyReviewAction(approved, { type: 'submit' })).toThrow(InvalidTransitionError);
    expect(() => applyReviewAction(approved, { type: 'approve', at: AT })).toThrow(InvalidTransitionError);
  });

  it('maps legacy QMT-20 names', () => {
    expect(fromLegacyStatus('جديد')).toBe('draft');
    expect(fromLegacyStatus('موسوم')).toBe('under_review');
    expect(fromLegacyStatus('بانتظار المراجعة')).toBe('under_review');
    expect(fromLegacyStatus('معتمد')).toBe('approved');
    expect(fromLegacyStatus('مرفوض')).toBe('rejected');
  });
});

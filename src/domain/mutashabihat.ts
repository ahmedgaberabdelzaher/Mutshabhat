import type { AyahId } from './quran';

export type DifferenceType = 'زيادة' | 'نقص' | 'تقديم/تأخير' | 'إبدال';

export type ReviewStatus =
  | 'draft' // مسوّدة
  | 'under_review' // قيد المراجعة
  | 'approved' // معتمد
  | 'rejected'; // مرفوض
// Transition: draft → under_review → approved | rejected.
// An edit to an approved record returns it to under_review (see review-status.ts).
// Legacy QMT-20 names map as: جديد → draft; موسوم / بانتظار المراجعة → under_review.

export type ReviewDecision = 'اعتماد' | 'تعديل' | 'رفض';

export type ReviewMeta = {
  version: number; // incremented on each data or highlight-rule change
  reviewedAt?: string; // ISO-8601; displayed in Asia/Riyadh
  decision?: ReviewDecision;
  decisionReason?: string;
  reviewer?: string;
};

export type SourceName = 'quranpedia' | 'waqar144' | 'hifzlink';

export type WordRange = {
  ayahId: AyahId;
  startWord: number; // inclusive, index into Ayah.words
  endWord: number; // inclusive
};

export type MutashabihMember = {
  /** First (or only) ayah of this member. */
  ayahId: AyahId;
  /** Present when a member spans several consecutive ayahs (e.g. Waqar144 multi-ayah entries). */
  ayahIds?: AyahId[];
  differenceRanges: WordRange[]; // empty if the source does not specify ranges
};

export type MutashabihGroup = {
  id: string;
  members: MutashabihMember[];
  type?: DifferenceType; // only when the source provides it; no classification UI in Sprint 1
  status: ReviewStatus;
  review: ReviewMeta;
  source: { name: SourceName; ref?: string };
  /** Part of the committee's pilot review set (QMT-49): the 285 HifzLink curated pairs. */
  pilot?: boolean;
  reviewCycle?: string;
  /** Upstream note (Quranpedia notes are Arabic, HifzLink notes are English). */
  note?: string;
  /** Raw upstream category, kept for the committee (e.g. HifzLink `lafzi`). */
  sourceCategory?: string;
  /** Waqar144 `ctx`: show part of the following ayah for context. */
  showNextAyahContext?: boolean;
};

/** Highlight rule for one pair of members (QMT-26). Stored in data so the committee can edit it without a rebuild. */
export type HighlightRule = {
  id: string;
  /** Ayah ids (first ayah of each member) of the pair, lexicographically ordered by mushaf position. */
  pair: [AyahId, AyahId];
  /** Word-level ranges for each side. */
  ranges: WordRange[];
  /** Optional letter-level ranges: [ayahId, wordIndex, startChar, endChar] inside a highlighted word (UTF-16 offsets, inclusive start / exclusive end). */
  letterRanges?: { ayahId: AyahId; word: number; start: number; end: number }[];
  granularity: 'word' | 'letter' | 'none';
  /** auto_diff = computed by scripts/build-mutashabihat-data.mjs; committee = edited by reviewers. */
  source: 'auto_diff' | 'committee';
  algorithm?: string;
  type?: DifferenceType;
  status: ReviewStatus;
  review: ReviewMeta;
};

export type DatasetKind = 'review' | 'production';

export type MutashabihatDataset = {
  schemaVersion: 1;
  kind: DatasetKind;
  datasetVersion: number;
  description?: string;
  sources?: Record<string, string>;
  groups: MutashabihGroup[];
  highlightRules: HighlightRule[];
};

export const STATUS_LABELS: Record<ReviewStatus, string> = {
  draft: 'مسوّدة',
  under_review: 'قيد المراجعة',
  approved: 'معتمد',
  rejected: 'مرفوض',
};

export const SOURCE_LABELS: Record<SourceName, string> = {
  quranpedia: 'الموسوعة القرآنية',
  waqar144: 'Waqar144',
  hifzlink: 'HifzLink',
};

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

/**
 * MVP scope is verbal (lafzi) mutashabihat. `semantic` marks pairs/groups with little shared wording
 * (similar meaning or theme). They stay in the review dataset behind a filter and must never reach
 * beta/production. See docs/DATA_MODEL.md for the classification rule.
 */
export type SimilarityType = 'lafzi' | 'semantic';

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
  /** List title for the group (records screen); see docs/DATA_MODEL.md for the > 2 members rule. */
  title?: TitleSpan;
  titleBasis?: TitleBasis;
  /** How many members contain the title phrase. */
  titleCoverage?: number;
  /** Group-level classification: lafzi if at least one of its pairs is lafzi. Beta/production require 'lafzi'. */
  similarityType?: SimilarityType;
};

/** Highlight rule for one pair of members (QMT-26). Stored in data so the committee can edit it without a rebuild. */
/**
 * List title (QMT-26 list titles): the similar word/phrase itself, as an exact word span of the Tanzil text
 * (`text` = words startWord..endWord joined by spaces, i.e. an exact substring of the ayah). Generated at
 * build time; the committee may edit it (basis = committee) and ship it as data (OTA).
 */
export type TitleSpan = { ayahId: AyahId; startWord: number; endWord: number; text: string };
/** phrase = shared phrase (method=phrase); lcs = longest common contiguous part; fallback = beginning of the ayah. */
export type TitleBasis = 'phrase' | 'lcs' | 'fallback' | 'committee';

export type HighlightRule = {
  id: string;
  /** Ayah ids (first ayah of each member) of the pair, lexicographically ordered by mushaf position. */
  pair: [AyahId, AyahId];
  /** Word-level ranges for each side. */
  ranges: WordRange[];
  /** Optional letter-level ranges: [ayahId, wordIndex, startChar, endChar] inside a highlighted word (UTF-16 offsets, inclusive start / exclusive end). */
  letterRanges?: { ayahId: AyahId; word: number; start: number; end: number }[];
  granularity: 'word' | 'letter' | 'none';
  /** Pair-level classification; overrides the group's similarityType for this pair. */
  similarityType?: SimilarityType;
  /**
   * Auto-diff method: `lcs` = whole-ayah word LCS; `phrase` = low overall overlap but a shared contiguous
   * phrase of ≥ 3 words, highlighted around that phrase (see phraseDiff in src/domain/diff.ts).
   */
  method?: 'lcs' | 'phrase';
  /** List title for this pair: one span per side, [pair[0] side, pair[1] side] (each in its own wording). */
  titles?: [TitleSpan, TitleSpan];
  titleBasis?: TitleBasis;
  /** For method=phrase: the shared phrase(s) located on each side (word ranges). */
  phrases?: { a: WordRange[]; b: WordRange[]; length: number }[];
  /** auto_diff = computed by scripts/build-mutashabihat-data.mjs; committee = edited by reviewers. */
  source: 'auto_diff' | 'committee';
  algorithm?: string;
  /** How much of the pair matched word-for-word; low = thematic rather than verbal similarity. Persisted uncertainty. */
  confidence?: 'high' | 'medium' | 'low';
  matchRatio?: number;
  /** Relative to pair[0]: زيادة = pair[0] has extra words; نقص = pair[0] lacks words present in pair[1]. */
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

export const SIMILARITY_LABELS: Record<SimilarityType, string> = {
  lafzi: 'متشابه لفظي',
  semantic: 'تشابه معنوي',
};

export const SOURCE_LABELS: Record<SourceName, string> = {
  quranpedia: 'الموسوعة القرآنية',
  waqar144: 'Waqar144',
  hifzlink: 'HifzLink',
};

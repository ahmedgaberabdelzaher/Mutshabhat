import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/config/theme';
import { SIMILARITY_LABELS, STATUS_LABELS, type ReviewStatus, type SimilarityType } from '@/domain/mutashabihat';

const PALETTE: Record<ReviewStatus, { fg: string; bg: string }> = {
  draft: { fg: colors.draft, bg: colors.draftBg },
  under_review: { fg: colors.underReview, bg: colors.underReviewBg },
  approved: { fg: colors.approved, bg: colors.approvedBg },
  rejected: { fg: colors.rejected, bg: colors.rejectedBg },
};

/** Visible review-status badge (QMT-48 AC4). */
export function StatusBadge({ status, testID }: { status: ReviewStatus; testID?: string }) {
  const p = PALETTE[status];
  return (
    <View
      style={[styles.badge, { backgroundColor: p.bg, borderColor: p.fg }]}
      accessibilityLabel={`الحالة: ${STATUS_LABELS[status]}`}
      testID={testID}>
      <Text style={[styles.text, { color: p.fg }]}>{STATUS_LABELS[status]}</Text>
    </View>
  );
}

const SIMILARITY_PALETTE: Record<SimilarityType, { fg: string; bg: string }> = {
  lafzi: { fg: '#1F5F8B', bg: '#E6F0F7' },
  semantic: { fg: '#7A4E9C', bg: '#F1EAF7' },
};

/** Similarity-type badge (لفظي / معنوي), shown in the review build. */
export function SimilarityBadge({ type, testID }: { type: SimilarityType; testID?: string }) {
  const p = SIMILARITY_PALETTE[type];
  return (
    <View
      style={[styles.badge, { backgroundColor: p.bg, borderColor: p.fg }]}
      accessibilityLabel={`النوع: ${SIMILARITY_LABELS[type]}`}
      testID={testID}>
      <Text style={[styles.text, { color: p.fg }]}>{SIMILARITY_LABELS[type]}</Text>
    </View>
  );
}

export function Tag({ label, testID }: { label: string; testID?: string }) {
  return (
    <View style={[styles.badge, styles.tag]} testID={testID}>
      <Text style={[styles.text, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 2, alignSelf: 'flex-start' },
  tag: { borderColor: colors.border, backgroundColor: '#F6F2E8' },
  text: { fontSize: 13, fontWeight: '700' },
});

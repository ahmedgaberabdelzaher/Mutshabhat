import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/config/theme';
import { STATUS_LABELS, type ReviewStatus } from '@/domain/mutashabihat';

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

import { StyleSheet, Text, View } from 'react-native';

import { FLAVOR_LABELS } from '@/config/flavor';
import { colors, spacing } from '@/config/theme';
import { getMutashabihatRepository } from '@/data';
import { toArabicDigits } from '@/lib/arabic-digits';

/** Explains which dataset this build reads. Review builds must never be mistaken for approved content. */
export function FlavorBanner() {
  const repo = getMutashabihatRepository();
  const info = repo.getDatasetInfo();
  const review = repo.policy.flavor === 'review';
  return (
    <View style={[styles.box, review ? styles.review : styles.prod]} testID="flavor-banner">
      <Text style={styles.title}>{FLAVOR_LABELS[repo.policy.flavor]}</Text>
      {review ? (
        <Text style={styles.text}>
          {`بيانات مرشّحة للمراجعة وليست معتمدة علميًا · إصدار البيانات ${toArabicDigits(info.datasetVersion)} · ${toArabicDigits(info.groupCount)} سجلًا (منها ${toArabicDigits(info.pilotCount)} في عيّنة اللجنة)`}
        </Text>
      ) : info.groupCount === 0 ? (
        <Text style={styles.text} testID="no-approved">
          لا توجد متشابهات معتمدة بعد. ستظهر هنا بعد اعتماد اللجنة العلمية.
        </Text>
      ) : (
        <Text style={styles.text}>{`${toArabicDigits(info.groupCount)} موضعًا معتمدًا`}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 12, padding: spacing.md, gap: 4, borderWidth: 1 },
  review: { backgroundColor: colors.draftBg, borderColor: colors.draft },
  prod: { backgroundColor: colors.approvedBg, borderColor: colors.approved },
  title: { fontSize: 16, fontWeight: '700', color: colors.text },
  text: { fontSize: 14, color: colors.text, lineHeight: 22 },
});

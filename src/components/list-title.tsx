import { StyleSheet, Text, View } from 'react-native';

import { SimilarityBadge } from '@/components/status-badge';
import { ACTIVE_QURAN_FONT } from '@/config/fonts';
import { colors, spacing } from '@/config/theme';
import type { SimilarityType } from '@/domain/mutashabihat';
import type { ListTitle } from '@/domain/title';

/**
 * Title of a mutashabihat list item: the similar word/phrase itself, in the Quran font (exact Tanzil text).
 * Fallback (no displayable shared part): the beginning of the ayah + «…» + the type badge.
 */
export function ListTitleText({
  title,
  similarityType,
  testID,
}: {
  title: ListTitle;
  similarityType: SimilarityType;
  testID?: string;
}) {
  const fallback = title.basis === 'fallback';
  return (
    <View style={styles.row}>
      <Text
        style={[styles.title, { fontFamily: ACTIVE_QURAN_FONT.family }]}
        numberOfLines={2}
        testID={testID}
        accessibilityRole="header">
        {fallback ? `${title.text} …` : title.text}
      </Text>
      {fallback ? <SimilarityBadge type={similarityType} testID={testID ? `${testID}-type` : undefined} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
  title: { fontSize: 21, lineHeight: 40, color: colors.text, flexShrink: 1, textAlign: 'auto' },
});

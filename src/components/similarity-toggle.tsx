import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/config/theme';
import type { SimilarityType } from '@/domain/mutashabihat';

const OPTIONS: { value: SimilarityType; label: string }[] = [
  { value: 'lafzi', label: 'المتشابه اللفظي' },
  { value: 'semantic', label: 'تشابه معنوي (خارج نطاق MVP)' },
];

/**
 * Review-build filter. Default view = lafzi (MVP scope); semantic pairs (little shared wording) are only
 * listed when the reviewer picks them here. Never rendered in beta/production.
 */
export function SimilarityToggle({
  value,
  onChange,
}: {
  value: SimilarityType;
  onChange: (s: SimilarityType) => void;
}) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {OPTIONS.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === o.value }}
          onPress={() => onChange(o.value)}
          testID={`similarity-${o.value}`}
          style={[styles.option, value === o.value && styles.selected]}>
          <Text style={[styles.text, value === o.value && styles.selectedText]}>{o.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  option: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.textMuted,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
  },
  selected: { backgroundColor: colors.textMuted },
  text: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  selectedText: { color: colors.surface },
});

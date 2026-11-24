import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, spacing } from '@/config/theme';
import type { Scope } from '@/data';

const OPTIONS: { value: Scope; label: string }[] = [
  { value: 'pilot', label: 'عيّنة اللجنة (HifzLink)' },
  { value: 'all', label: 'كل البيانات المرشّحة' },
];

/** Review-build filter: committee pilot set (285 HifzLink pairs, QMT-49) vs all candidate data. */
export function ScopeToggle({ value, onChange }: { value: Scope; onChange: (s: Scope) => void }) {
  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {OPTIONS.map((o) => (
        <Pressable
          key={o.value}
          accessibilityRole="radio"
          accessibilityState={{ selected: value === o.value }}
          onPress={() => onChange(o.value)}
          testID={`scope-${o.value}`}
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
    borderColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  selected: { backgroundColor: colors.primary },
  text: { color: colors.primary, fontWeight: '600' },
  selectedText: { color: colors.primaryText },
});

import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

import { DivisionList } from '@/components/division-list';
import { Button } from '@/components/ui';
import { colors, spacing } from '@/config/theme';
import { getQuranRepository } from '@/data';
import { toArabicDigits } from '@/lib/arabic-digits';
import { positionCounts } from '@/lib/position-counts';

const toLatin = (s: string) => s.replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)));

/** QMT-32: pick a Madinah mushaf page (1–604, Tanzil metadata). */
export default function BrowseByPageScreen() {
  const quran = getQuranRepository();
  const counts = positionCounts('page');
  const [input, setInput] = useState('');
  const [error, setError] = useState(false);
  const pages = quran.getPageList();

  const go = () => {
    const n = Number(toLatin(input.trim()));
    if (!Number.isInteger(n) || n < 1 || n > pages.length) {
      setError(true);
      return;
    }
    setError(false);
    router.push({ pathname: '/browse/page/[page]', params: { page: String(n) } });
  };

  const items = pages.map((p) => {
    const start = quran.getAyah(p.start)!;
    return {
      key: String(p.index),
      title: `الصفحة ${toArabicDigits(p.index)}`,
      subtitle: `${start.surahName} ${toArabicDigits(start.ayah)} · الجزء ${toArabicDigits(start.juz)}`,
      count: counts.get(p.index) ?? 0,
      href: { pathname: '/browse/page/[page]' as const, params: { page: String(p.index) } },
    };
  });

  return (
    <DivisionList
      items={items}
      testIDPrefix="page"
      header={
        <View style={styles.jump}>
          <TextInput
            value={input}
            onChangeText={setInput}
            onSubmitEditing={go}
            placeholder="رقم الصفحة (١–٦٠٤)"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            style={styles.input}
            testID="page-input"
          />
          <Button label="انتقال" onPress={go} testID="page-go" />
          {error ? <Text style={styles.error}>اكتب رقم صفحة من ١ إلى ٦٠٤.</Text> : null}
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  jump: { gap: spacing.sm, marginBottom: spacing.md },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 18,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlign: 'right',
  },
  error: { color: colors.rejected },
});

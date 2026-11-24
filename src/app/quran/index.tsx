import { FlatList, StyleSheet } from 'react-native';

import { LinkRow } from '@/components/ui';
import { colors, MAX_CONTENT_WIDTH, spacing } from '@/config/theme';
import { getQuranRepository } from '@/data';
import { toArabicDigits } from '@/lib/arabic-digits';

export default function SurahIndexScreen() {
  const surahs = getQuranRepository().getSurahs();
  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.content}
      data={surahs}
      keyExtractor={(s) => String(s.index)}
      renderItem={({ item }) => (
        <LinkRow
          href={{ pathname: '/quran/[surah]', params: { surah: String(item.index) } }}
          title={`${toArabicDigits(item.index)}. ${item.name}`}
          subtitle={`${toArabicDigits(item.ayahCount)} آية · ${item.type === 'Meccan' ? 'مكية' : 'مدنية'}`}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
});

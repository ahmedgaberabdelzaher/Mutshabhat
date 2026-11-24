import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { FlatList, Pressable, StyleSheet } from 'react-native';

import { AyahText } from '@/components/ayah-text';
import { Muted, Screen } from '@/components/ui';
import { colors, MAX_CONTENT_WIDTH, spacing } from '@/config/theme';
import { getQuranRepository } from '@/data';

export default function SurahScreen() {
  const { surah } = useLocalSearchParams<{ surah: string }>();
  const repo = getQuranRepository();
  const info = repo.getSurah(Number(surah));
  if (!info) {
    return (
      <Screen>
        <Muted>السورة غير موجودة.</Muted>
      </Screen>
    );
  }
  const ayahs = repo.getAyahsOfSurah(info.index);
  return (
    <>
      <Stack.Screen options={{ title: `سورة ${info.name}` }} />
      <FlatList
        style={styles.list}
        contentContainerStyle={styles.content}
        data={ayahs}
        keyExtractor={(a) => a.id}
        initialNumToRender={12}
        renderItem={({ item }) => (
          <Link
            href={{ pathname: '/ayah/[surah]/[ayah]', params: { surah: String(item.surah), ayah: String(item.ayah) } }}
            asChild>
            <Pressable style={styles.ayah}>
              <AyahText ayah={item} />
            </Pressable>
          </Link>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  list: { backgroundColor: colors.background },
  content: { padding: spacing.lg, gap: spacing.sm, width: '100%', maxWidth: MAX_CONTENT_WIDTH, alignSelf: 'center' },
  ayah: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
});

import { Link, Stack, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AnaloguesSection } from '@/components/analogues-section';
import { AyahText } from '@/components/ayah-text';
import { Card, LinkRow, Muted, Screen, Title } from '@/components/ui';
import { colors, spacing } from '@/config/theme';
import { getQuranRepository } from '@/data';
import { makeAyahId } from '@/domain/quran';
import { toArabicDigits } from '@/lib/arabic-digits';

export default function AyahScreen() {
  const params = useLocalSearchParams<{ surah: string; ayah: string }>();
  const repo = getQuranRepository();
  const ayah = repo.getAyah(makeAyahId(Number(params.surah), Number(params.ayah)));

  if (!ayah) {
    return (
      <Screen>
        <Muted>الآية غير موجودة.</Muted>
      </Screen>
    );
  }

  const abs = repo.absoluteIndex(ayah.id);
  const prev = repo.ayahAt(abs - 1);
  const next = repo.ayahAt(abs + 1);

  return (
    <Screen>
      <Stack.Screen options={{ title: `${ayah.surahName} ${toArabicDigits(ayah.ayah)}` }} />
      <Card>
        <View style={styles.header}>
          <Title>{`سورة ${ayah.surahName}`}</Title>
          <Text style={styles.ayahNo} testID="ayah-number">{`الآية ${toArabicDigits(ayah.ayah)}`}</Text>
        </View>
        <AyahText ayah={ayah} size="large" testID="ayah-text" />
        <Muted>{`الجزء ${toArabicDigits(ayah.juz)} · الصفحة ${toArabicDigits(ayah.page)} (مصحف المدينة)`}</Muted>
      </Card>

      <AnaloguesSection key={ayah.id} ayahId={ayah.id} />

      <Link href="/sources" style={styles.attribution} testID="ayah-attribution">
        النص من مشروع تنزيل (tanzil.net)، برخصة CC BY 3.0، كما هو من غير تعديل · المصادر
      </Link>

      <View style={styles.nav}>
        {next ? (
          <View style={styles.navItem}>
            <LinkRow
              href={{ pathname: '/ayah/[surah]/[ayah]', params: { surah: String(next.surah), ayah: String(next.ayah) } }}
              title="الآية التالية"
              subtitle={`${next.surahName} ${toArabicDigits(next.ayah)}`}
            />
          </View>
        ) : null}
        {prev ? (
          <View style={styles.navItem}>
            <LinkRow
              href={{ pathname: '/ayah/[surah]/[ayah]', params: { surah: String(prev.surah), ayah: String(prev.ayah) } }}
              title="الآية السابقة"
              subtitle={`${prev.surahName} ${toArabicDigits(prev.ayah)}`}
            />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.sm },
  ayahNo: { fontSize: 16, color: colors.primary, fontWeight: '700' },
  nav: { gap: spacing.sm },
  navItem: {},
  attribution: { color: colors.primary, fontSize: 14, textDecorationLine: 'underline' },
});

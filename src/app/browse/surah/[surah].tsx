import { Stack, useLocalSearchParams } from 'expo-router';

import { PositionList } from '@/components/position-list';
import { Muted, Screen } from '@/components/ui';
import { getQuranRepository } from '@/data';

/** QMT-30: positions in the chosen surah only, in mushaf order. */
export default function SurahPositionsScreen() {
  const { surah } = useLocalSearchParams<{ surah: string }>();
  const quran = getQuranRepository();
  const info = quran.getSurah(Number(surah));
  if (!info) {
    return (
      <Screen>
        <Muted>السورة غير موجودة.</Muted>
      </Screen>
    );
  }
  const ids = quran.getAyahsOfSurah(info.index).map((a) => a.id);
  return (
    <>
      <Stack.Screen options={{ title: `مواضع سورة ${info.name}` }} />
      <PositionList ayahIds={ids} />
    </>
  );
}

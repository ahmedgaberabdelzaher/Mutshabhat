import { Stack, useLocalSearchParams } from 'expo-router';

import { PositionList } from '@/components/position-list';
import { Muted, Screen } from '@/components/ui';
import { getQuranRepository } from '@/data';
import { toArabicDigits } from '@/lib/arabic-digits';

/** QMT-31: positions in the chosen juz only, in mushaf order. */
export default function JuzPositionsScreen() {
  const { juz } = useLocalSearchParams<{ juz: string }>();
  const n = Number(juz);
  const ids = getQuranRepository().getAyahIdsInJuz(n);
  if (!ids.length) {
    return (
      <Screen>
        <Muted>الجزء غير موجود.</Muted>
      </Screen>
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: `مواضع الجزء ${toArabicDigits(n)}` }} />
      <PositionList ayahIds={ids} />
    </>
  );
}

import { Stack, useLocalSearchParams } from 'expo-router';

import { PositionList } from '@/components/position-list';
import { Muted, Screen } from '@/components/ui';
import { getQuranRepository } from '@/data';
import { toArabicDigits } from '@/lib/arabic-digits';

/** QMT-32: positions on the chosen Madinah mushaf page only, in mushaf order. */
export default function PagePositionsScreen() {
  const { page } = useLocalSearchParams<{ page: string }>();
  const n = Number(page);
  const ids = getQuranRepository().getAyahIdsOnPage(n);
  if (!ids.length) {
    return (
      <Screen>
        <Muted>الصفحة غير موجودة.</Muted>
      </Screen>
    );
  }
  return (
    <>
      <Stack.Screen options={{ title: `مواضع الصفحة ${toArabicDigits(n)}` }} />
      <PositionList ayahIds={ids} />
    </>
  );
}

import { DivisionList } from '@/components/division-list';
import { getQuranRepository } from '@/data';
import { toArabicDigits } from '@/lib/arabic-digits';
import { positionCounts } from '@/lib/position-counts';

/** QMT-31: pick a juz (1–30, Tanzil metadata). */
export default function BrowseByJuzScreen() {
  const quran = getQuranRepository();
  const counts = positionCounts('juz');
  const items = quran.getJuzList().map((j) => {
    const start = quran.getAyah(j.start)!;
    return {
      key: String(j.index),
      title: `الجزء ${toArabicDigits(j.index)}`,
      subtitle: `يبدأ من ${start.surahName} ${toArabicDigits(start.ayah)}`,
      count: counts.get(j.index) ?? 0,
      href: { pathname: '/browse/juz/[juz]' as const, params: { juz: String(j.index) } },
    };
  });
  return <DivisionList items={items} testIDPrefix="juz" />;
}

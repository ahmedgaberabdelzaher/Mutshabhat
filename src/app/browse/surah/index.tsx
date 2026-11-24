import { DivisionList } from '@/components/division-list';
import { getQuranRepository } from '@/data';
import { toArabicDigits } from '@/lib/arabic-digits';
import { positionCounts } from '@/lib/position-counts';

/** QMT-30: pick a surah (1–114, Arabic names). */
export default function BrowseBySurahScreen() {
  const counts = positionCounts('surah');
  const items = getQuranRepository()
    .getSurahs()
    .map((s) => ({
      key: String(s.index),
      title: `${toArabicDigits(s.index)}. ${s.name}`,
      count: counts.get(s.index) ?? 0,
      href: { pathname: '/browse/surah/[surah]' as const, params: { surah: String(s.index) } },
    }));
  return <DivisionList items={items} testIDPrefix="surah" />;
}

import { getQuranRepository } from '@/data';
import { toArabicDigits } from '@/lib/arabic-digits';

/** «البقرة ٢٥» for an ayah id (falls back to the raw id). */
export function refLabel(id: string): string {
  const a = getQuranRepository().getAyah(id);
  return a ? `${a.surahName} ${toArabicDigits(a.ayah)}` : id;
}

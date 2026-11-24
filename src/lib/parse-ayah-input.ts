import { makeAyahId, type AyahId } from '@/domain/quran';

const ARABIC_INDIC = '٠١٢٣٤٥٦٧٨٩';
const EXTENDED = '۰۱۲۳۴۵۶۷۸۹';

/** Parse user input like "2:255", "٢:٢٥٥", "2 255" or "2/255" into an AyahId (no range validation). */
export function parseAyahInput(raw: string): AyahId | null {
  const latin = raw.replace(/[٠-٩۰-۹]/g, (d) => {
    const i = ARABIC_INDIC.indexOf(d);
    return String(i >= 0 ? i : EXTENDED.indexOf(d));
  });
  const m = latin.trim().match(/^(\d{1,3})\s*[:：/\-\s،,]\s*(\d{1,3})$/);
  if (!m) return null;
  return makeAyahId(Number(m[1]), Number(m[2]));
}

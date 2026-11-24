import { getMutashabihatRepository, getQuranRepository } from '@/data';

/** Count visible positions per surah / juz / page (all scope; approved-only in beta/production). */
export function positionCounts(by: 'surah' | 'juz' | 'page'): Map<number, number> {
  const quran = getQuranRepository();
  const repo = getMutashabihatRepository();
  const counts = new Map<number, number>();
  for (const id of repo.getPositionAyahIds('all')) {
    const ayah = quran.getAyah(id);
    if (!ayah) continue;
    const k = by === 'surah' ? ayah.surah : by === 'juz' ? ayah.juz : ayah.page;
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return counts;
}

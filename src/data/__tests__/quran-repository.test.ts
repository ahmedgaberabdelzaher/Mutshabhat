import { getQuranRepository } from '@/data';

const repo = getQuranRepository();

describe('LocalQuranRepository', () => {
  it('exposes 114 surahs with official Arabic names', () => {
    const surahs = repo.getSurahs();
    expect(surahs).toHaveLength(114);
    expect(surahs[0].name).toBe('الفاتحة');
    expect(surahs[1].name).toBe('البقرة');
    expect(surahs[113].name).toBe('الناس');
  });

  it('returns ayah number, surah name, juz and Madinah page from Tanzil metadata', () => {
    const a = repo.getAyah('2:255')!;
    expect(a).toMatchObject({ id: '2:255', surah: 2, ayah: 255, surahName: 'البقرة', juz: 3, page: 42 });
    expect(repo.getAyah('1:1')).toMatchObject({ juz: 1, page: 1 });
    expect(repo.getAyah('2:142')).toMatchObject({ juz: 2 });
    expect(repo.getAyah('2:141')).toMatchObject({ juz: 1 });
    expect(repo.getAyah('114:6')).toMatchObject({ juz: 30, page: 604 });
  });

  it('returns undefined for ids outside the mushaf', () => {
    expect(repo.getAyah('1:8')).toBeUndefined();
    expect(repo.getAyah('115:1')).toBeUndefined();
    expect(repo.getAyah('abc')).toBeUndefined();
  });

  it('maps absolute positions both ways', () => {
    expect(repo.absoluteIndex('1:1')).toBe(0);
    expect(repo.absoluteIndex('2:1')).toBe(7);
    expect(repo.ayahAt(6235)!.id).toBe('114:6');
    expect(repo.ayahAt(6236)).toBeUndefined();
  });

  it('lists ayahs per juz and per page covering the whole mushaf exactly once', () => {
    const byJuz = Array.from({ length: 30 }, (_, i) => repo.getAyahIdsInJuz(i + 1)).flat();
    const byPage = Array.from({ length: 604 }, (_, i) => repo.getAyahIdsOnPage(i + 1)).flat();
    expect(byJuz).toHaveLength(6236);
    expect(byPage).toHaveLength(6236);
    expect(new Set(byPage).size).toBe(6236);
    expect(repo.getAyahIdsOnPage(1)).toEqual(['1:1', '1:2', '1:3', '1:4', '1:5', '1:6', '1:7']);
  });
});

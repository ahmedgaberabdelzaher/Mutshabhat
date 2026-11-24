import type { Ayah, AyahId, JuzInfo, PageInfo, Surah } from '@/domain/quran';
import { makeAyahId, parseAyahId, tokenize } from '@/domain/quran';

/** Read-only access to the Quran text and Tanzil metadata. Screens depend on this interface only. */
export interface QuranRepository {
  readonly sourceInfo: { source: string; license: string; sha256: string; notice: string };
  getSurahs(): Surah[];
  getSurah(index: number): Surah | undefined;
  getAyah(id: AyahId): Ayah | undefined;
  getAyahsOfSurah(surah: number): Ayah[];
  /** Absolute 0-based position of an ayah in mushaf order (0–6235). */
  absoluteIndex(id: AyahId): number;
  ayahAt(absoluteIndex: number): Ayah | undefined;
  getJuzList(): JuzInfo[];
  getPageList(): PageInfo[];
  /** Ayah ids (mushaf order) in the given juz / Madinah page. */
  getAyahIdsInJuz(juz: number): AyahId[];
  getAyahIdsOnPage(page: number): AyahId[];
}

export type QuranTextFile = {
  source: string;
  license: string;
  sourceSha256: string;
  notice: string;
  surahs: string[][];
};

export type QuranMetaFile = {
  surahs: { index: number; ayahCount: number; start: number; name: string; type: string }[];
  juz: { index: number; surah: number; ayah: number }[];
  pages: { index: number; surah: number; ayah: number }[];
};

/** Upper-bound search: index of the last start <= value. */
function lastStartAtOrBefore(starts: number[], value: number): number {
  let lo = 0;
  let hi = starts.length - 1;
  while (lo < hi) {
    const mid = (lo + hi + 1) >> 1;
    if (starts[mid] <= value) lo = mid;
    else hi = mid - 1;
  }
  return lo;
}

/** Bundled-JSON implementation (Sprint 1: offline, no network). */
export class LocalQuranRepository implements QuranRepository {
  readonly sourceInfo;
  private readonly surahStart: number[];
  private readonly juzStart: number[];
  private readonly pageStart: number[];
  private readonly total: number;

  constructor(
    private readonly text: QuranTextFile,
    private readonly meta: QuranMetaFile,
  ) {
    this.sourceInfo = { source: text.source, license: text.license, sha256: text.sourceSha256, notice: text.notice };
    this.surahStart = meta.surahs.map((s) => s.start);
    this.total = meta.surahs.reduce((n, s) => n + s.ayahCount, 0);
    this.juzStart = meta.juz.map((j) => this.absoluteIndex(makeAyahId(j.surah, j.ayah)));
    this.pageStart = meta.pages.map((p) => this.absoluteIndex(makeAyahId(p.surah, p.ayah)));
  }

  getSurahs(): Surah[] {
    return this.meta.surahs.map(({ index, name, ayahCount, type }) => ({ index, name, ayahCount, type }));
  }

  getSurah(index: number): Surah | undefined {
    const s = this.meta.surahs[index - 1];
    return s && { index: s.index, name: s.name, ayahCount: s.ayahCount, type: s.type };
  }

  absoluteIndex(id: AyahId): number {
    const { surah, ayah } = parseAyahId(id);
    const s = this.meta.surahs[surah - 1];
    if (!s || ayah < 1 || ayah > s.ayahCount) return -1;
    return s.start + ayah - 1;
  }

  ayahAt(abs: number): Ayah | undefined {
    if (!Number.isInteger(abs) || abs < 0 || abs >= this.total) return undefined;
    const si = lastStartAtOrBefore(this.surahStart, abs);
    return this.getAyah(makeAyahId(si + 1, abs - this.surahStart[si] + 1));
  }

  getAyah(id: AyahId): Ayah | undefined {
    let parsed;
    try {
      parsed = parseAyahId(id);
    } catch {
      return undefined;
    }
    const { surah, ayah } = parsed;
    const text = this.text.surahs[surah - 1]?.[ayah - 1];
    if (text === undefined) return undefined;
    const abs = this.absoluteIndex(id);
    return {
      id: makeAyahId(surah, ayah),
      surah,
      ayah,
      surahName: this.meta.surahs[surah - 1].name,
      juz: lastStartAtOrBefore(this.juzStart, abs) + 1,
      page: lastStartAtOrBefore(this.pageStart, abs) + 1,
      text,
      words: tokenize(text),
    };
  }

  getAyahsOfSurah(surah: number): Ayah[] {
    const s = this.meta.surahs[surah - 1];
    if (!s) return [];
    return Array.from({ length: s.ayahCount }, (_, i) => this.getAyah(makeAyahId(surah, i + 1))!);
  }

  getJuzList(): JuzInfo[] {
    return this.meta.juz.map((j) => ({ index: j.index, start: makeAyahId(j.surah, j.ayah) }));
  }

  getPageList(): PageInfo[] {
    return this.meta.pages.map((p) => ({ index: p.index, start: makeAyahId(p.surah, p.ayah) }));
  }

  private idsInRange(starts: number[], n: number): AyahId[] {
    if (n < 1 || n > starts.length) return [];
    const from = starts[n - 1];
    const to = n < starts.length ? starts[n] : this.total;
    const ids: AyahId[] = [];
    for (let i = from; i < to; i++) ids.push(this.ayahAt(i)!.id);
    return ids;
  }

  getAyahIdsInJuz(juz: number): AyahId[] {
    return this.idsInRange(this.juzStart, juz);
  }

  getAyahIdsOnPage(page: number): AyahId[] {
    return this.idsInRange(this.pageStart, page);
  }
}

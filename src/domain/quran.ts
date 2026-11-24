/** Ayah id is "surah:ayah", e.g. "2:255". surah and ayah are 1-based. */
export type AyahId = string;

export type Ayah = {
  id: AyahId;
  surah: number; // 1–114
  ayah: number;
  surahName: string; // official Arabic name from Tanzil metadata
  juz: number; // 1–30
  page: number; // Madinah mushaf page (1–604)
  /** Exact Tanzil text. Never mutated, normalised or re-encoded. */
  text: string;
  /** Display tokens derived from `text` (split on single spaces). Not a second source of truth. */
  words: string[];
};

export type Surah = {
  index: number;
  name: string;
  ayahCount: number;
  type: 'Meccan' | 'Medinan' | string;
};

export type JuzInfo = { index: number; start: AyahId };
export type PageInfo = { index: number; start: AyahId };

export function makeAyahId(surah: number, ayah: number): AyahId {
  return `${surah}:${ayah}`;
}

export function parseAyahId(id: AyahId): { surah: number; ayah: number } {
  const [s, a] = id.split(':').map(Number);
  if (!Number.isInteger(s) || !Number.isInteger(a)) throw new Error(`Invalid ayah id: ${id}`);
  return { surah: s, ayah: a };
}

/** Split on the single ASCII spaces Tanzil uses between tokens. Joining with ' ' gives back `text` exactly. */
export function tokenize(text: string): string[] {
  return text.split(' ');
}

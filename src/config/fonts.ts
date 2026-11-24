/**
 * Quran font configuration — the ONE place to swap the Mushaf font.
 *
 * Current: Amiri Quran (SIL OFL 1.1, assets/fonts/amiri-quran/OFL.txt).
 * KFGQPC Uthmanic fonts are NOT bundled until the King Fahd Complex licence is granted
 * (Phase 0 correspondence). To switch, add the licensed file under assets/fonts/ and change
 * ACTIVE_QURAN_FONT below; no screen code needs to change.
 */
export type QuranFontConfig = {
  family: string;
  source: number; // result of require() on a font asset
  displayName: string;
  license: string;
  url: string;
};

export const QURAN_FONTS = {
  amiriQuran: {
    family: 'AmiriQuran',
    source: require('../../assets/fonts/amiri-quran/AmiriQuran.ttf'),
    displayName: 'Amiri Quran — خالد حسني',
    license: 'SIL Open Font License 1.1',
    url: 'https://github.com/aliftype/amiri',
  },
  // Optional OFL alternative already in the repo (assets/fonts/digitalkhatt-madina/madina.otf).
  // Not registered by default so Metro does not bundle its 2.6 MB file. To use it, add:
  // digitalKhattMadina: { family: 'DigitalKhattMadina', source: require('../../assets/fonts/digitalkhatt-madina/madina.otf'),
  //   displayName: 'DigitalKhatt Madina — أمين عنان', license: 'SIL Open Font License 1.1', url: 'https://github.com/DigitalKhatt/madinafont' },
} satisfies Record<string, QuranFontConfig>;

export const ACTIVE_QURAN_FONT: QuranFontConfig = QURAN_FONTS.amiriQuran;

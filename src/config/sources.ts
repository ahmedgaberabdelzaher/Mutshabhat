/**
 * Attribution shown on the Sources screen (QMT-24). Keep in sync with DATA_SOURCES.md.
 */
export type SourceAttribution = {
  key: 'tanzil' | 'quranpedia' | 'waqar144' | 'hifzlink' | 'amiri';
  title: string;
  role: string;
  license: string;
  licenseUrl?: string;
  url: string;
  lines: string[];
};

export const SOURCES: SourceAttribution[] = [
  {
    key: 'tanzil',
    title: 'مشروع تنزيل (Tanzil Project)',
    role: 'نص المصحف (الرسم العثماني، الإصدار 1.1) وبيانات السور والأجزاء وصفحات مصحف المدينة',
    license: 'Creative Commons Attribution 3.0 (CC BY 3.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by/3.0/',
    url: 'https://tanzil.net/',
    lines: [
      'المصدر: Tanzil Project — tanzil.net',
      'يُعرَض النص كما هو من غير أي تعديل، وفق شروط الترخيص.',
      'Tanzil Quran Text (Uthmani, Version 1.1) — Copyright (C) 2007-2026 Tanzil Project.',
    ],
  },
  {
    key: 'quranpedia',
    title: 'الموسوعة القرآنية (Quranpedia.net) — مركز أصول',
    role: 'بيانات الآيات المتشابهة (عيّنة مرشّحة للمراجعة)',
    license: 'Quranpedia.net Data License — إصدار التفريغ 2026-11-21',
    licenseUrl: 'https://quranpedia.net/dumps/LICENSE.md',
    url: 'https://quranpedia.net',
    lines: [
      'Similar-ayah data from Quranpedia.net («الموسوعة القرآنية»), operated by OsoulCenter (مركز أصول).',
      'المصدر: الموسوعة القرآنية quranpedia.net — تاريخ نسخة البيانات (dump version): 2026-11-21 (similar.json.gz).',
      'شرط الترخيص: الاستعمال داخل التطبيقات مجاني، ويلزم عند إعادة نشر البيانات ذكرُ «الموسوعة القرآنية quranpedia.net» مصدرًا مع رابط الموقع وبيانُ تاريخ النسخة.',
    ],
  },
  {
    key: 'waqar144',
    title: 'Quran Mutashabihat Data — Waqar Ahmed (Waqar144)',
    role: 'بيانات المتشابهات (عيّنة مرشّحة للمراجعة)',
    license: 'CC0 1.0 Universal',
    licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
    url: 'https://github.com/Waqar144/Quran_Mutashabihat_Data',
    lines: ['This project uses Quran Mutashabihat Data by Waqar Ahmed (Waqar144).'],
  },
  {
    key: 'hifzlink',
    title: 'quran-mutashabihat — srmdn / HifzLink',
    role: 'أزواج المتشابهات المنقّحة (curated) وتصنيفاتها وملاحظاتها',
    license: 'Creative Commons Attribution 4.0 (CC BY 4.0)',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    url: 'https://github.com/srmdn/quran-mutashabihat',
    lines: ['Curated mutashabihat pairs (categories and notes) by srmdn / HifzLink, licensed under CC BY 4.0.'],
  },
  {
    key: 'amiri',
    title: 'خط Amiri Quran — خالد حسني',
    role: 'خط عرض نص المصحف',
    license: 'SIL Open Font License 1.1',
    licenseUrl: 'https://openfontlicense.org/',
    url: 'https://github.com/aliftype/amiri',
    lines: ['Amiri Quran font by Khaled Hosny / aliftype.'],
  },
];

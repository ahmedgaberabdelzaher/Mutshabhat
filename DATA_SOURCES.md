# Data sources

**Status: CANDIDATE / for review only.**

Mutashabihat records in this repository are **not scholar-approved** and **must not ship in beta or production** until the scientific committee has approved them. Sprint 1 may use this sample only in a **review build**, with each record treated as `draft` or `under_review`. A separate production dataset (approved records only) is not included yet and should stay empty until that review happens.

نصوص المتشابهات المضمَّنة هنا **مرشَّحة للمراجعة فقط**، وليست معتمدة علميًا. **لا تُدرَج في نسخة بيتا أو الإنتاج** حتى تعتمدها اللجنة العلمية.

This commit is data only. It does not add app UI, loaders, or a normalized product schema.

Fetched on **24 November 2026, about 15:40 Asia/Riyadh (UTC+3)**, unless a source lists an earlier upstream date below.

---

## Layout

| Path | Role |
| --- | --- |
| `assets/data/candidate/` | Licensed mutashabihat samples, still pending scholarly approval |
| `assets/data/tanzil/` | Official Tanzil Quran text and metadata (unmodified; checksum source) |
| `assets/fonts/amiri-quran/` | **Primary** Quran font (SIL OFL 1.1) |
| `assets/fonts/digitalkhatt-madina/` | Optional OFL alternative Quran font |

Tanzil is the canonical mushaf text, not a mutashabihat candidate record. It is stored outside `candidate/` so a later checksum test can compare the bundled text to this source file. Mutashabihat sources stay under `candidate/`.

Metro can bundle JSON by default. Do **not** `require()` `similar.json.gz` or decompress it into the app (the official dump is ~42 MB uncompressed and includes media plus a non-Tanzil Quran text). Prefer `similar.slim.json` or a later normalized review dataset.

---

## 1. Quranpedia similar ayahs (primary mutashabihat sample)

- **Source:** Quranpedia («الموسوعة القرآنية»), operated by OsoulCenter (مركز أصول)
- **URLs:** [https://quranpedia.net/dumps/similar.json.gz](https://quranpedia.net/dumps/similar.json.gz), [license](https://quranpedia.net/dumps/LICENSE.md), site [https://quranpedia.net](https://quranpedia.net)
- **License:** Quranpedia.net Data License (see `assets/data/candidate/quranpedia/LICENSE.md`)
  - Free to use inside apps; attribution is appreciated but not required for app use.
  - **Republishing** the data as a downloadable dataset (including this public repo) **requires** crediting Quranpedia.net with a link and stating the dump version.
- **Dump version (`license.version` inside the file):** 2026-11-21
- **License.md document version:** 2026-11-24
- **Fetched:** 24 November 2026, about 15:41 Asia/Riyadh (UTC+3)
- **Files:**
  - `assets/data/candidate/quranpedia/similar.json.gz` — official unmodified dump (4,245,820 bytes). SHA-256 `9d18b54754b18eb97672e0c9ee056896b2f2a8d3bfab12801d9cb38e23b38c4b`
  - `assets/data/candidate/quranpedia/similar.slim.json` — derived extract (3,125,177 bytes): ayah references and notes only. YouTube, images, websites, and Quranpedia’s embedded Quran text were omitted. Use Tanzil for wording.
  - `assets/data/candidate/quranpedia/LICENSE.md` — official license file
- **Counts (from the official dump):** 2,102 source ayahs (98 surahs), 4,307 similar groups, 19,485 ayah references inside those groups. Schema: `/v1/ayah/{surah}/{ayah}/similar`.
- **Required credit (because this repo republishes the dump):**

  Similar-ayah data from Quranpedia.net («الموسوعة القرآنية»), operated by OsoulCenter (مركز أصول): https://quranpedia.net — dump version 2026-11-21 (`similar.json.gz`).

The official dump’s license block also names two third-party sources (Quranic Arabic Corpus, GNU GPL; Quranic Treebank, MIT). Those fields are **not** used in this repo. Morphology / iʿrāb dumps were not imported.

`mutshabeh.json.gz` (a catalog of mutashabih *books* available per ayah, ~2 KB) was not imported; it is not the similar-ayah dataset named in the brief.

---

## 2. Waqar144 / Quran Mutashabihat Data (supplement)

- **Source:** Waqar Ahmed (GitHub: [Waqar144](https://github.com/Waqar144))
- **URL:** [https://github.com/Waqar144/Quran_Mutashabihat_Data](https://github.com/Waqar144/Quran_Mutashabihat_Data)
- **License:** CC0 1.0 Universal (`assets/data/candidate/waqar144/LICENSE`)
- **Upstream commit:** `7b259fc73669701695df1e9902215972255a18ee` (“Update data”), 14 November 2026, 19:59 Asia/Riyadh (UTC+3) / 16:59 UTC
- **Fetched:** 24 November 2026, about 15:40 Asia/Riyadh (UTC+3)
- **Files (unmodified originals):**
  - `mutashabiha_data.json` (164,295 bytes) — SHA-256 `cc8b33473db519c007cd26ce1d319b65e414cc6761a449696992be44fca50c97`
  - `LICENSE`, `README.md`
  - `txts/1.txt`–`txts/30.txt` (23,315 bytes total) — per-juz source text used to generate the JSON
- **Counts:** 1,348 mutashabiha entries, keyed by juz/para `1`–`30`; 2,456 analogue references; 270 entries with `ctx`; 43 multi-ayah sources. Ayah numbers are absolute (1–6236).
- **Requested credit** (the author asked for mention even though CC0 does not require it):

  This project uses Quran Mutashabihat Data by Waqar Ahmed (Waqar144): https://github.com/Waqar144/Quran_Mutashabihat_Data (CC0 1.0).

---

## 3. HifzLink / srmdn curated pairs (supplement)

- **Source:** srmdn / HifzLink, [quran-mutashabihat](https://github.com/srmdn/quran-mutashabihat)
- **URL:** [https://github.com/srmdn/quran-mutashabihat](https://github.com/srmdn/quran-mutashabihat)
- **License:** CC BY 4.0 for **curated** data only (stated in the upstream README; there is no separate LICENSE file in that repo). Pending pairs are described upstream as having no formal license and were **not** imported.
- **Upstream commit:** `ad48424cfd511ddbe94e512b59a1883ebafa7beb`, 15 October 2026, 17:43 Asia/Riyadh (UTC+3) / 14:43 UTC
- **Fetched:** 24 November 2026, about 15:40 Asia/Riyadh (UTC+3)
- **Files:**
  - `pairs.curated.json` (85,975 bytes) — SHA-256 `a0dba1a46c69f84efc56a870d9bde64543cd6423332b1fea81bb11397165cff8`. Filter of upstream `pairs.json` keeping only `status: "curated"`. Fields `ayah1`, `ayah2`, `category`, and `note` are unchanged.
  - `README.md` — upstream README, including the license statement
- **Counts:** 285 curated pairs (matches upstream stats). Categories in this snapshot: 205 `lafzi`, 4 `word_swap`, 1 `addition_omission`, 75 with an empty category. 284 have notes; 1 note is empty. Pending (1,359) and dropped (15) pairs were omitted.
- **Required CC BY 4.0 credit:**

  Curated mutashabihat pairs (categories and notes) are from quran-mutashabihat by srmdn / HifzLink, licensed under CC BY 4.0: https://github.com/srmdn/quran-mutashabihat — https://creativecommons.org/licenses/by/4.0/

---

## 4. Tanzil Uthmani Quran text and metadata

- **Source:** Tanzil Project
- **URLs:** [Download page](https://tanzil.net/download/), text file [https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=xml](https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=xml), metadata [https://tanzil.net/res/text/metadata/quran-data.xml](https://tanzil.net/res/text/metadata/quran-data.xml), terms [https://tanzil.net/docs/text_license](https://tanzil.net/docs/text_license)
- **License:** Creative Commons Attribution 3.0. Verbatim copies only; **changing the Quran text is not allowed**. Applications must clearly indicate Tanzil as the source and link to [tanzil.net](https://tanzil.net/). The copyright notice must be kept with the text and reproduced in derived files.
- **Edition:** Tanzil Quran Text (Uthmani, Version 1.1). Copyright (C) 2007–2026 Tanzil Project. Metadata: `quran-data.xml` version 1.0, copyright (C) 2008–2009 Tanzil.info, license cc-by.
- **Fetched:** 24 November 2026, about 15:40 Asia/Riyadh (UTC+3), from the official URLs above
- **Files (text and metadata are unmodified official downloads):**
  - `assets/data/tanzil/quran-uthmani.xml` (1,516,178 bytes) — SHA-256 `203f0f1bf3158b1e5be4ab9f8f6870e570aab6d9a626fe6192a70b75d4afe0fd`
  - `assets/data/tanzil/quran-data.xml` (77,234 bytes) — SHA-256 `8867c1d88191472adec9db694b3cd9f135b1a2ef580574d32cf888dcb22c5c7a` (114 surahs, 30 juz, 240 hizb quarters, 7 manzils, 556 rukus, 604 Madinah mushaf pages, 15 sajdas)
  - `assets/data/tanzil/COPYRIGHT.txt` — the copyright/terms block copied verbatim from the XML comment
- **Counts:** **114 surahs**, **6,236 ayahs**. 112 `bismillah` attributes (every surah except al-Fatiha, where the basmala is ayah 1:1, and at-Tawba, which has none). Metadata ayah total is also 6,236.

**Required credit and notice:**

Source: Tanzil Project (https://tanzil.net/). The Quran text is used unmodified.

```
# PLEASE DO NOT REMOVE OR CHANGE THIS COPYRIGHT BLOCK
#====================================================================
#
#  Tanzil Quran Text (Uthmani, Version 1.1)
#  Copyright (C) 2007-2026 Tanzil Project
#  License: Creative Commons Attribution 3.0
#
#  This copy of the Quran text is carefully produced, highly 
#  verified and continuously monitored by a group of specialists 
#  at Tanzil Project.
#
#  TERMS OF USE:
#
#  - Permission is granted to copy and distribute verbatim copies 
#    of this text, but CHANGING IT IS NOT ALLOWED.
#
#  - This Quran text can be used in any website or application, 
#    provided that its source (Tanzil Project) is clearly indicated, 
#    and a link is made to tanzil.net to enable users to keep
#    track of changes.
#
#  - This copyright notice shall be included in all verbatim copies 
#    of the text, and shall be reproduced appropriately in all files 
#    derived from or containing substantial portion of this text.
#
#  Please check updates at: http://tanzil.net/updates/
#
#====================================================================
```

A later checksum test should hash `assets/data/tanzil/quran-uthmani.xml` (SHA-256 above) and fail if the bundled text drifts.

---

## 5. Fonts

### Primary: Amiri Quran (SIL OFL 1.1)

- **Source:** Khaled Hosny / aliftype, [Amiri](https://github.com/aliftype/amiri)
- **URL:** [https://github.com/aliftype/amiri/releases/tag/1.003](https://github.com/aliftype/amiri/releases/tag/1.003)
- **License:** SIL Open Font License 1.1 (`assets/fonts/amiri-quran/OFL.txt`)
- **Version:** 1.003, published 13 June 2025, 16:45 Asia/Riyadh (UTC+3)
- **Fetched:** 24 November 2026, about 15:40 Asia/Riyadh (UTC+3)
- **Files:** `AmiriQuran.ttf` (136,920 bytes), `AmiriQuranColored.ttf` (158,336 bytes), plus `OFL.txt` and the upstream `README.md`
- **Credit:** Amiri Quran font by Khaled Hosny / aliftype, SIL OFL 1.1: https://github.com/aliftype/amiri

### Optional alternative: DigitalKhatt Madina (SIL OFL 1.1)

- **Source:** Amine Anane / DigitalKhatt ([madinafont](https://github.com/DigitalKhatt/madinafont)); the project is sponsored by Tarteel, but the font itself is OFL. This is **not** Tarteel QUL mutashabihat data.
- **URL:** [https://github.com/DigitalKhatt/madinafont](https://github.com/DigitalKhatt/madinafont)
- **License:** SIL Open Font License 1.1 (`assets/fonts/digitalkhatt-madina/LICENSE`)
- **Upstream commit:** `9aeb02c26d8dae4c032820733466c1ee9137e6d6`, 30 July 2026, 03:27 Asia/Riyadh (UTC+3) / 00:27 UTC
- **Fetched:** 24 November 2026, about 15:40 Asia/Riyadh (UTC+3)
- **Files:** `madina.otf` (2,592,120 bytes) and `LICENSE`. This is a CFF2 variable OpenType font; some platforms support it less well than Amiri, which is why Amiri Quran is primary.
- **Credit:** Madina font by Amine Anane / DigitalKhatt, SIL OFL 1.1: https://github.com/DigitalKhatt/madinafont

---

## Skipped (and why)

| Item | Reason |
| --- | --- |
| Tarteel QUL mutashabihat | License unresolved; product rule forbids use |
| Audio / recitations | No clear license for bundling |
| KFGQPC / QCF fonts | License does not clearly allow bundling in this app |
| srmdn pending (1,359) and dropped (15) pairs, and `waqar_raw.json` | Pending pairs are Waqar-derived and described upstream as having no formal license; dropped pairs were rejected |
| Quranpedia `morphology.json.gz` and other non-similar dumps | Morphology is GNU GPL (Quranic Arabic Corpus); out of scope |
| Quranpedia `mutshabeh.json.gz` | Book-availability index, not the similar-ayah dataset |
| GPL / AGPL application code (e.g. forking other Quran apps) | Not needed; we only imported permissively licensed data |
| Quranpedia YouTube / image / website attachments | Third-party media; omitted from the slim extract. Still present inside the official `.gz` dump, which should not be bundled into the app as-is |

---

## Size summary

Approximate on-disk totals after import:

- `assets/data/`: 8.9 MB (candidate 7.4 MB, Tanzil 1.5 MB)
- `assets/fonts/`: 2.8 MB (Amiri Quran 304 KB, DigitalKhatt Madina 2.5 MB)
- Combined data + fonts: about **11.7 MB**, which is reasonable for the repo. Do not Metro-bundle the 42 MB uncompressed Quranpedia dump.

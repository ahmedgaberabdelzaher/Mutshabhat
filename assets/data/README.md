# Bundled data

**Candidate mutashabihat data in `candidate/` is not scholar-approved and must not ship in beta or production until it is approved.**

البيانات تحت `candidate/` مرشَّحة للمراجعة فقط، وليست معتمدة للبيتا أو الإنتاج.

- Mutashabihat samples (Quranpedia, Waqar144, HifzLink curated pairs): `candidate/`
- Tanzil Uthmani Quran text and metadata (unmodified official files): `tanzil/`
- License, attribution, versions, checksums, and counts: see [`DATA_SOURCES.md`](../../DATA_SOURCES.md) at the repo root.

## Similarity type (lafzi / semantic)

MVP covers verbal (لفظي) mutashabihat only. `npm run build:mutashabihat` tags every pair (`highlightRules[].similarityType`) and group (`groups[].similarityType`):

- **semantic** — little shared wording (no shared word; or one shared word while the shorter ayah has > 4 words; or shared words by word LCS on letter-only keys < 30% of the shorter ayah) **and** no shared phrase of ≥ 3 consecutive words. These stay in the review build, hidden from the default view and shown only via the «تشابه معنوي» filter, and never reach beta/production (repository rule + tests). Exception: the 285 HifzLink pilot pairs are always listed in the review build, with a type badge.
- **lafzi** — everything else. `method: lcs` = whole-ayah word diff; `method: phrase` = low overall overlap but a shared ≥ 3-word phrase, highlighted in the 2 words around each shared phrase. A group is lafzi if any of its pairs is lafzi.
- Beta/production show only records explicitly tagged `similarityType: "lafzi"`.

Details and counts: [`docs/DATA_MODEL.md`](../../docs/DATA_MODEL.md#highlight-rules-qmt-26).

Fonts live in `assets/fonts/`. Amiri Quran is the primary font.

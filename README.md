# Mutshabhat | متشابهات

A cross-platform Quran app to help review and memorize the **mutashabihat** (similar verses).

تطبيق قرآن متعدد المنصات للمساعدة على مراجعة وحفظ **المتشابهات**.

This repository contains the Sprint 1 PoC: an Expo app that shows the unmodified Tanzil Quran text, plus bundled **candidate** mutashabihat data for a review build.

يحتوي هذا المستودع على هيكل مشروع Expo وعلى بيانات قرآن ومتشابهات **مرشَّحة للمراجعة** لأول نسخة تجريبية. بناء الميزات يأتي في التزامات لاحقة.

## Stack

- React Native + Expo (SDK 58)
- TypeScript
- Expo Router (file-based routing)
- Targets: iOS and Android (web is also available via Expo)

## Getting started

```bash
cd ~/Projects/Mutshabhat
npm install
npx expo start
```

Then open the app in Expo Go, an iOS simulator, or an Android emulator.

## RTL and fonts

- RTL is forced for the whole app with the `expo-localization` config plugin (`forcesRTL: true`, Arabic as the only supported locale). On web the document direction is set to `rtl` in `src/app/_layout.tsx`.
- Text is left at `textAlign: 'auto'` and rows use `flexDirection: 'row'`, so both follow the RTL direction instead of hard-coded left/right.
- The Mushaf font is configured in **one place**: `src/config/fonts.ts` (`ACTIVE_QURAN_FONT`). It is Amiri Quran (SIL OFL 1.1) until the King Fahd Complex font licence is granted.
- Expo Go resets RTL preferences; to verify RTL on a device, use a development build (`npx expo run:ios`).

## Architecture (Sprint 1)

- `scripts/build-quran-data.mjs` converts the unmodified Tanzil XML into `src/data/generated/quran-text.json` (ayah strings copied verbatim) and `quran-meta.json` (surahs, juz, 604 Madinah pages). Run `npm run build:data` after changing the Tanzil files.
- `src/data/` holds repository interfaces (`QuranRepository`) with bundled-JSON implementations. Screens only talk to repositories, so an API-backed implementation can replace them later.
- `src/data/__tests__/quran-text.checksum.test.ts` fails if the bundled text drifts from the Tanzil source by a single byte.

## Data sources

Licensed Quran text, mutashabihat samples, and fonts are documented in [DATA_SOURCES.md](DATA_SOURCES.md).

Mutashabihat files under `assets/data/candidate/` are **not scholar-approved** and must not ship in beta or production until approved. The official Tanzil Uthmani text (unmodified, CC BY 3.0) is in `assets/data/tanzil/`. The primary Quran font is Amiri Quran (SIL OFL 1.1).

بيانات المتشابهات تحت `assets/data/candidate/` مرشَّحة للمراجعة فقط، ولا تُدرَج في البيتا أو الإنتاج قبل الاعتماد.

## Scripts

- `npm start` — start the Expo dev server
- `npm run ios` — open on iOS
- `npm run android` — open on Android
- `npm run web` — open in a browser
- `npm test` — unit tests (jest-expo)
- `npm run typecheck` — `tsc --noEmit`
- `npm run lint` — `expo lint`
- `npm run build:data` — regenerate app JSON from the Tanzil XML

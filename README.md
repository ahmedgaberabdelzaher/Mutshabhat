# Mutshabhat | متشابهات

A cross-platform Quran app to help review and memorize the **mutashabihat** (similar verses).

تطبيق قرآن متعدد المنصات للمساعدة على مراجعة وحفظ **المتشابهات**.

This repository contains an Expo starter scaffold plus bundled, **candidate** Quran and mutashabihat data for a first review/PoC build. Feature work follows in later commits.

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

## RTL readiness

The app will be Arabic-first, so right-to-left (RTL) layout should be considered from the start of feature work:

- Enable RTL at the app root (for example with React Native's `I18nManager` and Expo's localization support) when screens are built.
- Use start/end spacing (`paddingStart` / `marginEnd`) instead of left/right so layout flips correctly.
- Prefer the bundled **Amiri Quran** font (`assets/fonts/amiri-quran/`) and test text wrapping, diacritics (tashkeel), and verse layout in RTL. KFGQPC fonts are not bundled (license is not clearly compatible).
- Keep navigation, icons, and gestures RTL-aware (back chevrons, tab order, swipe direction).

These notes are a reminder only; RTL is not wired up in this scaffold.


## Data sources

Licensed Quran text, mutashabihat samples, and fonts are documented in [DATA_SOURCES.md](DATA_SOURCES.md).

Mutashabihat files under `assets/data/candidate/` are **not scholar-approved** and must not ship in beta or production until approved. The official Tanzil Uthmani text (unmodified, CC BY 3.0) is in `assets/data/tanzil/`. The primary Quran font is Amiri Quran (SIL OFL 1.1).

بيانات المتشابهات تحت `assets/data/candidate/` مرشَّحة للمراجعة فقط، ولا تُدرَج في البيتا أو الإنتاج قبل الاعتماد.

## Scripts

- `npm start` — start the Expo dev server
- `npm run ios` — open on iOS
- `npm run android` — open on Android
- `npm run web` — open in a browser

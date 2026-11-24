# Mutshabhat | متشابهات

A cross-platform Quran app to help review and memorize the **mutashabihat** (similar verses).

تطبيق قرآن متعدد المنصات للمساعدة على مراجعة وحفظ **المتشابهات**.

This repository currently contains a clean Expo starter scaffold. Feature work will follow once business requirements are shared by the BA.

يحتوي هذا المستودع حاليًا على هيكل مشروع Expo مبدئي نظيف. سيتم بناء الميزات بعد وصول متطلبات الأعمال من الـ BA.

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
- Prefer Quran-capable fonts (such as KFGQPC or Amiri Quran) and test text wrapping, diacritics (tashkeel), and verse layout in RTL.
- Keep navigation, icons, and gestures RTL-aware (back chevrons, tab order, swipe direction).

These notes are a reminder only; RTL is not wired up in this scaffold.

## Scripts

- `npm start` — start the Expo dev server
- `npm run ios` — open on iOS
- `npm run android` — open on Android
- `npm run web` — open in a browser

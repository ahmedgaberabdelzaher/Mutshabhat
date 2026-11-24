import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Build flavors (QMT-48). Static config lives in app.json; this file layers per-flavor values on top.
 *
 *   EXPO_PUBLIC_APP_FLAVOR=review      candidate dataset, status badges, EAS Update channel "review"
 *   EXPO_PUBLIC_APP_FLAVOR=beta        production dataset (approved only), channel "beta"
 *   EXPO_PUBLIC_APP_FLAVOR=production  production dataset (approved only), channel "production"  [default]
 *
 * EAS Update channels are set per build profile in eas.json, so a review OTA update can never reach a
 * beta/production binary. EAS_PROJECT_ID is filled in once the project is linked with `eas init`
 * (not done yet — no Expo account has been created for this PoC).
 */
const FLAVORS = ['review', 'beta', 'production'] as const;
type Flavor = (typeof FLAVORS)[number];

const raw = process.env.EXPO_PUBLIC_APP_FLAVOR;
const flavor: Flavor = (FLAVORS as readonly string[]).includes(raw ?? '') ? (raw as Flavor) : 'production';

const BASE_ID = 'com.ahmedgaber.mutshabhat';
const ID_SUFFIX: Record<Flavor, string> = { review: '.review', beta: '.beta', production: '' };
const NAME: Record<Flavor, string> = {
  review: 'المتشابهات (مراجعة)',
  beta: 'المتشابهات (تجريبي)',
  production: 'المتشابهات',
};

const projectId = process.env.EAS_PROJECT_ID;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: NAME[flavor],
  slug: config.slug ?? 'Mutshabhat',
  scheme: flavor === 'production' ? 'mutshabhat' : `mutshabhat-${flavor}`,
  ios: { ...config.ios, bundleIdentifier: BASE_ID + ID_SUFFIX[flavor] },
  android: { ...config.android, package: BASE_ID + ID_SUFFIX[flavor] },
  runtimeVersion: { policy: 'appVersion' },
  updates: projectId ? { ...config.updates, url: `https://u.expo.dev/${projectId}` } : config.updates,
  extra: {
    ...config.extra,
    flavor,
    ...(projectId ? { eas: { projectId } } : {}),
  },
});

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Platform } from 'react-native';

import { ACTIVE_QURAN_FONT } from '@/config/fonts';
import { colors } from '@/config/theme';

SplashScreen.preventAutoHideAsync();

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  // Native RTL is forced via the expo-localization config plugin (app.config.ts);
  // on web the document direction drives layout instead.
  document.documentElement.dir = 'rtl';
  document.documentElement.lang = 'ar';
}

export default function RootLayout() {
  const [loaded, error] = useFonts({ [ACTIVE_QURAN_FONT.family]: ACTIVE_QURAN_FONT.source });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.primary,
          headerTitleStyle: { color: colors.text },
          contentStyle: { backgroundColor: colors.background },
          headerBackButtonDisplayMode: 'minimal',
        }}>
        <Stack.Screen name="index" options={{ title: 'المتشابهات' }} />
        <Stack.Screen name="quran/index" options={{ title: 'فهرس السور' }} />
        <Stack.Screen name="quran/[surah]" options={{ title: 'السورة' }} />
        <Stack.Screen name="ayah/[surah]/[ayah]" options={{ title: 'الآية' }} />
        <Stack.Screen name="sources" options={{ title: 'المصادر والإسناد' }} />
      </Stack>
    </>
  );
}

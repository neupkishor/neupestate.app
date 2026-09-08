import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthSessionProvider } from '@/neup/auth/AuthSessionProvider';
import { AuthDatabaseSync } from './AuthDatabaseSync';
import { initializeEstateDatabase } from '@/neup/core/database/estate';
import outfitFonts from '@/base/fonts/outfitfonts';

import OutfitBold from '@/base/fonts/outfit.bold.ttf';
import OutfitMedium from '@/base/fonts/outfit.medium.ttf';
import OutfitRegular from '@/base/fonts/outfit.regular.ttf';
import OutfitSemiBold from '@/base/fonts/outfit.semibold.ttf';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [outfitFonts.regular]: OutfitRegular,
    [outfitFonts.medium]: OutfitMedium,
    [outfitFonts.semiBold]: OutfitSemiBold,
    [outfitFonts.bold]: OutfitBold,
  });

  useEffect(() => {
    initializeEstateDatabase();
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthSessionProvider successRoute="/(tabs)/home">
      <AuthDatabaseSync />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="property/[id]" />
      </Stack>
    </AuthSessionProvider>
  );
}

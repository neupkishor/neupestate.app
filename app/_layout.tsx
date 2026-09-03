import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { AuthSessionProvider } from '#/core/auth-session';
import outfitFonts from '$/fonts/outfitfonts';

import OutfitBold from '$/fonts/outfit.bold.ttf';
import OutfitMedium from '$/fonts/outfit.medium.ttf';
import OutfitRegular from '$/fonts/outfit.regular.ttf';
import OutfitSemiBold from '$/fonts/outfit.semibold.ttf';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [outfitFonts.regular]: OutfitRegular,
    [outfitFonts.medium]: OutfitMedium,
    [outfitFonts.semiBold]: OutfitSemiBold,
    [outfitFonts.bold]: OutfitBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <AuthSessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="property/[id]" />
      </Stack>
    </AuthSessionProvider>
  );
}

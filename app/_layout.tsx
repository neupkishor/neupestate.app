import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { AuthSessionProvider } from '#/core/auth-session';
import outfitFonts from '$/fonts/outfitfonts';

import OutfitBold from '../base/fonts/Outfit-Bold.ttf';
import OutfitMedium from '../base/fonts/Outfit-Medium.ttf';
import OutfitRegular from '../base/fonts/Outfit-Regular.ttf';
import OutfitSemiBold from '../base/fonts/Outfit-SemiBold.ttf';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    [outfitFonts.regular]: OutfitRegular,
    [outfitFonts.medium]: OutfitMedium,
    [outfitFonts.semiBold]: OutfitSemiBold,
    [outfitFonts.bold]: OutfitBold,
  });

  if (!fontsLoaded) return null;

  return (
    <AuthSessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="property/[id]" />
      </Stack>
    </AuthSessionProvider>
  );
}

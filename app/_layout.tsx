import { Stack } from 'expo-router';
import { AuthSessionProvider } from '#/core/auth-session';

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="property/[id]" />
      </Stack>
    </AuthSessionProvider>
  );
}

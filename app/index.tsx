import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthSession } from '#/core/auth-session';

export default function Index() {
  const router = useRouter();
  const { authenticated, expired, loading } = useAuthSession();

  useEffect(() => {
    if (loading) return;
    router.replace(expired ? '/auth' : authenticated ? '/(tabs)/home' : '/home');
  }, [authenticated, expired, loading, router]);

  return null;
}

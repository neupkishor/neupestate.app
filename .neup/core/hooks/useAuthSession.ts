import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { AuthSession, getAuthSession } from '@/lib/auth';

export function useAuthSession() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setIsLoading(true);

      void getAuthSession().then((storedSession) => {
        if (!active) return;
        setSession(storedSession);
        setIsLoading(false);
      });

      return () => {
        active = false;
      };
    }, []),
  );

  return { session, isLoading };
}

import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';

export const AUTH_START_URL = 'https://neupgroup.com/account/auth/start';
export const AUTH_CALLBACK_URL = 'neupestate://auth/callback';
export const AUTH_COOKIE_KEY = 'auth_account';
type AuthSessionState = { token: string | null; authenticated: boolean; loading: boolean; setToken: (token: string | null) => Promise<void> };
const AuthSessionContext = createContext<AuthSessionState>({ token: null, authenticated: false, loading: true, setToken: async () => undefined });

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { void SecureStore.getItemAsync(AUTH_COOKIE_KEY).then((storedToken) => { setTokenState(storedToken); setLoading(false); }); }, []);
  useEffect(() => {
    const handleUrl = ({ url }: { url: string }) => {
      const parsed = Linking.parse(url);
      const returnedToken = typeof parsed.queryParams?.auth_account === 'string' ? parsed.queryParams.auth_account : null;
      if (returnedToken) {
        setTokenState(returnedToken);
        void SecureStore.setItemAsync(AUTH_COOKIE_KEY, returnedToken);
      }
    };
    const subscription = Linking.addEventListener('url', handleUrl);
    void Linking.getInitialURL().then((url) => { if (url) handleUrl({ url }); });
    return () => subscription.remove();
  }, []);
  const setToken = async (nextToken: string | null) => { setTokenState(nextToken); if (nextToken) await SecureStore.setItemAsync(AUTH_COOKIE_KEY, nextToken); else await SecureStore.deleteItemAsync(AUTH_COOKIE_KEY); };
  const value = useMemo(() => ({ token, authenticated: Boolean(token), loading, setToken }), [token, loading]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}
export function useAuthSession() { return useContext(AuthSessionContext); }

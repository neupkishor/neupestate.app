import * as SecureStore from 'expo-secure-store';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { getAuthenticatedProfile, type AuthenticatedProfile } from '#/core/auth-profile';
import { runApi } from '#/core/infrastructure/api';
import { getStoredSelfAccount, saveAuthenticatedAccount } from '#/core/database/estate';

export const AUTH_START_URL = 'https://neupgroup.com/account/auth/start';
export const AUTH_CALLBACK_URL = 'neupestate://auth/callback';
export const AUTH_COOKIE_KEY = 'auth_account';
export type AuthProfile = AuthenticatedProfile;
type AuthSessionState = { token: string | null; profile: AuthProfile | null; expired: boolean; authenticated: boolean; loading: boolean; setToken: (token: string | null) => Promise<void> };
type RefreshResponse = { success?: boolean; token?: string; error?: string };
const AuthSessionContext = createContext<AuthSessionState>({ token: null, profile: null, expired: false, authenticated: false, loading: true, setToken: async () => undefined });

export function AuthSessionProvider({ children }: PropsWithChildren) {
  const [token, setTokenState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<AuthProfile | null>(null);
  const [expired, setExpired] = useState(false);
  useEffect(() => { void SecureStore.getItemAsync(AUTH_COOKIE_KEY).then((storedToken) => setTokenState(storedToken)).catch(() => setLoading(false)); }, []);
  useEffect(() => {
    if (!token) {
      setProfile(null);
      setLoading(false);
      return;
    }
    const loadProfile = async (currentToken: string, canRefresh: boolean): Promise<void> => {
      try {
        const authenticatedProfile = await getAuthenticatedProfile(currentToken);
        await saveAuthenticatedAccount(authenticatedProfile);
        setProfile(authenticatedProfile);
        setLoading(false);
      } catch (requestError) {
        const status = (requestError as { status?: number }).status;
        if (canRefresh && status === 401) {
          const refreshedToken = await refreshAccountToken(currentToken);
          if (refreshedToken) {
            setTokenState(refreshedToken);
            await SecureStore.setItemAsync(AUTH_COOKIE_KEY, refreshedToken);
            return loadProfile(refreshedToken, false);
          }
        }
        console.error('[auth] authenticated session failed', requestError);
        const storedAccount = getStoredSelfAccount();
        if (storedAccount) {
          setProfile({ accountId: storedAccount.accountId, displayName: '', accountType: storedAccount.type, accountPhoto: storedAccount.displayImage ?? undefined });
          setLoading(false);
          return;
        }
        setProfile(null);
        setExpired(true);
        setTokenState(null);
        await SecureStore.deleteItemAsync(AUTH_COOKIE_KEY);
        setLoading(false);
      }
    };
    void loadProfile(token, true);
  }, [token]);
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
  const setToken = async (nextToken: string | null) => { setExpired(false); setTokenState(nextToken); if (nextToken) await SecureStore.setItemAsync(AUTH_COOKIE_KEY, nextToken); else await SecureStore.deleteItemAsync(AUTH_COOKIE_KEY); };
  const value = useMemo(() => ({ token, profile, expired, authenticated: Boolean(token), loading, setToken }), [token, profile, expired, loading]);
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

async function refreshAccountToken(token: string): Promise<string | null> {
  console.log('[auth] POST /account/bridge/api.v1/auth/signin refresh request', {
    url: 'https://neupgroup.com/account/bridge/api.v1/auth/signin',
    method: 'POST',
    headers: { 'x-auth-account': '[redacted]' },
    body: null,
  });
  try {
    const result = await runApi<RefreshResponse>({
      baseUrl: 'https://neupgroup.com/account',
      path: '/bridge/api.v1/auth/signin',
      method: 'POST',
      headers: { 'x-auth-account': token },
    });
    console.log('[auth] POST /account/bridge/api.v1/auth/signin refresh response', { status: result.status, ok: result.ok, body: result.body });
    return result.ok && result.body.success && result.body.token ? result.body.token : null;
  } catch (requestError) {
    console.error('[auth] account token refresh failed', requestError);
    return null;
  }
}
export function useAuthSession() { return useContext(AuthSessionContext); }

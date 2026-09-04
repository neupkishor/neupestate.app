import { runApi } from '#/core/infrastructure/api';

export type AuthenticatedProfile = {
  accountId: string;
  neupId?: string;
  neupidPrimary?: string;
  displayName: string;
  accountType: string;
  accountPhoto?: string;
};

type AuthenticatedProfileResponse = {
  success: boolean;
  error?: string;
  profile?: AuthenticatedProfile;
  profileInfo?: Partial<AuthenticatedProfile>;
  accountId?: string;
};

export async function getAuthenticatedProfile(token: string): Promise<AuthenticatedProfile> {
  console.log('[auth] GET /account/bridge/api.v1/auth/me request', {
    url: 'https://neupgroup.com/account/bridge/api.v1/auth/me',
    method: 'GET',
    headers: { 'x-auth-account': '[redacted]' },
  });
  const result = await runApi<AuthenticatedProfileResponse>({
    baseUrl: 'https://neupgroup.com/account',
    path: '/bridge/api.v1/auth/me',
    headers: { 'x-auth-account': token },
  });
  console.log('[auth] GET /account/bridge/api.v1/auth/me response', {
    status: result.status,
    ok: result.ok,
    body: result.body,
  });

  const profile = result.body.profile ?? result.body.profileInfo;
  if (!result.ok || !result.body.success || !profile) {
    const error = new Error(result.body?.error || 'Authenticated profile request failed') as Error & { status?: number; code?: string };
    error.status = result.status;
    error.code = result.body?.error;
    throw error;
  }

  return {
    accountId: profile.accountId ?? result.body.accountId ?? '',
    neupId: profile.neupId ?? profile.neupidPrimary,
    neupidPrimary: profile.neupidPrimary ?? profile.neupId,
    displayName: profile.displayName ?? '',
    accountType: profile.accountType ?? '',
    accountPhoto: profile.accountPhoto,
  };
}

import { recordActivity } from '#/core/database/estate';

/** Activity names emitted by app-level authentication lifecycle hooks. */
export const AUTH_ACTIVITY = {
  signedOut: 'auth.signout',
} as const;

export type AuthActivityAccount = {
  accountId: string | null;
};

/** Customize this file when the app needs additional sign-out side effects. */
export function onAuthSignedOut(account: AuthActivityAccount) {
  recordActivity(AUTH_ACTIVITY.signedOut, account.accountId ?? 'guest', {
    source: 'authProvider',
    action: 'signedOut',
  });
}

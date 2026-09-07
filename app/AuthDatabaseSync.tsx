import { useEffect, useRef } from 'react';
import { useAuthSession } from '#/auth/AuthSessionProvider';
import { recordAuthEvent } from '#/core/database/estate';
import { onAuthSignedOut } from './auth-activity';

/** Bridges the portable auth provider to this app's local SQLite history. */
export function AuthDatabaseSync() {
  const { authenticated, profile } = useAuthSession();
  const previous = useRef<{ authenticated: boolean; accountId: string | null }>({ authenticated: false, accountId: null });

  useEffect(() => {
    const before = previous.current;
    const accountId = profile?.accountId ?? null;
    if (authenticated && accountId && (!before.authenticated || before.accountId !== accountId)) {
      recordAuthEvent({
        event: 'signed_in',
        accountId,
        connectionId: profile?.connectionId,
        refreshBy: profile?.refreshBy,
        expiresOn: profile?.expiresOn,
      });
    } else if (!authenticated && before.authenticated) {
      recordAuthEvent({ event: 'signed_out', accountId: before.accountId });
      onAuthSignedOut({ accountId: before.accountId });
    }
    previous.current = { authenticated, accountId };
  }, [authenticated, profile]);

  return null;
}

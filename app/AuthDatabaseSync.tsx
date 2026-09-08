import { useEffect, useRef } from 'react';
import { useAuthSession } from '@/neup/auth/AuthSessionProvider';
import { estateDatabase, recordAuthEvent } from '@/neup/core/database/estate';
import { onAuthSignedOut } from './auth-activity';
import { logAuthDiagnostic } from '@/neup/logica/logger/diagnostics';

/** Bridges the portable auth provider to this app's local SQLite history. */
export function AuthDatabaseSync() {
  const { authenticated, profile } = useAuthSession();
  const previous = useRef<{ authenticated: boolean; accountId: string | null }>({ authenticated: false, accountId: null });

  useEffect(() => {
    const before = previous.current;
    const accountId = profile?.accountId ?? null;
    let stage = 'database.sync.started';
    logAuthDiagnostic(stage, { authenticated, hasAccountId: Boolean(accountId), recordAuthEventType: typeof recordAuthEvent });
    try {
      if (authenticated && accountId && (!before.authenticated || before.accountId !== accountId)) {
        stage = 'database.signed_in.record';
        recordAuthEvent({
          event: 'signed_in',
          accountId,
          connectionId: profile?.connectionId,
          refreshBy: profile?.refreshBy,
          expiresOn: profile?.expiresOn,
        });
      } else if (!authenticated && before.authenticated) {
        stage = 'database.signed_out.record';
        recordAuthEvent({ event: 'signed_out', accountId: before.accountId });
        stage = 'database.signed_out.activity';
        onAuthSignedOut({ accountId: before.accountId });
      }
      previous.current = { authenticated, accountId };
      logAuthDiagnostic('database.sync.completed');
    } catch (error) {
      logAuthDiagnostic(stage, { recordAuthEventType: typeof recordAuthEvent, runSyncType: typeof estateDatabase?.runSync, onAuthSignedOutType: typeof onAuthSignedOut }, error);
      throw error;
    }
  }, [authenticated, profile]);

  return null;
}

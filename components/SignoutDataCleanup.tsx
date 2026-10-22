import { useEffect, useRef } from 'react';
import * as FileSystem from 'expo-file-system/legacy';
import { useAuthSession } from '@neup/auth/AuthSessionProvider';
import { estateDatabase } from '@neup/core/database/estate';

/** Removes locally cached account data after an authenticated session ends. */
export function SignoutDataCleanup() {
  const { authenticated } = useAuthSession();
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    if (authenticated) {
      wasAuthenticated.current = true;
      return;
    }

    if (!wasAuthenticated.current) return;
    wasAuthenticated.current = false;

    estateDatabase.withTransactionSync(() => {
      estateDatabase.execSync('DELETE FROM properties; DELETE FROM referrals; DELETE FROM accounts; DELETE FROM activities;');
    });

    if (FileSystem.documentDirectory) {
      void FileSystem.deleteAsync(`${FileSystem.documentDirectory}accounts/`, { idempotent: true })
        .catch((error) => console.warn('[signout] unable to remove cached account images', error));
    }
  }, [authenticated]);

  return null;
}

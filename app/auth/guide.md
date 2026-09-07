# Neup authentication integration guide

This guide explains how to add the Neup authentication flow and authentication
status handling to another Expo/React Native app in the Neup company.

## 1. Install the dependencies

From the target app's repository root, install the Expo-compatible packages:

```sh
npx expo install \
  expo-linking \
  expo-router \
  expo-secure-store \
  expo-sqlite \
  expo-status-bar \
  react-native-safe-area-context
```

If the target app already contains this directory, its setup script can be
used instead:

```sh
sh app/auth/setup.sh
```

## 2. Add the auth routes

Create an `app/auth` route group containing:

- `_layout.tsx` — stack layout for auth screens.
- `start.tsx` — entry screen explaining sign-in and sign-up.
- `index.tsx` — the NeupID sign-in flow.
- `signup.tsx` — account creation flow.
- `signout.tsx` — sign-out confirmation and action.

The auth screens should use Expo Router navigation and should return to the
app's authenticated landing route after a successful sign-in.

## 3. Add the auth session provider

Copy `AuthSessionProvider.tsx` into the target app's `app/auth` directory. It
contains the provider and the `useAuthSession()` hook. It:

1. Reads the account token from `expo-secure-store` on startup.
2. Requests the authenticated profile from the Neup account API.
3. Exposes `token`, `profile`, `authenticated`, `loading`, and `expired`.
4. Refreshes an expired account token once when the API returns `401`.
5. Deletes the stored token when refresh fails or the session is invalid.
6. Listens for the authentication callback URL and persists its token.

Import and mount the provider in the target app's root `app/_layout.tsx`:

```tsx
import { AuthSessionProvider } from '@/app/auth/AuthSessionProvider';

export default function RootLayout() {
  return (
    <AuthSessionProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthSessionProvider>
  );
}
```

The provider must wrap the router so every route can read auth status:

```tsx
<AuthSessionProvider>
  <Slot />
</AuthSessionProvider>
```

Keep token access inside the provider and API layer. Do not log real tokens,
passwords, or authentication request JWTs.

## 4. Configure deep linking

Register a unique app scheme in the target app's Expo configuration. For
example:

```json
{
  "expo": {
    "scheme": "neup-example"
  }
}
```

Use the matching callback URL when starting authentication:

```ts
const AUTH_CALLBACK_URL = 'neup-example://auth/callback';
```

The callback must be registered with the Neup account service before the app is
released. Test both cold-start callbacks and callbacks received while the app
is already open.

## 5. Implement `app/index.tsx`

Use the root index route as the auth-aware entry point. Wait for the provider
to finish loading, then redirect signed-in users to the app and signed-out or
expired users to the appropriate screen:

```tsx
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useAuthSession } from '@/app/auth/AuthSessionProvider';

export default function Index() {
  const router = useRouter();
  const { authenticated, expired, loading } = useAuthSession();

  useEffect(() => {
    if (loading) return;
    router.replace(expired ? '/auth' : authenticated ? '/(tabs)/home' : '/home');
  }, [authenticated, expired, loading, router]);

  return null;
}
```

Replace `/(tabs)/home` and `/home` with the target app's authenticated and
public landing routes. Keep the `loading` guard to prevent startup redirects
from racing with secure-store session restoration.

## 6. Use auth status in the app

Read the provider from any screen with `useAuthSession()`:

```tsx
const { authenticated, expired, loading, profile } = useAuthSession();
```

Handle the states in this order:

```tsx
if (loading) return <LoadingScreen />;
if (expired) return <SessionExpiredScreen />;
if (authenticated) return <AuthenticatedContent profile={profile} />;
return <SignedOutContent />;
```

For screens that only need identity values, use the compact auth object:

```tsx
import { useAuth } from '@/app/auth/auth';

const { name, authToken, accountId, displayName } = useAuth();
```

Each value is `null` when no authenticated profile or token is available.
`name` is the first word of `displayName`.

For the shared normalized response, use `getAuthInfo()`:

```tsx
import { getAuthInfo } from '#/auth/auth';

const { isAuthenticated, userAccountType, basics } = getAuthInfo();
// basics: { id, neupid, displayName, displayImage }
```

`userAccountType` is `guest`, `brand`, or `individual`. Basic identity fields
are `null` when no authenticated profile is available.

Do not redirect before `loading` becomes `false`; otherwise a valid stored
session can briefly appear signed out during startup.

## 7. Use the account API

The sign-in flow uses the Neup account bridge endpoints:

- `GET /account/bridge/api.v1/auth/signin` to start a sign-in request.
- `POST /account/bridge/api.v1/auth/signin` to submit each sign-in step.
- `GET /account/bridge/api.v1/auth/me` to load the current profile.
- `POST /account/bridge/api.v1/auth/signin` with `x-auth-account` to refresh a token.

Use the account service's current API contract for request and response
schemas. Send the account token in the `x-auth-account` header only through a
trusted API helper, and handle non-2xx responses without exposing server error
details directly to users.

## 8. Verify before release

Test the following on iOS and Android:

- Sign-in with an invalid NeupID and invalid password.
- Successful sign-in and navigation to the authenticated home screen.
- App restart with a stored session.
- Expired-token refresh and failed refresh.
- Sign-out and deletion of the stored token.
- Deep-link callback when the app is closed and when it is open.
- Back navigation from every auth step.

Each app must use its own scheme and production configuration while keeping the
same session-security rules.

# Authentication setup

This app uses the shared Neup authentication repository at:

`https://github.com/neupgroup/neupauth.app`

## Setup

Run the project setup from the repository root:

```sh
./setup.sh
```

The setup script keeps the auth source and app integration in separate locations:

- `neup/auth` — shallow clone of the upstream auth repository. Treat this as the source repository and do not edit generated copies directly.
- `app/auth` — Expo Router pages used by this app (`_layout.tsx`, `index.tsx`, `signup.tsx`, `signout.tsx`, and `start.tsx`).
- `.neup/auth` — shared auth implementation, including `AuthSessionProvider.tsx` and `auth.ts`.

The root script delegates synchronization to `.neup/auth/setup.sh`. That nested script replaces the route pages in `app/auth` and replaces shared files in `.neup/auth`, so removed or changed upstream files do not remain stale.

## Imports

Import shared auth code through the `#/auth` alias:

```tsx
import { AuthSessionProvider } from '#/auth/AuthSessionProvider';
import { useAuthSession } from '#/auth/AuthSessionProvider';
import { useAuth } from '#/auth/auth';
```

The provider is mounted in `app/_layout.tsx`, so any route can use
`useAuthSession()`. Do not import shared auth implementation from `@/app/auth`.

## Making changes

1. Update the upstream auth source in `neup/auth` when changing shared auth behavior.
2. Run `./setup.sh`; it delegates to `.neup/auth/setup.sh` to replace the app copies.
3. Keep app-specific route or presentation changes in `app/auth`.
4. Keep shared provider and auth helpers in `.neup/auth`.
5. Run `npx tsc --noEmit` before committing.

Never log account tokens, passwords, or authentication request JWTs.

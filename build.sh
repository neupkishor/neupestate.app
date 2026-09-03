#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
CREDENTIALS_FILE="$PROJECT_ROOT/credentials.json"

if [ ! -f "$CREDENTIALS_FILE" ]; then
  echo "Error: credentials.json was not found."
  exit 1
fi

read_credential() {
  node -e "
    const credentials = require(process.argv[1]);
    const value = credentials.android?.keystore?.[process.argv[2]];

    if (typeof value !== 'string' || value.length === 0) {
      console.error('Missing Android keystore field: ' + process.argv[2]);
      process.exit(1);
    }

    process.stdout.write(value);
  " "$CREDENTIALS_FILE" "$1"
}

KEYSTORE_PATH="$(read_credential keystorePath)"
KEYSTORE_PASSWORD="$(read_credential keystorePassword)"
KEY_ALIAS="$(read_credential keyAlias)"
KEY_PASSWORD="$(read_credential keyPassword)"

if [[ "$KEYSTORE_PATH" != /* ]]; then
  KEYSTORE_PATH="$PROJECT_ROOT/$KEYSTORE_PATH"
fi

if [ ! -f "$KEYSTORE_PATH" ]; then
  echo "Error: Keystore was not found at: $KEYSTORE_PATH"
  exit 1
fi

cd "$PROJECT_ROOT"

npx expo prebuild --clean

cd android

./gradlew bundleRelease \
  -Pandroid.injected.signing.store.file="$KEYSTORE_PATH" \
  -Pandroid.injected.signing.store.password="$KEYSTORE_PASSWORD" \
  -Pandroid.injected.signing.key.alias="$KEY_ALIAS" \
  -Pandroid.injected.signing.key.password="$KEY_PASSWORD"

cd "$PROJECT_ROOT"

mkdir -p generated/and.version

mv -f \
  android/app/build/outputs/bundle/release/app-release.aab \
  generated/and.version/app-release.aab

echo "Android App Bundle created:"
echo "$PROJECT_ROOT/generated/and.version/app-release.aab"
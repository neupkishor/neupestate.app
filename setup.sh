#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTH_DIR="$PROJECT_ROOT/app/auth"
TEMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/neupauth.XXXXXX")"
CLONE_DIR="$TEMP_ROOT/neupauth.app"

cleanup() {
  rm -rf "$TEMP_ROOT"
}
trap cleanup EXIT

echo "Cloning neupauth.app..."
git clone --depth 1 https://github.com/neupgroup/neupauth.app.git "$CLONE_DIR"

mkdir -p "$AUTH_DIR"

# Copy every repository file, including dotfiles, but keep the cloned .git
# directory out of the application source tree.
find "$CLONE_DIR" -mindepth 1 -maxdepth 1 ! -name .git -exec cp -R {} "$AUTH_DIR"/ \;

echo "Auth provider installed at $AUTH_DIR"

AUTH_SETUP="$AUTH_DIR/setup.sh"
if [ -f "$AUTH_SETUP" ]; then
  echo "Running auth setup..."
  bash "$AUTH_SETUP"
fi

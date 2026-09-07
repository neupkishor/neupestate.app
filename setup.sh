#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTH_SHARED_DIR="$PROJECT_ROOT/.neup/auth"
NEUP_DIR="$PROJECT_ROOT/.neup"
TEMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/neupestate.XXXXXX")"

cleanup() {
  rm -rf "$TEMP_ROOT"
}
trap cleanup EXIT

AUTH_REPOSITORY="https://github.com/neupgroup/expo.auth.git"

if [ ! -d "$AUTH_SHARED_DIR/.git" ]; then
  if [ -e "$AUTH_SHARED_DIR" ]; then
    echo "Removing invalid auth repository at $AUTH_SHARED_DIR..."
    rm -rf "$AUTH_SHARED_DIR"
  fi
  mkdir -p "$NEUP_DIR"
  echo "Cloning auth repository into $AUTH_SHARED_DIR..."
  git clone --depth 1 "$AUTH_REPOSITORY" "$AUTH_SHARED_DIR"
else
  AUTH_REMOTE="$(git -C "$AUTH_SHARED_DIR" remote get-url origin 2>/dev/null || true)"
  if [ "$AUTH_REMOTE" != "$AUTH_REPOSITORY" ]; then
    git -C "$AUTH_SHARED_DIR" remote set-url origin "$AUTH_REPOSITORY"
  fi

  echo "Checking auth repository version..."
  git -C "$AUTH_SHARED_DIR" fetch --depth 1 origin main
  LOCAL_AUTH_COMMIT="$(git -C "$AUTH_SHARED_DIR" rev-parse HEAD)"
  REMOTE_AUTH_COMMIT="$(git -C "$AUTH_SHARED_DIR" rev-parse origin/main)"
  if [ "$LOCAL_AUTH_COMMIT" = "$REMOTE_AUTH_COMMIT" ]; then
    echo "Auth repository is already at the latest commit."
  else
    echo "Resetting auth repository to origin/main..."
    git -C "$AUTH_SHARED_DIR" reset --hard origin/main
  fi
fi

if [ ! -f "$AUTH_SHARED_DIR/setup.sh" ]; then
  echo "Error: auth setup script is missing at $AUTH_SHARED_DIR/setup.sh" >&2
  exit 1
fi
bash "$AUTH_SHARED_DIR/setup.sh"

clone_neup_repo() {
  local repository="$1"
  local target_name="$2"
  local clone_dir="$TEMP_ROOT/$target_name"
  local target_dir="$NEUP_DIR/$target_name"

  local required_file="$3"

  if [ -f "$target_dir/$required_file" ]; then
    echo "Using existing $repository at $target_dir"
    return
  fi

  echo "Cloning $repository..."
  git clone --depth 1 "https://github.com/neupgroup/$repository.git" "$clone_dir"

  mkdir -p "$target_dir"
  # Preserve checked-in extensions while installing missing upstream files.
  find "$clone_dir" -mindepth 1 -maxdepth 1 ! -name .git -exec cp -Rn {} "$target_dir"/ \;
  echo "Installed $repository at $target_dir"
}

mkdir -p "$NEUP_DIR"
clone_neup_repo "expo.core" "core" "database/estate.ts"
clone_neup_repo "expo.components" "components" "ui/text.tsx"
clone_neup_repo "expo.logica" "logica" "index.ts"

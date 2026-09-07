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

if [ -d "$AUTH_SHARED_DIR/.git" ]; then
  echo "Using existing auth repository at $AUTH_SHARED_DIR"
elif [ -f "$AUTH_SHARED_DIR/setup.sh" ]; then
  echo "Using existing auth files at $AUTH_SHARED_DIR"
else
  mkdir -p "$NEUP_DIR"
  echo "Cloning neupauth.app into $AUTH_SHARED_DIR..."
  git clone --depth 1 https://github.com/neupgroup/neupauth.app.git "$AUTH_SHARED_DIR"
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

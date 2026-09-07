#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTH_DIR="$PROJECT_ROOT/app/auth"
NEUP_DIR="$PROJECT_ROOT/.neup"
TEMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/neupauth.XXXXXX")"
CLONE_DIR="$TEMP_ROOT/neupauth.app"

cleanup() {
  rm -rf "$TEMP_ROOT"
}
trap cleanup EXIT

if [ -f "$AUTH_DIR/index.tsx" ]; then
  echo "Using existing auth provider at $AUTH_DIR"
else
  echo "Cloning neupauth.app..."
  git clone --depth 1 https://github.com/neupgroup/neupauth.app.git "$CLONE_DIR"
  mkdir -p "$AUTH_DIR"
  find "$CLONE_DIR" -mindepth 1 -maxdepth 1 ! -name .git -exec cp -Rn {} "$AUTH_DIR"/ \;
  echo "Auth provider installed at $AUTH_DIR"
  AUTH_SETUP="$AUTH_DIR/setup.sh"
  if [ -f "$AUTH_SETUP" ]; then bash "$AUTH_SETUP"; fi
fi

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

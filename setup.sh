#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AUTH_SHARED_DIR="$PROJECT_ROOT/neup/auth"
NEUP_DIR="$PROJECT_ROOT/neup"
TEMP_ROOT="$(mktemp -d "${TMPDIR:-/tmp}/neupestate.XXXXXX")"

cleanup() {
  rm -rf "$TEMP_ROOT"
}
trap cleanup EXIT

AUTH_REPOSITORY="https://github.com/neupgroup/expo.auth.git"

if [ -d "$AUTH_SHARED_DIR/.git" ]; then
  if [ -n "$(git -C "$AUTH_SHARED_DIR" status --porcelain)" ]; then
    echo "Using locally modified auth repository."
  else
    echo "Updating auth repository without discarding local commits..."
    git -C "$AUTH_SHARED_DIR" fetch origin main
    git -C "$AUTH_SHARED_DIR" merge --ff-only origin/main
  fi
elif [ -f "$AUTH_SHARED_DIR/setup.sh" ]; then
  echo "Using copied auth module at $AUTH_SHARED_DIR"
elif [ -e "$AUTH_SHARED_DIR" ]; then
  echo "Error: incomplete auth directory at $AUTH_SHARED_DIR; preserving its contents." >&2
  exit 1
else
  mkdir -p "$NEUP_DIR"
  git clone --depth 1 "$AUTH_REPOSITORY" "$AUTH_SHARED_DIR"
fi

if [ ! -f "$AUTH_SHARED_DIR/setup.sh" ]; then
  echo "Error: auth setup script is missing at $AUTH_SHARED_DIR/setup.sh" >&2
  exit 1
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
clone_neup_repo "expo.core" "core" "infrastructure/api.ts"
clone_neup_repo "expo.components" "components" "ui/text.tsx"
clone_neup_repo "expo.logica" "logica" "index.ts"

# Apply auth-owned files after the complete shared modules are installed.
bash "$AUTH_SHARED_DIR/setup.sh"

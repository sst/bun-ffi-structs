#!/usr/bin/env bash
set -euo pipefail

# Run all example TypeScript files in the examples directory with Bun
# Usage:
#   ./run-all.sh
# Env:
#   BUN_BIN  - path to bun binary (default: bun)

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXAMPLES_DIR="$ROOT_DIR/examples"
BUN_BIN="${BUN_BIN:-bun}"

if ! command -v "$BUN_BIN" >/dev/null 2>&1; then
  echo "Error: bun not found in PATH. Install Bun or set BUN_BIN." >&2
  exit 127
fi

shopt -s nullglob

# Collect example files
files=( "$EXAMPLES_DIR"/*.ts )

if ((${#files[@]} == 0)); then
  echo "No .ts example files found in $EXAMPLES_DIR" >&2
  exit 1
fi

passed=0
failed=0
skipped=0
failures=()

echo "Running examples in: $EXAMPLES_DIR"

for file in "${files[@]}"; do
  base="$(basename "$file")"

  echo
  echo "=== ${base%.*} ==="
  "$BUN_BIN" --cwd "$ROOT_DIR" "$file"
  exit_code=$?
  echo "Exit code: $exit_code" >&2
  if [ $exit_code -eq 0 ]; then
    ((passed++))
  else
    ((failed++))
    failures+=("$base")
  fi
done

echo
echo "Summary: $passed passed, $failed failed, $skipped skipped (total: $((passed+failed+skipped)))"
if ((failed > 0)); then
  echo "Failed examples:"
  for f in "${failures[@]}"; do
    echo "  - $f"
  done
  exit 1
fi

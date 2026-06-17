#!/bin/bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

for pkg in client server; do
  echo "→ Regenerating ${pkg}/package-lock.json on linux/amd64..."
  docker run --rm \
    -v "${ROOT}/${pkg}/package.json:/app/package.json" \
    -v "${ROOT}/${pkg}/package-lock.json:/app/package-lock.json" \
    -w /app node:24-alpine npm install --package-lock-only
  echo "✓ ${pkg} done"
  echo ""
done

echo "Commit the updated package-lock.json files."

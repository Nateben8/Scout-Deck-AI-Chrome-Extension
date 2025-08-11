#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

VER=$(jq -r .version manifest.json)
NAME="scoutdeck-ai-extension-$VER.zip"

TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

# Copy files
rsync -a --exclude node_modules --exclude .git --exclude *.zip ./ "$TMPDIR/"

cd "$TMPDIR"
zip -r "$NAME" ./* >/dev/null
mv "$NAME" "$(pwd -P)/../$NAME" 2>/dev/null || mv "$NAME" "../$NAME"

echo "Created $NAME" 
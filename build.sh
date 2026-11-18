#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")"

VERSION=$(grep -oP '"version":\s*"\K[^"]+' manifest.json)
DIST_DIR="dist"
ZIP_FILE="$DIST_DIR/respostas-rapidas-v${VERSION}.zip"

mkdir -p "$DIST_DIR"
rm -f "$ZIP_FILE"

FILES=(
  manifest.json
  content.js
  content.css
  options.html
  options.js
  popup.html
  popup.js
)

zip -r "$ZIP_FILE" "${FILES[@]}"

echo "Pacote gerado: $ZIP_FILE (v${VERSION})"
echo "Envie este .zip em https://addons.mozilla.org/developers/ (Self-distributed)"
echo "Quando baixar o .xpi assinado, salve-o na raiz como: respostas-rapidas.xpi"

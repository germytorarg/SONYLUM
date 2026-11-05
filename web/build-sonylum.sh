#!/usr/bin/env bash
# Arma web/dist/sonylum: copia del sitio con CSS y JS minificados (para subir al hosting).
set -euo pipefail
cd "$(dirname "$0")"
rm -rf dist/sonylum && mkdir -p dist && cp -r sonylum dist/sonylum
cd dist/sonylum
for f in styles.css main.js audio.js cube.js; do
  npx --yes esbuild@0.24.0 "$f" --minify --log-level=warning --outfile="$f.min" && mv "$f.min" "$f"
done
echo "Listo: $(pwd)"

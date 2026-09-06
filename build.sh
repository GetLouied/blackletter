#!/usr/bin/env bash
# Rebuild js/app.js from src/. Only needed when you change code in src/ —
# editing cards in data/*.json requires no build at all.
set -e
npx --yes esbuild@0.21.5 src/main.jsx \
  --bundle --minify --jsx=automatic --format=iife --target=safari14 \
  --define:process.env.NODE_ENV='"production"' \
  --outfile=js/app.js
echo "built js/app.js"

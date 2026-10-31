#!/bin/sh
# Builds the two downloads offered on the Hub overview:
#   dist-downloads/eklipse-editor-prototype.html        single file, opens from disk (everything embedded)
#   dist-downloads/eklipse-editor-prototype-folder.zip  the folder build + README (needs a local web server)
set -e
cd "$(dirname "$0")/.."
npx vite build --mode single >/dev/null
node scripts/build-single-html.mjs dist-downloads/eklipse-editor-prototype.html
npx vite build --outDir dist-folder --emptyOutDir >/dev/null
cat > dist-folder/README.txt <<'TXT'
Eklipse editor prototype (StreamLadder parity) - folder version

This folder must be served by a local web server (browsers block the app's scripts when a file is opened from disk).
1. Open a terminal in this folder.
2. Run one of:   npx serve .        or   python3 -m http.server 8000
3. Open http://localhost:3000/prototype.html (npx serve) or http://localhost:8000/prototype.html (python).
Open a captured screen directly with ?screen=<ID>, e.g. prototype.html?screen=E05.

For a version that opens by double-click, download the single HTML file instead.
Internal use only: the demo clip is third-party gameplay footage.
TXT
rm -f dist-downloads/eklipse-editor-prototype-folder.zip
(cd dist-folder && zip -qr -X ../dist-downloads/eklipse-editor-prototype-folder.zip . -x '.DS_Store')
rm -rf dist-folder
ls -la dist-downloads | awk 'NR>1{print $5, $9}'

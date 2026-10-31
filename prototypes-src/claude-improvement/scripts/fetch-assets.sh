#!/usr/bin/env bash
# Download the third-party/catalogue inputs for build-media.sh into a cache dir
# (outside the repo). Read-only public GETs only:
#   - Eklipse QC public catalogues: /v1/public/memes, /v1/public/sounds
#   - Files on eklipse-assets.eklipse.gg listed by those catalogues
#   - @fontsource/* npm tarballs (caption fonts, OFL / Apache-2.0)
# Downloaded files are data only; nothing from them is executed.
# Usage: scripts/fetch-assets.sh [CACHE_DIR]   (default: $TMPDIR/sl-media-cache)
set -euo pipefail

CACHE="${1:-${MEDIA_CACHE:-${TMPDIR:-/tmp}/sl-media-cache}}"
API="https://qc-api.eklipse.gg/v1/public"
FONTS=(montserrat bangers anton poppins luckiest-guy bebas-neue)

mkdir -p "$CACHE/memes" "$CACHE/sounds" "$CACHE/fonts"

get() { # url dest — skip when already cached
  [ -s "$2" ] || curl -fsSL --retry 2 -o "$2" "$1"
}

curl -fsSL "$API/memes" -o "$CACHE/memes.json"
curl -fsSL "$API/sounds" -o "$CACHE/sounds.json"

# id<TAB>preview_link<TAB>clip_link for every meme; id<TAB>preview_link for sounds
python3 -I - "$CACHE" <<'PY' > "$CACHE/urls.tsv"
import json, sys, os
c = sys.argv[1]
for m in json.load(open(os.path.join(c, "memes.json")))["data"]:
    print("meme", m["id"], m["preview_link"], m["clip_link"], sep="\t")
for s in json.load(open(os.path.join(c, "sounds.json")))["data"]:
    print("sound", s["id"], s["preview_link"], "-", sep="\t")
PY

while IFS=$'\t' read -r kind id a b; do
  case "$a$b" in *[!A-Za-z0-9:/._-]*) echo "skip odd url for $id" >&2; continue;; esac
  if [ "$kind" = meme ]; then
    get "$a" "$CACHE/memes/$id.webm"
    get "$b" "$CACHE/memes/$id.mp4"
  else
    get "$a" "$CACHE/sounds/$id.mp3"
  fi
done < "$CACHE/urls.tsv"

for f in "${FONTS[@]}"; do
  if [ ! -d "$CACHE/fonts/$f" ]; then
    (cd "$CACHE/fonts" && npm pack --silent "@fontsource/$f" >/dev/null)
    mkdir -p "$CACHE/fonts/$f"
    tar -xzf "$CACHE/fonts"/fontsource-"$f"-*.tgz -C "$CACHE/fonts/$f"
  fi
done

echo "fetched into $CACHE"

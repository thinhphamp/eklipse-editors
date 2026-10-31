#!/bin/sh
# Rebuilds the 107 evidence pairs: left = StreamLadder evidence (left half of the
# audit's p5 pair), right = this prototype at 1920x1800 from the given build.
# Usage: sh scripts/make-pairs.sh <dist-dir> <out-dir>
set -e
DIST=${1:-dist}; OUT=${2:-../../plans/261022-1044-sl-prototype-eklipse-complete/verify/pairs}
SHOTS=$(mktemp -d)
node scripts/check-screens.mjs --dist "$DIST" --viewport-height 1800 --shots "$SHOTS" | tail -1
python3 - "$SHOTS" "$OUT" <<'PY'
import sys
from pathlib import Path
from PIL import Image
shots, out = Path(sys.argv[1]), Path(sys.argv[2])
source = Path('../../plans/261019-streamladder-web-audit/proto-fidelity/p5')
out.mkdir(parents=True, exist_ok=True)
count = 0
for pair in sorted(source.glob('*-pair.png')):
    shot = shots / (pair.name[:-9] + '.png')
    if not shot.exists(): continue
    with Image.open(pair) as old, Image.open(shot) as new:
        half = old.crop((0, 0, old.width // 2, old.height)).resize((1200, 1125))
        result = Image.new('RGB', (2400, 1125))
        result.paste(half, (0, 0)); result.paste(new.convert('RGB').resize((1200, 1125)), (1200, 0))
        result.save(out / pair.name, optimize=True)
    count += 1
print('pairs:', count, '->', out)
PY
rm -rf "$SHOTS"

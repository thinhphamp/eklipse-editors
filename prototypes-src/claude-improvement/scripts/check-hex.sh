#!/bin/sh
# Fails when a raw colour literal appears in src/ outside src/theme/tokens.css and src/theme/sticker-tokens-*.css.
# Colours must come from tokens (var(--...)); alpha via color-mix() or alpha tokens in tokens.css.
cd "$(dirname "$0")/.." || exit 2
hits=$(rg -n '#[0-9a-fA-F]{3,8}\b|rgba?\(' src --glob '!**/theme/tokens.css' --glob '!**/theme/sticker-tokens-*.css' --glob '!**/*.jpg' --glob '!**/*.png' --glob '!**/*.json')
if [ -n "$hits" ]; then
  echo "check-hex: raw colours outside src/theme/tokens.css and src/theme/sticker-tokens-*.css:"; echo "$hits" | head -40; exit 1
fi
echo "check-hex: OK (no raw colours outside src/theme/tokens.css and src/theme/sticker-tokens-*.css)"

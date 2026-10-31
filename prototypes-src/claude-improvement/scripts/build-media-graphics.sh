# Sourced by scripts/build-media.sh (needs OUT, WORK, TEXT_FONT, add, GEN, GEN_LIC).
# Generates own-work graphics: 8 emote PNGs, 8 animated WebP "GIF" stand-ins, 8 Lottie stickers.

# ---------- 6. emotes: 112x112 PNG faces ----------
FACE="-fill '#FFC83D' -stroke '#6B3F00' -strokewidth 4 -draw 'circle 56,56 56,8'"
emote() { # slug title extra-draw-args
  local slug=$1 title=$2; shift 2
  eval magick -size 112x112 xc:none $FACE "$@" "$OUT/emotes/$slug.png"
  add "media/emotes/$slug.png" emote "Twitch stand-in" "$title" "$GEN (ImageMagick)" "$GEN_LIC" "Stand-in for Twitch/7TV emotes"
}
EYES="-fill '#3B2200' -stroke none -draw 'circle 40,44 40,51' -draw 'circle 72,44 72,51'"
emote ek-smile "EkSmile" "$EYES" "-fill none -stroke '#3B2200' -strokewidth 5 -draw 'arc 34,50 78,84 20,160'"
emote ek-lul "EkLUL" "-fill none -stroke '#3B2200' -strokewidth 5 -draw 'arc 30,36 50,52 200,340' -draw 'arc 62,36 82,52 200,340'" \
  "-fill '#7A1F1F' -stroke '#3B2200' -strokewidth 3 -draw 'path \"M 30 62 Q 56 100 82 62 Z\"'"
emote ek-sadge "EkSadge" "$EYES" "-fill none -stroke '#3B2200' -strokewidth 5 -draw 'arc 36,70 76,96 200,340'" \
  "-fill '#4FC3F7' -stroke none -draw 'ellipse 40,62 5,9 0,360'"
emote ek-pog "EkPog" "-fill white -stroke '#3B2200' -strokewidth 3 -draw 'circle 38,42 38,54' -draw 'circle 74,42 74,54'" \
  "-fill '#3B2200' -stroke none -draw 'circle 38,42 38,47' -draw 'circle 74,42 74,47' -draw 'ellipse 56,78 11,15 0,360'"
emote ek-cool "EkCool" "-fill '#111111' -stroke none -draw 'roundrectangle 22,34 52,54 6,6' -draw 'roundrectangle 60,34 90,54 6,6' -draw 'rectangle 50,38 62,42'" \
  "-fill none -stroke '#3B2200' -strokewidth 5 -draw 'arc 38,56 78,82 20,160'"
emote ek-rage "EkRage" "-fill '#FF5A3C' -stroke '#7A1F00' -strokewidth 4 -draw 'circle 56,56 56,8'" "$EYES" \
  "-stroke '#3B2200' -strokewidth 6 -draw 'line 28,30 50,40' -draw 'line 84,30 62,40' -fill none -draw 'arc 36,70 76,96 200,340'"
emote ek-love "EkLove" "-fill '#FF3D7F' -stroke none -draw 'circle 34,40 34,48' -draw 'circle 46,40 46,48' -draw 'path \"M 27 43 L 40 58 L 53 43 Z\"'" \
  "-draw 'circle 66,40 66,48' -draw 'circle 78,40 78,48' -draw 'path \"M 59 43 L 72 58 L 85 43 Z\"'" \
  "-fill none -stroke '#3B2200' -strokewidth 5 -draw 'arc 36,58 76,86 20,160'"
emote ek-skull "EkSkull" "-fill '#F2F2F2' -stroke '#555555' -strokewidth 4 -draw 'circle 56,56 56,8'" \
  "-fill '#222222' -stroke none -draw 'ellipse 38,50 10,12 0,360' -draw 'ellipse 74,50 10,12 0,360' -draw 'path \"M 56 64 L 50 76 L 62 76 Z\"'" \
  "-fill '#F2F2F2' -stroke '#555555' -strokewidth 3 -draw 'roundrectangle 36,84 76,104 4,4' -draw 'line 50,84 50,104' -draw 'line 62,84 62,104'"

# ---------- 7. GIF stand-ins: animated WebP 240x180 (text banners) ----------
gif() { # slug title bg fg motion(zoom|shake|spin|pulse)
  local slug=$1 title=$2 bg=$3 fg=$4 motion=$5 d="$WORK/gif-$1" i s a x y
  mkdir -p "$d"
  magick -size 240x180 "xc:$bg" -font "$TEXT_FONT" -pointsize 64 -fill "$fg" -stroke '#000000' -strokewidth 3 \
    -gravity center -annotate +0+0 "$title" "$d/base.png"
  for i in $(seq 0 15); do
    s=1; a=0; x=120; y=90
    case $motion in
      zoom)  s=$(awk "BEGIN{print 0.8+0.25*sin($i/16*6.2832)}");;
      shake) x=$(awk "BEGIN{print 120+8*sin($i*2.1)}"); y=$(awk "BEGIN{print 90+5*cos($i*1.7)}");;
      spin)  a=$(awk "BEGIN{print 12*sin($i/16*6.2832)}");;
      pulse) s=$(awk "BEGIN{print 1+0.12*(($i%8)<2)}");;
    esac
    magick "$d/base.png" -virtual-pixel background -background "$bg" -distort SRT "120,90 $s $a $x,$y" "$d/f$(printf %02d "$i").png"
  done
  magick -delay 6 -loop 0 "$d"/f*.png -quality 70 "$OUT/gifs/$slug.webp"
  add "media/gifs/$slug.webp" gif "Reaction" "$title" "$GEN (ImageMagick, Bangers OFL font)" "$GEN_LIC" "Animated WebP stand-in until the GIF provider key exists"
}
gif gg "GG" '#5B2BE0' '#FFFFFF' zoom
gif no-way "NO WAY" '#E0245E' '#FFE14D' shake
gif lets-go "LET'S GO" '#12B76A' '#FFFFFF' pulse
gif rip "RIP" '#2B2B2B' '#D0D0D0' spin
gif clutch "CLUTCH" '#F79009' '#1A1A1A' zoom
gif pog "POG" '#0BA5EC' '#FFFFFF' shake
gif oof "OOF" '#7A5AF8' '#FFE14D' spin
gif ez "EZ" '#101828' '#4ADE80' pulse

# ---------- 8. Lottie stickers (hand-authored JSON) ----------
python3 -I - "$OUT/stickers" <<'PY' > "$WORK/lottie.tsv"
import json, os, sys
out = sys.argv[1]
E = {"o": {"x": [0.33], "y": [0]}, "i": {"x": [0.67], "y": [1]}}
def anim(frames):  # [(t, value)] -> animated property
    return {"a": 1, "k": [dict({"t": t, "s": v if isinstance(v, list) else [v]}, **(E if n < len(frames) - 1 else {}))
                          for n, (t, v) in enumerate(frames)]}
def st(v): return {"a": 0, "k": v}
def rgb(h): return [int(h[i:i + 2], 16) / 255 for i in (1, 3, 5)] + [1]
def fill(c): return {"ty": "fl", "c": st(rgb(c)), "o": st(100), "r": 1, "nm": "fill"}
def stroke(c, w): return {"ty": "st", "c": st(rgb(c)), "o": st(100), "w": st(w), "lc": 2, "lj": 2, "nm": "stroke"}
def ellipse(x, y, w, h): return {"ty": "el", "p": st([x, y]), "s": st([w, h]), "nm": "ellipse"}
def rect(x, y, w, h, r=0): return {"ty": "rc", "p": st([x, y]), "s": st([w, h]), "r": st(r), "nm": "rect"}
def star(pts, outer, inner): return {"ty": "sr", "sy": 1, "pt": st(pts), "p": st([0, 0]), "r": st(0), "or": st(outer),
                                     "os": st(0), "ir": st(inner), "is": st(0), "nm": "star"}
def poly(pts, r): return {"ty": "sr", "sy": 2, "pt": st(pts), "p": st([0, 0]), "r": st(0), "or": st(r), "os": st(0), "nm": "poly"}
def group(*items): return {"ty": "gr", "it": list(items) + [{"ty": "tr", "p": st([0, 0]), "a": st([0, 0]), "s": st([100, 100]),
                                                         "r": st(0), "o": st(100)}], "nm": "group"}
def layer(name, shapes, s=None, r=None, o=None, p=None):
    return {"ddd": 0, "ind": 1, "ty": 4, "nm": name, "sr": 1, "ip": 0, "op": 60, "st": 0, "bm": 0,
            "ks": {"o": o or st(100), "r": r or st(0), "p": p or st([100, 100, 0]), "a": st([0, 0, 0]),
                   "s": s or st([100, 100, 100])}, "shapes": shapes}
def save(slug, title, layers):
    for i, l in enumerate(layers): l["ind"] = i + 1
    doc = {"v": "5.7.4", "fr": 30, "ip": 0, "op": 60, "w": 200, "h": 200, "nm": title, "ddd": 0, "assets": [], "layers": layers}
    json.dump(doc, open(os.path.join(out, f"{slug}.json"), "w"), separators=(",", ":"))
    print(f"{slug}\t{title}")
pulse = anim([(0, [100, 100, 100]), (15, [120, 120, 100]), (30, [100, 100, 100]), (45, [120, 120, 100]), (60, [100, 100, 100])])
spin = anim([(0, 0), (60, 360)])
save("spinning-star", "Spinning star", [layer("star", [group(star(5, 70, 30), fill("#FFD23F"), stroke("#B8860B", 4))], r=spin)])
save("bouncing-ball", "Bouncing ball", [layer("ball", [group(ellipse(0, 0, 60, 60), fill("#FF5A3C"))],
     p=anim([(0, [100, 50, 0]), (15, [100, 150, 0]), (30, [100, 50, 0]), (45, [100, 150, 0]), (60, [100, 50, 0])]))])
save("pulse-ring", "Pulse ring", [layer("ring", [group(ellipse(0, 0, 120, 120), stroke("#5B2BE0", 12))], s=pulse,
     o=anim([(0, 100), (30, 40), (60, 100)]))])
save("heart-beat", "Heart beat", [layer("heart", [group(ellipse(-22, -10, 60, 60), ellipse(22, -10, 60, 60), fill("#FF3D7F")),
     group(rect(0, 18, 62, 62, 4), fill("#FF3D7F"))], s=pulse)])
save("sparkle", "Sparkle", [layer("sparkle", [group(star(4, 80, 16), fill("#FFFFFF"), stroke("#7A5AF8", 4))], r=spin,
     s=anim([(0, [60, 60, 100]), (30, [110, 110, 100]), (60, [60, 60, 100])]))])
save("wobble-triangle", "Wobble triangle", [layer("tri", [group(poly(3, 70), fill("#12B76A"), stroke("#065F46", 4))],
     r=anim([(0, -15), (15, 15), (30, -15), (45, 15), (60, -15)]))])
save("spinning-square", "Spinning square", [layer("square", [group(rect(0, 0, 100, 100, 18), fill("#0BA5EC"), stroke("#035E8A", 5))],
     r=spin, s=pulse)])
save("double-ring", "Double ring", [layer("outer", [group(ellipse(0, 0, 150, 150), stroke("#F79009", 8))], r=spin, s=pulse),
     layer("inner", [group(ellipse(0, 0, 70, 70), fill("#F79009"))], s=anim([(0, [120, 120, 100]), (30, [80, 80, 100]), (60, [120, 120, 100])]))])
PY
while IFS=$'\t' read -r slug title; do
  add "media/stickers/$slug.json" sticker-lottie "Animated" "$title" "$GEN (hand-authored Lottie 5.7, 200x200, 30 fps, 2 s)" "$GEN_LIC" "Shape-only Lottie, no images or fonts"
done < "$WORK/lottie.tsv"

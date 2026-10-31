---
feature: channel-sticker
status: final
---

# Channel stickers: its own rail tab, 2nd below Templates

## Goal
Take the social channel name sticker out of **Elements** and give it its own rail tab, second after Templates:

`Templates · Channel stickers · Captions · Elements · Effects · Audio`

Combine what the main Eklipse app supports today (`mvtsggal-image.png`) with what the prototype already has.

## What each side has

| | Main Eklipse app ("Channel Stickers" menu) | Prototype today (Elements tab) |
|---|---|---|
| Name | One "Channel Name" field | One handle, saved (`ek-claude-brand`), live in every tile |
| Platforms | Twitch, Facebook, YouTube, Kick, pick **one** | Twitch, YouTube, Kick, TikTok, Instagram chips, pick **several** (`brand-platforms`); catalog also has Facebook, X |
| Colour | 7 swatches (purple, yellow, mint, red, blue, green, black) | None; each design has fixed colours |
| Designs | Single Channel Name / Multi Channel Name tabs, pill designs (icon block + name) | 52 designs in tabs All / Animated / Multiple / Twitch / Youtube / Kick / Facebook; animated ones are premium |
| Clip behaviour | Added like any element | Brand card: "On this clip · 0:00 to the end", **Add to every new clip** (on by default), whole clip, below facecam and above captions |

## Combined model (same in every variant)
1. **One sticker per clip, saved as your setting.** Kept from the prototype: whole clip, every new clip by default,
   remembered in local storage and carried by saved templates.
2. **Name** from Eklipse, prefilled from the connected account.
3. **Platforms: pick one or several.** Union of both lists: Twitch, YouTube, Kick, Facebook, TikTok, Instagram, X.
   One platform = single designs, two or more = multi designs. The Single / Multi tabs go away; the choice of
   platforms decides it.
4. **Colour** from Eklipse: "Platform colour" (default) + the 7 swatches. Only Eklipse designs recolour; fixed-colour
   designs (most of the 52) say so and grey out the swatches.
5. **Designs**: Eklipse designs (recolourable) + the prototype catalog, filtered by the chosen platforms.

## In scope (files the promotion will touch)
`src/data.ts` (new tab id, label), `src/shell/Rail.tsx`, `BottomNav.tsx`, new `src/tabs/channel/`,
`src/tabs/elements/Elements.tsx` (remove the brand card + Social Stickers section, leave a pointer),
`BrandCard.tsx`, `variants/brand-*`, `variants/social/*`, `social-stickers/*`, `shell/brand-sticker.ts`
(add `platforms[]`, `color`), icon sprite. The unpromoted `soc-rail-tab` variant is the code starting point.

## Out of scope / parking lot
- Follower count or live "LIVE" badges on stickers.
- Sticker position presets per layout (today: fixed y 60 under the facecam).
- Custom-upload logos.

## Answered (30 Oct, round 1 → B)
1. Names **can differ per platform**, and a clip can carry **several stickers**, not only one (B2: up to 3).
2. Tab name: **Channel stickers**.
3. **Merge** StreamLadder and Eklipse designs into one library.
4. **Tint every design**, fixed-colour looks included ("Original" keeps their own colours).

## Open questions (round 1, now answered above)
1. In the main app, does **Multi Channel Name** mean one name with several platform icons, or a **different name per
   platform** (e.g. Twitch `quan1102`, YouTube `@quanplays`)? Variant C is built for the second.
2. Tab name: **Channel sticker** (main-app wording) or **Socials** (old `soc-rail-tab` wording)?
3. The 52-design catalog was captured from StreamLadder as a reference. Do we ship those looks, or only Eklipse's own
   designs plus new ones drawn in the same family?
4. Should the colour also tint fixed designs (hue shift), or stay Eklipse-designs only?

## Still open (B2)
- Max stickers per clip: B2 drafts 3. OK?
- Timing presets: Whole clip / First 5 s / Last 5 s enough, or also a custom range (drag on the timeline)?
- Position: B2 stacks stickers that overlap in time; is drag-to-move on the preview needed in this round?
- The edit sheet is tall when a sticker is selected; collapse it to one line by default?

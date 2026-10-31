---
feature: elements-menu
status: final
---

# Elements: organised like production, styled like the prototype

## Goal
Reorganise the prototype's **Elements** rail tab the way the Eklipse production editor organises it
(`mvumbxsc-image.png`): top tabs per content type, sub-tabs, a search bar and a media grid with name + length. Use the
prototype's visual style (dark tokens, Hanken Grotesk, purple accent, 520px side panel).

**Audio stays its own rail tab**, as it is in the prototype today. Production has `Meme · Audio · Texts · Effects`;
the prototype gets `Meme · Texts · Effects`.

## What each side has

| | Production (Elements menu) | Prototype today (Elements tab) |
|---|---|---|
| Structure | Top tabs **Meme · Audio · Texts · Effects** (icon + label), then underline sub-tabs (Meme shows one: "Meme") | One long scroll of sections: Custom Elements (upload), Text Elements, Reactions, Animated Stickers, Gifs, Twitch Emotes; `el-jump` chips scroll to a section |
| Search | Full-width search field + **Search** button, per tab | One search across memes, GIFs, emotes (`el-jump`); separate "Search Twitch emotes" field |
| Grid | 3 columns, video thumbnails, **duration** badge + play icon, name below; grid-size toggle (top right) | 3-column tiles, name only; "Full page" opens a gallery page per section |
| Memes | Own tab, first | **Not shown.** 12 meme videos exist in `public/media/memes` but are only used as 4 webm stickers |
| Audio | Inside Elements | Own rail tab (Music, Sound effects); stays |
| Effects | Inside Elements (content not in the screenshot) | Own rail tab: Zoom, Speed, Effects (9 shader presets), AI censoring, TTS, Remove silences, Hook title |
| Channel stickers | Own rail menu | Own rail tab (`ch-stickers`); Elements keeps a pointer |

## Why the order matters (repo data)
From `docs/knowledge/editor-direction-research.md` (web, 19,562 projects, association, not causal):
text **+45.9** export points for the same user, user-added memes **+32.7**; AI memes left untouched export **44.4%** vs
**72.9%** when the user edits them. So Meme and Texts lead, and seeing/fixing memes already on the clip matters.

## Proposed mapping (same in every variant)
- **Meme**: Memes · GIFs · Stickers (Lottie + webm) · Emotes · Uploads (today's Custom Elements)
- **Texts**: AI hook intro title card on top; Titles · Intro · Outro · Reactions
- **Effects**: see open question 1
- Picking a tile adds it at the playhead; the edit page (Animations / Sound / Style …) stays as it is today.

## In scope (files the promotion will touch)
`src/tabs/elements/Elements.tsx`, `Elements.css`, `media.tsx` (duration badge, hover preview),
`variants/ElJump.tsx` (replaced), `src/fixtures` manifest (meme kind into Elements), `src/variant.ts` (new flag),
possibly `src/data.ts` + `src/tabs/effects/*` if Effects folds in.

## Open questions
1. **Production "Effects" inside Elements: what is in it?** Overlay effect videos (explosions, green-screen), or the
   same shader effects the prototype has under Effects → Effects? This decides whether the prototype's **Effects rail
   tab stays** (Elements → Effects = overlays only) or **folds into Elements** (rail: Templates · Channel stickers ·
   Captions · Elements · Audio). A screenshot of that tab settles it.
2. Tab order: production order **Meme · Texts · Effects**, or **Texts first** (text has the bigger export gap)?
3. Production Meme sub-tabs: only "Meme" is visible. Are GIFs / emotes / stickers somewhere else in production, or new?
4. Do memes play their own sound when added (production memes are videos with audio)? Default volume?

## Out of scope / parking lot
- Shared timing row (`el-timing` / `fx-timing` / `aud-timing`), separate probe recommendation.
- After-AI-Edit review of all AI items (C9) across tabs; variant B only shows the Elements part of it.
- Audio tab layout.

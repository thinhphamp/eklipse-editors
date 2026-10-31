# eklipse-4.0 feature map

- App: Eklipse web app v4, Next.js 15 App Router, plain JS, fully client-rendered (`ClientOnly` in `src/app/providers.js`). Route guard is client-side only (`src/contexts/AuthContext.js` + `src/constansts/public-routes.js`).
- Run locally: `.env.local` copied from the QC env (ask the team; no `.env.example` in repo). Talks to the QC API set in `NEXT_PUBLIC_API_URL`. Use a prod build: `npm run build && npx next start -p 3000`. Do not use `next dev` for mapping: webpack compiles each route for ~3 min.
- Test accounts: QC test accounts, ask the team. Never put emails or passwords in this file.
- Premium was tested with the Stripe sandbox (QC Sandbox merchant).
- Verified: 2026-10-05 against `src/` on master `637b3a57`. Spot-check 3/3 passed (Content Publisher, Private Stream, Saved clips) by an agent using only this map.
- Screenshots referenced below are kept outside the repo (onboarding workspace), not committed.
- Living document: update it when you notice drift. Change the Verified date on any entry you re-check.

Selector notes: the repo has 0 `data-testid`. Use Playwright role/text locators. The only stable `id` found on shell elements is the sidebar root `#mySidebar` (`src/components/layouts/Menu.js:204`). Sidebar items also carry stable classes (`.home-menu`, `.video-library-menu`, `.posting-agent-menu`, `.content-planner-menu`, `.live-clipping-menu`, `.live-stream-menu`). Modals are missing from the crawl's accessibility snapshot, so modal selectors below come from visible text in screenshots and have not been run.

Crawl caveat: the crawl script kept only the first ~45 interactive elements per page and filtered sidebar `listitem`s out of the premium pass, so tier differences below come from screenshots + code, not snapshot diffs.

## Global navigation

Use a viewport of at least 1440x900. On short screens the "Mobile App" item and the desktop-notifications toast cover the lower sidebar items and swallow clicks.

Shell: `src/components/layouts/Private.js` (picks BasicLayout / OnboardingLayout / EmptyLayout, mounts every global modal) → `Menu.js` (sidebar) + `Header.js` (top bar).

Sidebar (`src/components/layouts/Menu.js`), `getByRole('listitem', { name })`:
| Item | Route | Notes |
|---|---|---|
| Home | /home | |
| Library | /video-library | |
| Edits | /edited-clip | |
| Content Agent | /posting-agent | |
| Content Publisher | /content-planner | |
| Live Clipping (Beta) | /live-clipping | premium only: rendered when `premiumType === 'full'` |
| Private Stream | /live-stream | |
| Mobile App | button, `getByRole('button', { name: 'Mobile App' })` | QR / store popover |
| Settings | /account | |
| Tier badge | `getByText('Free')` / `getByText('Premium')`, top-left | click opens paywall (free) |
| Upgrade to Premium | `getByText('Upgrade to Premium')` | free only; opens Go Premium modal |

Top bar (`src/components/layouts/Header.js`):
| Element | Selector | Action | Code |
|---|---|---|---|
| Connected Accounts 0/5 | `getByRole('button', { name: /Connected Accounts/ })` | opens connect-account modal; shows "onboarding required" warning if onboarding unfinished | `layouts/SocialConnectButton.js` → `modals/ConnectAccountModal.js` |
| Eklipse Bounty | `getByRole('link', { name: /Eklipse Bounty/ })` | → /bounty | `headers/BountyNudge.js` |
| GO PREMIUM | `getByText('GO PREMIUM')` | opens Go Premium modal; hidden for premium/paused | `common/EkGoPremiumButton.js` |
| Ask assistant | `getByRole('button', { name: 'Ask assistant' })` | opens full-screen AI assistant sidebar | `ai-agents/AIAssistantSidebar.js` |
| Create | `getByText('Create')` (popover) | menu: Editor, AI Edit, Montage (Montage → paywall for free) | `headers/CreateBtn.js` |
| Saved Clip | `getByRole('button', { name: 'Saved Clip' })` | → /video-library/saved-playlist | `Header.js:96` |
| Bell | unnamed icon button, second from right | notifications popover, links to /account#notifications-settings | `layouts/NotificationHeader.js` |
| Account icon | unnamed icon button, far right | menu: Membership (/account#membership), Account Settings (/account), Help, Logout | `layouts/ProfileSettings.js` |

Screenshots: `route-home.png` (free shell), `premium-route-home.png` (premium shell), `nav-create-menu.png`.

## Register
- Reach it: logged out → /login → "Sign up", or open /register directly
- Route: /register (variants: /register-twitch, /register-campaign, /register-campaign/[campaign_code])
- Code: `src/app/register/page.js` → `components/register/MarketingSection`, `components/common` (EkPrimaryButton)
- Selector: `getByRole('button', { name: 'Continue with Twitch' })`; email form opens from `getByText('Email')` in "Or sign up with Kick, Facebook, Xbox, or Email"
- Tier: n/a (public)
- Screenshot: `00-register.png`, `01-after-signup.png`
- Verified: 2026-10-05

## Login
- Reach it: open / or any private route while logged out
- Route: /login (plus /forgot-password, /password/reset, /oauth-callback)
- Code: `src/app/login/page.js` → `components/register/MarketingSection`
- Selector: `getByRole('button', { name: 'Sign in' })`, link `getByText('Forgot your password?')`
- Tier: n/a (public)
- Screenshot: `03-after-login.png` (`02-login.png` is blank, captured before render)
- Verified: 2026-10-05. After an email login on localhost the page stays on /login; open /home by hand.

## Onboarding
- Reach it: forced for any new account (`userInfo.finishOnboarding === null` → push /onboarding, `Private.js:800-806`)
- Route: /onboarding
- Code: `src/app/onboarding/page.js` → `_components/OnboardingWelcome`, `OnboardingSocialAccounts`, `OnboardingMobileApp`, `OnboardingStream` / `OnboardingAIEdit` / `OnboardingStreamCheck` (pushes /home at the end)
- Steps: 1 "How can Eklipse help?" (goal) → 2 "Set up your account" (connect platform, `getByText('Skip for Now')`) → 3 "Get Eklipse Mobile" (`getByRole('button', { name: 'Continue' })`) → 4 "Let's Get Started" → /home with the "Welcome to the next generation of Eklipse!" modal
- Selector: `getByText('Create AI Highlights from my game streams')` (step 1 option)
- Tier: both
- Screenshot: `05-onboarding-step1.png`, `07-onboarding-step2.png`, `08-onboarding-step3.png`, `09-onboarding-done.png`, `06-after-onboarding-skip.png`
- Verified: 2026-10-05

## Home
- Reach it: sidebar Home
- Route: /home
- Code: `src/app/home/page.js` → `_components/StreamConnection`, `_components/NewQuickActions`, `components/templates/ListTemplatesPanel`, `modals/Gen10LaunchPopup`, `popupbanners/MobileBanner`, `PreEditWeeklyBanner`
- Selector: `getByRole('listitem', { name: 'Home' })`
- Contents: connect-platform tiles (Twitch/Youtube/Facebook/Kick/Rumble), "Import Stream" (→ `modals/streams/ImportStreamModal`), Quick Actions (Import Streams, Convert to TikTok, AI Edit → `modals/EditClipModal`; Share → SchedulePostModal), template carousel
- Tier: both. Premium adds a "Weekly Challenge 0%" button on the stream card and shows a "Gameplay Intelligence" modal once after purchase. The free snapshot is cut off, so template count was not compared.
- Screenshot: `route-home.png`, `premium-route-home.png`, `home-after-purchase.png`, `04-home.png`
- Verified: 2026-10-05

## Library (streams / clips / playlists)
- Reach it: sidebar Library
- Route: /video-library (tabs via hash `#streams`, `#clip`, `#playlist`)
- Code: `src/app/video-library/page.js` → `_components/StreamGroupedByDate`, `ClipPanel`, `PlaylistPanel`
- Selector: `getByRole('listitem', { name: 'Library' })`; tabs `getByRole('tab', { name: 'Streams' | 'Clip' | 'Playlist' })`
- Tier: both, no difference in snapshot (filters All/Processed/In Progress/Not Processed, Import Stream, Refresh, "Connect Stream 0/5")
- Screenshot: `route-video-library.png`, `premium-route-video-library.png`
- Verified: 2026-10-05

## Library: stream list (standalone)
- Reach it: direct URL only (no link found in the crawl)
- Route: /video-library/streams
- Code: `src/app/video-library/streams/page.js` → `components/stream-detail/StreamCard`
- Selector: none (empty page for an account with no streams)
- Tier: both
- Screenshot: `route-video-library_streams.png` (blank content area)
- Verified: 2026-10-05 (empty state only)

## Saved clips
- Reach it: top bar "Saved Clip"
- Route: /video-library/saved-playlist (detail: /video-library/saved-playlist/[id] from a playlist card)
- Code: `src/app/video-library/saved-playlist/page.js` → re-exports `[id]/page.js`
- Selector: `getByRole('button', { name: 'Saved Clip' })`; page `getByRole('heading', { name: 'No Clips Saved Yet' })`
- Tier: both
- Screenshot: `route-video-library_saved-playlist.png`
- Verified: 2026-10-05

## Edits
- Reach it: sidebar Edits
- Route: /edited-clip
- Code: `src/app/edited-clip/page.js` → `components/edited-clip/StartEditingPanel`, `AIEditSuggestionPanel`, `CreatedClipsPanel`, `projects/ListProjectsPanel`, `projects/SideListProjectsPanel`
- Selector: `getByRole('listitem', { name: 'Edits' })`; cards `getByText('Edit Your Clips' | 'Start Instant Edit' | 'Get Clip Edited by Pro' | 'Create Montage')`
- Tier: both. Free: "Create Montage" opens the paywall (`StartEditingPanel.js:49-63`); "Get Clip Edited by Pro" opens `RequestPremiumEditingModal`. Edited Clips filters: All / AI Edit / Converted to TikTok / Extended / Trimmed Clip / Montage / Pro Edit.
- Screenshot: `route-edited-clip.png`, `premium-route-edited-clip.png`
- Verified: 2026-10-05

## AI Edit studio
- Reach it: Create → AI Edit, or Home quick action "AI Edit" → choose clip → studio (`hooks/useEditClip.js`, `hooks/useAiEdit.js`)
- Route: /ai-edit-studio (`AI_EDIT_CUSTOMIZE_PAGE_PATH`, renders in EmptyLayout without sidebar)
- Code: `src/app/ai-edit-studio/page.js` → `components/ai-edit/AIEditHeader`, `AIEditStyleMenu`, `AIEditTemplateMenu`, `AIEditPreviewTemplate`, `AIEditCroppingModal`
- Selector: `getByRole('button', { name: 'Generate AI Edit' })`; clip picker `getByRole('textbox', { name: 'Paste a Twitch or Kick clip URL here' })`
- Tier: both, no difference seen (styles Surprise Me / Funny / Montage / Minimalist, layout 9:16 vs 16:9)
- Screenshot: `route-ai-edit-studio.png`, `premium-route-ai-edit-studio.png`
- Verified: 2026-10-05

## Instant edit (pre-edit)
- Reach it: Home "Pre-edit weekly" banner (`popupbanners/PreEditWeeklyBanner.js:37`); Edits → "Start Instant Edit"
- Route: /instant-edit/pre-edit (also /instant-edit/pre-edit/[id], /instant-edit/preview; public variants /pre-edit, /clip-preview)
- Code: `src/app/instant-edit/pre-edit/page.js` → `components/popupbanners/PreEditWeeklyModal` (template), `app/instant-edit/_components/*`
- Selector: none; empty state text `getByText('No pre-edit clips available.')`
- Tier: both
- Screenshot: `route-instant-edit_pre-edit.png`
- Verified: 2026-10-05 (empty state only)

## Content Agent (posting agent)
- Reach it: sidebar Content Agent
- Route: /posting-agent
- Code: `src/app/posting-agent/page.js` (self-contained) → `components/common/MobileAppQRCode`
- Selector: `getByRole('listitem', { name: 'Content Agent' })`; CTA `getByRole('button', { name: 'Activate & continue on mobile →' })`
- Tier: both, same marketing page ("Your agent works while you sleep": I hunt / I edit / I draft)
- Screenshot: `route-posting-agent.png`, `premium-route-posting-agent.png`
- Verified: 2026-10-05

## Content Publisher (content planner / schedule post)
- Reach it: sidebar Content Publisher
- Route: /content-planner
- Code: `src/app/content-planner/page.js` (1050 lines, calendar inline) → `components/modals/ContentPlannerModal`, `schedule-post/NewsPostsDetail`, global `modals/SchedulePostModal` (2072 lines)
- Selector: `getByRole('listitem', { name: 'Content Publisher' })`; `getByRole('button', { name: 'Schedule a post' })`; view toggles `Week` / `Month`, plus a `Today` date-jump button beside the prev/next arrows. The schedule modal can take a few seconds to open: wait before clicking again
- Tier: both. Free: picking any date other than today opens the paywall (`page.js:565-576`). The calendar column count differs between snapshots only because of truncation.
- Screenshot: `route-content-planner.png`, `premium-route-content-planner.png`
- Verified: 2026-10-05

## Live Clipping
- Reach it: sidebar "Live Clipping" (premium only)
- Route: /live-clipping (tabs `#general-settings`, `#live-clipping`; `#past_live` linked from stream pages)
- Code: `src/app/live-clipping/page.js` → `components/live-clipping/LiveClippingSetting`, `LiveClippingList`, `AdditionalSettings`
- Selector: `getByRole('listitem', { name: 'Live Clipping' })` or `.live-clipping-menu`; tabs `getByRole('tab', { name: 'General Settings' | 'Live Clipping' })`
- Tier: premium. Free users are sent to /home by `window.location.href` (`LiveClippingSetting.js:158-162`, checks `isPremium`). The menu item uses `premiumType === 'full'`, a different check (see Known issues).
- Screenshot: `premium-route-live-clipping.png` (free: `route-live-clipping.png` = Home)
- Verified: 2026-10-05

## Private Stream
- Reach it: sidebar Private Stream
- Route: /live-stream
- Code: `src/app/live-stream/page.js` (794 lines) → `components/stream-detail/StreamCard` (`useHandleStreamCard`), `StreamCardActionButton`
- Selector: `getByRole('listitem', { name: 'Private Stream' })`; `getByRole('button', { name: 'How do I start streaming to Eklipse?' })`
- Tier: both. Free: RTMP URL can be copied, but stream key "Reset"/"Copy" and the "Auto-Processing" toggle (a checkbox, nested under the "How do I start streaming to Eklipse?" button in the a11y tree) are disabled. Premium: all enabled, plus a "Learn how" button.
- Screenshot: `route-live-stream.png`, `premium-route-live-stream.png`
- Verified: 2026-10-05

## Settings (account)
- Reach it: sidebar Settings, or account icon → Account Settings / Membership
- Route: /account (hash sections `#connected-account`, `#profile`, `#membership`, `#notifications-history`, `#notifications-settings`; `?openModal=premium#membership` opens Go Premium)
- Code: `src/app/account/page.js` → `./ConnectedAccount`, `./Profile`, `./Membership`, `./NotificationsHistory`, `./NotificationsSettings`
- Selector: `getByRole('listitem', { name: 'Settings' })`; sub-nav `getByRole('listitem', { name: 'Connected Account' | 'Profile' | 'Membership' | 'Notifications History' })`
- Tier: both; same Connected Account screen (Twitch/YouTube/Facebook/Kick/Rumble + socials). Membership content per tier was not captured.
- Screenshot: `route-account.png`, `premium-route-account.png`
- Verified: 2026-10-05

## Bounty
- Reach it: top bar "Eklipse Bounty"
- Route: /bounty
- Code: `src/app/bounty/page.js` → `_components/BountyPage`, `CampaignCarousel`, `CampaignCard`, `Leaderboard`, `TierRewards`, `RulesModal`
- Selector: `getByRole('link', { name: /Eklipse Bounty/ })`; page `getByRole('heading', { name: 'Bounty Campaigns' })`
- Tier: free crawled only; the campaign CTA can open the Go Premium modal (`CampaignCardCta.js`)
- Screenshot: `route-bounty.png`
- Verified: 2026-10-05 (free only)

## Games (public)
- Reach it: direct URL; public, with header
- Route: /games
- Code: `src/app/games/page.js` (self-contained)
- Selector: `getByRole('heading', { name: 'Supported Games' })`; search `getByRole('textbox', { name: 'Search game name' })`; game tile `getByRole('img', { name: 'Minecraft' })`
- Tier: n/a
- Screenshot: `route-games.png`
- Verified: 2026-10-05 (logged in)

## Game detail (public)
- Reach it: /games → click a game image (`games/page.js` pushes `/game-detail/<id>`)
- Route: /game-detail/[id] (numeric id)
- Code: `src/app/game-detail/[id]/page.js` (self-contained)
- Selector: `getByRole('img', { name: '<game>' })` on /games
- Tier: n/a
- Screenshot: none
- Verified: not verified: not crawled

## Clip share (public)
- Reach it: shared clip link, e.g. `/clip-share/quad-kill-at-05942-80692821`. No link builder found in `src/`, so the URL probably comes from the backend.
- Route: /clip-share/[id] (slug `[a-zA-Z0-9-]+`)
- Code: `src/app/clip-share/[id]/page.js` (642 lines, self-contained)
- Selector: n/a (entry is an external URL)
- Tier: n/a
- Screenshot: none
- Verified: not verified: needs a real shared clip

## Paywall and Stripe checkout
- Reach it: "GO PREMIUM" (top bar), "Upgrade to Premium" (sidebar), tier badge, or a gated action (Create Montage, scheduling a post on a future date, Bounty CTA, stream lock banners). Gated actions open `modals/paywall/PaywallModal`, whose button opens the Go Premium modal.
- Route: modal on the current page; Stripe returns to /payment/after-checkout?session_id=...; PayPal popup returns to /upgrade-subscription?status=... (EmptyLayout; posts a message to `window.opener`, then closes)
- Code: `components/layouts/Private.js` (mounts it) → `components/premium-v2/GoPremiumModal/GoPremiumModalV2` → `PlanSelection`, `PlanItem`, `VipPassSection`, `StripeCheckoutElement` (Stripe `CheckoutProvider`, `checkout.confirm()`), `PayPalSubscriptionCheckout`; session from `premium-v2/useStripeSubscription.js` (`useCreateCheckoutSessionMutation`); return page `src/app/payment/after-checkout/page.js` → `hooks/useStripeSubscription.checkSessionStatus`
- Flow: "Elevate Your Content with Eklipse Premium" → pick Annual $15/mo ($179.99/yr, VIP Pass) / Semi-Annual $20/mo / Monthly $24.99 → "Choose Payment Method" → promo code, Card (Stripe Elements: card, expiry, CVC, country) → "Subscribe to Monthly $24.99". Stripe Link and "Pay with PayPal" are also offered.
- Selector: `getByText('GO PREMIUM')`; then `getByText('Choose Payment Method')`, `getByText(/Subscribe to/)`. Card fields sit in Stripe iframes: use `page.frameLocator('iframe[name^="__privateStripeFrame"]')`.
- Tier: free only (entry points are hidden for premium)
- Screenshot: `premium-paywall.png`, `premium-payment-method.png`, `premium-card-filled.png`, `premium-card-check.png`, `premium-after-subscribe.png`, `home-after-purchase.png`, `route-upgrade-subscription.png`
- Note: the Stripe `return_url` is set by the backend (the frontend request does not send one) and sends the browser to the QC web app, not localhost. You land on that host's login page (`premium-after-subscribe.png`); go back to localhost by hand. The subscription still applied (`home-after-purchase.png`).
- Verified: 2026-10-05

## Dev-only: theme demo
- Reach it: direct URL, any logged-in user
- Route: /demo (also /demo/icons)
- Code: `src/app/demo/page.js` → `components/common/ThemeToggle`, `premium/PlansTable`, `premium/ComparePlans`
- Selector: `getByRole('heading', { name: 'Dark/Light Theme Demo' })`
- Tier: both
- Screenshot: `route-demo.png`
- Verified: 2026-10-05

## Needs data to verify

None of these were crawled: the test account had no streams, projects or pro edits. Paths below are inferred from code.

| Route | Code | How a user reaches it |
|---|---|---|
| /video-library/streams/[id] | `src/app/video-library/streams/[id]/page.js` (697 lines; `_components/LockBanner`, `LockBackdrop`, `perks/useStripePerk`) | Library → stream card (`stream-detail/StreamCard.js`); after a perk purchase (`hooks/useStripeSubscription.js`) |
| /waiting-stream/[id] | `src/app/waiting-stream/[id]/page.js` → `waiting-stream/stream-progress-panel/StreamProgressPanel`, `preview/ListClipsPreviewPanel`, `failed-stream/FailedInfoPanel` | Stream card while processing; Import Stream / GetClipModal; YtFailedStreamPopup |
| /edited-clip/ai-edit/[id] | `src/app/edited-clip/ai-edit/[id]/page.js` → `edited-clip/detail/EditedClipDetail` | Edits → AI Edit clip card (`edited-clip/types/AllClipsPanel.js`); after "Generate AI Edit" via /auto-edit/preview/[id] |
| /edited-clip/convert-to-tiktok/[id] | `.../convert-to-tiktok/[id]/page.js` → `EditedClipDetail` | Edits → Converted to TikTok card |
| /edited-clip/re-clip/[id] | `.../re-clip/[id]/page.js` → `EditedClipDetail` | Edits → Extended / Trimmed clip card |
| /montage/[id] | `src/app/montage/[id]/page.js` → `EditedClipDetail` | Edits → Montage card (`EditedClipDetail.js:111`); premium only to create |
| /premium-clips/[id] | `src/app/premium-clips/[id]/page.js` → `edited-clip/pro-edit/ProEditClipPlayer`, `detail/actions/*`, `modals/pro-edits/RequestForRevisionModal` | Edits → Pro Edit card when delivered (`AllClipsPanel.js`) |
| /pro-edits-tracker/[id] | `src/app/pro-edits-tracker/[id]/page.js` → `edited-clip/pro-edit/ProEditStatus*` | Pro Edit card while in progress; from /premium-clips/[id] |
| /auto-edit/preview/[id] | `src/app/auto-edit/preview/[id]/page.js` → `ai-edit/PremiumEditAds` | `hooks/useGenerateAIEdit.js` after Generate AI Edit |
| /instant-edit/pre-edit/[id], /instant-edit/preview | `src/app/instant-edit/...` | Pre-edit weekly modal; QuickAIEditSettingModal; `hooks/useInstantEditMore.js` |
| /video-library/saved-playlist/[id] | `src/app/video-library/saved-playlist/[id]/page.js` | Library → Playlist tab → playlist card (`_components/PlaylistCard.js`) |
| /video-library/preview | `src/app/video-library/preview/page.js` | not traced |

## Known issues seen while mapping

- After an email login on localhost the app stays on /login and does not redirect to /home (`03-after-login.png`).
- Register on localhost: reCAPTCHA shows "Localhost is not in the list of supported domains for this site key" (`01-after-signup.png`).
- Stripe `return_url` points to the QC web app, so a local checkout ends on another host's login page (`premium-after-subscribe.png`).
- Modals (paywall, checkout, onboarding welcome, Gameplay Intelligence) are missing from the accessibility snapshot. Automation that relies on the a11y tree cannot see them.
- Many header controls have no accessible name in the snapshot (bell, account icon, carousel arrows). Icon buttons in `NotificationHeader.js` / `ProfileSettings.js` have no `aria-label`.
- The desktop notification prompt on localhost says "Enable desktop notifications for app.eklipse.gg" (every private-page screenshot). The string is not in `src/` or `public/locales/en`, so it probably comes from an env value or a third-party SDK. Source not confirmed.
- Live Clipping on a premium account without Twitch connected shows the link `https://www.twitch.tv/undefined` (`snap-premium/live-clipping.txt`; built in `LiveClippingSetting.js:952` from `twitchAccount?.platformChannelName`).
- Live Clipping gating does not match: the menu shows only for `premiumType === 'full'`, but the page only checks `isPremium`, so a non-full premium type can open it by URL. Free users get a full page reload to /home (`window.location.href`), not a router redirect.
- /video-library/streams renders a blank content area for an account with no streams; there is no empty state (`route-video-library_streams.png`).
- /upgrade-subscription opened directly spins forever on "Processing your upgrade, please wait..." because it only acts when `window.opener` exists (`route-upgrade-subscription.png`).
- /demo and /demo/icons are reachable by any logged-in user.
- `02-login.png` is blank: the page had not rendered when it was captured. Re-capture it on the next pass.

## Production notes (2026-10-08, app.eklipse.gg, Premium account)

Mapped above on QC; differences and additions seen on production (details: `docs/knowledge/feature-*.md`):
- Library → Import Stream has a second option "Search a streamer" (NEW): browse a Twitch user's public VODs and import one (`src/components/stream/import-search/`).
- Stream detail (`/video-library/streams/[id]`): the share action is an unlabeled icon next to download; Convert to Reels opens a template sheet, then the Editor in a new tab.
- Edit result pages `/edited-clip/ai-edit/[id]` and `/edited-clip/convert-to-tiktok/[id]`: "Post to: Tiktok / Youtube / Facebook", "Edit More (New)", Download; "Clip exported! Ready to share?" modal; Creator Rewards toast.
- Share dialog for every tier opens on "Schedule post" (now + 30 min); a "Ready to post?" confirm follows "Share".
- `/bounty` between campaigns: "No active bounty yet" + "Previous Bounty" list.
- Content Publisher: Publisher Assistant rail (best times, posting streak).

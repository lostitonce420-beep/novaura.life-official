# NovAura Platform Sitemap & Status Audit
**Domain:** novaura.life (Firebase project: novaura-systems)
**Last updated:** 2026-03-31
**Status key:** ✅ WORKING | ⚠️ PARTIAL | 🔲 SHELL | 🃏 MOCK DATA

---

## Entry Point — Landing Page
**URL:** `https://novaura.life/`
**File:** `NovAura-WebOS/src/pages/LandingPage.jsx`
**Status:** ✅ WORKING

### Nav Links
| Label | URL | Destination |
|---|---|---|
| Platform | `/platform/feed` | Unified platform — social feed |
| Market | `/platform/browse` | Assets marketplace |
| NovaLow | `/platform/domains` | Domain selling |
| Login | `/platform/login` | Auth |
| NovAura OS | (button) | Launches Web OS in-page only |

---

## NovAura Web OS
**URL:** `https://novaura.life/` (in-page, no route)
**Source:** `NovAura-WebOS/src/`
**Firebase rewrite:** `**` → `/index.html`

### OS Windows

| Window | Type Key | Status | Backend | Notes |
|---|---|---|---|---|
| Cybeni IDE | `ide` | ✅ WORKING | localStorage + API | Monaco editor, project mgmt, ZIP export, cloud build needs backend |
| Website Builder | `website-builder` | ✅ WORKING | aiService API | AI generates HTML/CSS/JS, live preview |
| AI Browser | `browser` | 🔲 SHELL | none | UI only — no actual browser rendering |
| Terminal | `terminal` | 🔲 SHELL | none | A few mocked commands, no real shell |
| Repo Station | `appstore` | ⚠️ PARTIAL | Zustand store | Browse/import repos works, GitHub source needs backend |
| Aetherium TCG | `aetherium-tcg` | ✅ WORKING | localStorage | Full battle engine, 45+ cards, 5 NPCs, deck builder — all local |
| Inventory | `inventory` | ✅ WORKING | localStorage | Card collection, deck builder, assets, trade requests — all local |
| Art Studio | `art-studio` | ✅ WORKING | Canvas API | Full drawing app, brush/eraser/shapes/fill — local only |
| Music Composer | `music-composer` | ✅ WORKING | Web Audio API | Full DAW-lite, tracks, instruments, mixer — local only |
| Social | `social` | ⚠️ PARTIAL | Firebase + API | Feed/posts/likes work, needs Firebase auth connection |
| Vertex AI | `vertex` | ✅ WORKING | aiService API | Imagen 3.0 image gen, video gen — needs API key configured |
| Vibe Coding | `vibe-coding` | ⚠️ PARTIAL | API | Design/planning UI works, AI code generation needs backend |
| Dojo | `dojo` | ⚠️ PARTIAL | API | UI works, asset/world generation needs backend AI |
| Games Arena | `games-arena` | ✅ WORKING | local | Nova Strike, Chess, Checkers, Tic-Tac-Toe (AI minimax) — all functional |
| Literature IDE | `literature-ide` | ✅ WORKING | localStorage | Full writing suite, file tree, AI panel, story bible — local only |
| Nova AI Chat | `chat` | ⚠️ PARTIAL | API | UI + modes work, responses need AI provider configured |
| Voice Chat | `voice` | ✅ WORKING | Firebase + Gemini Live | Real voice I/O, transcription — needs Gemini Live key |
| Live AI | `live-ai` | ✅ WORKING | Firebase AI | Voice conversation, transcripts — needs Firebase AI configured |
| Admin Panel | `admin-panel` | ⚠️ PARTIAL | Firestore (w/ mock fallback) | User mgmt, moderation — falls back to mock data if Firestore disconnected |
| Billing | `billing` | 🔲 SHELL | none | Plan display only — no payment processing |
| Profile | `profile` | ✅ WORKING | localStorage | Account settings, BYOK AI config, provider routing |
| Git | `git` | 🔲 SHELL | none | UI visualization with fake git state — no real git ops |
| Files | `files` | ✅ WORKING | API + GitHub + Google Drive | Upload/download, folder mgmt, Drive/GitHub integration |
| PixAI | `pixai` | ✅ WORKING | PixAI service | Image gen with Mio API — needs PixAI key |
| Business Operator | `business-operator` | ⚠️ PARTIAL | localStorage | Post-it notes/tasks work, metrics/AI suggestions are UI stubs |
| Secrets Manager | `secrets` | ✅ WORKING | localStorage + XOR | API key mgmt, scoped — uses weak XOR (MVP only, not prod-grade) |
| Personalization | `personalization` | ✅ WORKING | localStorage | 8 themes, accents, particles — all local |
| Tax Filing | `tax-filing` | ⚠️ PARTIAL | localStorage | Real 2025 tax brackets/calculations work, PDF scanning stubbed |
| Challenges | `challenges` | ✅ WORKING | localStorage | 25+ coding challenges, XP, hints, validation — all local |
| Psychometrics | `psychometrics` | ✅ WORKING | localStorage | Personality assessments, scoring, archetypes — all local |
| AI Companion | `ai-companion` | 🔲 SHELL | none | Hardcoded mood responses, no real AI |
| Media Player | `media` | ✅ WORKING | File API | Local audio/video upload and playback, playlist |
| Media Library | `media-library` | ✅ WORKING | API (axios) | Real backend storage API for media upload/browse |
| Comic Creator | `comic-creator` | ✅ WORKING | localStorage | Layouts, panels, dialogue, effects — local only |
| Clothing Creator | `clothing-creator` | ✅ WORKING | localStorage | Pattern/color/fit designer, wardrobe — local only |
| Art Gallery | `art-gallery` | ⚠️ PARTIAL | localStorage | Demo pieces hardcoded, custom art from localStorage |
| Workspace | `workspace` | ✅ WORKING | localStorage | Game project/asset organizer — local only |
| Constructor | `constructor` | 🔲 SHELL | none | Framework reference display, no project generation |
| Script Fusion | `script-fusion` | ✅ WORKING | localStorage | Multi-script merge, conflict detection — local, regex-based |
| Creator Studio | `creator-studio` | ⚠️ PARTIAL | API callback | Code gen needs onAIChat backend |
| Weather | `weather` | ✅ WORKING | Open-Meteo (public) | Real weather, 7-day forecast — no auth needed |
| Crypto | `crypto` | ✅ WORKING | CoinGecko (public) | Real market data, charts, trending — no auth needed |
| Calculator | `calculator` | ✅ WORKING | JS eval | Full calculator with history |
| Background Remover | `bg-remover` | ✅ WORKING | API (axios) | Real image processing — needs backend endpoint |
| Business Card | `business-card` | ✅ WORKING | Canvas/CSS | 14 templates, flip animation — client-side only |
| Gilded Cage | `gilded-cage` | ✅ WORKING | local | Full steampunk RPG — all local |

### OS Summary
- ✅ WORKING: 28 windows
- ⚠️ PARTIAL: 11 windows
- 🔲 SHELL: 6 windows (Browser, Terminal, Git, Billing, Constructor, AI Companion)

---

## Unified Platform
**URL base:** `https://novaura.life/platform/`
**Source:** `NovAura-WebOS/platform/src/`
**Build output:** `NovAura-WebOS/dist/platform/`
**Firebase rewrite:** `/platform/**` → `/platform/index.html`

### Public Routes

| URL | Page | Status | Backend | Notes |
|---|---|---|---|---|
| `/platform/` | HomePage | ✅ WORKING | none | Hero, feature cards, CTAs — static UI |
| `/platform/login` | LoginPage | ✅ WORKING | Auth store | Email/password + Google OAuth — missing 2FA |
| `/platform/signup` | SignupPage | ✅ WORKING | Auth store | Email/password + Google OAuth — missing email verification |
| `/platform/browse` | BrowsePage | ✅ WORKING | API + localStorage fallback | Asset browser, filter, sort, search |
| `/platform/browse/:category` | BrowsePage | ✅ WORKING | API + localStorage fallback | Category filter |
| `/platform/asset/:id` | AssetDetailPage | ✅ WORKING | API + localStorage fallback | Asset detail, cart/wishlist, license — reviews stubbed |
| `/platform/creator/:username` | CreatorProfilePage | ⚠️ PARTIAL | API | Profile display |
| `/platform/profile/:username` | UserProfilePage | ✅ WORKING | API | User profile |
| `/platform/search` | SearchPage | ✅ WORKING | API | Search assets |
| `/platform/feed` | FeedPage | ⚠️ PARTIAL | Social store (localStorage) | Posts/likes work, no real-time, images base64 only |
| `/platform/shop` | ShopPage | ⚠️ PARTIAL | Shopify API | Product fetch, no fallback if Shopify fails |
| `/platform/hub` | EcosystemHub | 🔲 SHELL | none | Static content |
| `/platform/chat` | NovaChat | ⚠️ PARTIAL | API | Nova AI chat UI |
| `/platform/creators` | CreatorLounge | 🔲 SHELL | none | Static |
| `/platform/music` | MusicMarketplacePage | 🔲 SHELL | none | Static |
| `/platform/gallery` | GalleryPage | ⚠️ PARTIAL | localStorage | Demo pieces hardcoded |
| `/platform/games` | GamesPage | 🔲 SHELL | none | Static |
| `/platform/software` | SoftwarePage | 🔲 SHELL | none | Static |
| `/platform/free` | FreeItemsPage | 🔲 SHELL | none | Static |
| `/platform/studio` | StudioShowcasePage | 🔲 SHELL | none | Static |
| `/platform/pricing` | PricingPage | ✅ WORKING | none | Plan tiers display — no payment |
| `/platform/about` | AboutPage | 🔲 SHELL | none | Static |
| `/platform/investors` | InvestorPortalPage | 🔲 SHELL | none | Static |
| `/platform/email` | EmailServicesPage | 🔲 SHELL | none | Static |
| `/platform/changelog` | ChangelogPage | 🔲 SHELL | none | Static |
| `/platform/status` | StatusPage | 🔲 SHELL | none | Static |
| `/platform/help` | HelpCenterPage | 🔲 SHELL | none | Static |
| `/platform/registry` | NovaRegistryPage | 🔲 SHELL | none | Static |
| `/platform/api-keys` | APIKeyLibraryPage | 🔲 SHELL | none | Static |
| `/platform/reader` | DevAuraReaderPage | 🔲 SHELL | none | Static |

### NovaLow (Domains & Hosting)

| URL | Page | Status | Notes |
|---|---|---|---|
| `/platform/domains` | DomainMarketplace | ⚠️ PARTIAL | UI present, no real domain purchasing |
| `/platform/hosting` | HostingPlansPage | ℹ️ INFO | External links to Cloudflare/Vercel/DigitalOcean — no provisioning |
| `/platform/builder` | SiteBuilderPage | 🔲 SHELL | 3 templates link out, 3 are "coming soon" |
| `/platform/devtools` | DevToolsPage | 🔲 SHELL | Static |
| `/platform/security` | SecurityPage | 🔲 SHELL | Static |
| `/platform/tutorials` | TutorialsPage | 🔲 SHELL | Static |
| `/platform/promote` | PromotePage | 🔲 SHELL | Static |

### Buyer Pages (Protected)

| URL | Page | Status | Notes |
|---|---|---|---|
| `/platform/cart` | CartPage | ✅ WORKING | localStorage cart, platform fee calc |
| `/platform/checkout` | CheckoutPage | ⚠️ PARTIAL | Flow works, Stripe redirect present — no webhook handling |
| `/platform/orders` | OrdersPage | ⚠️ PARTIAL | Real API call — no error fallback |
| `/platform/downloads` | DownloadsPage | 🃏 MOCK DATA | 2 hardcoded items — not real |
| `/platform/wishlist` | WishlistPage | 🔲 SHELL | Placeholder |
| `/platform/settings` | SettingsPage | ⚠️ PARTIAL | Profile/API keys/hardware work, 839 lines needs refactor |
| `/platform/messages` | MessagesPage | ⚠️ PARTIAL | localStorage only — no backend sync |
| `/platform/notifications` | NotificationsPage | 🔲 SHELL | Placeholder |
| `/platform/agreements` | AgreementsPage | 🔲 SHELL | Placeholder |

### Creator Pages (Protected)

| URL | Page | Status | Notes |
|---|---|---|---|
| `/platform/creator-dashboard` | CreatorDashboard | ⚠️ PARTIAL | Stats/assets show, no real-time data |
| `/platform/creator-upload` | CreatorUpload | ⚠️ PARTIAL | 5-step wizard works, file persistence not complete |
| `/platform/creator-earnings` | CreatorEarnings | 🃏 MOCK DATA | All hardcoded — no real royalty data |
| `/platform/creator-assets` | CreatorAssets | 🔲 SHELL | Stub |
| `/platform/creator-settings` | CreatorSettings | 🔲 SHELL | Stub |
| `/platform/nova-ide` | NovaIDE | 🔲 SHELL | Not implemented |

### Admin Pages (Protected)

| URL | Page | Status | Notes |
|---|---|---|---|
| `/platform/admin` | AdminDashboard | ✅ WORKING | Approve/reject assets, real user stats |
| `/platform/admin/users` | AdminUsers | ✅ WORKING | User list, role mgmt, deletion |
| `/platform/admin/assets` | AdminAssets | ⚠️ PARTIAL | Asset approval UI |
| `/platform/admin/orders` | AdminOrders | 🔲 SHELL | Unknown |
| `/platform/admin/command` | AdminCommandCenter | 🔲 SHELL | Unknown |

### Platform Summary
- ✅ WORKING: ~12 pages
- ⚠️ PARTIAL: ~12 pages
- 🔲 SHELL: ~20 pages
- 🃏 MOCK DATA: 2 pages (DownloadsPage, CreatorEarnings)

---

## Critical Gaps (Blocks Revenue)

| Priority | Item | What's Needed |
|---|---|---|
| 🔴 HIGH | Stripe webhooks | CheckoutPage redirects to Stripe but no webhook to confirm payment |
| 🔴 HIGH | File downloads | OrdersPage has no working download/license key delivery |
| 🔴 HIGH | Creator earnings | All mock data — no real royalty ledger |
| 🔴 HIGH | File upload persistence | CreatorUpload doesn't actually persist files |
| 🟡 MED | Email verification | SignupPage missing email confirm flow |
| 🟡 MED | FeedPage real-time | Social feed uses localStorage, no backend sync |
| 🟡 MED | MessagesPage sync | Chats are localStorage only |
| 🟡 MED | Billing window | Shows plans but no subscription management |
| 🟡 MED | Git window | UI only — no real git operations |
| 🟢 LOW | Browser window | No iframe/webview rendering |
| 🟢 LOW | Terminal window | Mock commands only |
| 🟢 LOW | AI Companion | Hardcoded responses |
| 🟢 LOW | Constructor window | Framework reference only |
| 🟢 LOW | 20+ static platform pages | Info pages with no content |

---

## API
**URL base:** `https://novaura.life/api/`
**Source:** `NovAura-WebOS/functions/src/`
**Firebase rewrite:** `/api/**` → Firebase Function `api`

---

## Firebase Config
| Key | Value |
|---|---|
| Project | `novaura-systems` |
| Hosting site | `novaura-systems` → novaura.life |
| Config file | `NovAura-WebOS/firebase.json` |
| RC file | `NovAura-WebOS/.firebaserc` |
| Platform build | `NovAura-WebOS/dist/platform/` |
| OS build | `NovAura-WebOS/dist/index.html` |

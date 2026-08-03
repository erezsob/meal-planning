# PWA installability criteria — Sick Meals

**Date:** 2026-08-01  
**Scope:** Can Sick Meals clear an installability floor on **Android Chrome** and **iOS Safari** given current assets (web manifest + icons; no service worker; Cloudflare HTTPS)?  
**Floor under test:**

| Criterion | Bar |
| --- | --- |
| Installable | Add to Home Screen / browser install |
| Opens standalone | Chrome-less (no browser UI chrome) |
| Offline | **Not required** (online-only OK) |
| Soft platform gaps | May be documented rather than blocking |

**Claims below are tied to primary sources** (MDN, web.dev, Chrome for Developers, WebKit / Apple Developer). Secondary blogs are not used as authority.

---

## Verdict (decision bar)

| Platform | Clears floor? | Notes |
| --- | --- | --- |
| **Android Chrome** | **Yes** | Manifest + HTTPS + icons already match Chrome’s documented install criteria. **No service worker required** for installability in current web.dev / MDN / Chrome DevTools guidance. Soft gaps: engagement heuristics for *auto* install UI; richer install UI optional; historical nuance on auto-prompt vs menu install (see §3). |
| **iOS Safari** | **Yes, with documented gaps** | Share → **Add to Home Screen** works without a SW. `display: "standalone"` yields a Home Screen web app (chrome-less). Soft gaps: no browser install prompt / no `beforeinstallprompt`; user-driven install UX; pre-iOS 26 behavior differs from iOS 26+ (see §4). |

**Bottom line for a later grilling ticket:** Sick Meals can clear this floor on both platforms **without adding a service worker**, provided production stays on HTTPS and the existing manifest/icons remain linked and loadable. Document iOS install UX and optional Chrome polish as soft gaps, not blockers.

---

## 1. Current app inventory (verified in repo)

| Asset | Present? | Location / value |
| --- | --- | --- |
| Web app manifest | Yes | `public/manifest.json` — `name`, `short_name`, `description`, `start_url: "/"`, `display: "standalone"`, `theme_color` / `background_color`, icons 192/512 (+ maskable) + favicon.ico |
| Manifest link | Yes | `src/routes/__root.tsx` → `rel="manifest"` → `/manifest.json` |
| Theme color meta | Yes | `theme-color` `#030712` (matches manifest after [#56](https://github.com/erezsob/meal-planning/issues/56)) |
| Apple touch icon | Yes | `rel="apple-touch-icon"` → `/apple-touch-icon.png`; file in `public/` |
| PNG icons 192 / 512 (+ maskable) | Yes | `public/icon-192.png`, `icon-512.png`, `*-maskable.png` |
| Service worker | **No** | No registration, no Workbox, no `vite-plugin-pwa` |
| Deploy | Assumed | Cloudflare (Vite + wrangler) → production **HTTPS** |

---

## 2. Android Chrome — installability requirements

### 2.1 Documented criteria (current)

[web.dev — What does it take to be installable?](https://web.dev/articles/install-criteria) (article `dateModified` 2024-09-19 in page metadata) states Chrome fires `beforeinstallprompt` and shows in-browser install promotion when:

| Requirement | Detail |
| --- | --- |
| Not already installed | App not already installed |
| Engagement heuristics | User clicked/tapped the page ≥1 time (any prior load OK); user spent ≥30 seconds viewing the page (any time) |
| Secure origin | Served over **HTTPS** |
| Manifest | Linked web app manifest including: |
| → Name | `short_name` **or** `name` |
| → Icons | Must include a **192px** and a **512px** icon |
| → Start URL | `start_url` |
| → Display | One of `fullscreen`, `standalone`, `minimal-ui`, `window-controls-overlay` |
| → Related apps | `prefer_related_applications` absent or `false` |

**Service worker is not listed** on that criteria page.

MDN aligns for Chromium required manifest members: `name` or `short_name`, `icons` (192 + 512), `start_url`, `display` and/or `display_override`, `prefer_related_applications` false/absent; HTTPS/localhost/loopback required. Explicit note: service workers are **not** a requirement for installability ([MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)).

`display: "standalone"` means the OS opens the app without browser URL chrome (status bar may remain) ([MDN — `display`](https://developer.mozilla.org/en-US/docs/Web/Manifest/display)).

### 2.2 Install surfaces on Android

From [web.dev — Installation](https://web.dev/learn/pwa/installation):

- Menu / install UI wording varies (`Install` / `Add to Home Screen`).
- Meeting criteria enables browser promotion; Chrome may mint a **WebAPK** (best experience) or fall back to a **shortcut** if minting fails or criteria are not met.
- Optional promotional fields (`description`, `screenshots`) unlock a richer Android install dialog ([web.dev install criteria tip](https://web.dev/articles/install-criteria); [web.dev web app manifest](https://web.dev/learn/pwa/web-app-manifest)).

Custom in-app install UX uses `beforeinstallprompt` ([web.dev — Installation prompt](https://web.dev/learn/pwa/installation-prompt); [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)).

### 2.3 Offline / default offline page (out of floor, soft UX)

Chrome Android 109+ / desktop 110+ shows a **browser-generated default offline page** for installed web apps that do not implement a custom offline experience ([Chrome — Basic offline page](https://developer.chrome.com/blog/default-offline)). That supports an online-only product without a SW for the floor; offline polish remains optional.

---

## 3. Is a service worker still required for Chrome installability?

| Source | Claim |
| --- | --- |
| [web.dev install criteria](https://web.dev/articles/install-criteria) (current criteria list) | **No SW** in the list for `beforeinstallprompt` / in-browser install promotion |
| [MDN Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) | SW **not** required for installability; used for offline |
| [Chrome DevTools 112](https://developer.chrome.com/blog/new-in-devtools-112) | No-op fetch handlers “**are no longer required** for your website to qualify as a Progressive Web App” |
| [Chrome — Revisiting installability criteria](https://developer.chrome.com/blog/update-install-criteria) | Removed SW `fetch()` requirement for **installation from the menu** (Chrome **108** mobile / **112** desktop). At *publication time*, the blog still said the **algorithm that displays the install prompt** still required a `fetch()` handler, while noting further signal work |

**Practical reading for this floor:**

- **Menu / browser install without a SW:** Supported per Chrome’s criteria update + current web.dev/MDN (no SW in current criteria).
- **Soft / historical gap to document:** The older Chrome blog’s “auto-prompt still wants `fetch()`” line may still affect *automatic* mini-infobar timing on some builds; it does **not** block the floor of “user can install via browser UI” once manifest criteria + HTTPS are met. Prefer verifying auto-prompt on a target Chrome build if the grilling ticket elevates auto-prompt to a hard requirement.
- **Do not add empty fetch handlers** solely for installability — Chrome discourages them ([Chrome 112](https://developer.chrome.com/blog/new-in-chrome-112), [DevTools 112](https://developer.chrome.com/blog/new-in-devtools-112)).

---

## 4. iOS Safari — Add to Home Screen / web app requirements

### 4.1 Install path (no Chromium-style prompt)

- There is **no browser install prompt** on iOS/iPadOS; users add via Share → **Add to Home Screen** ([web.dev — Installation](https://web.dev/learn/pwa/installation)).
- `beforeinstallprompt` is **not supported on iOS** ([MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)).
- iOS **16.4+**: Add to Home Screen also available from third-party browsers’ Share menus ([WebKit — Web Push for Web Apps](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/); [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)).

### 4.2 Standalone (chrome-less) behavior

**Pre–iOS 26 (manifest / legacy meta):**

- A manifest with `display` set to **`standalone` or `fullscreen`** makes the site a **Home Screen web app** (opens without browser chrome; separate from Safari in App Switcher) ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/); [WWDC23 — What’s new in web apps](https://developer.apple.com/videos/play/wwdc2023/10120/)).
- Without that (and without the legacy capable meta), the site is a Home Screen **bookmark** that opens in the browser ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
- Legacy path: `apple-mobile-web-app-capable` = `yes` hides Safari chrome when launched from Home Screen ([Apple archive — Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)). Still useful as a belt-and-suspenders soft gap; **not required** when `display: "standalone"` is present for the WebKit path above.
- web.dev notes iOS supports **`standalone`** for installed PWAs (`minimal-ui` falls back to browser shortcut; `fullscreen` falls back to standalone) ([web.dev — Installation](https://web.dev/learn/pwa/installation)).

**iOS / iPadOS 26+:**

- **By default every site** added to Home Screen opens as a web app; users can turn off “Open as Web App”. WebKit: “**zero requirements** for ‘installability’ in Safari” for that OS generation ([WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/); [WWDC25 WebKit beta notes](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/)).
- Manifest still improves the experience (icons, etc.); Home Screen web apps on iOS **never required Service Workers** ([WebKit Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)).

### 4.3 Icons on iOS

- Provide Home Screen icon via manifest icons (supported since iOS/iPadOS 15.4) **and/or** `apple-touch-icon` in HTML; if both exist, **`apple-touch-icon` takes precedence** ([WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).
- Classic guidance: root/`link` PNG `apple-touch-icon` ([Apple archive](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)).
- web.dev recommends `apple-touch-icon`; without a specific icon, older behavior used a screenshot (WebKit 16.4+ may use a monogram fallback if icons missing) ([web.dev — Installation](https://web.dev/learn/pwa/installation); [WebKit](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)).

### 4.4 Scope / start URL

WWDC23: web apps have a scope (default = host of the page used to create the web app); links outside scope open in the default browser; manifest can narrow `scope` ([WWDC23](https://developer.apple.com/videos/play/wwdc2023/10120/)). Explicit `scope` is optional soft polish, not a floor blocker when the app lives on one origin at `/`.

---

## 5. Gap analysis vs Sick Meals today

| Requirement | Needed for floor? | Sick Meals today | Gap? |
| --- | --- | --- | --- |
| HTTPS production | Hard (Chrome); assumed | Cloudflare HTTPS | None (ops assumption) |
| Manifest linked on pages | Hard (Chrome promotion; iOS standalone pre-26) | `__root.tsx` links `/manifest.json` | None |
| `name` / `short_name` | Hard (Chrome) | Both present | None |
| `start_url` | Hard (Chrome) | `"/"` | None |
| `display: standalone` (or allowed modes) | Hard (Chrome + iOS chrome-less pre-26) | `standalone` | None |
| Icons 192 + 512 | Hard (Chrome) | Present (+ maskable) | None |
| `prefer_related_applications` false/absent | Hard (Chrome) | Absent | None |
| Service worker / fetch handler | **Not** for this floor | Absent | **None for floor**; soft: no custom offline (browser default offline page on Chrome) |
| Engagement heuristics | Soft for *auto* Chrome prompt | N/A in code | Document: 30s + interaction for auto UI |
| `description` + `screenshots` | Soft (richer Android dialog) | `description` yes; screenshots no | Soft polish |
| `apple-touch-icon` | Soft/recommended (iOS icon quality) | Present | None |
| `apple-mobile-web-app-capable` | Soft legacy (pre-manifest path) | Absent | Soft; covered by manifest `display` for modern WebKit |
| Explicit `scope` | Soft | Absent (host default OK) | Soft |
| Matching `theme-color` meta vs manifest | Soft consistency | Aligned `#030712` in repo after [#56](https://github.com/erezsob/meal-planning/issues/56); confirm on production after deploy | Soft inconsistency **resolved in repo** |
| Browser install prompt / BIP | Soft (iOS never) | N/A on iOS | **Documented platform gap** |
| Offline / Workbox | Out of floor | None | None for floor |

---

## 6. Soft platform gaps (document, don’t block)

1. **iOS install UX is manual** — Share → Add to Home Screen; no `beforeinstallprompt` ([web.dev](https://web.dev/learn/pwa/installation), [MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)).
2. **Chrome auto-install promotion** may wait on engagement heuristics (click + 30s) ([web.dev install criteria](https://web.dev/articles/install-criteria)); menu install remains available when criteria are met.
3. **Historical Chrome auto-prompt vs SW** — older Chrome blog vs current web.dev/MDN; treat auto-prompt SW coupling as soft/verify-on-device if elevated later ([Chrome blog](https://developer.chrome.com/blog/update-install-criteria)).
4. **Richer Android install UI** needs screenshots (+ description already present) ([web.dev](https://web.dev/articles/install-criteria)).
5. **Online-only** → Chrome default offline page if launched offline; acceptable under this floor ([Chrome default offline](https://developer.chrome.com/blog/default-offline)).
6. **iOS 26+** reduces installability requirements further (user-controlled “Open as Web App”); keep `display: standalone` + icons for older iOS and better metadata ([WebKit Safari 26](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)).
7. **theme-color meta vs manifest theme_color** — was a soft inconsistency (`#030712` vs `#000000`); aligned in repo via [#56](https://github.com/erezsob/meal-planning/issues/56). Confirm on production after deploy (see `docs/research/pwa-device-verification.md`).

---

## 7. Acceptance mapping (for grilling ticket)

| Floor item | Android Chrome | iOS Safari |
| --- | --- | --- |
| Installable | Yes — browser Install / Add to Home Screen when criteria met | Yes — Share → Add to Home Screen (document manual UX) |
| Standalone / chrome-less | Yes — `display: standalone` | Yes — Home Screen web app via `display: standalone` (pre-26); default web app on iOS 26+ |
| Online-only OK | Yes — no SW required; default offline page soft | Yes — SW never required for Home Screen web apps |
| Soft gaps | Engagement heuristics; optional screenshots; BIP optional | No BIP; manual install; optional legacy meta / scope |

---

## Primary sources cited

1. [web.dev — What does it take to be installable?](https://web.dev/articles/install-criteria)  
2. [web.dev — Installation](https://web.dev/learn/pwa/installation)  
3. [web.dev — Web app manifest](https://web.dev/learn/pwa/web-app-manifest)  
4. [web.dev — Installation prompt](https://web.dev/learn/pwa/installation-prompt)  
5. [MDN — Making PWAs installable](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable)  
6. [MDN — Web app manifest `display`](https://developer.mozilla.org/en-US/docs/Web/Manifest/display)  
7. [Chrome for Developers — Revisiting Chrome's installability criteria](https://developer.chrome.com/blog/update-install-criteria)  
8. [Chrome for Developers — What's New in DevTools (Chrome 112)](https://developer.chrome.com/blog/new-in-devtools-112)  
9. [Chrome for Developers — New in Chrome 112](https://developer.chrome.com/blog/new-in-chrome-112)  
10. [Chrome for Developers — Basic offline page for web apps](https://developer.chrome.com/blog/default-offline)  
11. [WebKit — Web Push for Web Apps on iOS and iPadOS](https://webkit.org/blog/13878/web-push-for-web-apps-on-ios-and-ipados/)  
12. [WebKit — WebKit Features in Safari 26.0](https://webkit.org/blog/17333/webkit-features-in-safari-26-0/)  
13. [WebKit — News from WWDC25: WebKit in Safari 26 beta](https://webkit.org/blog/16993/news-from-wwdc25-web-technology-coming-this-fall-in-safari-26-beta/)  
14. [Apple Developer — WWDC23: What’s new in web apps](https://developer.apple.com/videos/play/wwdc2023/10120/)  
15. [Apple Developer Archive — Configuring Web Applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html)  

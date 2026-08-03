# PWA on-device verification — Sick Meals

**Ticket:** [#57 Verify PWA install on real phones](https://github.com/erezsob/meal-planning/issues/57)  
**Date:** 2026-08-03  
**Environment:** `https://plan.sick-meals.workers.dev` (see `.docs/DEPLOYMENT.md`)  
**Depends on:** [#56](https://github.com/erezsob/meal-planning/issues/56) install-surface guard (merged to `main`)

This ticket’s acceptance bar is **manual** (parent [#55](https://github.com/erezsob/meal-planning/issues/55)): real Android Chrome and iOS Safari against HTTPS production. Soft platform gaps are documented here and must not be treated as failures.

---

## Agent-completed checks (2026-08-03)

| Check | Result | Evidence |
| --- | --- | --- |
| Production URL uses HTTPS | **Pass** | TLS to `plan.sick-meals.workers.dev:443` — TLSv1.2, cert CN `sick-meals.workers.dev`, issuer Google Trust Services WE1, notAfter Oct 28 2026. HTTP/2 responses. |
| Cloudflare serves the host | **Pass** | Response `server: cloudflare`; Access login host `erso.cloudflareaccess.com`. |
| Install-surface contract (repo / `main`) | **Pass** | `pnpm exec vitest run lib/pwaInstallSurface.test.ts` — 15/15 green after #56. |
| Unauthenticated fetch of HTML / `manifest.json` | **Blocked (expected)** | Unauthenticated requests **302** to Cloudflare Access login. Agent cannot inspect live head/manifest without an Access session. |
| Android Chrome Install → standalone | **Not run** | Needs Access-authenticated session on a physical Android device. |
| iOS Safari A2HS → standalone | **Not run** | Needs Access-authenticated session on a physical iPhone/iPad. |
| Standalone smoke (week plan / shopping / library / history) | **Not run** | Same device gate. |

### Ops note before device runs

1. Deploy `main` (includes #56 theme parity) to production: `pnpm deploy:prod`.
2. Sign in through Cloudflare Access on the phone browser **before** Install / Add to Home Screen.
3. After install, open from the home-screen icon (not a leftover browser tab) to judge standalone.

---

## Soft gaps (documented — not blockers)

Copied/confirmed from `docs/research/pwa-install-criteria.md` and [#55](https://github.com/erezsob/meal-planning/issues/55) / [#46](https://github.com/erezsob/meal-planning/issues/46) brief:

1. **iOS has no install prompt** — Share → **Add to Home Screen** only; no `beforeinstallprompt`.
2. **Chrome auto-install UI** may wait on engagement heuristics (interaction + ~30s); menu **Install** / **Add to Home Screen** remains the reliable path once criteria are met.
3. **Optional polish not required:** screenshots for richer Android dialog, explicit `scope`, legacy `apple-mobile-web-app-capable` meta.
4. **Online-only:** no service worker for this floor; Chrome may show its default offline page if launched offline.
5. **Cloudflare Access** sits in front of production — household members must authenticate before the installable document/manifest are reachable. This is an access gate, not a PWA criteria failure.

Theme-color parity is **no longer** a soft inconsistency in repo (`#030712` document + manifest per #56); confirm the same on production **after** deploy.

---

## Human device checklist (remaining ACs)

Use production: `https://plan.sick-meals.workers.dev`

### Android (Chrome)

1. [ ] Open production → complete Cloudflare Access.
2. [ ] Confirm address bar shows **https**.
3. [ ] Install via Chrome **Install** / **Add to Home Screen** (menu or banner).
4. [ ] Launch from the home-screen / app icon — opens **without** normal browser chrome (standalone).
5. [ ] Smoke: week plan, shopping, library, history still usable.

### iPhone (Safari)

1. [ ] Open production in Safari → complete Cloudflare Access.
2. [ ] Share → **Add to Home Screen** → Add.
3. [ ] Launch from the home-screen icon — opens **standalone** (not a Safari tab chrome).
4. [ ] Smoke: week plan, shopping, library, history still usable.

### Closing this ticket

When both device sections pass, comment the results on #57 (devices + OS versions if handy) and close. Soft gaps above stay documented, not failures.

---

## Install steps (end-user)

- **iPhone (Safari):** Open the site → Share → **Add to Home Screen** → Add → open from the home screen icon.
- **Android (Chrome):** Open the site → **Install** / **Add to Home Screen** (menu or banner) → open from the home screen / app icon.

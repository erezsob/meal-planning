# PWA-first for phone install

Household users asked for something they can “download” on iPhone and Android. We deliver that as an **installable Progressive Web App** (browser Install / Add to Home Screen → standalone), not a native App Store / Play Store app or a Capacitor-style wrapper. The web stack already has a linked web app manifest, icons, and `apple-touch-icon`; current platform criteria do not require a service worker for installability, and we stay **online-only** for this decision. Soft platform gaps (especially iOS’s manual Add to Home Screen) are documented rather than treated as a reason to go native. Revisit native/wrapper only if a future effort refuses those documented gaps.

## Considered options

- **Native (React Native / fully separate apps)** — rejected for now; high cost for a household web app that already runs in mobile browsers.
- **Wrapper (Capacitor / TWA) for store listing** — rejected for now; store distribution and shell maintenance are out of scope when browser install clears the floor.
- **PWA-first (manifest + HTTPS + standalone; no SW for install)** — accepted.

# ScoutDeck AI Chrome Extension — Development Guide

## Quick start
- Load this folder in chrome://extensions (Developer mode → Load unpacked)
- Click the toolbar icon to toggle the panel on HUDL pages
- Use Ctrl/Cmd+Shift+S to toggle quickly

## Scripts
- `npm run format` — Prettier formatting
- `npm run lint` — ESLint
- `npm run validate` — validates `manifest.json`
- `npm run zip` — Produce a versioned zip (reads version from `manifest.json`)

## Auth & Data Sync (Milestone 1)
- The service worker (`background.js`) handles login via `chrome.identity.launchWebAuthFlow`
  - Issues tokens from `https://scoutdeck.ai/api/extension/issue-token?redirect=<ext_redirect>`
  - Expects `#access_token`, `#refresh_token`, `#expires_in` in the redirect hash
- Tokens are stored in `chrome.storage.local` with expiry and auto-refresh via `POST /api/extension/refresh`
- `fetchWithAuth` attaches `Authorization: Bearer <token>` and retries once on 401
- Panel `Submit` sends `UPSERT_PLAY` to `POST /api/extension/plays`

### Required server endpoints
- `GET /api/extension/issue-token?redirect=<url>` → starts OAuth and redirects with tokens in hash
- `POST /api/extension/refresh` → `{ access_token, refresh_token?, expires_in }`
- `GET /api/extension/me` → returns user profile
- `POST /api/extension/plays` → upsert payload `{ gameId, playNumber, filmSide, fields }`

### Google OAuth
- Authorized redirect URIs must include:
  - `https://scoutdeck.ai/api/auth/callback/google`
  - `https://<EXTENSION_ID>.chromiumapp.org/extension-auth`

## Files
- `manifest.json` — MV3 config
- `background.js` — service worker, auth, and API calls
- `content.js` — injects the right-side panel
- `panel/` — UI HTML/CSS/JS for the funnel
- `storage.js` — abstraction on chrome.storage
- `utils/export.js` — export helpers (CSV etc.)

## Release checklist
- Update `manifest.json` version
- `npm run validate`
- `npm run zip`
- Upload the zip to Chrome Web Store dashboard 
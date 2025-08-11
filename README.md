# ScoutDeck AI (Fresh Start)

Minimal MV3 Chrome extension scaffold.

- Popup with Toggle Sidebar button
- Content script injects right-side, full-height, resizable sidebar (Cmd/Ctrl+Shift+F)
- Clean code, no icons yet

## Develop
1. Open chrome://extensions
2. Enable Developer mode
3. Load unpacked → this folder
4. Use the popup or Cmd/Ctrl+Shift+F to toggle the sidebar

## Structure
- manifest.json: MV3 config
- popup.html/.css/.js: popup UI
- content.js/.css: injected sidebar frame + resizer
- sidebar.html/.css/.js: sidebar app shell
- background.js: service worker 
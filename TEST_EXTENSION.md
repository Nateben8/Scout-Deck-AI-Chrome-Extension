# ScoutDeck AI Extension Testing Guide

## 🚀 How to Test the Extension

### 1. Load the Extension in Chrome

1. Open Chrome and go to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top right)
3. Click "Load unpacked"
4. Select the `Actual Scout Deck AI Chrome Extension` folder
5. The extension should now appear in your extensions list

### 2. Test Authentication

#### Option A: Using the Popup
1. Click the ScoutDeck AI extension icon in your Chrome toolbar
2. You should see a popup with "Sign in with Google" button
3. Click "Sign in with Google"
4. It should redirect to your website for Google OAuth
5. After signing in, you should be redirected back and see your email in the popup

#### Option B: Using the Panel (on Hudl)
1. Go to any Hudl page (e.g., `hudl.com`)
2. Click the ScoutDeck AI extension icon
3. The panel should inject into the page
4. If not signed in, you'll see an auth gate
5. Click "Sign in" to authenticate

### 3. Test the Complete Flow

1. **Sign in via popup**: Click extension icon → Sign in with Google
2. **Verify authentication**: Popup should show your email and "Open Dashboard" button
3. **Test dashboard**: Click "Open Dashboard" - should open your website dashboard
4. **Test on Hudl**: Go to a Hudl page, the panel should work without asking for auth again
5. **Test sign out**: Click "Sign Out" in popup, should clear authentication

### 4. Expected Behavior

✅ **Working correctly:**
- Extension popup shows sign-in UI when not authenticated
- Google OAuth redirects to your website and back to extension
- After sign-in, popup shows user email and dashboard button
- Panel on Hudl pages works without additional authentication
- "Open Dashboard" button opens your website
- Sign out clears authentication everywhere

❌ **Issues to check:**
- If popup doesn't show: Check if `popup.html` is set in manifest
- If sign-in fails: Check browser console for errors
- If redirect fails: Verify Google OAuth redirect URIs include extension URL
- If panel doesn't work: Check Hudl page console for errors

### 5. Debugging

**Check Extension Console:**
1. Go to `chrome://extensions/`
2. Click "Details" on ScoutDeck AI extension
3. Click "Inspect views: background page"
4. Check console for errors

**Check Popup Console:**
1. Right-click extension icon → "Inspect popup"
2. Check console for errors

**Check Panel Console:**
1. On Hudl page, open DevTools (F12)
2. Check console for ScoutDeck-related errors

### 6. Common Issues & Solutions

**Issue: "Sign in with Google" doesn't work**
- Solution: Make sure your website is running on `http://localhost:3000`
- Check that Google OAuth credentials are properly set in `.env.local`

**Issue: Extension popup doesn't show**
- Solution: Make sure `"default_popup": "popup.html"` is in manifest.json

**Issue: Authentication doesn't persist**
- Solution: Check that tokens are being saved to `chrome.storage.local`

**Issue: Panel doesn't appear on Hudl**
- Solution: Make sure you're on a `*.hudl.com` page and the content script is injecting

### 7. Test Checklist

- [ ] Extension loads without errors
- [ ] Popup appears when clicking extension icon
- [ ] "Sign in with Google" button works
- [ ] Google OAuth flow completes successfully
- [ ] User email appears in popup after sign-in
- [ ] "Open Dashboard" button works
- [ ] Panel appears on Hudl pages
- [ ] Panel authentication works seamlessly
- [ ] "Sign Out" button clears authentication
- [ ] Authentication persists across browser sessions

## 🔧 Development Notes

- Extension uses Chrome Identity API for OAuth flow
- Tokens are stored in `chrome.storage.local`
- Background script handles all API communication
- Panel and popup share authentication state
- Website API endpoints handle token issuance and validation

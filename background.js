chrome.runtime.onInstalled.addListener(() => {
  console.log('ScoutDeck AI installed fresh.');
});

chrome.runtime.onStartup.addListener(() => {
  console.log('ScoutDeck AI started.');
});

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab?.id) return;
  try {
    await chrome.tabs.sendMessage(tab.id, { type: 'sdai:toggle' });
  } catch (e) {
    console.debug('toggle send failed (tab may not have content script yet):', e?.message);
  }
});

// Authentication with ScoutDeck
const BASE_URL = "https://scoutdeck.ai";

function getRedirectUri() {
  try {
    if (chrome.identity?.getRedirectURL) {
      return chrome.identity.getRedirectURL('extension-auth');
    }
  } catch {}
  return `https://${chrome.runtime.id}.chromiumapp.org/extension-auth`;
}

function parseAuthFromUrl(responseUrl) {
  const url = new URL(responseUrl);
  const hash = url.hash.replace(/^#/, "");
  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token") || null;
  const refreshToken = params.get("refresh_token") || null;
  const expiresInSec = Number(params.get("expires_in") || "3600");
  const expiresAtMs = Date.now() + Math.max(60, expiresInSec) * 1000; // floor at 60s
  return { accessToken, refreshToken, expiresAtMs };
}

async function saveTokens({ accessToken, refreshToken, expiresAtMs }) {
  const store = {};
  if (accessToken) store.scoutdeck_token = accessToken;
  if (refreshToken) store.scoutdeck_refresh = refreshToken;
  if (expiresAtMs) store.scoutdeck_exp = expiresAtMs;
  await chrome.storage.local.set(store);
}

async function getTokens() {
  const { scoutdeck_token, scoutdeck_refresh, scoutdeck_exp } = await chrome.storage.local.get([
    'scoutdeck_token', 'scoutdeck_refresh', 'scoutdeck_exp'
  ]);
  return { accessToken: scoutdeck_token || null, refreshToken: scoutdeck_refresh || null, expiresAtMs: scoutdeck_exp || 0 };
}

async function ensureAccessToken() {
  const { accessToken, refreshToken, expiresAtMs } = await getTokens();
  const stillValid = accessToken && Date.now() < (expiresAtMs - 60_000);
  if (stillValid) return accessToken;
  if (!refreshToken) throw new Error('Missing refresh token');
  const res = await fetch(`${BASE_URL}/api/extension/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken })
  });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
  const data = await res.json();
  const newAccess = data.access_token;
  const newRefresh = data.refresh_token || refreshToken;
  const expiresInSec = Number(data.expires_in || 3600);
  const expMs = Date.now() + Math.max(60, expiresInSec) * 1000;
  await saveTokens({ accessToken: newAccess, refreshToken: newRefresh, expiresAtMs: expMs });
  return newAccess;
}

async function fetchWithAuth(path, init = {}) {
  const token = await ensureAccessToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });
  if (res.status === 401) {
    // try refresh once
    const token2 = await ensureAccessToken();
    const res2 = await fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(init.headers || {}),
        Authorization: `Bearer ${token2}`
      }
    });
    return res2;
  }
  return res;
}

async function loginWithScoutDeck() {
  const redirectUri = getRedirectUri();
  const issueTokenUrl = `${BASE_URL}/signin?redirect=${encodeURIComponent(redirectUri)}`;

  return new Promise((resolve, reject) => {
    try {
      chrome.identity.launchWebAuthFlow(
        { url: issueTokenUrl, interactive: true },
        async (responseUrl) => {
          if (chrome.runtime.lastError) {
            console.error('WebAuth error:', chrome.runtime.lastError);
            return reject(chrome.runtime.lastError);
          }
          if (!responseUrl) return reject(new Error("No response URL"));

          try {
            const { accessToken, refreshToken, expiresAtMs } = parseAuthFromUrl(responseUrl);
            if (!accessToken) return reject(new Error("No access_token in response"));
            await saveTokens({ accessToken, refreshToken, expiresAtMs });
            resolve(accessToken);
          } catch (err) {
            return reject(err);
          }
        }
      );
    } catch (err) {
      return reject(err);
    }
  });
}

async function getUserProfile() {
  const res = await fetchWithAuth('/api/extension/me');
  if (!res.ok) throw new Error(`Auth failed: ${res.status}`);
  return res.json();
}

async function upsertPlay(play) {
  const res = await fetchWithAuth('/api/extension/plays', {
    method: 'POST',
    body: JSON.stringify(play)
  });
  if (!res.ok) throw new Error(`Upsert failed: ${res.status}`);
  return res.json();
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    try {
      if (message?.type === "LOGIN") {
        const token = await loginWithScoutDeck();
        return sendResponse({ ok: true, token });
      }
      if (message?.type === "ME") {
        const me = await getUserProfile();
        return sendResponse({ ok: true, me });
      }
      if (message?.type === "LOGOUT") {
        await chrome.storage.local.remove(["scoutdeck_token","scoutdeck_refresh","scoutdeck_exp"]);
        return sendResponse({ ok: true });
      }
      if (message?.type === "OPEN_DASHBOARD") {
        const url = message?.url || "https://scoutdeck.ai/dashboard";
        await chrome.tabs.create({ url });
        return sendResponse({ ok: true });
      }
      if (message?.type === "UPSERT_PLAY") {
        const result = await upsertPlay(message.play);
        return sendResponse({ ok: true, result });
      }
      return sendResponse({ ok: false, error: "unknown_message" });
    } catch (e) {
      return sendResponse({ ok: false, error: String(e) });
    }
  })();
  return true; // keep the message channel open for async
}); 
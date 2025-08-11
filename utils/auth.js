/* Minimal auth helpers for the panel/content scripts.
   These wrap background.js message APIs and expose convenience methods. */

(function(){
  const AUTH_KEYS = ['scoutdeck_token','scoutdeck_refresh','scoutdeck_exp'];

  async function getToken(){
    try {
      const { scoutdeck_token } = await chrome.storage.local.get('scoutdeck_token');
      return scoutdeck_token || null;
    } catch { return null; }
  }

  async function login(){
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'LOGIN' }, (resp) => {
        if (resp?.ok) return resolve({ ok: true, token: resp.token });
        resolve({ ok: false, error: resp?.error || 'login_failed' });
      });
    });
  }

  async function logout(){
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'LOGOUT' }, (resp) => {
        if (resp?.ok) return resolve({ ok: true });
        resolve({ ok: false, error: resp?.error || 'logout_failed' });
      });
    });
  }

  async function me(){
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'ME' }, (resp) => {
        if (resp?.ok) return resolve({ ok: true, me: resp.me });
        resolve({ ok: false, error: resp?.error || 'me_failed' });
      });
    });
  }

  async function upsertPlay(play){
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'UPSERT_PLAY', play }, (resp) => {
        if (resp?.ok) return resolve({ ok: true, result: resp.result });
        resolve({ ok: false, error: resp?.error || 'upsert_failed' });
      });
    });
  }

  function onAuthChange(callback){
    try {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area !== 'local') return;
        const touched = Object.keys(changes).some(k => AUTH_KEYS.includes(k));
        if (touched) callback?.(changes);
      });
    } catch {}
  }

  window.SDAI_AUTH = { getToken, login, logout, me, upsertPlay, onAuthChange };
})(); 
(function(){
  // Expose detector on window so content script can call it after eval
  const DET = {};

  function parseFromURL() {
    try {
      const u = new URL(location.href);
      // Heuristics: look for play param or index-like segments
      const playParam = u.searchParams.get('play') || u.searchParams.get('clip') || u.searchParams.get('index');
      const playNumber = playParam ? Number(playParam) : null;
      // Game id heuristics
      const pathParts = u.pathname.split('/').filter(Boolean);
      const gameId = pathParts.find(p => /game|event|match/i.test(p)) || null;
      return { playNumber: Number.isFinite(playNumber) ? playNumber : null, gameId };
    } catch { return { playNumber: null, gameId: null }; }
  }

  function parseFromDOM() {
    // Try common HUDL containers for clip index or text like "Play 10"
    const candidates = [
      '[data-qa="clip-index"]',
      '[data-testid*="clip-index"]',
      '.ClipIndex', '.clip-index',
      'div[role="status"]',
      'h1, h2, h3, .title, .header'
    ];
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (!el) continue;
      const m = /play\s*#?\s*(\d+)/i.exec(el.textContent || '');
      if (m) return { playNumber: Number(m[1]), gameId: null };
    }
    return { playNumber: null, gameId: null };
  }

  DET.getCurrentPlayInfo = async function() {
    const a = parseFromURL();
    if (a.playNumber) return a;
    const b = parseFromDOM();
    return b.playNumber ? b : a;
  };

  DET.startObservers = function(onChange){
    let last = null;
    const notify = async () => {
      const info = await DET.getCurrentPlayInfo();
      const key = JSON.stringify(info);
      if (key !== last) { last = key; onChange?.(info); }
    };
    // Observe URL changes
    let oldHref = location.href;
    setInterval(() => { if (location.href !== oldHref) { oldHref = location.href; notify(); } }, 800);
    // MutationObserver on body for HUDL clip changes
    const mo = new MutationObserver(() => { notify(); });
    mo.observe(document.body, { subtree: true, childList: true, attributes: true, characterData: false });
    // Initial notify
    notify();
  };

  window.__SDAI_DETECTOR__ = DET;
})(); 
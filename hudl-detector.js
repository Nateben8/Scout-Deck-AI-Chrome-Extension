(function(){
  // Expose detector on window so content script can call it after eval
  const DET = {};

  function parseFromURL() {
    try {
      const u = new URL(location.href);
      
      // Extract game ID from URL patterns
      let gameId = null;
      const gameMatch = u.pathname.match(/\/game\/(\d+)/i) || 
                       u.pathname.match(/\/games\/(\d+)/i) ||
                       u.pathname.match(/\/event\/(\d+)/i) ||
                       u.pathname.match(/\/match\/(\d+)/i);
      if (gameMatch) {
        gameId = gameMatch[1];
      }
      
      // Extract play number from URL parameters or path
      const playParam = u.searchParams.get('play') || 
                       u.searchParams.get('clip') || 
                       u.searchParams.get('index') ||
                       u.searchParams.get('playNumber');
      let playNumber = playParam ? Number(playParam) : null;
      
      // Try to extract from path segments
      if (!playNumber) {
        const playMatch = u.pathname.match(/\/play\/(\d+)/i) ||
                         u.pathname.match(/\/clip\/(\d+)/i);
        if (playMatch) {
          playNumber = Number(playMatch[1]);
        }
      }
      
      return { 
        playNumber: Number.isFinite(playNumber) ? playNumber : null, 
        gameId: gameId || `hudl-${Date.now()}`
      };
    } catch { 
      return { 
        playNumber: null, 
        gameId: `hudl-${Date.now()}`
      }; 
    }
  }

  function parseFromDOM() {
    // Try common HUDL containers for clip index or text like "Play 10"
    const candidates = [
      '[data-qa="clip-index"]',
      '[data-testid*="clip-index"]',
      '[data-testid*="play"]',
      '[data-testid*="timeline"]',
      '.ClipIndex', '.clip-index',
      '.play-number', '.playNumber',
      '.timeline-play', '.current-play',
      'div[role="status"]',
      '.hudl-clip-info',
      '.video-controls .play-info',
      'h1, h2, h3, .title, .header'
    ];
    
    let playNumber = null;
    let gameId = null;
    
    // Look for play number
    for (const sel of candidates) {
      const el = document.querySelector(sel);
      if (!el) continue;
      
      // Try different patterns for play numbers
      const text = el.textContent || el.getAttribute('data-play') || '';
      const patterns = [
        /play\s*#?\s*(\d+)/i,
        /clip\s*#?\s*(\d+)/i,
        /(\d+)\s*of\s*\d+/i,
        /^(\d+)$/
      ];
      
      for (const pattern of patterns) {
        const match = pattern.exec(text);
        if (match) {
          playNumber = Number(match[1]);
          break;
        }
      }
      
      if (playNumber) break;
    }
    
    // Look for game information in page title or headers
    const titleEl = document.querySelector('title, h1, .game-title, .event-title');
    if (titleEl) {
      const titleText = titleEl.textContent || '';
      const gameMatch = titleText.match(/game\s*(\d+)/i) || 
                       titleText.match(/vs\s+(.+?)\s+/i) ||
                       titleText.match(/(.+?)\s+vs\s+/i);
      if (gameMatch) {
        gameId = gameMatch[1].replace(/\s+/g, '-').toLowerCase();
      }
    }
    
    return { 
      playNumber: Number.isFinite(playNumber) ? playNumber : null, 
      gameId: gameId || null 
    };
  }

  DET.getCurrentPlayInfo = async function() {
    const urlData = parseFromURL();
    const domData = parseFromDOM();
    
    // Merge the data, preferring URL data for gameId and DOM data for playNumber if available
    return {
      playNumber: domData.playNumber || urlData.playNumber || 1,
      gameId: urlData.gameId || domData.gameId || `hudl-${Date.now()}`
    };
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
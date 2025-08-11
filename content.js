(() => {
  const COLORS = { blue: '#0F3D91', gold: '#F5C542', white: '#FFFFFF' };
  const MIN_W = 260; // allow smaller
  const MAX_W_FRAC = 0.55;
  let widthPx = Math.max(MIN_W, Math.floor(window.innerWidth * 0.32));
  let rootHost, shadow, panelEl, handleEl;
  let isOpen = false;

  const prefersReducedMotion = () => window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Toggle via toolbar icon
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === 'sdai:toggle') togglePanel();
  });

  // Keyboard: Ctrl/Cmd+Shift+S → toggle panel
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key.toLowerCase() === 's') {
      e.preventDefault();
      togglePanel();
    }
  });

  function togglePanel() {
    if (!rootHost) return injectPanel();
    isOpen = !isOpen;
    rootHost.style.display = isOpen ? 'block' : 'none';
    if (!prefersReducedMotion()) rootHost.style.opacity = isOpen ? '1' : '0';
    if (isOpen) loadPanelApp();
  }

  function injectPanel() {
    if (rootHost) { isOpen = true; rootHost.style.display = 'block'; return; }
    isOpen = true;

    rootHost = document.createElement('div');
    rootHost.style.position = 'fixed';
    rootHost.style.top = '0';
    rootHost.style.right = '0';
    rootHost.style.height = '100vh';
    rootHost.style.width = widthPx + 'px';
    rootHost.style.maxWidth = Math.floor(window.innerWidth * MAX_W_FRAC) + 'px';
    rootHost.style.zIndex = '2147483647';
    rootHost.style.display = 'block';
    if (!prefersReducedMotion()) {
      rootHost.style.opacity = '0';
      rootHost.style.transition = 'opacity 160ms ease';
      requestAnimationFrame(() => { rootHost.style.opacity = '1'; });
    }

    shadow = rootHost.attachShadow({ mode: 'open' });

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial; }
      .wrap { position: relative; width: 100%; height: 100%; display: flex; }
      .panel { flex: 1; height: 100%; background: ${COLORS.white}; border-left: 1px solid #e5e7eb; box-shadow: -12px 0 24px rgba(15,61,145,.12); border-top-left-radius: 12px; border-bottom-left-radius: 12px; overflow: hidden; }
      .handle { position: absolute; left: 0; top: 0; width: 8px; height: 100%; cursor: ew-resize; background: linear-gradient(180deg, rgba(15,61,145,.1), rgba(245,197,66,.1)); border-top-left-radius: 12px; border-bottom-left-radius: 12px; }
      .close-btn { position: absolute; top: auto; bottom: 12px; right: 12px; width: 24px; height: 24px; border-radius: 50%; background: rgba(0,0,0,.1); color: #666; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px; z-index: 10; transition: all 0.2s ease; }
      .close-btn:hover { background: rgba(0,0,0,.2); color: #333; }
      iframe { border: 0; width: 100%; height: 100%; }
    `;

    const wrap = document.createElement('div');
    wrap.className = 'wrap';

    handleEl = document.createElement('div');
    handleEl.className = 'handle';

    const closeBtn = document.createElement('button');
    closeBtn.className = 'close-btn';
    closeBtn.innerHTML = '×';
    closeBtn.title = 'Close ScoutDeck AI';
    closeBtn.addEventListener('click', () => {
      isOpen = false;
      rootHost.style.display = 'none';
    });

    const shell = document.createElement('div');
    shell.className = 'panel';
    panelEl = document.createElement('iframe');
    panelEl.src = chrome.runtime.getURL('panel/panel.html');

    shell.appendChild(panelEl);
    shell.appendChild(closeBtn);
    wrap.appendChild(handleEl);
    wrap.appendChild(shell);
    shadow.appendChild(style);
    shadow.appendChild(wrap);

    document.documentElement.appendChild(rootHost);

    initResize();
    loadPanelApp();
  }

  function initResize() {
    let startX = 0, startW = widthPx, resizing = false, activePointerId = null;

    const onPointerDown = (e) => {
      resizing = true;
      activePointerId = e.pointerId;
      startX = e.clientX;
      startW = rootHost.getBoundingClientRect().width;
      handleEl.setPointerCapture(activePointerId);
      document.body.style.userSelect = 'none';
    };

    const onPointerMove = (e) => {
      if (!resizing || e.pointerId !== activePointerId) return;
      const dx = startX - e.clientX;
      const maxW = Math.floor(window.innerWidth * MAX_W_FRAC);
      widthPx = Math.max(MIN_W, Math.min(maxW, Math.floor(startW + dx)));
      rootHost.style.width = widthPx + 'px';
    };

    const stopResize = () => {
      if (!resizing) return;
      resizing = false;
      activePointerId && handleEl.releasePointerCapture(activePointerId);
      activePointerId = null;
      document.body.style.userSelect = '';
    };

    handleEl.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', stopResize);
    window.addEventListener('blur', stopResize);
  }

  async function loadPanelApp() {
    const sendContext = async () => {
      const info = await detectCurrentPlay();
      panelEl.contentWindow?.postMessage({ type: 'sdai:init', payload: info }, '*');
    };
    if (panelEl.contentDocument?.readyState === 'complete') sendContext();
    else panelEl.addEventListener('load', sendContext, { once: true });
  }

  async function detectCurrentPlay() {
    const url = chrome.runtime.getURL('hudl-detector.js');
    const src = await fetch(url).then(r => r.text()).catch(() => '');
    let api = null;
    try { api = (new Function(src + '\n;return window.__SDAI_DETECTOR__'))(); } catch {}
    if (api && typeof api.getCurrentPlayInfo === 'function') {
      const info = await api.getCurrentPlayInfo();
      api.startObservers?.((updated) => {
        panelEl?.contentWindow?.postMessage({ type: 'sdai:playChanged', payload: updated }, '*');
      });
      return info;
    }
    return { playNumber: null, gameId: null };
  }
})(); 
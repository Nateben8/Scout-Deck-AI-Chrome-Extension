(function(){
  // Dynamically load storage.js
  const storageScript = document.createElement('script');
  storageScript.src = chrome.runtime.getURL('storage.js');
  document.head.appendChild(storageScript);
  
  // Auth gate elements
  const authGate = document.getElementById('authGate');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const authStatus = document.getElementById('authStatus');

  async function checkAuthAndGate(){
    try {
      const { scoutdeck_token } = await chrome.storage.local.get('scoutdeck_token');
      const hasToken = Boolean(scoutdeck_token);
      if (authGate) authGate.style.display = hasToken ? 'none' : 'block';
      if (authStatus) authStatus.textContent = hasToken ? 'Authenticated' : 'Not signed in';
    } catch (e) {
      if (authStatus) authStatus.textContent = 'Auth check failed';
      if (authGate) authGate.style.display = 'block';
    }
  }

  loginBtn?.addEventListener('click', ()=>{
    authStatus.textContent = 'Opening sign-in...';
    chrome.runtime.sendMessage({ type: 'LOGIN' }, (resp)=>{
      if (resp?.ok) {
        authStatus.textContent = 'Signed in';
        checkAuthAndGate();
      } else {
        authStatus.textContent = `Login failed: ${resp?.error || 'unknown'}`;
      }
    });
  });

  logoutBtn?.addEventListener('click', ()=>{
    chrome.runtime.sendMessage({ type: 'LOGOUT' }, ()=>{
      authStatus.textContent = 'Signed out';
      checkAuthAndGate();
    });
  });

  document.addEventListener('visibilitychange', ()=>{
    if (!document.hidden) checkAuthAndGate();
  });

  // Initial auth check
  checkAuthAndGate();

  const saveIndicator = document.getElementById('saveIndicator');
  const playLabel = document.getElementById('playLabel');
  const manualPlay = document.getElementById('manualPlay');
  const progressBar = document.getElementById('progressBar');
  const progressText = document.getElementById('progressText');
  const currentStepNumber = document.getElementById('currentStepNumber');
  const totalSteps = document.getElementById('totalSteps');
  const stepsRoot = document.getElementById('stepsRoot');
  let steps = [];
  const stepDots = Array.from(document.querySelectorAll('.step-dot'));
  const prevBtn = document.getElementById('prevStep');
  const nextBtn = document.getElementById('nextStep');
  const submitBtn = document.getElementById('submitPlay');
  const profileTab = document.getElementById('profileTab');

  const DASHBOARD_URL = 'https://scoutdeck.ai/dashboard'; // TODO: update when final link is available
  profileTab?.addEventListener('click', (e)=>{
    e.preventDefault();
    chrome.runtime.sendMessage({ type: 'OPEN_DASHBOARD', url: DASHBOARD_URL });
  });

  const ids = [
    'down','distance','yardLine','result','resultOther','quarter','motion','offForm','offFormOther','defFront','defFrontOther','frontType','baseShell','manZone','covAdj','alignAdj','levSaf','levCor','levLb','depSaf','depCor','depLb','runFit','runFitOther','weakDb','vulnCorner','targetable','lbTend','covGive','condNotes','blitzOrigin','blitzDropper','blitzVacated','blitzVacatedOther','motionType','motionOther','boxLb','fieldSaf','gainLossYards',
    // Defense ids
    'def_down','def_distance','def_yardLine','def_gainLossYards','def_playResult','def_playResultOther','def_quarter','def_playType',
    'def_offForm','def_offFormOther','def_personnel','def_personnelOther','def_formStrength','def_motion','def_motionOther',
    'def_qbAlign','def_rbAlign','def_rbAlignNotes','def_teAlign','def_runScheme','def_runSchemeOther','def_whoPulls','def_runDirection',
    'def_prefRunSide','def_rbStyle','def_passPro','def_slideDir','def_rbPassRole','def_primaryConcept','def_screenType','def_targetZone',
    'def_targetReceiver','def_qbRead','def_qbMobility','def_topOL','def_weakOL','def_rbEval','def_wrBlockEffort','def_wrTips','def_wrMotionFreq','def_goToReceiver'
  ];
  const el = Object.fromEntries(ids.map(id => [id, document.getElementById(id)]));
  const radios = {
    hash: () => getRadio('hash'), 
    playType: () => getRadio('playType'), 
    trick: () => getRadio('trick'), 
    pressBail: () => getRadio('pressBail'), 
    blitzCalled: () => getRadio('blitzCalled'), 
    rpoPa: () => getRadio('rpoPa'),
    filmSide: () => getRadio('filmSide'),
    def_hash: () => getRadio('def_hash'),
    def_rpoPa: () => getRadio('def_rpoPa'),
    def_trick: () => getRadio('def_trick'),
    def_multiRb: () => getRadio('def_multiRb'),
    def_screenUse: () => getRadio('def_screenUse'),
    def_qbPressure: () => getRadio('def_qbPressure'),
    def_pullers: () => getRadio('def_pullers'),
    def_cutback: () => getRadio('def_cutback')
  };
  const dlMoves = () => {
    try {
      return Array.from(document.querySelectorAll('.dlMove:checked')).map(x => x?.value).filter(Boolean);
    } catch (error) {
      console.error('Error getting DL moves:', error);
      return [];
    }
  };
  function getRadio(name){ 
    try {
      const x = document.querySelector(`input[name="${name}"]:checked`); 
      return x?.value || null; 
    } catch (error) {
      console.error('Error getting radio value:', error);
      return null;
    }
  }
  function setRadio(name, value){ 
    try {
      const x = document.querySelector(`input[name="${name}"][value="${value}"]`); 
      if (x) x.checked = true; 
    } catch (error) {
      console.error('Error setting radio value:', error);
    }
  }

  // Conditional blocks
  const motionBlock = document.getElementById('motionSubtype');
  const motionOtherBlock = document.getElementById('motionOtherBlock');
  const resultOtherBlock = document.getElementById('resultOtherBlock');
  const offFormOtherBlock = document.getElementById('offFormOtherBlock');
  const defFrontOtherBlock = document.getElementById('defFrontOtherBlock');
  const blitzVacatedOtherBlock = document.getElementById('blitzVacatedOtherBlock');
  const runFitOtherBlock = document.getElementById('runFitOtherBlock');
  const blitzBlock = document.getElementById('blitzBlock');
  
  function applyConditionals(){
    const motionValue = el.motion?.value;
    
    if (motionBlock) {
      const shouldHideMotionBlock = !motionValue || motionValue === 'No';
      motionBlock.classList.toggle('hidden', shouldHideMotionBlock);
    }
    if (motionOtherBlock) {
      motionOtherBlock.classList.toggle('hidden', motionValue !== 'Other');
    }
    
    if (resultOtherBlock) {
      resultOtherBlock.classList.toggle('hidden', el.result?.value !== 'Other');
    }
    if (offFormOtherBlock) {
      offFormOtherBlock.classList.toggle('hidden', el.offForm?.value !== 'Other');
    }
    if (defFrontOtherBlock) {
      defFrontOtherBlock.classList.toggle('hidden', el.defFront?.value !== 'Other');
    }
    if (blitzVacatedOtherBlock) {
      blitzVacatedOtherBlock.classList.toggle('hidden', el.blitzVacated?.value !== 'Other');
    }
    if (runFitOtherBlock) {
      runFitOtherBlock.classList.toggle('hidden', el.runFit?.value !== 'Other');
    }

    // Defense-side Other toggles
    document.getElementById('def_playResultOtherBlock')?.classList.toggle('hidden', el.def_playResult?.value !== 'Other');
    document.getElementById('def_offFormOtherBlock')?.classList.toggle('hidden', el.def_offForm?.value !== 'Other');
    document.getElementById('def_personnelOtherBlock')?.classList.toggle('hidden', el.def_personnel?.value !== 'Other');
    document.getElementById('def_motionOtherBlock')?.classList.toggle('hidden', el.def_motion?.value !== 'Other');
    document.getElementById('def_runSchemeOtherBlock')?.classList.toggle('hidden', el.def_runScheme?.value !== 'Other');
    
    if (blitzBlock) blitzBlock.classList.toggle('hidden', radios.blitzCalled() !== 'Yes');
    updateProgress();
    updateButtons();
  }

  document.addEventListener('change', (e)=>{ 
    try {
      const id = e.target?.id;
      const name = e.target?.name;
      if (
        ['blitzCalled','filmSide','def_hash','def_rpoPa','def_trick','def_multiRb','def_screenUse','def_qbPressure'].includes(name) ||
        id === 'motion' || id === 'result' || id === 'offForm' || id === 'defFront' || id === 'blitzVacated' || id === 'runFit' ||
        id === 'def_playResult' || id === 'def_offForm' || id === 'def_personnel' || id === 'def_motion' || id === 'def_runScheme'
      ) {
        applyConditionals(); 
        if (name === 'filmSide') { updateSideVisibility(); showStep(1); }
      }
      debounceSave(); 
      updateProgress(); 
      updateButtons(); 
      highlightRequiredFields();
    } catch (error) {
      console.error('Error in change event:', error);
    }
  });
  document.addEventListener('input', (e)=>{ 
    try {
      debounceSave(); 
      updateProgress(); 
      updateButtons(); 
      highlightRequiredFields();
    } catch (error) {
      console.error('Error in input event:', error);
    }
  });

  let currentStep = 0;
  // dynamic; updated by rebuildStepOrder()
  
  function prefersReducedMotion(){
    return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function showStep(i){ 
    // Block navigation if not authenticated
    if (authGate && authGate.style.display !== 'none') return;
    currentStep = Math.max(0, Math.min(steps.length-1, i)); 
    
    // Hide all steps
    steps.forEach((step, idx) => {
      if (step) {
        step.style.display = idx === currentStep ? 'block' : 'none';
      }
    });
    
    // Update step dots
    const dots = Array.from(document.querySelectorAll('.step-dot'));
    dots.forEach((dot, idx) => {
      if (dot) {
        dot.classList.remove('active', 'completed');
        if (idx === currentStep) {
          dot.classList.add('active');
        } else if (idx < currentStep) {
          dot.classList.add('completed');
        }
      }
    });
    
    // Update step numbers
    if (currentStepNumber) currentStepNumber.textContent = currentStep + 1;
    if (totalSteps) totalSteps.textContent = String(steps.length);

    // Scroll to top of panel for new step
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    try { window.scrollTo({ top: 0, behavior }); } catch {}
    
    updateProgress(); 
    updateButtons(); 
    highlightRequiredFields();
  }
  
  // Step dot navigation
  stepDots.forEach((dot, index) => {
    if (dot) {
      dot.addEventListener('click', () => {
        if (authGate && authGate.style.display !== 'none') return;
        if (index <= currentStep || stepValid(index - 1)) {
          showStep(index);
        } else {
          stepsRoot?.classList.add('shake');
          setTimeout(()=> stepsRoot?.classList.remove('shake'), 450);
        }
      });
    }
  });
  
  if (prevBtn) prevBtn.addEventListener('click', ()=> { if (authGate && authGate.style.display !== 'none') return; showStep(currentStep-1); });
  if (nextBtn) nextBtn.addEventListener('click', ()=> { 
    if (authGate && authGate.style.display !== 'none') return; 
    if (!stepValid(currentStep)) { 
      stepsRoot?.classList.add('shake');
      setTimeout(()=> stepsRoot?.classList.remove('shake'), 450);
      return; 
    }
    showStep(currentStep+1); 
  });
  
  function initFlow(){
    updateSideVisibility();
    showStep(1);
    updateProgress();
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFlow);
  } else {
    initFlow();
  }

  function updateButtons(){ 
    if (prevBtn) prevBtn.disabled = currentStep === 0; 
    const isLast = currentStep === steps.length-1;
    const valid = stepValid(currentStep);

    if (nextBtn) {
      nextBtn.style.display = isLast ? 'none' : 'inline-flex'; 
      nextBtn.disabled = !valid;
      if (!valid) {
        const summary = getMissingFields(currentStep);
        nextBtn.textContent = `Next • ${summary}`;
        nextBtn.title = summary;
      } else {
        nextBtn.textContent = 'Next →';
        nextBtn.title = '';
      }
    }
    if (submitBtn) {
      submitBtn.style.display = isLast ? 'inline-flex' : 'none'; 
      submitBtn.disabled = !valid;
    }
  }

  function validateCore(){ 
    const required = [
      el.down?.value, 
      el.distance?.value, 
      el.quarter?.value, 
      radios.playType()
    ]; 
    return required.every(v => v !== undefined && v !== null && String(v).trim() !== ''); 
  }

  let context = { playNumber: null, gameId: null };
  window.addEventListener('message', (e)=>{ 
    const { type, payload } = e.data || {}; 
    if (type === 'sdai:init' || type === 'sdai:playChanged') { 
      if (manualPlay?.value) payload.playNumber = Number(manualPlay.value); 
      context = payload || context; 
      updateHeader(); 
      loadState(); 
    } 
  });
  
  // Function to check if play number already exists
  async function checkPlayNumberExists(playNumber) {
    if (!playNumber || !context.gameId) return false;
    
    try {
      // Get all stored data for this game
      const allData = await SDAI_STORAGE.getAll();
      const gamePlays = Object.entries(allData)
        .filter(([key, data]) => {
          // Check if this is data for the same game
          return data && data.gameId === context.gameId && data.playNumber === playNumber;
        });
      
      return gamePlays.length > 0;
    } catch (error) {
      console.error('Error checking play number:', error);
      return false;
    }
  }

  // Function to get next available play number
  async function getNextAvailablePlayNumber() {
    if (!context.gameId) return 1;
    
    try {
      const allData = await SDAI_STORAGE.getAll();
      const gamePlays = Object.entries(allData)
        .filter(([key, data]) => data && data.gameId === context.gameId)
        .map(([key, data]) => data.playNumber)
        .filter(num => num !== null && num !== undefined)
        .sort((a, b) => a - b);
      
      if (gamePlays.length === 0) return 1;
      
      // Find the first gap in play numbers, or use the next number
      for (let i = 1; i <= Math.max(...gamePlays) + 1; i++) {
        if (!gamePlays.includes(i)) {
          return i;
        }
      }
      
      return Math.max(...gamePlays) + 1;
    } catch (error) {
      console.error('Error getting next play number:', error);
      return 1;
    }
  }

  if (manualPlay) {
    manualPlay.addEventListener('input', async () => { 
      const n = Number(manualPlay.value || ''); 
      context.playNumber = Number.isFinite(n) && n>0 ? n : null; 
      updateHeader();
      
      // Check for duplicate play number
      if (context.playNumber) {
        const exists = await checkPlayNumberExists(context.playNumber);
        if (exists) {
          manualPlay.style.borderColor = 'var(--error)';
          manualPlay.title = `Play #${context.playNumber} already exists for this game`;
        } else {
          manualPlay.style.borderColor = '';
          manualPlay.title = '';
        }
      } else {
        manualPlay.style.borderColor = '';
        manualPlay.title = '';
      }
      
      updateProgress();
      updateButtons();
    });
  } else {
    console.error('Manual play element not found!');
  }
  
  function updateHeader(){ 
    if (playLabel) playLabel.textContent = context.playNumber ? `#${context.playNumber}` : '(Set Play #)'; 
  }

  function key(){ 
    try {
      if (typeof sdaiContextKey === 'function') {
        return sdaiContextKey(context); 
      } else {
        // Fallback key generation
        return `game-${context.gameId || 'unknown'}-play-${context.playNumber || 'unknown'}`;
      }
    } catch (error) {
      console.error('Error generating key:', error);
      return 'default-key';
    }
  }
  function num(v, allowNeg=false){ 
    if (v === '' || v === null || v === undefined) return null; 
    const n = Number(v); 
    return Number.isFinite(n) ? (allowNeg ? n : Math.max(0, n)) : null; 
  }

  function collect(){
    return {
      gameId: context.gameId ?? null,
      playNumber: context.playNumber ?? null,
      filmSide: radios.filmSide() || 'Offense',
      timestamp: new Date().toISOString(),
      fields: {
        down: el.down?.value || null,
        distance: num(el.distance?.value),
        yardLine: num(el.yardLine?.value),
        hash: radios.hash(),
                 result: el.result?.value || null,
         resultOther: el.resultOther?.value || null,
        quarter: el.quarter?.value || null,
        playType: radios.playType(),
        rpoPa: radios.rpoPa() || 'N/A',
        trickPlay: radios.trick(),
        motionUsed: el.motion?.value || null,
        motionType: el.motionType?.value || null,
        motionOther: el.motionOther?.value || null,
                 offForm: el.offForm?.value || null,
         offFormOther: el.offFormOther?.value || null,
                 defFront: el.defFront?.value || null,
         defFrontOther: el.defFrontOther?.value || null,
        frontType: el.frontType?.value || null,
        baseShell: el.baseShell?.value || null,
        manZone: el.manZone?.value || null,
        covAdj: el.covAdj?.value || null,
        alignAdj: el.alignAdj?.value || null,
        levSaf: el.levSaf?.value || null,
        levCor: el.levCor?.value || null,
        levLb: el.levLb?.value || null,
        depSaf: num(el.depSaf?.value),
        depCor: num(el.depCor?.value),
        depLb: num(el.depLb?.value),
        pressBail: radios.pressBail(),
        boxLb: num(el.boxLb?.value),
        fieldSaf: num(el.fieldSaf?.value),
        blitzCalled: radios.blitzCalled(),
        blitzOrigin: el.blitzOrigin?.value || null,
        blitzDropper: el.blitzDropper?.value || null,
                 blitzVacated: el.blitzVacated?.value || null,
         blitzVacatedOther: el.blitzVacatedOther?.value || null,
        blitzIndicators: el.blitzIndicators?.value || null,
                 runFit: el.runFit?.value || null,
         runFitOther: el.runFitOther?.value || null,
        dLineMovement: dlMoves(),
        weakDb: el.weakDb?.value || null,
        vulnCorner: el.vulnCorner?.value || null,
        targetable: el.targetable?.value || null,
        lbTend: el.lbTend?.value || null,
        covGive: el.covGive?.value || null,
        condNotes: el.condNotes?.value || null,

         // Defense fields
         def_down: el.def_down?.value || null,
         def_distance: num(el.def_distance?.value),
         def_yardLine: num(el.def_yardLine?.value),
         def_hash: radios.def_hash() || null,
         def_gainLossYards: num(el.def_gainLossYards?.value, true),
         def_playResult: el.def_playResult?.value || null,
         def_playResultOther: el.def_playResultOther?.value || null,
         def_quarter: el.def_quarter?.value || null,
         def_playType: el.def_playType?.value || null,
         def_rpoPa: radios.def_rpoPa() || 'N/A',
         def_trick: radios.def_trick() || null,

         def_offForm: el.def_offForm?.value || null,
         def_offFormOther: el.def_offFormOther?.value || null,
         def_personnel: el.def_personnel?.value || null,
         def_personnelOther: el.def_personnelOther?.value || null,
         def_formStrength: el.def_formStrength?.value || null,
         def_motion: el.def_motion?.value || null,
         def_motionOther: el.def_motionOther?.value || null,
         def_qbAlign: el.def_qbAlign?.value || null,
         def_rbAlign: el.def_rbAlign?.value || null,
         def_multiRb: radios.def_multiRb() || null,
         def_rbAlignNotes: el.def_rbAlignNotes?.value || null,
         def_teAlign: el.def_teAlign?.value || null,

         def_runScheme: el.def_runScheme?.value || null,
         def_runSchemeOther: el.def_runSchemeOther?.value || null,
         def_pullers: radios.def_pullers() || null,
         def_whoPulls: el.def_whoPulls?.value || null,
         def_runDirection: el.def_runDirection?.value || null,
         def_prefRunSide: el.def_prefRunSide?.value || null,
         def_cutback: radios.def_cutback() || null,
         def_rbStyle: el.def_rbStyle?.value || null,

         def_passPro: el.def_passPro?.value || null,
         def_slideDir: el.def_slideDir?.value || null,
         def_rbPassRole: el.def_rbPassRole?.value || null,
         def_primaryConcept: el.def_primaryConcept?.value || null,
         def_screenUse: radios.def_screenUse() || null,
         def_screenType: el.def_screenType?.value || null,
         def_targetZone: el.def_targetZone?.value || null,
         def_targetReceiver: el.def_targetReceiver?.value || null,
         def_qbRead: el.def_qbRead?.value || null,
         def_qbPressure: radios.def_qbPressure() || null,
         def_qbMobility: el.def_qbMobility?.value || null,

         def_topOL: el.def_topOL?.value || null,
         def_weakOL: el.def_weakOL?.value || null,
         def_rbEval: el.def_rbEval?.value || null,
         def_wrBlockEffort: el.def_wrBlockEffort?.value || null,
         def_wrTips: el.def_wrTips?.value || null,
         def_wrMotionFreq: el.def_wrMotionFreq?.value || null,
         def_goToReceiver: el.def_goToReceiver?.value || null
      }
    };
  }

  async function loadState(){
    try {
      const data = await SDAI_STORAGE.get(key());
      document.querySelectorAll('input[type="radio"]').forEach(r => { if (r) r.checked = false; });
      document.querySelectorAll('input[type="checkbox"]').forEach(c => { if (c) c.checked = false; });
      for (const id of ids) if (el[id]) el[id].value = '';

      if (data && data.fields){
        const f = data.fields;
        for (const id of ids) if (el[id] && f[id] != null) el[id].value = f[id];
        ['hash','playType','trick','pressBail','blitzCalled','rpoPa','filmSide','def_hash','def_rpoPa','def_trick','def_multiRb','def_screenUse','def_qbPressure','def_pullers']
          .forEach(name => f[name] != null && setRadio(name, f[name]));
        if (Array.isArray(f.dLineMovement)) f.dLineMovement.forEach(v => { const c = Array.from(document.querySelectorAll('.dlMove')).find(x => x.value === v); if (c) c.checked = true; });
      }
      updateSideVisibility();
      applyConditionals();
      showStep(currentStep);
    } catch (error) {
      console.error('Error loading state:', error);
    }
  }

  let t=null; 
  function debounceSave(){ clearTimeout(t); t = setTimeout(save, 250); }
  async function save(){ 
    try {
      await SDAI_STORAGE.set(key(), collect()); 
      flashSaved(); 
    } catch (error) {
      console.error('Error saving:', error);
    }
  }
  function flashSaved(){ 
    if (saveIndicator) {
      saveIndicator.style.display = 'inline-block'; 
      clearTimeout(saveIndicator._t); 
      saveIndicator._t = setTimeout(()=>{ 
        if (saveIndicator) saveIndicator.style.display = 'none'; 
      }, 800); 
    }
  }

  function highlightRequiredFields() {
    // Clear all previous highlighting
    document.querySelectorAll('.form-group, .radio-group').forEach(el => {
      el.classList.remove('required-missing');
    });
    
    if (!stepValid(currentStep)) {
      const f = collect().fields;
      
      switch(currentStep) {
        case 0:
          if (!manualPlay?.value || Number(manualPlay.value) <= 0) {
            manualPlay?.closest('.form-group')?.classList.add('required-missing');
          }
          break;
        case 1:
          if (!el.down?.value) el.down?.closest('.form-group')?.classList.add('required-missing');
          if (!el.distance?.value) el.distance?.closest('.form-group')?.classList.add('required-missing');
          if (!el.quarter?.value) el.quarter?.closest('.form-group')?.classList.add('required-missing');
          if (!radios.playType()) {
            document.querySelector('input[name="playType"]')?.closest('.radio-group')?.classList.add('required-missing');
          }
          break;
        case 2:
          if (!f.offForm && !f.defFront && !f.frontType && !f.baseShell && !f.manZone) {
            // Highlight all formation fields
            ['offForm', 'defFront', 'frontType', 'baseShell', 'manZone'].forEach(id => {
              el[id]?.closest('.form-group')?.classList.add('required-missing');
            });
          }
          break;
        case 3:
          if (!f.levSaf && !f.levCor && !f.levLb) {
            ['levSaf', 'levCor', 'levLb'].forEach(id => {
              el[id]?.closest('.form-group')?.classList.add('required-missing');
            });
          }
          break;
        case 4:
          if (f.boxLb === null && f.fieldSaf === null) {
            ['boxLb', 'fieldSaf'].forEach(id => {
              el[id]?.closest('.form-group')?.classList.add('required-missing');
            });
          }
          break;
        case 5:
          if (f.blitzCalled === null || f.blitzCalled === undefined) {
            document.querySelector('input[name="blitzCalled"]')?.closest('.radio-group')?.classList.add('required-missing');
          }
          break;
        case 6:
          if (!f.runFit && (!f.dLineMovement || f.dLineMovement.length === 0)) {
            el.runFit?.closest('.form-group')?.classList.add('required-missing');
            document.querySelector('.checkbox-group')?.classList.add('required-missing');
          }
          break;
        case 7:
          if (!f.weakDb && !f.vulnCorner && !f.targetable) {
            ['weakDb', 'vulnCorner', 'targetable'].forEach(id => {
              el[id]?.closest('.form-group')?.classList.add('required-missing');
            });
          }
          break;
      }
    }
  }

  function getMissingFields(idx) {
    const f = collect().fields;
    const missing = [];
    
    switch(idx) {
      case 0:
        if (!manualPlay?.value || Number(manualPlay.value) <= 0) {
          missing.push('Play Number');
        }
        break;
      case 1:
        if (!el.down?.value) missing.push('Down');
        if (!el.distance?.value) missing.push('Distance');
        if (!el.quarter?.value) missing.push('Quarter');
        if (!radios.playType()) missing.push('Play Type');
        break;
      case 2:
        if (!f.offForm && !f.defFront && !f.frontType && !f.baseShell && !f.manZone) {
          missing.push('Formation/Coverage');
        }
        break;
      case 3:
        if (!f.levSaf && !f.levCor && !f.levLb) {
          missing.push('Leverage');
        }
        break;
      case 4:
        if (f.boxLb === null && f.fieldSaf === null) {
          missing.push('Box Count');
        }
        break;
      case 5:
        if (f.blitzCalled === null || f.blitzCalled === undefined) {
          missing.push('Blitz Called');
        }
        break;
      case 6:
        if (!f.runFit && (!f.dLineMovement || f.dLineMovement.length === 0)) {
          missing.push('D-Line Behavior');
        }
        break;
      case 7:
        if (!f.weakDb && !f.vulnCorner && !f.targetable) {
          missing.push('Scouting Insights');
        }
        break;
    }
    
    return missing.length > 0 ? missing.join(', ') : 'All fields complete';
  }

  function stepValid(idx){
    const f = collect().fields;
    switch(idx){
      case 0:
        // Play number validation - must have a valid play number
        const playValid = !!(manualPlay?.value && Number(manualPlay.value) > 0);
        return playValid;
      case 1:
        const core = el.down?.value && el.distance?.value && el.quarter?.value && radios.playType();
        return !!core;
      case 2: 
        return !!(f.offForm || f.defFront || f.frontType || f.baseShell || f.manZone);
      case 3: 
        return !!(f.levSaf || f.levCor || f.levLb);
      case 4: 
        return f.boxLb!=null || f.fieldSaf!=null;
      case 5: 
        return f.blitzCalled !== null && f.blitzCalled !== undefined;
      case 6: 
        return !!(f.runFit || (f.dLineMovement && f.dLineMovement.length));
      case 7: 
        return !!(f.weakDb || f.vulnCorner || f.targetable);
      default: 
        return false;
    }
  }
  
  function updateProgress(){ 
    const total = steps.length; 
    let completed = 0; 
    
    // Count completed steps
    for (let i=0;i<total;i++) {
      if (stepValid(i)) completed++; 
    }
    
    // Calculate percentage
    const pct = Math.round((completed/Math.max(1,total))*100); 
    
    // Update progress bar
    if (progressBar) {
      progressBar.style.width = pct + '%'; 
    }
    
    // Update progress text
    if (progressText) {
      progressText.textContent = pct + '%'; 
    }
    
    // Update step dots to show completion
    const dots = Array.from(document.querySelectorAll('.step-dot'));
    dots.forEach((dot, idx) => {
      if (!dot) return;
      dot.classList.toggle('completed', idx < currentStep);
      dot.classList.toggle('active', idx === currentStep);
    });
    
  }

  const clearFormBtn = document.getElementById('clearForm');
  if (clearFormBtn) {
    clearFormBtn.addEventListener('click', async () => { 
      try {
        await SDAI_STORAGE.remove(key()); 
        loadState(); 
      } catch (error) {
        console.error('Error clearing form:', error);
      }
    });
  }
  
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => { 
      try {
        await save(); 
        const payload = collect();
        // Include key parts for server
        const play = {
          gameId: payload.gameId,
          playNumber: payload.playNumber,
          filmSide: payload.filmSide,
          fields: payload.fields,
          client_ts: Date.now()
        };
        chrome.runtime.sendMessage({ type: 'UPSERT_PLAY', play }, (resp)=>{
          if (!resp?.ok) {
            console.error('Upsert failed:', resp?.error);
          }
        });
        if (saveIndicator) saveIndicator.textContent = 'Submitted'; 
        flashSaved(); 
        if (saveIndicator) saveIndicator.textContent = 'Saved'; 
      } catch (error) {
        console.error('Error submitting:', error);
      }
    });
  }

  // Keyboard navigation
  document.addEventListener('keydown', (e) => {
    try {
      if (authGate && authGate.style.display !== 'none') return;
      if (e.key === 'ArrowLeft' && prevBtn && !prevBtn.disabled) {
        e.preventDefault();
        showStep(currentStep - 1);
      } else if ((e.key === 'ArrowRight' || (e.key === 'Enter' && (e.metaKey || e.ctrlKey))) && nextBtn && !nextBtn.disabled) {
        e.preventDefault();
        showStep(currentStep + 1);
      } else if ((e.key === 'Enter') && currentStep === steps.length - 1 && submitBtn && !submitBtn.disabled) {
        e.preventDefault();
        submitBtn.click();
      }
    } catch (error) {
      console.error('Error in keyboard navigation:', error);
    }
  });

  function getSelectedSide(){
    return radios.filmSide() || 'Offense';
  }

  function updateSideVisibility(){
    const side = getSelectedSide();
    const offenseSteps = Array.from(document.querySelectorAll('.funnel-step.side-offense'));
    const defenseSteps = Array.from(document.querySelectorAll('.funnel-step.side-defense'));

    offenseSteps.forEach(s => { if (s) { s.dataset.active = (side === 'Offense') ? '1' : '0'; s.style.display = 'none'; s.classList.toggle('hidden', side !== 'Offense'); } });
    defenseSteps.forEach(s => { if (s) { s.dataset.active = (side === 'Defense') ? '1' : '0'; s.style.display = 'none'; s.classList.toggle('hidden', side !== 'Defense'); } });

    rebuildStepOrder();
  }

  function rebuildStepOrder(){
    // Build a runtime list of only active steps (always include step 0)
    const all = Array.from(document.querySelectorAll('.funnel-step'));
    const active = all.filter((s, idx) => idx === 0 || s?.dataset?.active !== '0');

    // Hide all first
    all.forEach(s => { if (s) s.style.display = 'none'; });

    // Rebuild stepDots to match active steps length minus step 0
    const dotsWrap = document.querySelector('.step-dots');
    if (dotsWrap) {
      dotsWrap.innerHTML = '';
      for (let i = 1; i < active.length; i++) {
        const idx = i;
        const dot = document.createElement('div');
        dot.className = 'step-dot' + (i === 1 ? ' active' : '');
        dot.dataset.step = String(i);
        dot.addEventListener('click', ()=> showStep(idx));
        dotsWrap.appendChild(dot);
      }
    }

    // Update globals and counters
    steps.length = 0;
    active.forEach(s => steps.push(s));
    if (totalSteps) totalSteps.textContent = String(steps.length);

    // Reset to step 1 (first content step)
    currentStep = Math.min(Math.max(currentStep, 1), steps.length - 1);
    showStep(currentStep);
  }

  // Initialize was moved to DOMContentLoaded above
})(); 
(() => {
  const log = document.getElementById('log');
  document.getElementById('saveBtn').addEventListener('click', () => append('Saved placeholder'));
  document.getElementById('clearBtn').addEventListener('click', () => { log.textContent=''; append('Cleared'); });
  function append(msg){ log.textContent += `[${new Date().toLocaleTimeString()}] ${msg}\n`; }
  // Listen to messages from parent if needed later
  window.addEventListener('message', (e)=>{ /* reserved */ });
})(); 
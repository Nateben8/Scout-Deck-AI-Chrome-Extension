const SDAI_STORAGE = (() => {
  const STORAGE = chrome?.storage?.sync || chrome?.storage?.local;
  const set = (key, value) => new Promise(res => STORAGE.set({ [key]: value }, res));
  const get = (key) => new Promise(res => STORAGE.get(key, (r) => res(r[key])));
  const remove = (key) => new Promise(res => STORAGE.remove(key, res));
  const getAll = () => new Promise(res => STORAGE.get(null, res));
  return { set, get, remove, getAll };
})();

// Build context key from {gameId, playNumber} with fallbacks
function sdaiContextKey(ctx){
  const host = location.hostname; const path = location.pathname.replace(/\/$/, '');
  const base = ctx?.gameId ? `game:${ctx.gameId}` : `loc:${host}${path}`;
  const pn = ctx?.playNumber ?? 'unknown';
  return `${base}:play:${pn}`;
} 
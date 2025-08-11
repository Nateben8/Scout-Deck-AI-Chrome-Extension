export function exportJSON(filename, data){
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; document.body.appendChild(a); a.click();
  a.remove(); URL.revokeObjectURL(url);
}

export function exportCSV(filename, rows){
  const flat = (obj, prefix='') => Object.entries(obj).reduce((acc,[k,v])=>{
    const key = prefix ? `${prefix}.${k}` : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) Object.assign(acc, flat(v, key));
    else acc[key] = Array.isArray(v) ? v.join('; ') : v;
    return acc;
  }, {});
  const flattened = rows.map(r => flat(r));
  const headers = Array.from(new Set(flattened.flatMap(r => Object.keys(r))));
  const csv = [headers.join(','), ...flattened.map(r => headers.map(h => JSON.stringify(r[h] ?? '')).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
} 
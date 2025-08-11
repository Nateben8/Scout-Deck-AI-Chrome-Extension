import fs from 'node:fs';
import path from 'node:path';

const manifestPath = path.resolve(process.cwd(), 'manifest.json');
const raw = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(raw);

function assert(cond, msg) {
  if (!cond) {
    console.error('Manifest validation failed:', msg);
    process.exit(1);
  }
}

assert(manifest.manifest_version === 3, 'manifest_version must be 3');
assert(!!manifest.background?.service_worker, 'background.service_worker required');
assert(Array.isArray(manifest.permissions), 'permissions must be an array');
assert(manifest.permissions.includes('storage'), 'permissions must include storage');
assert(manifest.permissions.includes('identity'), 'permissions must include identity');
assert(Array.isArray(manifest.host_permissions), 'host_permissions must be an array');

console.log('manifest.json looks good ✔'); 
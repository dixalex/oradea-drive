// Headless checks for Oradea's hand corrections to generic buildings (src/world/oradea/fixes.js): node tests/oradea-fixes.test.mjs
// Every fixed id is in map_buildings.json and its footprint's centre is still where the fix was made (Overture ids can shift
// with a new download), and applyFixes patches exactly those entries. Skipped without the compiled map.
import { readFileSync, existsSync } from 'node:fs';
import { FIXES, applyFixes } from '../src/world/oradea/fixes.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map_buildings.json', A))) { console.log('skip: no public/assets/oradea/map_buildings.json'); process.exit(0); }
const map = { buildings: JSON.parse(readFileSync(new URL('map_buildings.json', A))) };
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };
const centre = (b) => { let x = 0, z = 0; const n = b.p.length / 2; for (let i = 0; i < b.p.length; i += 2) { x += b.p[i]; z += b.p[i + 1]; } return [x / n, z / n]; };

for (const f of FIXES) {
  const b = map.buildings.find((o) => o.id === f.id);
  const d = b ? Math.hypot(centre(b)[0] - f.at[0], centre(b)[1] - f.at[1]) : Infinity;
  ok(d < 3, `${f.id}: in the map, ${d.toFixed(1)} m from where it was fixed`);
  ok(f.why && !/—/.test(f.why), `${f.id}: says why, no em-dash`);
}
ok(applyFixes(map) === FIXES.length, 'applyFixes patches every fixed building');
ok(FIXES.every((f) => Object.entries(f.set).every(([k, v]) => map.buildings.find((o) => o.id === f.id)[k] === v)), 'the patched fields hold the new values');
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);

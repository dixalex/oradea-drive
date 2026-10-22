// Headless checks for Oradea's partners: node tests/oradea-partners.test.mjs
// Every partner place (kind 'ad') in places.js has a site, a pitch and a link; sites/partners.js gives every TABLE entry a
// door just outside its building, toward a road, kept clear of trees. Skipped without the compiled map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { inPoly } from '../src/world/cherkasy/geo.js';
import { PLACES } from '../src/world/oradea/places.js';
import { SITE, TABLE } from '../src/world/oradea/sites/partners.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A))) { console.log('skip: no public/assets/oradea/map.json'); process.exit(0); }
const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };

const ads = PLACES.filter((p) => p.kind === 'ad');
ok(ads.length >= 1, `${ads.length} partner(s): ${ads.map((p) => p.id).join(', ')}`);
for (const p of ads) {
  ok(/^https:\/\//.test(p.url) && p.pitch?.length >= 3 && p.name && p.note && p.icon, `${p.id}: link, name, note, icon, ${p.pitch?.length} pitch lines`);
  ok(TABLE.some((e) => e.id === p.id), `${p.id}: has a door in sites/partners.js`);
  ok(!/—/.test([p.name, p.note, ...(p.pitch ?? [])].join(' ')), `${p.id}: no em-dashes`);
}
ok(TABLE.every((e) => ads.some((p) => p.id === e.id)), 'every door belongs to a partner place');

const hf = createHeightField(map, new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0)));
const site = SITE.build({ root: new THREE.Group(), map, heightAt: hf.heightAt });
ok(site && !site.stats.missing.length, `every partner placed (missing: ${site?.stats.missing.join(', ') || 'none'})`);
for (const e of TABLE) {
  const d = site?.partners[e.id]?.door;
  if (!d) continue;
  const rings = e.ring ? [e.ring] : map.buildings.filter((b) => b.id === e.bld).map((b) => { const P = []; for (let i = 0; i < b.p.length; i += 2) P.push([b.p[i], b.p[i + 1]]); return P; });
  const wall = Math.min(...rings.flatMap((P) => P.map((p, i) => { const q = P[(i + 1) % P.length], dx = q[0] - p[0], dz = q[1] - p[1], L = dx * dx + dz * dz;
    const t = L ? Math.max(0, Math.min(1, ((d.x - p[0]) * dx + (d.z - p[1]) * dz) / L)) : 0; return Math.hypot(p[0] + t * dx - d.x, p[1] + t * dz - d.z); })));
  ok(!rings.some((P) => inPoly(P, d.x, d.z)) && wall > 2 && wall < (e.door ? 15 : 4.5), `${e.id}: door outside the building (${rings.length} part(s)), ${wall.toFixed(1)} m from the wall`);
  ok(Number.isFinite(d.y) && site.clear(d.x, d.z), `${e.id}: door on the ground, trees kept off`);
}
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);

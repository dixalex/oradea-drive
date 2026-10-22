// Headless checks for the Gara Oradea + Oradea Arena site (src/world/oradea/sites/gara.js) on the compiled map:
//   node tests/oradea-gara.test.mjs
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';

const ctx2d = new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} })
  : k === 'measureText' ? () => ({ width: 100 }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };
const { SITE } = await import('../src/world/oradea/sites/gara.js');

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const fails = [];
const check = (ok, msg) => { if (!ok) { fails.push(msg); console.log('FAIL', msg); } };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
const hf = createHeightField(map, dem);
const byId = new Map(map.buildings.map((b) => [b.id, b]));

// the OSM ids it replaces exist, and the station / arena are the ones the places point at
check(SITE.id === 'gara' && SITE.ground === true && typeof SITE.build === 'function', 'site contract');
for (const id of SITE.skip) check(byId.has(id), `skip id ${id} is in map_buildings.json`);
check(SITE.skip.includes(242379148) && SITE.skip.includes(998980470), 'the station and the arena outlines are skipped');
check(byId.get(242379148)?.name === 'Gara Oradea', 'OSM 242379148 is Gara Oradea');
check(/Arena/.test(byId.get(998980470)?.name ?? ''), 'OSM 998980470 is the arena');

const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const log = console.log; console.log = () => {};
const site = SITE.build({ root, solids: cw, zips: null, map, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt, onAsphalt: () => false } });
console.log = log;
check(site != null, 'the site builds');
check(site.footprints.length === 2, 'two footprints');
check(site.footprints.every((f) => f.poly.length >= 4 && f.id), 'footprints carry rings and ids');

// per building: budget, finite geometry, mesh count
const per = {};
let nan = 0;
root.traverse((o) => {
  if (!o.isMesh) return;
  const P = o.geometry.attributes.position, key = o.name.split('-')[0];
  const e = per[key] ??= { verts: 0, meshes: 0 };
  e.verts += P.count; e.meshes++;
  for (const v of P.array) if (!Number.isFinite(v)) nan++;
});
log(per, { solids: cw.count });
if (process.env.V) root.traverse((o) => { if (o.isMesh) log(o.name, o.geometry.attributes.position.count); });
check(nan === 0, 'all vertices are finite');
for (const [k, e] of Object.entries(per)) { check(e.verts <= 20000, `${k}: ${e.verts} verts over the 20k budget`); check(e.meshes <= 12, `${k}: ${e.meshes} draw calls over the budget`); }
check(per.gara && per.arena, 'both buildings made meshes');
check(cw.count > 60, 'colliders registered');

// clear() reports the footprints' lots, and not the open street
const mid = (id) => { const p = byId.get(id).p; let x = 0, z = 0; for (let i = 0; i < p.length; i += 2) { x += p[i]; z += p[i + 1]; } return [x / (p.length / 2), z / (p.length / 2)]; };
check(site.clear(...mid(242379148)) && site.clear(...mid(998980470)), 'clear() covers both buildings');
check(!site.clear(0, 0), 'clear() leaves the old town alone');
site.update(0.016, null);

// the collision world: the arena roof, the stairs (up from the plaza, across the landing, to the terrace) and the station platform
const top = (x, z, yMax) => cw.topAt(x, z, yMax);
const [ax, az] = mid(998980470);
check(top(ax, az).id >= 0, 'the arena is a solid');
{ const F = { o: [-540.7, 1447.7], a: Math.atan2(-33.1, 95.9) }, to = (u, v) => [F.o[0] + u * Math.cos(F.a) - v * Math.sin(F.a), F.o[1] + u * Math.sin(F.a) + v * Math.cos(F.a)];
  const g0 = hf.heightAt(...to(50, 41));
  const h = (u, v, max = g0 + 8) => top(...to(u, v), max).y - g0;
  check(Math.abs(h(-10, 50) - 0.35) < 0.7, `stair foot is low (${h(-10, 50).toFixed(2)} m)`);
  check(Math.abs(h(-2, 50) - 2.9) < 0.2, `landing 2.9 m (${h(-2, 50).toFixed(2)} m)`);
  check(h(5, 50) > h(2, 50) && h(2, 50) > h(-0.5, 50) - 0.01, 'the upper flight climbs');
  check(Math.abs(h(9, 50) - 5.7) < 0.2, `terrace at deck level (${h(9, 50).toFixed(2)} m)`);
  check(h(50, 41, Infinity) > 24, `roof over the hall (${h(50, 41, Infinity).toFixed(1)} m)`); }
{ const F = { o: [-437.9, -1719.3], a: 33.924336 * Math.PI / 180 }, to = (u, v) => [F.o[0] + u * Math.cos(F.a) - v * Math.sin(F.a), F.o[1] + u * Math.sin(F.a) + v * Math.cos(F.a)];
  const p = top(...to(30, -6)), w = top(...to(66, 8));
  check(p.id >= 0 && Number.isFinite(p.y), 'platform 1 is a solid'); check(w.id >= 0 && w.y > p.y + 8, 'the station block is tall'); }
log(fails.length ? `${fails.length} failed` : 'oradea-gara: ok');
process.exit(fails.length ? 1 : 0);

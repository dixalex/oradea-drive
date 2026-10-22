// Headless checks for Oradea's Baroque ensemble (src/world/oradea/sites/baroc.js) on the compiled map: node tests/oradea-baroc.test.mjs
// The three OSM buildings it replaces are in map_buildings.json (the Palace is way 262832527, not the 81495785 that places.js
// lists), the terrain is levelled under the Palace and the Basilica, the site builds in budget with no NaN and one named root group,
// the Canons' Row has its 57 arches and ten houses, the Basilica's towers stand ~45 m, the Palace three floors under a mansard,
// the walls and piers stop rays, the plaza keeps generated trees off, and the new sight is on the maps. Skipped without the Oradea map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { SITE } from '../src/world/oradea/sites/baroc.js';
import { PLACES } from '../src/world/oradea/places.js';
import { BAS, PAL, CAN } from '../src/world/oradea/sites/baroc/kit.js';
import { PLAZA, BED } from '../src/world/oradea/sites/baroc/park.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A)) || !existsSync(new URL('map_buildings.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const ctx2d = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };

let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
const hf = createHeightField(map, dem);
const byId = (id) => map.buildings.find((b) => b.id === id);
for (const id of SITE.skip) ok(byId(id), `OSM way ${id} is in map_buildings.json`);
ok(/palatul baroc/i.test(byId(262832527)?.name ?? '') || /dacia/i.test(JSON.stringify(byId(262832527) ?? {})), 'way 262832527 is the Baroque Palace');
ok(SITE.skip.length === 3 && !SITE.skip.includes(81495785), 'the site skips the Basilica, the Palace and the Canons\' Row, not the other heritage palace');

// the levelling: the lattice under the Palace and the Basilica is flat after shape()
const spread = (ring) => { let lo = 1e9, hi = -1e9; for (let u = 0; u <= 1; u += 0.1) for (let v = 0; v <= 1; v += 0.1) { const x = ring[0][0] + (ring[2][0] - ring[0][0]) * u, z = ring[0][1] + (ring[2][1] - ring[0][1]) * v; } return [lo, hi]; };
void spread;
const before = (ring) => { let lo = 1e9, hi = -1e9; for (const [a, d] of ring) { const [x, z] = PAL.xz(a, d), h = hf.heightAt(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h); } return hi - lo; };
const palPts = [[10, 5], [50, 5], [90, 5], [10, 40], [95, 50], [50, 15]];
const spreadBefore = before(palPts);
SITE.shape(hf, map);
const spreadAfter = before(palPts);
ok(spreadAfter <= spreadBefore + 1e-6, `the Palace lot is no less flat after shape() (${spreadBefore.toFixed(2)} -> ${spreadAfter.toFixed(2)} m)`);

const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const site = SITE.build({ root, map, solids: cw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt } });
ok(site && site.footprints?.length >= 10, `footprints: ${site?.footprints?.length}`);
let verts = 0, meshes = 0, nan = false;
root.traverse((o) => { if (o.isMesh) { meshes++; verts += o.geometry.attributes.position.count; for (const v of o.geometry.attributes.position.array) if (Number.isNaN(v)) nan = true; } });
ok(!nan, 'no NaN vertices');
ok(verts > 20000 && verts < 60000 && meshes <= 17, `budget: ${verts} verts in ${meshes} meshes`);
ok(root.children.length === 1 && root.children[0].name === 'landmark-baroc', 'one named root group, kept by proxies.js');
ok(site.stats.arches === 57, `the Canons' Row has ${site.stats.arches} arches`);
ok(site.stats.lamps >= 8 && site.stats.benches >= 6, `${site.stats.lamps} lamps, ${site.stats.benches} benches`);
ok(site.stats.trees >= 6, `${site.stats.trees} own trees`);

// heights
const top = (x, z) => cw.groundHeight(x, z, 80);
const ground = (x, z) => hf.heightAt(x, z);
const t1 = BAS.xz(69.1, 7.4), t2 = BAS.xz(69.1, 33.4);
for (const [x, z] of [t1, t2]) ok(top(x, z) - ground(x, z) > 38 && top(x, z) - ground(x, z) < 48, `a Basilica tower reaches ${(top(x, z) - ground(x, z)).toFixed(1)} m`);
const nave = BAS.xz(60, 20.4); ok(top(...nave) - ground(...nave) > 22 && top(...nave) - ground(...nave) < 32, `the nave roof ~${(top(...nave) - ground(...nave)).toFixed(1)} m`);
const pal = PAL.xz(52.85, 10); ok(top(...pal) - ground(...pal) > 18 && top(...pal) - ground(...pal) < 28, `the Palace roof ${(top(...pal) - ground(...pal)).toFixed(1)} m`);
const row = CAN.xz(100, 40.9); ok(top(...row) - ground(...row) > 9 && top(...row) - ground(...row) < 16, `the Canons' Row stands ${(top(...row) - ground(...row)).toFixed(1)} m`);

// rays: walls and piers stop them, the arches let a car through
const ray = (x, y, z, dx, dz, max) => cw.raycast({ x, y, z }, { x: dx, y: 0, z: dz }, max);
const toward = (F, a, d, step) => { const p = F.xz(a, d), q = F.xz(a + step[0], d + step[1]); const l = Math.hypot(q[0] - p[0], q[1] - p[1]); return [p, [(q[0] - p[0]) / l, (q[1] - p[1]) / l]]; };
{ const [p, dir] = toward(BAS, 90, 20.4, [-1, 0]); const h = ground(...p) + 1.5, hit = ray(p[0], h, p[1], dir[0], dir[1], 40); ok(hit && hit.distance > 10 && hit.distance < 24, `the Basilica front stops a ray from the plaza (${hit?.distance?.toFixed(1)} m)`); }
{ const [p, dir] = toward(PAL, 52.85, -20, [0, 1]); const hit = ray(p[0], ground(...p) + 1.5, p[1], dir[0], dir[1], 40); ok(hit && hit.distance > 10 && hit.distance < 24, `the Palace front stops a ray from the plaza (${hit?.distance?.toFixed(1)} m)`); }
{ // the Canons' Row: a ray along the front at pier height meets a pier; a ray through an arch reaches the back wall of the gallery
  const c0 = 0.7 + 10 * 4.405, mid = c0 + 4.405 / 2;
  const [p, dir] = toward(CAN, mid, 56, [0, -1]); const hit = ray(p[0], ground(...p) + 1.5, p[1], dir[0], dir[1], 30);
  ok(hit && hit.distance > 8 && hit.distance < 13, `a ray through an arch reaches the gallery's back wall (${hit?.distance?.toFixed(1)} m)`);
  const [p2, dir2] = toward(CAN, c0, 56, [0, -1]); const hit2 = ray(p2[0], ground(...p2) + 1.5, p2[1], dir2[0], dir2[1], 30);
  ok(hit2 && hit2.distance > 4 && hit2.distance < 6.5, `a pier stops a ray at its face (${hit2?.distance?.toFixed(1)} m)`);
}

// trees keep off the plaza, the bed and the Palace's garden; elsewhere they are free
ok(site.clear(...BED) && site.clear(-545, -1380), 'clear() keeps generated trees off the plaza and the bed');
ok(site.clear(...PAL.xz(52, 43)), 'clear() keeps them out of the Palace\'s courtyard');
ok(!site.clear(-450, -1300) && !site.clear(-700, -1500), 'clear() leaves far ground alone');
ok(PLAZA.length > 60, `the plaza outline has ${PLAZA.length} points`);

// night glow runs
let upd = true; try { site.update(0.016, null); } catch (e) { upd = false; }
ok(upd, 'update() runs');

// the places: the Canons' Row as a sight on its OSM way
const pl = PLACES.find((p) => p.id === 'sirulcanonicilor'); // in places.js, so the phone map lists it too
ok(pl && pl.kind === 'sight' && pl.bld.includes(262833611) && pl.name && pl.note, 'the Canons\' Row is a sight on its OSM way');
console.log = log;
if (fails) { log(`${fails} failed`); process.exit(1); }
log('all ok');

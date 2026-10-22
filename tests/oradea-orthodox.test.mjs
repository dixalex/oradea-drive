// Headless checks for Oradea's Orthodox churches (src/world/oradea/sites/orthodox.js) on the compiled map: node tests/oradea-orthodox.test.mjs
// Skipped without the Oradea map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { FRAME_OF } from '../src/world/cherkasy/frame.js';
import { SITE } from '../src/world/oradea/sites/orthodox.js';
import { PLACES } from '../src/world/oradea/places.js';
import { newSet, KEYS } from '../src/world/oradea/sites/orthodox/kit.js';
import { buildChurch } from '../src/world/oradea/sites/orthodox/church.js';
import { buildCathedral, CATHEDRAL_ID } from '../src/world/oradea/sites/orthodox/cathedral.js';
import { buildTrinity, TRINITY_ID } from '../src/world/oradea/sites/orthodox/trinity.js';
import { buildWooden, WOODEN_ID } from '../src/world/oradea/sites/orthodox/wooden.js';
import { buildAndrei, ANDREI_ID } from '../src/world/oradea/sites/orthodox/andrei.js';
import { buildMihail, MIHAIL_ID } from '../src/world/oradea/sites/orthodox/mihail.js';
import { KIT } from '../src/world/oradea/sites/orthodox/specs.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A)) || !existsSync(new URL('map_buildings.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const ctx2d = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };

let fails = 0;
const log = console.log; const logs = []; console.log = (...a) => { logs.push(a.join(' ')); };
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
const hf = createHeightField(map, dem);
const geo = FRAME_OF(map);
const byId = (id) => map.buildings.find((b) => b.id === id);

for (const id of SITE.skip) ok(byId(id), `OSM building ${id} is in map_buildings.json`);

const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const t0 = Date.now();
const site = SITE.build({ root, map, solids: cw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt }, geo });
const ms = Date.now() - t0;
console.log = log;
for (const l of logs) if (/failed|Error/.test(l)) log('  log:', l);
ok(site && site.footprints?.length >= 18, `footprints: ${site?.footprints?.length}`);
ok(site.stats.skipped.length === 0, `no church skipped (${site.stats.skipped.join(',')})`);
let verts = 0, meshes = 0, nan = false;
root.traverse((o) => { if (o.isMesh) { meshes++; verts += o.geometry.attributes.position.count; for (const v of o.geometry.attributes.position.array) if (Number.isNaN(v)) nan = true; } });
ok(!nan, 'no NaN vertices');
ok(meshes <= 15, `draw calls: ${meshes} meshes (budget 15)`);
log(`     ${verts} vertices, ${site.stats.churches} churches, ${site.stats.windows} windows, ${site.stats.domes} domes, ${site.stats.towers} towers, ${cw.count} solids, ${ms} ms`);
ok(root.children.length === 1 && root.children[0].name === 'landmark-orthodox', 'one named root group');

// ---- the five tier-(a) churches as sights: bilingual strings, a building id each, no em-dashes
const SIGHTS = PLACES.filter((p) => ['catedralaortodoxa', 'sftreime', 'sfandrei', 'sfmihailgavriil', 'bisericalemn'].includes(p.id)); // moved into places.js
ok(SITE.places.length === 0 && SIGHTS.length === 5 && new Set(PLACES.map((p) => p.id)).size === PLACES.length, `five sights in places.js, ids unique (${SIGHTS.map((p) => p.id).join(', ')})`);
ok(SIGHTS.every((p) => p.kind === 'sight' && p.icon && typeof p.name === 'string' && p.name.length > 4 && typeof p.note === 'string' && p.note.length > 8 && p.bld?.length === 1 && byId(p.bld[0]) && SITE.skip.includes(p.bld[0])), 'sights have a name, a note, an icon and a replaced building');
ok(SIGHTS.every((p) => !/\u2014/.test(p.name + p.note)), 'no em-dashes in the sights');
ok(['catedralaortodoxa', 'sftreime', 'sfandrei', 'sfmihailgavriil', 'bisericalemn'].every((id) => SIGHTS.some((p) => p.id === id)), 'the five expected place ids');

// ---- vertex budgets: each tier-(a) church alone, then the kit churches
const g = (x, z) => hf.heightAt(x, z), ringOf = (id) => { const b = byId(id), P = []; for (let i = 0; i < b.p.length; i += 2) P.push([b.p[i], b.p[i + 1]]); return P; };
const vertsOf = (fn) => { const B = newSet(); const res = fn(B); return { n: KEYS.reduce((a, k) => a + B[k].v, 0), res }; };
const HAND = [['catedrala', CATHEDRAL_ID, buildCathedral, 8000, 45], ['treime', TRINITY_ID, buildTrinity, 6000, 9], ['lemn', WOODEN_ID, buildWooden, 6000, 12], ['andrei', ANDREI_ID, buildAndrei, 16000, 30], ['mihail', MIHAIL_ID, buildMihail, 9000, 28]];
const heights = {};
for (const [key, id, fn, budget, minTop] of HAND) {
  const cw2 = createCollisionWorld({ terrain: g });
  const { n, res } = vertsOf((B) => fn({ B, S: cw2, g, ring: ringOf(id) }));
  heights[key] = res.top - res.gLo;
  if (key === 'catedrala' || key === 'andrei') {      // the front stair is a ramp a car can climb: the top rises toward the door
    const u0 = res.F.minU, hs = [3.5, 2.2, 0.8].map((d) => { const [x, z] = res.F.toMap(u0 - d + (key === 'catedrala' ? -2 : 0), key === 'catedrala' ? 0.6 : 0); return cw2.groundHeight(x, z, 150); });
    ok(hs[0] < hs[1] && hs[1] < hs[2] && hs[2] - hs[0] > 0.3, `${key}: the stair rises toward the door (${hs.map((h) => h.toFixed(2)).join(' < ')})`);
  }
  ok(n > 800 && n <= 20000 && n <= budget * 1.0 + 3000, `${key}: ${n} vertices (tier-a limit 20000)`);
  ok(res.top - res.Fy >= minTop * 0.55 && res.top - res.Fy < 80, `${key}: top ${(res.top - res.Fy).toFixed(1)} m over its floor`);
  ok(res.footprints.length === 1 && res.footprints[0].id === id && res.footprints[0].poly.flat().every(Number.isFinite), `${key}: one footprint with its OSM id`);
}
ok(heights.catedrala > heights.andrei && heights.andrei > heights.mihail * 0.9 && heights.mihail > heights.treime, `tallest to lowest: cathedral ${heights.catedrala.toFixed(0)}, St Andrew ${heights.andrei.toFixed(0)}, Velența ${heights.mihail.toFixed(0)}, Trinity ${heights.treime.toFixed(0)} m`);
let kitMax = 0, kitVerts = 0;
for (const spec of KIT) {
  if (spec.node) continue;
  const ring = typeof spec.ring === 'function' ? spec.ring() : ringOf(spec.id), cw2 = createCollisionWorld({ terrain: g });
  const { n } = vertsOf((B) => buildChurch({ B, S: cw2, g, spec, ring }));
  kitMax = Math.max(kitMax, n); kitVerts += n;
  ok(n > 300 && n <= 6500, `kit ${spec.key}: ${n} vertices`);
}
log(`     kit churches: ${KIT.length - 1} measured, largest ${kitMax}, together ${kitVerts} vertices`);

// ---- colliders: the car meets walls, towers and roofs; the lots stay clear of generated trees
const top = (x, z) => cw.groundHeight(x, z, 150) - hf.heightAt(x, z);
const centre = (id) => { const f = site.footprints.find((q) => q.id === id), n = f.poly.length; return f.poly.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]); };
for (const [key, id, , , minTop] of HAND) { const [cx, cz] = centre(id), t = top(cx, cz); ok(t > 3 && t < 80, `${key}: solid at its centre, ${t.toFixed(1)} m over the ground`); void minTop; }
const [cx0, cz0] = centre(CATHEDRAL_ID);
ok(top(cx0, cz0) > 15, `cathedral roof/hall solid ${top(cx0, cz0).toFixed(1)} m`);
for (const f of site.footprints) { const n = f.poly.length, c = f.poly.reduce((a, p) => [a[0] + p[0] / n, a[1] + p[1] / n], [0, 0]); ok(site.clear(c[0], c[1]), `clear() covers ${f.name}`); }
ok(!site.clear(0, 0) && typeof site.update === 'function', 'clear() is local; update(dt) drives the night glow');
if (fails) { log(fails + ' failed'); process.exit(1); } else log('all ok');

// Headless checks for Oradea's Baptist churches (src/world/oradea/sites/baptist.js) on the compiled map: node tests/oradea-baptist.test.mjs
// Every OSM way / relation the site replaces is in map_buildings.json, the terrain is levelled under Emanuel and BBSO, the site builds
// in budget with no NaN and one named root group per church, the two big churches stand at their real heights, each small church has
// its three meshes, the lots keep generated trees off, and the two sights are in places.js.
// Skipped without the Oradea map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { SITE } from '../src/world/oradea/sites/baptist.js';
import { PLACES } from '../src/world/oradea/places.js';
import { CHAPELS } from '../src/world/oradea/sites/baptist/chapels.js';
import { BBSO_RING, bbsoToMap } from '../src/world/oradea/sites/baptist/bbso.js';
import { C as EM_C, EMANUEL_RINGS } from '../src/world/oradea/sites/baptist/emanuel.js';

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

// what the site replaces
ok(SITE.skip.length === 8 && new Set(SITE.skip).size === 8, `skips ${SITE.skip.length} distinct OSM buildings`);
for (const id of SITE.skip) ok(byId(id), `OSM building ${id} is in map_buildings.json`);
const emRel = byId(3530253);
ok(emRel && /emanuel/i.test(JSON.stringify(emRel)), 'relation 3530253 is Emanuel');
ok(BBSO_RING.every((p, i) => { const q = byId(1264556370)?.p; return q && Math.abs(q[2 * i] - p[0]) < 0.06 && Math.abs(q[2 * i + 1] - p[1]) < 0.06; }), 'BBSO_RING is the OSM way 1264556370');
for (const c of CHAPELS) {
  const b = byId(c.id), p = b?.p ?? [];
  ok(b && p.length / 2 === c.ring.length && c.ring.every((q, i) => Math.abs(q[0] - p[2 * i]) < 0.06 && Math.abs(q[1] - p[2 * i + 1]) < 0.06), `${c.slug}: ring matches OSM ${c.id}`);
}

// the places: two new sights with real building ids, not already in places.js
const SIGHTS = PLACES.filter((q) => q.id === 'emanuel' || q.id === 'bbso'); // moved into places.js
ok(SITE.places.length === 0 && SIGHTS.length === 2, `places.js lists ${SIGHTS.map((q) => q.id).join(', ')}`);
ok(new Set(PLACES.map((q) => q.id)).size === PLACES.length, 'place ids are unique');
for (const q of SIGHTS) ok(q.kind === 'sight' && q.icon && q.name && q.note && q.bld?.every((id) => byId(id)), `${q.id}: kind, icon, name, note, bld ids in the map`);

// the terrain: flat under Emanuel's drum and under BBSO after shape()
const spread = (pts) => { let lo = 1e9, hi = -1e9; for (const [x, z] of pts) { const h = hf.heightAt(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h); } return hi - lo; };
const bbsoPts = [[0, 0], [84, 0], [84, 40], [0, 40], [42, 20], [20, 48], [60, 48]].map(([u, v]) => bbsoToMap(u, v));
const emPts = [[EM_C[0], EM_C[1]], [EM_C[0] + 20, EM_C[1]], [EM_C[0] - 20, EM_C[1]], [EM_C[0], EM_C[1] + 20], [EM_C[0], EM_C[1] - 20]];
const sb = spread(bbsoPts), se = spread(emPts);
SITE.shape(hf, map);
const sa = spread(bbsoPts), ea = spread(emPts);
ok(sa <= sb + 1e-6 && sa < 0.35, `BBSO lot spread ${sb.toFixed(2)} -> ${sa.toFixed(2)} m`);
ok(ea <= se + 1e-6 && ea < 0.35, `Emanuel lot spread ${se.toFixed(2)} -> ${ea.toFixed(2)} m`);

const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const site = SITE.build({ root, map, solids: cw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt } });
ok(site, 'builds');
let verts = 0, meshes = 0, nan = false;
const per = {};
root.traverse((o) => {
  if (!o.isMesh) return;
  meshes++; verts += o.geometry.attributes.position.count;
  const g = o.parent?.name ?? '?'; per[g] = per[g] ?? { verts: 0, meshes: 0 }; per[g].verts += o.geometry.attributes.position.count; per[g].meshes++;
  for (const v of o.geometry.attributes.position.array) if (!Number.isFinite(v)) nan = true;
});
ok(!nan, 'no NaN / infinite vertices');
const names = root.children.map((c) => c.name).sort();
const want = ['landmark-emanuel', 'landmark-bbso', ...CHAPELS.map((c) => `baptist-${c.slug}`)].sort();
ok(JSON.stringify(names) === JSON.stringify(want), `root groups: ${names.join(', ')}`);
ok(per['landmark-emanuel'].verts > 15000 && per['landmark-emanuel'].verts <= 25000 && per['landmark-emanuel'].meshes <= 10, `Emanuel: ${per['landmark-emanuel'].verts} verts, ${per['landmark-emanuel'].meshes} meshes`);
ok(per['landmark-bbso'].verts > 6000 && per['landmark-bbso'].verts <= 25000 && per['landmark-bbso'].meshes <= 11, `BBSO: ${per['landmark-bbso'].verts} verts, ${per['landmark-bbso'].meshes} meshes`);
for (const c of CHAPELS) { const p = per[`baptist-${c.slug}`]; ok(p && p.meshes <= 3 && p.verts > 200 && p.verts <= 3500, `${c.slug}: ${p?.verts} verts, ${p?.meshes} meshes`); }
ok(verts < 50000, `${verts} verts in ${meshes} meshes in all`);

// heights (a ray down from 80 m, minus the ground there)
const top = (x, z) => cw.groundHeight(x, z, 80) - hf.heightAt(x, z);
const [hx, hz] = bbsoToMap(42, 14), [ex, ez] = bbsoToMap(78, 20), [wx, wz] = bbsoToMap(22, 36), [px, pz] = bbsoToMap(41, 38);
ok(top(EM_C[0] + 10, EM_C[1]) > 15 && top(EM_C[0] + 10, EM_C[1]) < 20, `Emanuel's drum stands ${top(EM_C[0] + 10, EM_C[1]).toFixed(1)} m on the low half`);
ok(top(EM_C[0] - 10, EM_C[1]) > 17 && top(EM_C[0] - 10, EM_C[1]) < 21.5, `and ${top(EM_C[0] - 10, EM_C[1]).toFixed(1)} m on the high half`);
ok(top(-884, 300) > 18 && top(-884, 300) < 25, `the stair tower stands ${top(-884, 300).toFixed(1)} m`);
ok(top(hx, hz) > 19 && top(hx, hz) < 23, `BBSO's hall box stands ${top(hx, hz).toFixed(1)} m`);
ok(top(ex, ez) > 14.5 && top(ex, ez) < 18.5, `its east volume ${top(ex, ez).toFixed(1)} m (collider to the crown's crest)`);
ok(top(wx, wz) > 11 && top(wx, wz) < 14, `its west wing ${top(wx, wz).toFixed(1)} m`);
ok(top(px, pz) > 5 && top(px, pz) < 18.5, `its entrance block is solid (${top(px, pz).toFixed(1)} m)`);
const chapelTop = {};
for (const c of CHAPELS) { const mx = c.ring.reduce((s, p) => s + p[0], 0) / c.ring.length, mz = c.ring.reduce((s, p) => s + p[1], 0) / c.ring.length; chapelTop[c.slug] = top(mx, mz); ok(chapelTop[c.slug] > 3 && chapelTop[c.slug] < 14, `${c.slug} stands ${chapelTop[c.slug].toFixed(1)} m`); }

// the lots keep generated trees off, the footprints carry the OSM ids, the maps get the churches
ok(site.clear(EM_C[0], EM_C[1]) && site.clear(...bbsoToMap(40, 20)) && !site.clear(0, 0), 'clear() covers the two lots and nothing else');
for (const c of CHAPELS) ok(site.clear(c.ring[0][0] * 0.7 + c.ring[1][0] * 0.3, c.ring[0][1] * 0.7 + c.ring[1][1] * 0.3) || site.clear(...c.ring.reduce((s, p) => [s[0] + p[0] / c.ring.length, s[1] + p[1] / c.ring.length], [0, 0])), `${c.slug}: clear() covers the church`);
const fpIds = new Set(site.footprints.map((f) => f.id));
ok(SITE.skip.every((id) => fpIds.has(id)), 'a footprint for every skipped building');
ok(site.footprints.every((f) => f.kind === 'church' && f.poly.length >= 3 && f.poly.flat().every(Number.isFinite) && f.h > 3), 'footprints are churches with outlines and heights');
ok(site.footprints.filter((f) => f.id === 3530253).length === EMANUEL_RINGS.length, 'Emanuel has its three rings');
ok(site.spots.length >= 10 && site.spots.every((s) => Number.isFinite(s.x) && Number.isFinite(s.y) && s.pal), `${site.spots.length} own trees`);
ok(typeof site.update === 'function', 'update(dt) drives the night glow');
site.update(0.016, null);

log(fails ? `${fails} failed` : 'all ok');
process.exit(fails ? 1 : 0);

// Headless checks for Piața Unirii (src/world/oradea/sites/unirii.js and unirii/*.js) on the compiled Oradea map:
// node tests/oradea-unirii.test.mjs
//   the three OSM buildings it replaces are in the map and listed in `skip`; the site builds into one group
//   (landmark-unirii, so the far-site proxies never swap it for boxes) within the vertex / mesh budget with finite geometry;
//   each building's footprint sits on its OSM outline; the statue stands on the Ferdinand I node; colliders exist for the
//   buildings, the statue, the wall, the basins; trees keep off the square and the lots; the places resolve.
// Skipped when the Oradea map is absent.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { resolvePlaces } from '../src/world/cherkasy/places.js';
import { SITE } from '../src/world/oradea/sites/unirii.js';
import { toLocal, toMap, O } from '../src/world/oradea/sites/unirii/frame.js';
import { LAYOUT } from '../src/world/oradea/sites/unirii/paving.js';
import { PLACES } from '../src/world/oradea/places.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const ctx2d = new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} })
  : k === 'measureText' ? () => ({ width: 100 }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };

let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
const hf = createHeightField(map, dem);

// ---- the OSM ways it replaces
const IDS = { moon: 651522972, cathedral: 286245385, palace: 41415055 };
for (const [k, id] of Object.entries(IDS)) ok(map.buildings.some((b) => b.id === id), `OSM way ${id} (${k}) is in map_buildings.json`);
ok(Object.values(IDS).every((id) => SITE.skip.includes(id)), 'the site skips all three outlines');
ok(SITE.id === 'unirii' && typeof SITE.build === 'function', 'site contract: id and build');

// ---- build
const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const out = SITE.build({ root, T: null, map, solids: cw, zips: null, heightAt: hf.heightAt, ground: null, geo: null, facadeMat: null, detailMat: null, railLevel: null, bridges: [] });
ok(root.children.length === 1 && root.children[0].name === 'landmark-unirii', 'one root group named landmark-unirii');
let verts = 0, meshes = 0, nan = 0, ytop = 0;
root.updateMatrixWorld(true);
root.traverse((o) => {
  if (!o.isMesh) return;
  meshes++;
  const P = o.geometry.attributes.position;
  verts += P.count;
  for (let i = 0; i < P.array.length; i++) if (!Number.isFinite(P.array[i])) nan++;
  for (let i = 1; i < P.array.length; i += 3) ytop = Math.max(ytop, P.array[i]);
});
ok(nan === 0, 'every vertex is finite');
ok(verts > 8000 && verts <= 48000, `vertices: ${verts} (budget 30k for the buildings and the statue, plus the paving grid)`);
ok(meshes <= 18, `meshes (draw calls): ${meshes}`);
ok(cw.count > 60, `colliders: ${cw.count}`);
ok(out.footprints.length === 3, 'three footprints (Biserica cu Lună, the cathedral, the palace)');
ok(typeof out.update === 'function' && typeof out.clear === 'function', 'update and clear are functions');
out.update(0.016, null);

// ---- each building on its OSM outline
const ring = (id) => map.buildings.filter((b) => b.id === id).map((b) => b.p)[0];
const centre = (p) => { let x = 0, z = 0, n = p.length / 2; for (let i = 0; i < p.length; i += 2) { x += p[i]; z += p[i + 1]; } return [x / n, z / n]; };
for (const fp of out.footprints) {
  const osm = ring(fp.id), flat = fp.poly.flat?.() ?? fp.poly;
  ok(!!osm, `footprint ${fp.name}: OSM way ${fp.id}`);
  const [ax, az] = centre(osm), [bx, bz] = centre(flat);
  ok(Math.hypot(ax - bx, az - bz) < 5, `${fp.name}: centre within 5 m of the OSM outline (${Math.hypot(ax - bx, az - bz).toFixed(1)} m)`);
  ok(fp.h > 10, `${fp.name}: height ${fp.h.toFixed(1)} m`);
}
const tall = Math.max(...out.footprints.map((f) => f.h));
ok(tall > 45 && tall < 70, `the Moon Church tower is the tallest: ${tall.toFixed(1)} m`);

// ---- the statue stands on the Ferdinand I node and is solid
const [sx, sz] = toMap(0, 0);
ok(Math.hypot(sx - O[0], sz - O[1]) < 0.01, 'the site frame sits on the statue node');
const g0 = hf.heightAt(sx, sz);
ok(cw.inside(sx, g0 + 2, sz), 'the pedestal is solid');
// the west wall stops a body; the lantern columns are solid
const [wx, wz] = toMap(-24.8, -20);
ok(cw.inside(wx, hf.heightAt(wx, wz) + 0.6, wz), 'the balustrade is solid at 0.6 m');
const [cx, cz] = toMap(-23.4, -30);
ok(cw.inside(cx, hf.heightAt(cx, cz) + 2, cz), 'a lantern column is solid');
// the church doors are not walled in: a point in front of the Moon Church portal is free
{ const [px, pz] = toMap(63, 130); ok(!cw.inside(px, hf.heightAt(px, pz) + 1, pz), 'open paving in front of the Moon Church'); }

// ---- trees keep off the square and the lots
const [ex, ez] = toMap(40, 0), [fx, fz] = toMap(40, 100), [gx, gz] = toMap(150, 0);
ok(out.clear(ex, ez), 'the limestone field keeps trees off');
ok(out.clear(fx, fz), 'the promenade keeps trees off');
ok(!out.clear(gx, gz), 'far ground is not cleared');
const MOONC = centre(ring(IDS.moon)), CATHC = centre(ring(IDS.cathedral)), PALC = centre(ring(IDS.palace));
ok(out.clear(...MOONC) && out.clear(...CATHC) && out.clear(...PALC), 'the three building lots keep trees off');
ok(Array.isArray(out.spots) && out.spots.length > 5 && out.spots.every((s) => Number.isFinite(s.x) && Number.isFinite(s.z) && s.variant), `young trees listed: ${out.spots.length}`);

// ---- places
const placeIds = new Set(PLACES.map((p) => p.id));
ok(SITE.places.every((p) => !placeIds.has(p.id)), 'the site does not re-add a place of places.js');
const res = resolvePlaces(map, { toXZ: () => null }, [...PLACES, ...SITE.places]);
const byId = Object.fromEntries(res.map((p) => [p.id, p]));
ok(byId.piataunirii && byId.piataunirii.kind === 'sight', 'sight piataunirii resolves');
ok(byId.palatulepiscopal && byId.palatulepiscopal.rings.length === 1 && byId.palatulepiscopal.kind === 'improved', 'improved palatulepiscopal resolves with its OSM ring');
ok(SITE.places.every((p) => typeof p.name === 'string' && p.name.length > 2 && !p.name.includes('—')), 'place names are strings without em-dashes');

// ---- the paving covers the central field and the tram bed keeps its rails to the square
ok(LAYOUT.tramA.every(([e]) => e >= -27 && e <= 72) && LAYOUT.tramB.every(([e]) => e >= -27 && e <= 72), 'rails stay inside the square (e from -27 to 72)');
const [le, ls] = toLocal(sx, sz);
ok(Math.hypot(le, ls) < 0.01, 'toLocal inverts toMap');

console.log = log;
log(`${fails ? 'FAILED' : 'passed'}: ${fails} failing; ${verts} vertices, ${meshes} meshes, ${cw.count} colliders`);
process.exit(fails ? 1 : 0);

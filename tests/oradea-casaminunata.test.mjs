// Headless checks for Casa Minunată (src/world/oradea/sites/casaminunata.js) on the compiled Oradea map: node tests/oradea-casaminunata.test.mjs
// The OSM way it replaces exists and its outline is what the four volumes add up to, the site builds in budget (<= 15k vertices, <= 6
// meshes) with no NaN, the walls and roofs are solid, the partner's door ring and the street gate stay drivable, generated trees stay
// off the building and the grounds, and the partner entry is in places.js and sites/partners.js. Skipped without the Oradea map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { inPoly, area2 } from '../src/world/cherkasy/geo.js';
import { SITE as PARTNERS, TABLE } from '../src/world/oradea/sites/partners.js';
import { PLACES } from '../src/world/oradea/places.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A)) || !existsSync(new URL('map_buildings.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const ctx2d = new Proxy({}, { get: () => () => ({ addColorStop() {}, width: 100 }), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };
const { SITE, OSM_ID } = await import('../src/world/oradea/sites/casaminunata.js');
const { RING, VOL, PORCH } = await import('../src/world/oradea/sites/casaminunata/building.js');
const { toMap, toLoc, inLot } = await import('../src/world/oradea/sites/casaminunata/kit.js');
const { GATES } = await import('../src/world/oradea/sites/casaminunata/grounds.js');

let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const hf = createHeightField(map, new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0)));

// the OSM way and the outline the volumes add up to
const osm = map.buildings.find((b) => b.id === OSM_ID);
ok(SITE.skip.length === 1 && SITE.skip[0] === 436834224 && osm && osm.bt === 'kindergarten', 'skip id 436834224 is the OSM kindergarten in map_buildings.json');
ok(SITE.places.length === 0, 'no new places (the partner entry is in places.js)');
const ring = RING.map(([u, v]) => toMap(u, v)), P = []; for (let i = 0; i < osm.p.length; i += 2) P.push([osm.p[i], osm.p[i + 1]]);
const near = (a, B) => Math.min(...B.map((b) => Math.hypot(a[0] - b[0], a[1] - b[1])));
ok(ring.length === P.length && ring.every((p) => near(p, P) < 0.3), `RING matches the ${P.length} OSM vertices within 0.3 m (worst ${Math.max(...ring.map((p) => near(p, P))).toFixed(2)} m)`);
ok(Math.abs(Math.abs(area2(ring)) - Math.abs(area2(P))) / Math.abs(area2(P)) < 0.01, `outline area ${(Math.abs(area2(ring)) / 2).toFixed(0)} m2 vs OSM ${(Math.abs(area2(P)) / 2).toFixed(0)}`);
const rects = Object.values(VOL), inVols = (u, v) => rects.some((r) => u >= r.u0 - 1e-6 && u <= r.u1 + 1e-6 && v >= r.v0 - 1e-6 && v <= r.v1 + 1e-6);
let bad = 0, n = 0; for (let u = -5.07; u < 52; u += 0.25) for (let v = -1.07; v < 48; v += 0.25) { n++; if (inVols(u, v) !== inPoly(RING, u, v)) bad++; }
ok(bad === 0, `the four volumes fill the outline exactly (${bad} of ${n} sample points disagree)`);

// the partner: places.js entry, the door of sites/partners.js, the board dropped (this model carries the lettering)
const entry = PLACES.find((q) => q.id === 'casaminunata'), row = TABLE.find((e) => e.id === 'casaminunata');
ok(entry && entry.kind === 'ad' && entry.bld.includes(OSM_ID) && row && row.bld === OSM_ID, 'places.js and partners.js TABLE both have casaminunata on the OSM way');
ok(row && row.sign === undefined, 'partners.js draws no board for it (the name plate is in the model)');
ok(!('partners' in SITE), 'the site does not export partners');

// build it
const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const base = { root, map, solids: cw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt } };
const site = SITE.build(base);
ok(site, 'builds');
let verts = 0, meshes = 0, nan = false;
root.traverse((o) => { if (!o.isMesh) return; meshes++; verts += o.geometry.attributes.position.count; for (const v of o.geometry.attributes.position.array) if (!Number.isFinite(v)) nan = true; });
ok(!nan, 'no NaN / infinite vertices');
ok(root.children.length === 1 && root.children[0].name === 'landmark-casaminunata', 'one named root group');
ok(verts > 4000 && verts <= 15000, `${verts} vertices (budget 15000)`);
ok(meshes <= 6, `${meshes} draw calls (budget 6)`);
ok(site.stats.openings >= 60, `${site.stats.openings} windows and glazed doors`);
ok(cw.count > 20, `${cw.count} solids`);
ok(site.footprints.length === 1 && site.footprints[0].id === OSM_ID && site.footprints[0].poly.every((p) => p.every(Number.isFinite)), 'one footprint on the OSM id');
site.update(0.016); // night-light update runs without a camera

// the building is solid: walls stop a ray at each volume, roofs hold a ray from above at their height
const gy = hf.heightAt, ray = (x, y, z, dx, dz, max = 30) => cw.raycast({ x, y, z }, { x: dx, y: 0, z: dz }, max);
const U = [CA(), SA()];
function CA() { return Math.cos(13.3187 * Math.PI / 180); } function SA() { return Math.sin(13.3187 * Math.PI / 180); }
const at = (u, v) => toMap(u, v);
const wallHit = (u, v, du, dv, want, label) => { const [x, z] = at(u, v), d = [du * U[0] - dv * U[1], du * U[1] + dv * U[0]]; const h = ray(x, gy(x, z) + 1.5, z, d[0], d[1]); ok(h && Math.abs(h.distance - want) < 0.5, `${label}: a ray at 1.5 m meets the wall ${want} m away (${h ? h.distance.toFixed(1) : 'none'} m)`); };
wallHit(-10, 14, 1, 0, 10, 'west wall of the central block'); wallHit(30, -8, 0, 1, 8, 'north wall of the hall'); wallHit(60, 8, -1, 0, 9.65, 'east end of the hall');
wallHit(8, 56, 0, -1, 9.9, 'street front of the south wing'); wallHit(24, 22, -1, 0, 10.15, 'east wall of the central block (the porch stands at its south end)');
const top = (u, v) => { const [x, z] = at(u, v); return cw.groundHeight(x, z, 80) - gy(x, z); };
ok(top(6.9, 12) > 9.8 && top(6.9, 12) < 11.8, `central block ridge at ${top(6.9, 12).toFixed(1)} m`);
ok(top(30, 4) > 8 && top(30, 4) < 10.2, `hall roof at ${top(30, 4).toFixed(1)} m`);
ok(top(9, 41) > 5.2 && top(9, 41) < 7.4, `south wing roof at ${top(9, 41).toFixed(1)} m`);
ok(top(30, 45) < 0.5, `the garden has no roof in it (${top(30, 45).toFixed(1)} m)`);

// the partner's door spot (before the open street gate) stays drivable: within 4 m of the ring only the lot's fence and walls
const ps = PARTNERS.build({ root: new THREE.Group(), map, heightAt: hf.heightAt }), door = ps.partners.casaminunata.door;
const kinds = new Set(); cw.query(door.x - 4, door.z - 4, door.x + 4, door.z + 4, (id) => kinds.add(cw.kindOf(id)));
ok([...kinds].every((k) => k === 'wall' || k === 'fence'), `within 4 m of the door ring only the fence and walls (${[...kinds].join(', ') || 'nothing'})`);
ok(cw.solidAt(door.x, door.y + 0.8, door.z) < 0, 'the door ring itself is free');
// the street gate is open: a ray along the Y path from the street into the courtyard meets nothing
{
  const [x0, z0] = at(46.8, 52), [x1, z1] = at(40, 28), d = [x1 - x0, z1 - z0], L = Math.hypot(...d);
  const h = ray(x0, gy(x0, z0) + 0.9, z0, d[0], d[1], L);
  ok(!h, `the street gate lets a car-height ray reach the courtyard (${h ? 'blocked at ' + h.distance.toFixed(1) + ' m by ' + h.kind : 'clear'})`);
  const [fx, fz] = at(33, 47.4), [gx, gz] = at(33, 56);
  const f = ray(gx, gy(gx, gz) + 0.9, gz, fx - gx, fz - gz, 12);
  ok(f && f.kind === 'fence', `the fence closes the rest of the street side (${f ? f.kind : 'none'})`);
  const [ex, ez] = at(53, 33), [hx, hz] = at(60, 33);
  const e = ray(hx, gy(hx, hz) + 0.9, hz, ex - hx, ez - hz, 12);
  ok(e && e.kind === 'fence', `and the church side (${e ? e.kind : 'none'})`);
}

// trees: generated ones stay off the building and the grounds, the site's own spots are inside the lot and clear of solids
const cl = site.clear;
ok(cl(...at(7, 18)) && cl(...at(30, 8)) && cl(...at(10, 42)) && cl(...at(40, 40)) && cl(...at(25, 24)), 'clear() is true over the building and the garden');
ok(!cl(...at(-30, 20)) && !cl(...at(80, 20)) && !cl(...at(20, 70)) && !cl(...at(20, -30)), 'clear() is false 25 m or more beyond the lot');
ok(site.spots.length >= 4 && site.spots.every((s) => inLot(...toLoc(s.x, s.z)) && !inPoly(ring, s.x, s.z) && Number.isFinite(s.y)), `${site.spots.length} own tree spots in the lot, none on the building`);
ok(site.spots.every((s) => cw.solidAt(s.x, s.y + 1, s.z) < 0), 'no tree spot inside a solid');
const g1 = GATES.street; ok(g1[1] - g1[0] >= 3 && PORCH.v1 - PORCH.v0 > 3, `street gate ${(g1[1] - g1[0]).toFixed(1)} m wide, porch ${(PORCH.v1 - PORCH.v0).toFixed(1)} m`);

console.log = log;
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);

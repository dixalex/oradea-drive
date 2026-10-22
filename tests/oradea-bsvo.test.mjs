// Headless checks for the BSVO site (src/world/oradea/sites/bsvo.js) on the compiled Oradea map: node tests/oradea-bsvo.test.mjs
// The OSM ways it replaces exist, the church's frame matches its outline, the site builds in budget (<= 15k vertices, <= 6 meshes) with no NaN,
// the walls and the hipped roof are solid, the open yard gate lets a car through to the partner's ring and that ring stays free, the fence
// closes the yard on the east, generated trees stay off the buildings and the yard, and the partner entry points at the church (the long
// building 717082633, not the shop 717082635). Skipped without the Oradea map.
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
const { SITE, CHURCH_ID, SHOP_ID, TRAILERS_ID } = await import('../src/world/oradea/sites/bsvo.js');
const { RING, SHOP, W, DP } = await import('../src/world/oradea/sites/bsvo/church.js');
const { toMap, toLoc, O, ANG } = await import('../src/world/oradea/sites/bsvo/kit.js');
const { GATE, EAST } = await import('../src/world/oradea/sites/bsvo/grounds.js');

let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const hf = createHeightField(map, new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0)));

// the OSM ways and the outlines the frame is cut to
const ringOf = (id) => { const b = map.buildings.find((o) => o.id === id); if (!b) return null; const P = []; for (let i = 0; i < b.p.length; i += 2) P.push([b.p[i], b.p[i + 1]]); return P; };
const church = ringOf(CHURCH_ID), shop = ringOf(SHOP_ID);
ok(SITE.skip.includes(CHURCH_ID) && SITE.skip.includes(SHOP_ID) && SITE.skip.includes(TRAILERS_ID) && SITE.skip.every((id) => map.buildings.some((b) => b.id === id)), `skip ids ${SITE.skip.join(', ')} all exist in map_buildings.json`);
// Overture ids (3e9 and up) follow file order in build_map.mjs, so a fresh download can shift them: the trailers' id must still
// sit on this lot (within 40 m of the church's centre), or the skip would hide some other building
{ const t = ringOf(TRAILERS_ID), c = ringOf(CHURCH_ID), mid = (P) => P.reduce((a, q) => [a[0] + q[0] / P.length, a[1] + q[1] / P.length], [0, 0]);
  const d = t && c ? Math.hypot(mid(t)[0] - mid(c)[0], mid(t)[1] - mid(c)[1]) : Infinity;
  ok(d < 40, `the skipped Overture box ${TRAILERS_ID} stands on the church's lot (${d.toFixed(1)} m from the church)`); }
ok(church && church.length === 4 && shop && shop.length === 4, 'both OSM outlines are four-corner boxes');
ok(SITE.places.length === 0 && !('partners' in SITE), 'no new places, and the site does not export partners');
const near = (a, B) => Math.min(...B.map((b) => Math.hypot(a[0] - b[0], a[1] - b[1])));
const cMap = RING.map(([u, v]) => toMap(u, v)), sMap = SHOP.map(([u, v]) => toMap(u, v));
ok(cMap.every((p) => near(p, church) < 0.25), `the church frame matches the OSM corners (worst ${Math.max(...cMap.map((p) => near(p, church))).toFixed(2)} m)`);
ok(sMap.every((p) => near(p, shop) < 0.25), `the shop outline matches the OSM corners (worst ${Math.max(...sMap.map((p) => near(p, shop))).toFixed(2)} m)`);
ok(Math.abs(Math.abs(area2(cMap)) / 2 - 433) < 5 && W > 43 && DP > 9.8, `the church is ${(Math.abs(area2(cMap)) / 2).toFixed(0)} m2 (433 in the brief)`);

// the partner: places.js and sites/partners.js both point at the church
const entry = PLACES.find((q) => q.id === 'bsvo'), row = TABLE.find((e) => e.id === 'bsvo');
ok(entry && entry.kind === 'ad' && entry.bld.length === 1 && entry.bld[0] === CHURCH_ID && row && row.bld === CHURCH_ID && Array.isArray(row.door), 'places.js and partners.js TABLE both put bsvo on the church with its own door spot');

// build it
const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const base = { root, map, solids: cw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt } };
const site = SITE.build(base);
ok(site, 'builds');
let verts = 0, meshes = 0, nan = false;
root.traverse((o) => { if (!o.isMesh) return; meshes++; verts += o.geometry.attributes.position.count; for (const v of o.geometry.attributes.position.array) if (!Number.isFinite(v)) nan = true; });
ok(!nan, 'no NaN / infinite vertices');
ok(root.children.length === 1 && root.children[0].name === 'landmark-bsvo', 'one named root group');
ok(verts > 3000 && verts <= 15000, `${verts} vertices (budget 15000)`);
ok(meshes <= 6, `${meshes} draw calls (budget 6)`);
ok(site.stats.openings >= 10 && site.stats.doors >= 4, `${site.stats.openings} windows and ${site.stats.doors} doors on the church`);
ok(cw.count > 40, `${cw.count} solids`);
ok(site.footprints.length === 2 && site.footprints[0].id === CHURCH_ID && site.footprints[1].id === SHOP_ID && site.footprints.every((f) => f.poly.every((p) => p.every(Number.isFinite))), 'two footprints on the OSM ids');
site.update(0.016); // night-light update runs without a camera

// the church is solid: walls stop a ray, the hipped roof holds a ray from above at its height, a corner of the yard has no roof in it
const gy = hf.heightAt, ray = (x, y, z, dx, dz, max = 40) => cw.raycast({ x, y, z }, { x: dx, y: 0, z: dz }, max);
const at = (u, v) => toMap(u, v);
const dirU = [Math.cos(ANG), Math.sin(ANG)], dirV = [-Math.sin(ANG), Math.cos(ANG)];
const wallHit = (u, v, d, want, label) => { const [x, z] = at(u, v), h = ray(x, gy(x, z) + 1.5, z, d[0], d[1]); ok(h && Math.abs(h.distance - want) < 0.5, `${label}: a ray at 1.5 m meets the wall ${want} m away (${h ? h.distance.toFixed(1) : 'none'} m)`); };
wallHit(20, -8, dirV, 8, 'north front'); wallHit(20, 11, dirV.map((q) => -q), 1.04, 'south wall (between wall and fence)'); wallHit(-1.2, 5, dirU, 1.2, 'west end'); wallHit(52, 5, dirU.map((q) => -q), 8.55, 'east end');
const top = (u, v) => { const [x, z] = at(u, v); return cw.groundHeight(x, z, 80) - gy(x, z); };
ok(top(W / 2, DP / 2) > 4.7 && top(W / 2, DP / 2) < 5.6, `ridge at ${top(W / 2, DP / 2).toFixed(1)} m over the ground`);
ok(top(W / 2, 1.5) > 3.4 && top(W / 2, 1.5) < 4.6 && top(1.5, DP / 2) > 3.2, `the slopes fall to the eaves (${top(W / 2, 1.5).toFixed(1)} m on the north slope, ${top(1.5, DP / 2).toFixed(1)} m on the west hip)`);
ok(top(25, -15) < 0.8, `the yard has no roof in it (${top(25, -15).toFixed(1)} m)`);
ok(top(18, -33) > 3.4 && top(18, -33) < 5.2, `the shop's flat roof at ${top(18, -33).toFixed(1)} m`);

// the partner's door ring: free ground, nothing within 4.5 m but the building's own wall, and a car-height ray from the lane through the open gate reaches it
const ps = PARTNERS.build({ root: new THREE.Group(), map, heightAt: hf.heightAt }), door = ps.partners.bsvo.door;
const [du, dv] = toLoc(door.x, door.z);
ok(du > 24.6 && du < 26.6 && dv < -4 && dv > -7, `the door ring is before the glazed double door (u ${du.toFixed(1)}, v ${dv.toFixed(1)}, ${(-dv).toFixed(1)} m out)`);
const kinds = new Set(); cw.query(door.x - 4.5, door.z - 4.5, door.x + 4.5, door.z + 4.5, (id) => kinds.add(cw.kindOf(id)));
ok([...kinds].every((k) => k === 'wall'), `within 4.5 m of the door ring only the building's walls (${[...kinds].join(', ') || 'nothing'})`);
ok(cw.solidAt(door.x, door.y + 0.8, door.z) < 0, 'the door ring itself is free');
{
  const [x0, z0] = at((GATE.u0 + GATE.u1) / 2, -45), h = ray(x0, gy(x0, z0) + 0.9, z0, door.x - x0, door.z - z0, Math.hypot(door.x - x0, door.z - z0) - 0.5);
  ok(!h, `a car-height ray from the lane through the open gate reaches the ring (${h ? 'blocked at ' + h.distance.toFixed(1) + ' m by ' + h.kind : 'clear'})`);
  const wide = [-1.4, 1.4].map((o) => { const [x1, z1] = at((GATE.u0 + GATE.u1) / 2 + o, -45), dx = door.x + o * dirU[0] - x1, dz = door.z + o * dirU[1] - z1; return ray(x1, gy(x1, z1) + 0.9, z1, dx, dz, Math.hypot(dx, dz) - 0.5); });
  ok(wide.every((h) => !h), `and so do two rays 1.4 m either side (a car is 2 m wide): ${wide.map((h) => (h ? h.kind + ' at ' + h.distance.toFixed(1) : 'clear')).join(', ')}`);
  const [ex, ez] = at(36, -14), [yx, yz] = at(24.6, -14);
  const f = ray(yx, gy(yx, yz) + 0.9, yz, ex - yx, ez - yz, 30);
  ok(f && f.kind === 'fence', `the diagonal fence closes the yard on the east (${f ? f.kind : 'none'})`);
  const [sx, sz] = at(20, 11.0), [tx, tz] = at(20, 16);
  const s = ray(tx, gy(tx, tz) + 0.9, tz, sx - tx, sz - tz, 8);
  ok(s && s.kind === 'fence', `the south fence stands between the car park and the wall (${s ? s.kind : 'none'})`);
  const [wx, wz] = at(-1.2, -20), [qx, qz] = at(12, -20);
  const wl = ray(qx, gy(qx, qz) + 0.9, qz, wx - qx, wz - qz, 20);
  ok(wl && wl.kind === 'wall', `the white wall closes the west (${wl ? wl.kind : 'none'})`);
}

// trees: generated ones stay off the buildings and the yard, but not 25 m beyond
const cl = site.clear;
ok(cl(...at(20, 5)) && cl(...at(30, -12)) && cl(...at(18, -33)) && cl(...at(20, 12)) && cl(...at(27.5, -31)), 'clear() is true over the church, the yard, the shop and the gate');
ok(!cl(...at(60, 5)) && !cl(...at(20, 40)) && !cl(...at(-30, -12)) && !cl(...at(20, -75)), 'clear() is false 25 m or more beyond');
const [fx, fz] = at(38.5, -17); ok(!cl(fx, fz), 'clear() leaves the strip outside the diagonal fence to the real trees');

console.log = log;
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);

// Headless checks for the Mobiversal house (src/world/oradea/sites/mobiversal.js) on the compiled map: node tests/oradea-mobiversal.test.mjs
// The city generator's building it replaces (Overture id 3000001278: ids from 3e9 are numbered in file order and can shift on a data refresh)
// has its footprint inside the site's own outline, so a shifted id fails here; the site builds in budget (verts, draw calls) with no NaN,
// one named root group and no `partners` export; the walls are solid and the building stands at its measured heights; the car can reach the
// pink ring at the door and drive in through the open entrance, and is stopped by the fences; clear() keeps generated trees off the house and
// the yard but not off the street; places.js and sites/partners.js carry the same outline. Skipped without the Oradea map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { inPoly } from '../src/world/cherkasy/geo.js';
import { SITE, OSM_ID, MOBIVERSAL_RING } from '../src/world/oradea/sites/mobiversal.js';
import { SITE as PARTNERS, TABLE } from '../src/world/oradea/sites/partners.js';
import { toWorld, toLocal, L, D1, D2, XB, XS, H_LOW, H_TALL, LOT, GATE_X } from '../src/world/oradea/sites/mobiversal/plan.js';
import { PLACES } from '../src/world/oradea/places.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A)) || !existsSync(new URL('map_buildings.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const ctx2d = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };

let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const hf = createHeightField(map, new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0)));
const ring = MOBIVERSAL_RING; // [[x, z], ...]

// ---- the skipped generator buildings sit on the outline (so a shifted Overture id fails loudly)
const distToRing = (x, z) => Math.min(...ring.map((p, i) => { const q = ring[(i + 1) % ring.length], dx = q[0] - p[0], dz = q[1] - p[1], l2 = dx * dx + dz * dz;
  const t = l2 ? Math.max(0, Math.min(1, ((x - p[0]) * dx + (z - p[1]) * dz) / l2)) : 0; return Math.hypot(p[0] + t * dx - x, p[1] + t * dz - z); }));
ok(SITE.skip.length >= 1 && SITE.skip.includes(OSM_ID), `skips ${SITE.skip.join(', ')}`);
for (const id of SITE.skip) {
  const b = map.buildings.find((o) => o.id === id);
  if (!b) { ok(false, `skipped id ${id} is in map_buildings.json`); continue; }
  let cx = 0, cz = 0, a2 = 0;
  for (let i = 0; i < b.p.length; i += 2) { const j = (i + 2) % b.p.length, c = b.p[i] * b.p[j + 1] - b.p[j] * b.p[i + 1]; a2 += c; cx += (b.p[i] + b.p[j]) * c; cz += (b.p[i + 1] + b.p[j + 1]) * c; }
  cx /= 3 * a2; cz /= 3 * a2;
  ok(inPoly(ring, cx, cz) || distToRing(cx, cz) <= 3, `skipped ${id}: footprint centre (${cx.toFixed(1)}, ${cz.toFixed(1)}) is inside the outline${inPoly(ring, cx, cz) ? '' : ` or within 3 m of it (${distToRing(cx, cz).toFixed(1)} m)`}`);
}
ok(!('partners' in SITE), 'SITE has no `partners` key');

// ---- places.js and the partner table carry this outline
const place = PLACES.find((p) => p.id === 'mobiversal');
ok(place && place.kind === 'ad' && place.url && place.pitch?.length >= 3, 'places.js keeps the mobiversal partner');
const flat = ring.flat();
ok(place && Array.isArray(place.ring) && !place.bld && place.ring.length === flat.length && place.ring.every((v, i) => Math.abs(v - flat[i]) < 0.051), 'places.js carries the same outline as a flat ring (and no OSM building id)');
const row = TABLE.find((e) => e.id === 'mobiversal');
ok(row && row.ring === MOBIVERSAL_RING && !row.bld, 'sites/partners.js TABLE uses MOBIVERSAL_RING');

// ---- the frame: the local front wall runs along the footprint's front edge
const [w0, w1] = [toWorld(0, 0), toWorld(L, 0)];
const ov = map.buildings.find((o) => o.id === OSM_ID);
ok(ov && Math.hypot(w0[0] - 1329.9, w0[1] - 1850.2) < 0.5 && Math.hypot(w1[0] - 1331.3, w1[1] - 1870.7) < 0.6, `front wall ${w0.map((v) => v.toFixed(1))} -> ${w1.map((v) => v.toFixed(1))} meets the Overture front edge`);
const [lx, lz] = toLocal(...toWorld(7.3, -4.2));
ok(Math.abs(lx - 7.3) < 1e-3 && Math.abs(lz + 4.2) < 1e-3, 'toLocal inverts toWorld');

const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const site = SITE.build({ root, map, solids: cw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt } });
ok(site, 'builds');
ok(!('partners' in site), 'the built site does not return `partners`');
let verts = 0, meshes = 0, nan = false, tris = 0;
root.traverse((o) => {
  if (!o.isMesh) return;
  meshes++; verts += o.geometry.attributes.position.count; tris += o.geometry.index.count / 3;
  for (const v of o.geometry.attributes.position.array) if (!Number.isFinite(v)) nan = true;
  for (const v of o.geometry.attributes.normal.array) if (!Number.isFinite(v)) nan = true;
});
ok(!nan, 'no NaN / infinite vertices or normals');
ok(root.children.length === 1 && root.children[0].name === 'landmark-mobiversal', `one root group: ${root.children.map((c) => c.name)}`);
ok(verts > 2500 && verts <= 15000, `${verts} vertices (budget 15000)`);
ok(meshes >= 4 && meshes <= 6, `${meshes} meshes / draw calls (budget 6)`);
log(`     ${tris} triangles, ${cw.count} solids, ${site.stats.openings} openings, floor line ${site.stats.yF} m, ${site.stats.cars} parked cars`);
ok(cw.count >= 12, `${cw.count} colliders (the two blocks, the fences, the hedge, the cabinets, the bin, the tree)`);
ok(site.footprints.length === 1 && site.footprints[0].id === OSM_ID && site.footprints[0].poly.length === ring.length, 'one footprint, the outline');
ok(site.footprints[0].poly.every((p, i) => p[0] === ring[i][0] && p[1] === ring[i][1]), 'the footprint is MOBIVERSAL_RING');

// ---- heights: a ray down from 40 m over each block's roof, minus the ground
const top = (X, Z) => { const [x, z] = toWorld(X, Z); return cw.groundHeight(x, z, 40) - hf.heightAt(x, z); };
const low = top(XS / 2, -D1 / 2), tall = top((XS + L) / 2, -D1 / 2), bay = top(L - 1.5, -D2 + 1.0);
ok(Math.abs(low - (H_LOW + 0.0)) < 0.45, `low block ${low.toFixed(2)} m over the ground (about ${H_LOW} + the threshold)`);
ok(Math.abs(tall - H_TALL) < 0.45 && Math.abs(bay - H_TALL) < 0.45, `tall block ${tall.toFixed(2)} m, south-east bay ${bay.toFixed(2)} m (about ${H_TALL})`);
ok(tall - low > 2.2, `the tall block stands ${(tall - low).toFixed(1)} m over the low one`);

// ---- the walls are solid, the yard and the street are open
const inside = (X, Z, y) => { const [x, z] = toWorld(X, Z); return cw.inside(x, hf.heightAt(x, z) + y, z); };
ok(inside(4, -7, 2) && inside(14, -8, 2) && inside(18, -16.5, 2) && inside(4, -3, 7) && inside(15, -3, 10), 'inside both blocks and the bay is solid');
ok(!inside(4, 3, 1) && !inside(15, 8, 1) && !inside(4, -7, 13) && !inside(10, 3.2, 1), 'the yard, the air over the roofs and the ring spot are open');
ok(inside(XB + 1.5, -D1 - 0.9, 2) && !inside(XB - 1.5, -D1 - 0.9, 2), 'the south-east bay is solid and the notch west of it is open');

// ---- the partner's ring: nothing but the house's own wall within 4 m of the door
const pb = PARTNERS.build({ root: new THREE.Group(), map, heightAt: hf.heightAt });
const door = pb?.partners.mobiversal.door;
ok(door, `partners.js places the door at ${door && [door.x.toFixed(1), door.z.toFixed(1)]}`);
if (door) {
  const [dX, dZ] = toLocal(door.x, door.z);
  log(`     the door, in the house frame: X ${dX.toFixed(1)} (the front wall is 0..${L}), ${dZ.toFixed(1)} m out`);
  ok(dZ > 2.5 && dZ < 4 && dX > 3 && dX < L - 3, 'the ring stands 2.5–4 m out from the front wall, clear of its ends');
  const hits = new Set(); cw.query(door.x - 4, door.z - 4, door.x + 4, door.z + 4, (id) => { if (cw.bounds(id).y0 < hf.heightAt(door.x, door.z) + 2.5) hits.add(id); });
  const house = (id) => { const b = cw.bounds(id); return b.x0 > 1329 && b.x1 < 1349.5 && b.z0 > 1849 && b.z1 < 1871; }; // the two blocks (a concave one is split in parts)
  ok(hits.size >= 1 && [...hits].every(house), `${hits.size} ground-level collider part(s) within 4 m of the ring, all the house's own walls (no fence or gate)`);
  ok(site.clear(door.x, door.z), 'trees are kept off the ring');
  for (const [x, z] of site.parked) ok(Math.hypot(x - door.x, z - door.z) > 4.5, `a parked car at (${x.toFixed(0)}, ${z.toFixed(0)}) is ${Math.hypot(x - door.x, z - door.z).toFixed(1)} m from the door`);
}

// ---- driving: a car-sized cylinder is pushed out of the walls and the fences, free at the ring, in the entrance and on the street
const pushAt = (X, Z, y = 0.5) => { const [x, z] = toWorld(X, Z), p = new THREE.Vector3(x, hf.heightAt(x, z) + y, z); const o = cw.pushCylinder(p, 1.0, 1.5, 0.3); return !!(o && o.hit); };
ok(pushAt(5, -0.5) && pushAt(15, -0.5) && pushAt(L + 0.4, -6) && pushAt(-0.4, -6), 'the front, south and north walls push a car back');
ok(pushAt(4, LOT.z1 - 0.1) && pushAt(LOT.x1 + 0.1, 6) && pushAt(-1.6, 6) && pushAt(8, LOT.z0 + 0.2), 'the street fence, the south and north fences and the east fence push a car back');
ok(pushAt(-2.75, 2), 'the neighbour\'s hedge pushes a car back');
ok(!pushAt(10.05, 3.2) && !pushAt(14, LOT.z1 - 0.1) && !pushAt(14, LOT.z1 + 3) && !pushAt(14, 8), 'no push at the ring spot, in the open entrance (X 14), on the pavement or in the yard');
ok(!pushAt(GATE_X + 1.2, LOT.z1 - 0.1) && !pushAt(LOT.x1 - 2.5, LOT.z1 - 0.1), 'the entrance is open from the number-plate post to the south fence');

// ---- trees: off the house and the yard, not off the street
const at = (X, Z) => { const [x, z] = toWorld(X, Z); return site.clear(x, z); };
ok(at(4, -7) && at(15, -8) && at(10, 6) && at(15, 12) && at(10, -18), 'clear() holds the house, the yard and the back');
ok(!at(10, 24) && !at(-14, 0) && !at(40, 0) && !at(10, -30), 'clear() leaves the street and the neighbours alone');
ok(site.clear(1330, 1860) && site.clear(1340, 1865), 'clear() holds the generator\'s old footprint');

// ---- night: the lit glass and the lettering follow nightK
site.update(0.016, null);
const mats = root.children[0].children.map((m) => m.material);
ok(mats.every((m) => Number.isFinite(m.emissiveIntensity ?? 0)), 'update() runs');

console.log = log;
log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);

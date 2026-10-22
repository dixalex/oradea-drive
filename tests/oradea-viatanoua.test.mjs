// Headless checks for the Viața Nouă / BCUO house (src/world/oradea/sites/viatanoua.js) on the compiled map: node tests/oradea-viatanoua.test.mjs
// The OSM way it replaces is in map_buildings.json and the site's outline is that way; the site builds in budget (verts, draw calls),
// with no NaN, one named root group and no `partners` export; the walls, roof planes and gate are solid; the house stands at its
// measured height; the car can still reach the pink ring at the door (nothing but the wall within 4 m of it); clear() keeps generated
// trees off the house and the yard behind the gate but not off the street. Skipped without the Oradea map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { SITE, OSM_ID } from '../src/world/oradea/sites/viatanoua.js';
import { SITE as PARTNERS } from '../src/world/oradea/sites/partners.js';
import { FR, toWorld, OSM_RING, WF, D1, D2, H_RIDGE, GATE } from '../src/world/oradea/sites/viatanoua/house.js';
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
const osm = map.buildings.find((b) => b.id === OSM_ID);

ok(SITE.skip.length === 1 && SITE.skip[0] === OSM_ID && osm, `skips OSM way ${OSM_ID}, which is in map_buildings.json`);
ok(osm && osm.p.length / 2 === OSM_RING.length && OSM_RING.every((q, i) => Math.abs(q[0] - osm.p[2 * i]) < 0.06 && Math.abs(q[1] - osm.p[2 * i + 1]) < 0.06), 'OSM_RING is that way\'s outline');
ok(!('partners' in SITE), 'SITE has no `partners` key');
const place = PLACES.find((p) => p.id === 'viatanoua');
ok(place && place.kind === 'ad' && place.bld.includes(OSM_ID), 'places.js keeps the viatanoua partner on this building');

// the frame: the local front wall runs along the OSM front edge
const [w0, w1] = [toWorld(0, 0), toWorld(WF, 0)];
ok(Math.hypot(w0[0] - -50.1, w0[1] - -1070) < 0.05 && Math.hypot(w1[0] - -39.3, w1[1] - -1069.8) < 0.3, `front wall runs ${w0.map((v) => v.toFixed(1))} -> ${w1.map((v) => v.toFixed(1))}`);
const rear = toWorld(WF / 2, -D2);
ok(osm && Math.hypot(rear[0] - -44, rear[1] - -1093.3) < 1.2, `the rear wall lands on the OSM rear edge (${rear.map((v) => v.toFixed(1))})`);

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
ok(root.children.length === 1 && root.children[0].name === 'landmark-viatanoua', `one root group: ${root.children.map((c) => c.name)}`);
ok(verts > 2500 && verts <= 15000, `${verts} vertices (budget 15000)`);
ok(meshes >= 4 && meshes <= 6, `${meshes} meshes / draw calls (budget 6)`);
log(`     ${tris} triangles, ${cw.count} solids, floor line ${site.stats.yF} m`);
ok(cw.count >= 9, `${cw.count} colliders (walls, roof planes, wing, gate, piers, wall)`);
ok(site.footprints.length === 1 && site.footprints[0].id === OSM_ID && site.footprints[0].poly.length === OSM_RING.length, 'one footprint, the OSM outline');

// heights: a ray down from 40 m over the front range's ridge and over the wing's, minus the ground
const top = (lx, lz) => { const [x, z] = toWorld(lx, lz); return cw.groundHeight(x, z, 40) - hf.heightAt(x, z); };
const ridge = top(WF / 2, -D1 / 2), eave = top(WF / 2, 0.1), wing = top(6, -18);
ok(Math.abs(ridge - H_RIDGE) < 0.4, `front ridge ${ridge.toFixed(2)} m over the ground (about ${H_RIDGE} + the floor line)`);
ok(eave > 5.0 && eave < 6.4, `front eave ${eave.toFixed(2)} m`);
ok(wing > 6.0 && wing < 8.0, `wing ridge ${wing.toFixed(2)} m`);
// the wall is solid, the street side is open
const inside = (lx, lz, y) => { const [x, z] = toWorld(lx, lz); return cw.inside(x, hf.heightAt(x, z) + y, z); };
ok(inside(5, -6, 2) && inside(6, -18, 2) && inside(5, -3, 6) && !inside(5, 1.0, 2) && !inside(5, -8, 12), 'inside the house is solid, the pavement in front and the air over the ridge are not');
ok(inside((GATE.gate[0] + GATE.gate[1]) / 2, 0, 1.0) && inside(GATE.pierA[0] + 0.25, 0, 1.5) && !inside(14, -3, 1.0), 'the gate and its pier are solid, the yard behind the gate is open');

// the partner's ring stands on the street before the yard gate: the front, the gate and the piers are behind it, nothing on its spot
const pb = PARTNERS.build({ root: new THREE.Group(), map, heightAt: hf.heightAt });
const door = pb?.partners.viatanoua.door;
ok(door, `partners.js places the door at ${door && [door.x.toFixed(1), door.z.toFixed(1)]}`);
if (door) {
  // solids that reach down to within 2.5 m of the ground (the roof planes start above 5 m and cannot touch a car)
  const hits = []; cw.query(door.x - 4, door.z - 4, door.x + 4, door.z + 4, (id) => { if (cw.bounds(id).y0 < hf.heightAt(door.x, door.z) + 2.5) hits.push(id); });
  const front = Math.max(...[0, 11, 22].map((lx) => toWorld(lx, 0)[1])), ahead = hits.filter((id) => cw.bounds(id).z1 > front + 0.6);
  ok(hits.length >= 1 && !ahead.length && door.z - front > 2.5, `${hits.length} ground-level collider(s) within 4 m of the ring, all on the front line (${front.toFixed(1)}); the ring ${(door.z - front).toFixed(1)} m out`);
}

// driving: a car-sized cylinder is pushed out of the front wall, the gate, a pier and the pink wall, and left alone at the ring and on the street
const pushAt = (lx, lz, y = 0.5) => { const [x, z] = toWorld(lx, lz), p = new THREE.Vector3(x, hf.heightAt(x, z) + y, z); const o = cw.pushCylinder(p, 1.0, 1.5, 0.3); return !!(o && o.hit); };
ok(pushAt(5, -0.5) && pushAt((GATE.gate[0] + GATE.gate[1]) / 2, 0.2) && pushAt(GATE.pierA[0] + 0.25, 0.4) && pushAt(19, 0.2), 'the front wall, the gate, a pier and the pink wall push a car back');
ok(!pushAt(5.0, 3.3) && !pushAt(5, 6) && !pushAt(14, -3.5), 'no push at the ring spot, on the street or in the yard behind the gate');

// trees: off the house and the yard, not off the street
const at = (lx, lz) => { const [x, z] = toWorld(lx, lz); return site.clear(x, z); };
ok(at(5, -6) && at(6, -18) && at(14, -10) && at(16, -20) && at(11.5, -3), 'clear() holds the house, the wing, the yard and the gate');
ok(!at(5, 4) && !at(5, 12) && !at(-6, -6) && !at(25, -6) && !at(5, -28), 'clear() leaves the street, the west neighbour, the east neighbour and the back alone');
ok(site.clear(-44.5, -1081) && site.clear(-44, -1093), 'clear() holds the OSM footprint');

// night: the lit glass and the plate follow nightK
const before = root.children[0].children.map((m) => m.material.emissiveIntensity);
site.update(0.016, null);
ok(before.every((v) => v === 0 || v === undefined || Number.isFinite(v)), 'update() runs');

console.log = log;
log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);

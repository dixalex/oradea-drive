// Headless checks for the Ferdinand bridge's north bank (src/world/oradea/sites/ferdinand.js) on the compiled Oradea map:
// node tests/oradea-ferdinand.test.mjs
//   the three OSM ways the site replaces are in the map and in `skip`; the site builds in budget (~30k vertices, <= 15
//   meshes) with finite geometry and no two coplanar surfaces over each other (z-fighting); the theatre's front, columns
//   and steps, the Szigligeti monument, Queen Maria's plinth, the Darvas house and the synagogue stop and carry the car;
//   the square is open between them; the footprints are the OSM outlines; the square is a sight. Skipped without the map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { liftBanks, shapeBridges } from '../src/world/oradea/river.js';
import { inPoly } from '../src/world/cherkasy/geo.js';
import { SITE } from '../src/world/oradea/sites/ferdinand.js';
import { PLACES } from '../src/world/oradea/places.js';
import { theatreFrame } from '../src/world/oradea/sites/ferdinand/theatre.js';

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
liftBanks(hf, dem, map.dem); shapeBridges(hf, map);

for (const id of SITE.skip) ok(map.buildings.some((b) => b.id === id), `OSM way ${id} is in map_buildings.json`);

const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const site = SITE.build({ root, solids: cw, heightAt: hf.heightAt, map });
ok(!!site && root.children.length === 1 && site.footprints.length === 3, 'site builds: one group, three footprints');
let verts = 0, meshes = 0, nan = 0;
const tris = [];
root.updateMatrixWorld(true);
root.traverse((o) => {
  if (!o.isMesh) return;
  meshes++;
  const P = o.geometry.attributes.position, I = o.geometry.index;
  verts += P.count;
  for (let i = 0; i < P.array.length; i++) if (!Number.isFinite(P.array[i])) nan++;
  const v = (k) => new THREE.Vector3().fromBufferAttribute(P, k);
  const n = I ? I.count : P.count;
  for (let k = 0; k < n; k += 3) {
    const a = v(I ? I.getX(k) : k), b = v(I ? I.getX(k + 1) : k + 1), c = v(I ? I.getX(k + 2) : k + 2);
    const nn = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(c, a));
    const area = nn.length() / 2;
    if (area < 1e-4) continue;
    nn.normalize();
    // an untextured triangle of one flat colour: a coplanar twin of the same colour shades identically, so it cannot z-fight visibly
    const C = o.geometry.attributes.color, flatCol = !o.material.map && C && [0, 1, 2].every((q) => { const i = I ? I.getX(k + q) : k + q; return Math.abs(C.getX(i) - C.getX(I ? I.getX(k) : k)) + Math.abs(C.getY(i) - C.getY(I ? I.getX(k) : k)) + Math.abs(C.getZ(i) - C.getZ(I ? I.getX(k) : k)) < 1e-3; });
    const col = flatCol ? [C.getX(I ? I.getX(k) : k), C.getY(I ? I.getX(k) : k), C.getZ(I ? I.getX(k) : k)].map((x) => Math.round(x * 100)).join(',') : null;
    tris.push({ mesh: o.name, a, b, c, n: nn, d: nn.dot(a), area, col });
  }
});
ok(nan === 0, 'all vertices finite');
ok(verts > 15000 && verts < 34000 && meshes <= 15, `${(verts / 1000).toFixed(1)}k vertices in ${meshes} meshes`);
ok(cw.count > 20, `colliders: ${cw.count}`);

// coplanar overlaps: same-facing triangles, one in the other's plane (1.2 cm), interiors overlapping seen along the normal
{
  const O = new THREE.Vector3(120, 5, -150);
  for (const t of tris) { for (const p of [t.a, t.b, t.c]) p.sub(O); t.d = t.n.dot(t.a); t.box = new THREE.Box3().setFromPoints([t.a, t.b, t.c]).expandByScalar(0.02); }
  const proj = (n, p) => { const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z); return ax >= ay && ax >= az ? [p.y, p.z] : ay >= az ? [p.x, p.z] : [p.x, p.y]; };
  // strictly inside, at least 3 cm from every edge: a 2 cm sliver of a sill over a reveal is not a visible fight
  const inside = (q, A_, B_, C_) => {
    const s = (p1, p2, p3) => ((p1[0] - p3[0]) * (p2[1] - p3[1]) - (p2[0] - p3[0]) * (p1[1] - p3[1])) / (Math.hypot(p2[0] - p3[0], p2[1] - p3[1]) || 1);
    const d1 = s(q, A_, B_), d2 = s(q, B_, C_), d3 = s(q, C_, A_), e = 0.03;
    return (d1 > e && d2 > e && d3 > e) || (d1 < -e && d2 < -e && d3 < -e);
  };
  const W3 = [[0.34, 0.33, 0.33], [0.6, 0.2, 0.2], [0.2, 0.6, 0.2], [0.2, 0.2, 0.6]];
  const pts = (t) => W3.map((w) => t.a.clone().multiplyScalar(w[0]).addScaledVector(t.b, w[1]).addScaledVector(t.c, w[2]));
  const tri2 = (u) => [u.a, u.b, u.c].map((p) => proj(u.n, p));
  const flat = (u, P) => P.every((p) => Math.abs(u.n.dot(p) - u.d) < 0.012);
  const overlap = (i, j) => { const Pi = pts(i), Pj = pts(j); return (flat(i, Pj) && Pj.some((p) => inside(proj(i.n, p), ...tri2(i)))) || (flat(j, Pi) && Pi.some((p) => inside(proj(j.n, p), ...tri2(j)))); };
  const groups = new Map();
  for (const t of tris) {
    if (/-(bronze|figures|pave)$/.test(t.mesh)) continue; // the smooth sculpture skins, and the draped paving (a decal by design)
    const k = `${Math.round(t.n.x * 10)},${Math.round(t.n.y * 10)},${Math.round(t.n.z * 10)}`;
    (groups.get(k) ?? groups.set(k, []).get(k)).push(t);
  }
  let bad = 0; const where = [];
  for (const list of groups.values()) {
    list.sort((p, q) => p.box.min.x - q.box.min.x);
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length && list[j].box.min.x <= list[i].box.max.x; j++) {
      const A_ = list[i], B_ = list[j];
      if (A_.n.dot(B_.n) < 0.9995 || !A_.box.intersectsBox(B_.box)) continue;
      if (A_.mesh === B_.mesh && A_.col && A_.col === B_.col) continue;
      if (!overlap(A_, B_)) continue;
      bad++;
      if (where.length < 12) where.push(`${A_.mesh}/${B_.mesh} @${A_.a.clone().add(O).toArray().map((x) => x.toFixed(2)).join(',')} n${A_.n.toArray().map((x) => x.toFixed(2)).join(',')}`);
    }
  }
  ok(bad === 0, `no coplanar overlapping surfaces (${bad}${where.length ? ': ' + where.join('; ') : ''})`);
}

// the theatre: the front stops the car, the columns hold, the steps climb to the portico, the square is open
const T = theatreFrame, W = T.W, CX = W / 2, toMap = T.toMap;
const g0 = hf.heightAt(...toMap(CX, 14));
const ray = (s, o, s2, o2, h = 1.0, max = 80) => { const [x, z] = toMap(s, o), [x2, z2] = toMap(s2, o2); return cw.raycast({ x, y: hf.heightAt(x, z) + h, z }, { x: x2 - x, y: 0, z: z2 - z }, max); };
const wing = ray(W - 1.5, 30, W - 1.5, 0);
ok(wing && T.toLocal(wing.point.x, wing.point.z)[1] > -0.5 && T.toLocal(wing.point.x, wing.point.z)[1] < 1.2, `a ray from the square stops at the wing's front wall (o = ${wing && T.toLocal(wing.point.x, wing.point.z)[1].toFixed(2)})`);
const col = ray(CX + 7.15, 30, CX + 7.15, 0, 2.0);
ok(col && cw.kindOf(col.id) === 'column', `a column stops the car (${col && cw.kindOf(col.id)})`);
const stepLow = cw.groundHeight(...toMap(CX + 4.7, 7.6), g0 + 4), stepTop = cw.groundHeight(...toMap(CX + 4.7, 1.4), g0 + 4);
ok(stepTop - g0 > 1.2 && stepTop - g0 < 1.9 && stepLow - g0 < stepTop - g0 - 0.3, `the steps climb to the portico (${(stepLow - g0).toFixed(2)} -> ${(stepTop - g0).toFixed(2)} m over the square)`);
const roof = cw.groundHeight(...toMap(CX, -25), g0 + 60);
ok(roof - g0 > 16 && roof - g0 < 26, `the theatre's roof holds (${(roof - g0).toFixed(1)} m)`);
const open = ray(CX + 24, 40, CX + 24, 6, 0.8, 34);
ok(!open || T.toLocal(open.point.x, open.point.z)[1] < 4, `the square is open east of the beds (ray from o = 40 first hits o = ${open && T.toLocal(open.point.x, open.point.z)[1].toFixed(1)})`);

// the monument on the axis, the plinth of Queen Maria, the island
const mon = ray(CX, 30, CX, 0, 1.0, 40);
ok(mon && cw.kindOf(mon.id) === 'monument' && T.toLocal(mon.point.x, mon.point.z)[1] > 9 && T.toLocal(mon.point.x, mon.point.z)[1] < 15.5, `the Szigligeti monument stops the car on the axis (${mon && cw.kindOf(mon.id)} at o = ${mon && T.toLocal(mon.point.x, mon.point.z)[1].toFixed(1)})`);
const maria = cw.raycast({ x: 36.5, y: hf.heightAt(36.5, -194) + 1, z: -194 }, { x: -0.06, y: 0, z: -1 }, 30);
ok(!!maria, 'something stands between the road and the Queen Maria plinth (the island or the plinth)');

// the Darvas house and the synagogue
const dv = cw.raycast({ x: 196, y: hf.heightAt(196, -240) + 1.2, z: -240 }, { x: 0, y: 0, z: 1 }, 40);
ok(dv && dv.point.z < -214 && dv.point.z > -222, `the Darvas front stops a ray from the street (z = ${dv && dv.point.z.toFixed(1)})`);
const sy = cw.raycast({ x: 200, y: hf.heightAt(232, -95) + 1.2, z: -95 }, { x: 1, y: 0, z: 0 }, 60);
ok(sy && sy.point.x > 229 && sy.point.x < 236, `the synagogue's west front stops a ray (x = ${sy && sy.point.x.toFixed(1)})`);
const dome = cw.groundHeight(249.7, -98.8, hf.heightAt(249.7, -98.8) + 60);
ok(dome - hf.heightAt(249.7, -98.8) > 15, `the synagogue's roof and drum hold (${(dome - hf.heightAt(249.7, -98.8)).toFixed(1)} m)`);

// footprints, places, trees, clearing
const fp = site.footprints;
ok(fp.map((q) => q.id).sort().join() === [...SITE.skip].sort().join(), 'footprints carry the skipped OSM ids');
for (const q of fp) {
  const osm = map.buildings.find((b) => b.id === q.id);
  let hit = false; for (let i = 0; i < (osm?.p.length ?? 0); i += 2) if (inPoly(q.poly, osm.p[i], osm.p[i + 1])) hit = true;
  ok(hit && q.h > 8, `${q.name}: the footprint is the OSM outline, ${q.h.toFixed(1)} m high`);
}
const sq = PLACES.find((p) => p.id === 'piataferdinand'); // in places.js, so the phone map lists it too
ok(sq?.kind === 'sight' && sq.name && sq.note && sq.xz?.length === 2 && !sq.ring, 'the square is a sight with a name and a note, a badge only');
ok(site.clear(...toMap(CX, 20)) && !site.clear(40, -400), 'clear() takes the generated trees off the square and keeps them elsewhere');
ok(site.spots.length >= 2 && site.spots.every((s) => Number.isFinite(s.x) && Number.isFinite(s.z)), `${site.spots.length} tree spots`);

console.log = log;
log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);

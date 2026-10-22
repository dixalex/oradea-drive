// Headless checks for the City Hall, the Roman Catholic church of St Ladislaus and the Black Eagle Palace on Piața Unirii
// (src/world/oradea/sites/primaria.js) on the compiled Oradea map: node tests/oradea-primaria.test.mjs
//   the four OSM ways the site replaces are in the map and in `skip`; it builds in budget (~30k vertices, <= 15 meshes) with
//   finite geometry and no two coplanar surfaces over each other (z-fighting); the hall's pavilion, the tower, the church and
//   the palace are solid, the palace's bollards stop the car at its open court, the footprints are the OSM outlines, the
//   sights are in places.js and clear() takes the trees off the three lots only. Skipped without the map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { liftBanks, shapeBridges } from '../src/world/oradea/river.js';
import { inPoly } from '../src/world/cherkasy/geo.js';
import { SITE } from '../src/world/oradea/sites/primaria.js';
import { toMap as hallMap, TOWER } from '../src/world/oradea/sites/primaria/frame.js';
import { toMapV } from '../src/world/oradea/sites/primaria/eagle.js';
import { churchLocal } from '../src/world/oradea/sites/primaria/church.js';

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

ok(SITE.skip.length === 4 && SITE.skip.join() === [264917565, 6481078, 1207602388, 19826329].join(), 'the site skips the church, the hall, the tower and the palace');
for (const id of SITE.skip) ok(map.buildings.some((b) => b.id === id), `OSM way ${id} is in map_buildings.json`);

const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const site = SITE.build({ root, solids: cw, heightAt: hf.heightAt, map });
ok(!!site && root.children.length === 1 && site.footprints.length === 4, 'site builds: one group, four footprints');
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
    const ix = [0, 1, 2].map((q) => (I ? I.getX(k + q) : k + q)), C = o.geometry.attributes.color, U = o.geometry.attributes.uv;
    const att = (A_) => (A_ ? ix.map((i) => [A_.getX(i), A_.getY(i), A_.itemSize > 2 ? A_.getZ(i) : 0]) : null);
    tris.push({ mesh: o.name, a, b, c, n: nn, d: nn.dot(a), area, uv: att(U), vc: att(C) });
  }
});
ok(nan === 0, 'all vertices finite');
ok(verts > 20000 && verts < 34000 && meshes <= 15, `${(verts / 1000).toFixed(1)}k vertices in ${meshes} meshes`);
ok(cw.count > 80, `colliders: ${cw.count}`);

// coplanar overlaps: same-facing triangles, one in the other's plane (6 mm: with the reversed float depth buffer 1 cm of offset is plenty), interiors overlapping seen along the normal
{
  const O = new THREE.Vector3(-20, 5, 0);
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
  const flat = (u, P) => P.every((p) => Math.abs(u.n.dot(p) - u.d) < 0.006);
  // two coplanar layers of one mesh in the same vertex colour differ only by the phase of a faint stucco or stone grain (box caps
  // that meet a neighbouring box's front at a corner, posts on a rail): not a visible fight. The painted atlases (tile, vn)
  // must also agree on the texel there.
  const bary = (t, p) => {
    const v0 = t.b.clone().sub(t.a), v1 = t.c.clone().sub(t.a), v2 = p.clone().sub(t.a);
    const d00 = v0.dot(v0), d01 = v0.dot(v1), d11 = v1.dot(v1), d20 = v2.dot(v0), d21 = v2.dot(v1), den = d00 * d11 - d01 * d01 || 1;
    const v = (d11 * d20 - d01 * d21) / den, w = (d00 * d21 - d01 * d20) / den;
    return [1 - v - w, v, w];
  };
  const lerp = (t, key, p) => { const A_ = t[key]; if (!A_) return null; const w = bary(t, p); return [0, 1, 2].map((c) => A_[0][c] * w[0] + A_[1][c] * w[1] + A_[2][c] * w[2]); };
  const same = (i, j, p) => {
    if (i.mesh !== j.mesh) return false;
    const x = lerp(i, 'vc', p), y = lerp(j, 'vc', p);
    if (!!x !== !!y || (x && x.some((v, c) => Math.abs(v - y[c]) > 0.01))) return false;
    if (/-(tile|vn)$/.test(i.mesh)) { const u = lerp(i, 'uv', p), w = lerp(j, 'uv', p); if (!u || !w || u.some((v, c) => Math.abs(v - w[c]) > 0.002)) return false; }
    return true;
  };
  const overlap = (i, j) => {
    for (const p of pts(i)) if (flat(j, [p]) && inside(proj(j.n, p), ...tri2(j)) && !same(i, j, p)) return true;
    for (const p of pts(j)) if (flat(i, [p]) && inside(proj(i.n, p), ...tri2(i)) && !same(i, j, p)) return true;
    return false;
  };
  const groups = new Map();
  for (const t of tris) {
    const k = `${Math.round(t.n.x * 10)},${Math.round(t.n.y * 10)},${Math.round(t.n.z * 10)}`;
    (groups.get(k) ?? groups.set(k, []).get(k)).push(t);
  }
  let bad = 0; const where = [];
  for (const list of groups.values()) {
    list.sort((p, q) => p.box.min.x - q.box.min.x);
    for (let i = 0; i < list.length; i++) for (let j = i + 1; j < list.length && list[j].box.min.x <= list[i].box.max.x; j++) {
      const A_ = list[i], B_ = list[j];
      if (A_.n.dot(B_.n) < 0.9995 || !A_.box.intersectsBox(B_.box)) continue;
      if (!overlap(A_, B_)) continue;
      bad++;
      if (where.length < 12) where.push(`${A_.mesh}/${B_.mesh} @${A_.a.clone().add(O).toArray().map((x) => x.toFixed(2)).join(',')} n${A_.n.toArray().map((x) => x.toFixed(2)).join(',')}`);
    }
  }
  ok(bad === 0, `no coplanar overlapping surfaces (${bad}${where.length ? ': ' + where.join('; ') : ''})`);
}

const gy = (x, z) => hf.heightAt(x, z);
const cast = (x, z, x2, z2, h = 1.0, max = 80) => cw.raycast({ x, y: gy(x, z) + h, z }, { x: x2 - x, y: 0, z: z2 - z }, max);

// the hall: the pavilion's steps climb to the entrance, a ray from the square stops at the front, the roof holds
{
  const [px, pz] = hallMap(0, 0);
  const front = cast(-40, 0, -70, -12, 3.0, 80);
  ok(front && front.point.x < -50 && front.point.x > -80, `a ray from the square stops at the hall front (x = ${front && front.point.x.toFixed(1)})`);
  const g = gy(px, pz);
  const top = cw.groundHeight(...hallMap(20, 8), g + 60);
  ok(top - g > 12 && top - g < 30, `the hall's roof holds (${(top - g).toFixed(1)} m over the ground at its corner)`);
}

// the tower: a 50 m column on the river street
{
  const [tx, tz] = TOWER.c, g = gy(tx, tz);
  const top = cw.groundHeight(tx, tz, g + 80);
  ok(top - g > 38 && top - g < 52, `the clock tower stands ${(top - g).toFixed(1)} m over the street`);
  // the tower's own walls stop a ray 14 m out on at least one side (the others may run into the hall's arm first)
  const rays = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([p, q]) => { const d = [TOWER.t1[0] * p + TOWER.t2[0] * q, TOWER.t1[1] * p + TOWER.t2[1] * q]; return cast(tx + 14 * d[0], tz + 14 * d[1], tx, tz, 1.5, 30); });
  ok(rays.some((h) => h && h.distance > 8.5 && h.distance < 12), `the tower's wall stops a ray (${rays.map((h) => h && h.distance.toFixed(1)).join(' / ')} m of 14)`);
}

// the church: rays from the lot's edges to its middle stop at its walls
{
  const ring = site.footprints.find((f) => f.id === 264917565).poly;
  const cx = ring.reduce((m, p) => m + p[0], 0) / ring.length, cz = ring.reduce((m, p) => m + p[1], 0) / ring.length;
  const hits = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([p, q]) => cast(cx + 30 * p, cz + 30 * q, cx, cz, 1.5, 40));
  ok(hits.every((h) => h && h.distance > 8 && h.distance < 29), `the church's walls stop rays from every side (${hits.map((h) => h && h.distance.toFixed(1)).join(' / ')} m of 30)`);
}

// the palace: solid walls, the court open and fenced by bollards, the back wall stops the car
{
  const ring = site.footprints.find((f) => f.id === 19826329).poly;
  const court = toMapV(-3, 31), inCourt = inPoly(ring, court[0], court[1]);
  ok(!inCourt, 'the palace court (the open recess) is outside its footprint ring');
  const back = cast(...toMapV(-7, 31), ...toMapV(8, 31), 1.0, 40);
  ok(back && back.distance < 30, `the court's back wall stops a car driving in (${back && back.distance.toFixed(1)} m)`);
  const boll = cast(...toMapV(-4.0, 30.9), ...toMapV(-9.0, 30.9), 0.5, 20);
  ok(boll && boll.distance < 8, `a bollard stands across the court's mouth (${boll && boll.distance.toFixed(1)} m)`);
  const wall = cast(...toMapV(30, -14), ...toMapV(30, 10), 1.5, 40);
  ok(wall && wall.distance > 10 && wall.distance < 20, `the street front stops a ray (${wall && wall.distance.toFixed(1)} m)`);
  const tw = toMapV(-6.0, 41.8), g = gy(tw[0], tw[1]);
  const top = cw.groundHeight(tw[0], tw[1], g + 80);
  ok(top - g > 25 && top - g < 50, `the round tower and its spire hold (${(top - g).toFixed(1)} m)`);
}

// footprints, places, clearing
const fp = site.footprints;
ok(fp.map((q) => q.id).sort().join() === [...SITE.skip].sort().join(), 'footprints carry the skipped OSM ids');
for (const q of fp) {
  const osm = map.buildings.find((b) => b.id === q.id);
  let hit = false; for (let i = 0; i < (osm?.p.length ?? 0); i += 2) if (inPoly(q.poly, osm.p[i], osm.p[i + 1])) hit = true;
  ok(hit && q.h > 8, `${q.name}: the footprint is the OSM outline, ${q.h.toFixed(1)} m high`);
}
{
  let places = null;
  try { places = (await import('../src/world/oradea/places.js')).PLACES; } catch { /* places.js needs a browser here: read the source instead */ }
  const src = places ? null : readFileSync(new URL('../src/world/oradea/places.js', import.meta.url), 'utf8');
  for (const id of ['primaria', 'vulturulnegru']) ok(places ? places.some((p) => p.id === id && p.kind === 'sight') : new RegExp(`sight\\('${id}'`).test(src), `${id} is a sight in places.js`);
}
const hallC = hallMap(10, 6), vnC = toMapV(40, 20);
ok(site.clear(...hallC) && site.clear(...vnC) && site.clear(...churchLocal.toMap(8, 10)) && !site.clear(40, -400), 'clear() takes the generated trees off the three lots and keeps them elsewhere');

console.log = log;
log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);

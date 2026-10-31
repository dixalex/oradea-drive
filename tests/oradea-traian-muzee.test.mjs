// Headless checks for the memorial museums and bronzes round Parcul Traian (src/world/oradea/sites/traian-muzee.js and ./traian-muzee/)
// on the compiled map:
//   node tests/oradea-traian-muzee.test.mjs
// Contract, skip ids (none shared with another site), places, atlas cells, vertex and draw-call budgets, finite geometry, colliders on
// every building and plinth, clear() at each bronze and on the lots, the phone map, a missing id.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';

const ctx2d = new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern' ? () => ({ addColorStop() {} })
  : k === 'measureText' ? () => ({ width: 100 }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };
const { SITE } = await import('../src/world/oradea/sites/traian-muzee.js');
const { LIST, SKIP } = await import('../src/world/oradea/sites/traian-muzee/data.js');
const { buildAtlas } = await import('../src/world/oradea/sites/traian-muzee/atlas.js');
const { BRONZE_POINTS } = await import('../src/world/oradea/sites/traian-muzee/bronze.js');
const { PLACES: ALL } = await import('../src/world/oradea/places.js');
const { rng } = await import('../src/world/cherkasy/geo.js');

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const fails = [];
const check = (ok, msg) => { if (!ok) { fails.push(msg); console.log('FAIL', msg); } };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
const hf = createHeightField(map, dem);
const byId = new Map(map.buildings.map((b) => [b.id, b]));
const WANT = { ady: 3000011176, vulcan: 421787868, lazar: 421787845, episcopia: 1525803455, okanyi: 423358089 }; // the buildings the site should hold when finished
const BUILT = LIST.map((b) => b.key);

// ---- contract and data
check(SITE.id === 'traian-muzee' && SITE.ground === true && typeof SITE.build === 'function', 'site contract');
check(SITE.skip === SKIP && new Set(SITE.skip).size === SITE.skip.length, 'skip lists every modelled building once');
check(LIST.every((b, i) => SKIP[i] === b.id && typeof b.build === 'function'), 'LIST entries carry id and builder');
for (const id of SITE.skip) check(byId.has(id), `skip id ${id} is in map_buildings.json`);
for (const k of BUILT) check(SKIP.includes(WANT[k]), `${k} (${WANT[k]}) is modelled`);
check(BUILT.every((k) => k in WANT), 'every built key is a known one');

// no other site may take one of these footprints (every file under sites/ is auto-loaded, a clash would double the building)
const dir = new URL('../src/world/oradea/sites/', import.meta.url);
let others = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.js') && n !== 'traian-muzee.js')) {
  let m; const log = console.log; console.log = () => {};
  try { m = await import(new URL(f, dir)); } catch { m = null; } finally { console.log = log; }
  if (!m?.SITE?.skip) continue;
  others++;
  for (const id of m.SITE.skip) check(!SKIP.includes(id), `${f} also skips ${id}`);
}
check(others >= 5, `${others} other sites checked for clashing skip ids`);

// ---- the places: in SITE.places until the orchestrator moves them into ../places.js (then SITE.places is empty); either way each of the five
// is listed once, with the right kind, footprints in the map, a name and a note in both languages (through t(ro, en)), no em-dash
const WANT_PLACES = { muzeuady: 'sight', muzeuvulcan: 'sight', casalazar: 'sight', episcopiaortodoxa: 'improved', okanyi: 'improved' };
const listed = [...SITE.places, ...ALL.filter((p) => p.id in WANT_PLACES)];
check(listed.map((p) => p.id).sort().join() === Object.keys(WANT_PLACES).sort().join(), `the places: ${listed.map((p) => p.id)}`);
check(new Set(ALL.map((p) => p.id)).size === ALL.length, 'place ids are unique in places.js');
for (const p of listed) {
  check(p.kind === WANT_PLACES[p.id], `${p.id}: ${WANT_PLACES[p.id]}`);
  check(typeof p.name === 'string' && p.name.length > 3 && typeof p.note === 'string' && p.note.length > 20 && typeof p.icon === 'string', `${p.id}: name, note, icon`);
  check(Array.isArray(p.bld) && p.bld.length >= 1 && p.bld.every((id) => byId.has(id) && SKIP.includes(id)), `${p.id}: footprints are modelled ones in the map`);
  check(!/[—Ѐ-ӿ]/.test(p.name + p.note), `${p.id}: no em-dash and no Cyrillic`);
  for (const c of [].concat(p.cut ?? [])) check(c.p?.length === 2 && c.n?.length === 2 && Math.abs(Math.hypot(...c.n) - 1) < 0.02, `${p.id}: a cut is {p, n} with a unit normal`);
}
{ // the Vulcan cuts keep the museum house (a 16 x 11.5 m rectangle at the OSM node) out of the 3,035 m2 block
  const { clipRing } = await import('../src/world/cherkasy/places.js');
  const { houseFrame, VULCAN_NODE } = await import('../src/world/oradea/sites/traian-muzee/vulcan.js');
  const p = listed.find((q) => q.id === 'muzeuvulcan'), b = byId.get(421787868);
  const ring = [].concat(p.cut).reduce(clipRing, b.p), area = (() => { let a = 0; for (let i = 0; i < ring.length; i += 2) { const j = (i + 2) % ring.length; a += ring[i] * ring[j + 1] - ring[j] * ring[i + 1]; } return Math.abs(a) / 2; })();
  const H = houseFrame(Array.from({ length: b.p.length / 2 }, (_, i) => [b.p[2 * i], b.p[2 * i + 1]]));
  check(ring.length >= 6 && area > 120 && area < 260, `the Vulcan cuts leave ${area.toFixed(0)} m2 of the block`);
  check(H && Math.hypot(H.c[0] - VULCAN_NODE[0], H.c[1] - VULCAN_NODE[1]) < 10, 'the Vulcan house stands at the museum node');
}

// ---- the atlas
const atlas = buildAtlas(rng(1869));
const cells = atlas.A.cells;
check(Object.keys(cells).length >= 40, `${Object.keys(cells).length} atlas cells`);
check(atlas.used > 0.2 && atlas.used < 0.92, `the 2048 x 2048 sheet is ${(atlas.used * 100).toFixed(0)} % used`);
for (const n of Object.keys(cells)) { const u = atlas.uv(n); check(u.u0 >= 0 && u.u1 <= 1 && u.v0 >= 0 && u.v1 <= 1 && u.u1 > u.u0 && u.v1 > u.v0, `uv of ${n} inside the atlas`); }
for (const n of ['ma.g', 'ma.gd', 'ma.p', 'ma.pedi', 'vu.g', 'vu.gd', 'vu.fb', 'vu.gable', 'la.g', 'la.f', 'la.rail', 'ep.g', 'ep.f3', 'ep.gd', 'ok.g', 'ok.fb', 'ok.gable']) check(cells[n], `cell ${n}`);
{
  const R = Object.entries(cells).map(([n, c]) => [n, c.x, c.y, c.x + c.w, c.y + c.h]);
  let clash = 0;
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
    const a = R[i], b = R[j];
    if (a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4]) continue;
    if (a[1] < b[3] && b[1] < a[3] && a[2] < b[4] && b[2] < a[4]) { clash++; if (clash < 4) console.log('overlap', a[0], b[0]); }
  }
  check(clash === 0, `${clash} overlapping atlas cells`);
}
check(atlas.A.W === 2048 && atlas.A.H === 2048, 'the sheet is 2048 x 2048');

// ---- the build
const build = (m = map, opt = {}) => {
  const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
  const root = new THREE.Group();
  const log = console.log, err = console.error, errs = [];
  console.log = () => {}; console.error = (...a) => { errs.push(a.map(String).join(' ')); };
  let site;
  try { site = SITE.build({ root, solids: cw, zips: null, map: m, heightAt: hf.heightAt, detailMat: new THREE.MeshStandardMaterial(), ground: { heightAt: hf.heightAt, onAsphalt: () => false }, ...opt }); } finally { console.log = log; console.error = err; }
  return { site, root, cw, errs };
};
const { site, root, cw, errs } = build();
check(site != null, 'the site builds');
check(errs.length === 0, `nothing logged as failed: ${errs.join(' | ').slice(0, 300)}`);
const fps = site.footprints;
check(fps.every((f) => f.poly.length >= 3 && f.id && f.h > 2.5 && f.h < 40), 'footprints carry rings, ids and plausible heights');
check(fps.every((f) => SKIP.includes(f.id)), 'the footprints are all skipped ids');
for (const id of SKIP) check(fps.some((f) => f.id === id), `a footprint for ${id}`);
const H = { 3000011176: [4.5, 11], 421787868: [5, 20], 421787845: [6, 20], 1525803455: [8, 20], 423358089: [8, 22] };
for (const [id, [lo, hi]] of Object.entries(H)) for (const f of fps.filter((q) => q.id === +id)) check(f.h > lo && f.h < hi, `${id} ${f.name ?? ''} stands ${f.h.toFixed(1)} m (${lo}-${hi})`);

// ---- geometry: groups, budgets, finiteness
const groups = {}; let nan = 0, steep = 0, maxDy = 0;
root.children.forEach((g) => {
  const e = groups[g.name] = { verts: 0, meshes: 0 };
  g.traverse((o) => {
    if (!o.isMesh) return;
    const P = o.geometry.attributes.position; e.verts += P.count; e.meshes++;
    if (process.env.V) console.log(o.name, P.count);
    for (const v of P.array) if (!Number.isFinite(v)) nan++;
    if (o.name.endsWith('-roof')) {
      const I = o.geometry.index;
      for (let t = 0; t < I.count; t += 3) {
        const ys = [0, 1, 2].map((k) => P.getY(I.getX(t + k)));
        const dy = Math.max(...ys) - Math.min(...ys); maxDy = Math.max(maxDy, dy); if (dy > 14) steep++;
      }
    }
  });
});
const total = Object.values(groups).reduce((s, e) => s + e.verts, 0), calls = Object.values(groups).reduce((s, e) => s + e.meshes, 0);
console.log(site.stats.buildings, groups, { total, calls, solids: cw.count, maxRoofDy: +maxDy.toFixed(1), atlas: +site.stats.atlasUsed.toFixed(2), bronze: site.stats.bronzeVerts });
check(nan === 0, 'all vertices are finite');
check(steep === 0, `${steep} roof triangles climb over 14 m`);
for (const [k, n] of Object.entries(site.stats.buildings)) check(n > 200 && n <= 12000, `${k}: ${n} verts (budget 12000)`);
check(LIST.every((b) => site.stats.buildings[b.key] > 0), 'every building drew something');
check(site.stats.bronzeVerts > 500 && site.stats.bronzeVerts <= 18000, `${site.stats.bronzeVerts} bronze verts (4 bronzes, 6000 each at most)`);
for (const [k, n] of Object.entries(site.stats.bronzeSizes ?? {})) check(n > 150 && n <= 6000, `bronze ${k}: ${n} verts (budget 6000)`);
check(Object.keys(site.stats.bronzeSizes ?? {}).length === Object.keys(BRONZE_POINTS).length, 'every bronze reports its size');
console.log('bronze sizes', site.stats.bronzeSizes);
check(calls <= 12, `${calls} draw calls over the budget of 12`);
check(cw.count >= SKIP.length * 2 + 3, `${cw.count} colliders registered`);

// ---- a collider stands in every footprint: a point just inside a long edge, three metres up, is inside a solid
const inPoly = (P, x, z) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < ((P[j][0] - P[i][0]) * (z - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) o = !o; return o; };
for (const f of fps) {
  const P = f.poly; let hit = false;
  for (let i = 0; i < P.length && !hit; i++) {
    const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 4) continue;
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
    for (const s of [1, -1]) { const x = mx + nx * s * 1.5, z = mz + nz * s * 1.5; if (inPoly(P, x, z) && cw.inside(x, hf.heightAt(x, z) + 3, z)) hit = true; }
  }
  check(hit, `building ${f.id} ${f.name ?? '(neighbours)'} has a collider`);
}
// a collider on every plinth: the bronze's base, 0.1 m over the ground
for (const [k, [x, z]] of Object.entries(BRONZE_POINTS)) check(cw.inside(x, hf.heightAt(x, z) + 0.1, z), `bronze ${k} has a collider on its plinth`);

// ---- clear() keeps generated trees off the lots and holds parks.js off each modelled bronze; update()
const mid = (P) => { let x = 0, z = 0; for (const p of P) { x += p[0]; z += p[1]; } return [x / P.length, z / P.length]; };
for (const f of fps) { const [x, z] = mid(f.poly); if (inPoly(f.poly, x, z)) check(site.clear(x, z), `clear() covers ${f.id} ${f.name ?? ''}`); }
for (const [k, [x, z]] of Object.entries(BRONZE_POINTS)) check(site.clear(x, z), `clear() is true at the ${k} bronze's OSM point`);
check(!site.clear(0, 0) && !site.clear(-300, 300) && !site.clear(600, 100), 'clear() leaves the rest of the city alone');
check(typeof site.update === 'function', 'update()');
for (const [k, id] of [['ady', 'n4827014957'], ['holnap', 'n4827012515'], ['czaran', 'n4827012513'], ['viteazul', 'n13700585162']]) {
  const p = map.pois.find((q) => q.id === id); check(p && Math.hypot(p.x - BRONZE_POINTS[k][0], p.z - BRONZE_POINTS[k][1]) < 0.2, `${k}: BRONZE_POINTS matches the OSM node ${id}`);
}

// ---- the same build twice gives the same mesh sizes
const again = build();
const sizes = (r) => r.children.map((g) => g.children.map((m) => m.geometry.attributes.position.count).join(',')).join('|');
check(sizes(again.root) === sizes(root), 'the build is deterministic');

// ---- the phone map: buildings and roads clipped to a disc of 1800 m round the origin, flagged phoneCentre (half-size atlas); then with
// a building missing: nothing may throw, the rest still builds
const disc = (p) => { for (let i = 0; i < p.length; i += 2) if (Math.hypot(p[i], p[i + 1]) < 1800) return true; return false; };
const phoneMap = { ...map, phoneCentre: true, buildings: map.buildings.filter((b) => disc(b.p)), roads: map.roads.filter((r) => disc(r.p)) };
const ph = build(phoneMap);
check(ph.errs.length === 0 && ph.site.footprints.length === fps.length, `the phone map builds all ${ph.site.footprints.length} footprints`);
{ let pc = 0; ph.root.children.forEach((g) => g.children.forEach(() => pc++)); check(pc === calls, `the phone draws ${pc} calls (the desktop ${calls})`); }
const gap = { ...map, buildings: map.buildings.filter((b) => b.id !== SKIP[SKIP.length - 1] && b.id !== SKIP[0]) };
let threw = null, gp = null;
try { gp = build(gap); } catch (e) { threw = e; }
check(!threw && gp && gp.errs.length === 0, `two ids missing: builds the rest (${threw?.message ?? ''})`);
let threw2 = null;
try { build({ ...map, buildings: [] }); } catch (e) { threw2 = e; }
check(!threw2, `no buildings at all does not throw (${threw2?.message ?? ''})`);
let threw3 = null;
try { build({ ...map, roads: [] }); } catch (e) { threw3 = e; }
check(!threw3, `no roads does not throw (${threw3?.message ?? ''})`);

if (fails.length) { console.log(`\n${fails.length} failed`); process.exit(1); }
console.log('ok: traian-muzee');

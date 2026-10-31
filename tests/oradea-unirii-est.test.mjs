// Headless checks for the east side of Piața Unirii and Strada Vasile Alecsandri (src/world/oradea/sites/unirii-est.js and ./unirii-est/)
// on the compiled map:
//   node tests/oradea-unirii-est.test.mjs
// Moskovits Adolf (rounded corner, two bows), Casa Deutsch, Casa Kováts, the Greek Catholic lyceum and the row lots of the street:
// contract, skip ids, places, atlas cells, vertex and draw-call budgets, finite geometry, colliders, clear(), the phone map.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';

const ctx2d = new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern' ? () => ({ addColorStop() {} })
  : k === 'measureText' ? () => ({ width: 100 }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };
const { SITE } = await import('../src/world/oradea/sites/unirii-est.js');
const { LIST, SKIP, AXIS } = await import('../src/world/oradea/sites/unirii-est/data.js');
const { PLACES: ALL } = await import('../src/world/oradea/places.js');
const PLACES = ALL.filter((p) => ['moskovitsadolf', 'kovats', 'iuliumaniu', 'alecsandri'].includes(p.id));
const { buildAtlas } = await import('../src/world/oradea/sites/unirii-est/atlas.js');
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

// ---- contract and data
check(SITE.id === 'unirii-est' && SITE.ground === true && typeof SITE.build === 'function', 'site contract');
check(SITE.skip === SKIP && SITE.skip.length === LIST.length && new Set(SITE.skip).size === SITE.skip.length, 'skip lists every modelled building once');
check(LIST.every((b, i) => SKIP[i] === b.id && typeof b.build === 'function' && (b.group === 'est' || b.group === 'vest')), 'LIST entries carry id, builder and group');
for (const id of SITE.skip) check(byId.has(id), `skip id ${id} is in map_buildings.json`);
for (const k of ['adolf', 'deutsch', 'kovats', 'lyceum']) check(LIST.some((b) => b.key === k), `${k} is built`);
check(LIST.find((b) => b.key === 'adolf').id === 6481080 && LIST.find((b) => b.key === 'deutsch').id === 1141044041
  && LIST.find((b) => b.key === 'kovats').id === 6481082 && LIST.find((b) => b.key === 'lyceum').id === 1374968255, 'the four main OSM ids');
check(AXIS.length === 6 && AXIS.every(Number.isFinite), 'the street axis is a polyline');

// no other site may take one of these footprints (every file under sites/ is auto-loaded, a clash would double the building)
const dir = new URL('../src/world/oradea/sites/', import.meta.url);
let others = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.js') && n !== 'unirii-est.js')) {
  let m; const log = console.log; console.log = () => {};
  try { m = await import(new URL(f, dir)); } catch { m = null; } finally { console.log = log; }
  if (!m?.SITE?.skip) continue;
  others++;
  for (const id of m.SITE.skip) check(!SKIP.includes(id), `${f} also skips ${id}`);
}
check(others >= 5, `${others} other sites checked for clashing skip ids`);

// ---- the places (in places.js; names and notes bilingual through t(ro, en))
const ids = (p) => p.id;
check(PLACES.map(ids).sort().join() === 'alecsandri,iuliumaniu,kovats,moskovitsadolf', 'the four places');
check(new Set(ALL.map(ids)).size === ALL.length, 'place ids are unique in places.js');
const street = PLACES.find((p) => p.id === 'alecsandri');
check(street?.kind === 'sight' && [1141044041, 21059343, 21059342, 423122936, 423122962].every((id) => street.bld.includes(id)), 'the street is a sight over Casa Deutsch and the row');
for (const id of ['moskovitsadolf', 'kovats', 'iuliumaniu']) check(PLACES.find((p) => p.id === id)?.kind === 'improved', `${id} is an improved object`);
for (const p of PLACES) {
  check(typeof p.name === 'string' && p.name.length > 3 && typeof p.note === 'string' && p.note.length > 10 && typeof p.icon === 'string', `${p.id}: name, note, icon`);
  check(Array.isArray(p.bld) && p.bld.length >= 1 && p.bld.every((id) => byId.has(id)), `${p.id}: footprints are in the map`);
  check(!/[—Ѐ-ӿ]/.test(p.name + p.note), `${p.id}: no em-dash and no Cyrillic`);
}
for (const p of PLACES) check(p.bld.every((id) => SKIP.includes(id)), `${p.id}: every footprint it lights is a modelled one`);
check(!PLACES.some((p) => p.id === 'moskovits'), "the existing 'moskovits' id (Moskovits Miksa) is not reused");

// ---- the atlas
const atlas = buildAtlas(rng(77));
const cells = atlas.A.cells;
check(Object.keys(cells).length > 80, `${Object.keys(cells).length} atlas cells`);
check(atlas.used > 0.3 && atlas.used < 0.9, `the sheet is ${(atlas.used * 100).toFixed(0)} % used`);
for (const n of ['dd.face', 'ma.nobile', 'ma.reg', 'ma.top', 'ma.pier', 'ma.blank', 'kv.f', 'ly.f', 'ly.t', 'g.munk', 'g.roth', 'g.rendes', 'g.amant', 'g.innD']) check(cells[n], `cell ${n}`);
for (const k of ['munk', 'no5', 'roth', 'rendes', 'amant', 'inn']) for (const c of ['reg', 'nobile', 'top', 'pier']) check(cells[`${k}.${c}`], `cell ${k}.${c}`);
for (const n of Object.keys(cells)) { const u = atlas.uv(n); check(u.u0 >= 0 && u.u1 <= 1 && u.v0 >= 0 && u.v1 <= 1 && u.u1 > u.u0 && u.v1 > u.v0, `uv of ${n} inside the atlas`); }
// no two cells overlap
{
  const R = Object.entries(cells).map(([n, c]) => [n, c.x, c.y, c.x + c.w, c.y + c.h]);
  let clash = 0;
  for (let i = 0; i < R.length; i++) for (let j = i + 1; j < R.length; j++) {
    const a = R[i], b = R[j];
    if (a[1] === b[1] && a[2] === b[2] && a[3] === b[3] && a[4] === b[4]) continue; // an alias of the same cell (reg / reg2)
    if (a[1] < b[3] && b[1] < a[3] && a[2] < b[4] && b[2] < a[4]) { clash++; if (clash < 4) console.log('overlap', a[0], b[0]); }
  }
  check(clash === 0, `${clash} overlapping atlas cells`);
}

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
check(errs.length === 0, `nothing logged as failed: ${errs.join(' | ').slice(0, 200)}`);
check(site.footprints.length === SITE.skip.length, `one footprint per skipped building (${site.footprints.length})`);
check(site.footprints.every((f) => f.poly.length >= 3 && f.id && f.h > 5 && f.h < 40), 'footprints carry rings, ids and plausible heights');
check(new Set(site.footprints.map((f) => f.id)).size === SKIP.length && site.footprints.every((f) => SKIP.includes(f.id)), 'the footprints are exactly the skipped ids');
const fp = (id) => site.footprints.find((f) => f.id === id);
const H = { 6481080: [19, 28], 1141044041: [9, 15], 6481082: [11, 18], 1374968255: [14, 24] };
for (const [id, [lo, hi]] of Object.entries(H)) check(fp(+id) && fp(+id).h > lo && fp(+id).h < hi, `${id} stands ${fp(+id)?.h?.toFixed(1)} m (${lo}-${hi})`);

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
        const dy = Math.max(...ys) - Math.min(...ys); maxDy = Math.max(maxDy, dy); if (dy > 12) steep++;
      }
    }
  });
});
const total = Object.values(groups).reduce((s, e) => s + e.verts, 0), calls = Object.values(groups).reduce((s, e) => s + e.meshes, 0);
console.log(site.stats.buildings, groups, { total, calls, solids: cw.count, maxRoofDy: +maxDy.toFixed(1) });
check(groups['unirii-est'] && groups['unirii-vest'], 'the two groups exist (east of the square, Kováts and the lyceum)');
check(nan === 0, 'all vertices are finite');
check(steep === 0, `${steep} roof triangles climb over 12 m`);
const V = site.stats.buildings, cap = { adolf: 25000, deutsch: 10000, kovats: 15000, lyceum: 15000 };
for (const [k, n] of Object.entries(cap)) check(V[k] > 200 && V[k] <= n, `${k}: ${V[k]} verts (budget ${n})`);
for (const k of ['block37', 'rendes', 'amant', 'inn']) check(V[k] > 50 && V[k] <= 6000, `${k}: ${V[k]} verts (budget ~5k a lot)`);
check(total <= 60000, `${total} verts over the 60k budget`);
check(calls <= 12, `${calls} draw calls over the budget of 12`);
check(site.stats.lots >= 30, `${site.stats.lots} facade lots`);
check(cw.count >= SKIP.length * 2, `${cw.count} colliders registered`);

// ---- a collider stands in every building: a point just inside a long edge, three metres up, is inside a solid
const inPoly = (P, x, z) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < ((P[j][0] - P[i][0]) * (z - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) o = !o; return o; };
for (const f of site.footprints) {
  const P = f.poly; let hit = false;
  for (let i = 0; i < P.length && !hit; i++) {
    const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 6) continue;
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
    for (const s of [1, -1]) { const x = mx + nx * s * 1.5, z = mz + nz * s * 1.5; if (inPoly(P, x, z) && cw.inside(x, hf.heightAt(x, z) + 3, z)) hit = true; }
  }
  check(hit, `building ${f.id} has a collider`);
}

// ---- clear(), update()
const mid = (id) => { const p = byId.get(id).p; let x = 0, z = 0; for (let i = 0; i < p.length; i += 2) { x += p[i]; z += p[i + 1]; } return [x / (p.length / 2), z / (p.length / 2)]; };
check(site.clear(AXIS[2], AXIS[3]) && site.clear(AXIS[0] + 30, AXIS[1] - 6.5), 'clear() covers the street axis');
check(site.clear(...mid(1141044041)) && site.clear(...mid(1374968255)), 'clear() covers Casa Deutsch and the lyceum');
check(!site.clear(0, 0) && !site.clear(-300, 300) && !site.clear(600, 100), 'clear() leaves the rest of the city alone');
check(typeof site.update === 'function', 'update()');

// ---- the same build twice gives the same mesh sizes
const again = build();
const sizes = (r) => r.children.map((g) => g.children.map((m) => m.geometry.attributes.position.count).join(',')).join('|');
check(sizes(again.root) === sizes(root), 'the build is deterministic');

// ---- the phone map: buildings and roads clipped to a disc of 1800 m round the origin (every id here lies inside), then with
// buildings missing (a lot's neighbour absent): nothing may throw, the rest still builds
const disc = (p) => { for (let i = 0; i < p.length; i += 2) if (Math.hypot(p[i], p[i + 1]) < 1800) return true; return false; };
const phoneMap = { ...map, buildings: map.buildings.filter((b) => disc(b.p)), roads: map.roads.filter((r) => disc(r.p)) };
const ph = build(phoneMap);
check(ph.errs.length === 0 && ph.site.footprints.length === SKIP.length, `the phone map builds all ${ph.site.footprints.length} buildings`);
const gap = { ...map, buildings: map.buildings.filter((b) => b.id !== 21059342 && b.id !== 1374968255) };
let threw = null, gp = null;
try { gp = build(gap); } catch (e) { threw = e; }
check(!threw && gp && gp.site.footprints.length === SKIP.length - 2 && gp.errs.length === 0, `two ids missing: builds the other ${gp?.site?.footprints?.length} (${threw?.message ?? ''})`);
const empty = { ...map, buildings: [] };
let threw2 = null;
try { build(empty); } catch (e) { threw2 = e; }
check(!threw2, `no buildings at all does not throw (${threw2?.message ?? ''})`);

if (fails.length) { console.log(`\n${fails.length} failed`); process.exit(1); }
console.log('ok: unirii-est');

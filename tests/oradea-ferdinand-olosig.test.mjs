// Headless checks for the Art Nouveau corners round Piața Ferdinand and in Olosig (src/world/oradea/sites/ferdinand-olosig.js and
// ./ferdinand-olosig/) on the compiled map:
//   node tests/oradea-ferdinand-olosig.test.mjs
// Casa Poynár, Palatul Füchsl, Hotel Transilvania, Casele Adorján I and II, the Rimanóczy Hotel and its baths wing: contract, skip ids
// (none shared with another site), places, atlas cells, vertex and draw-call budgets, finite geometry, colliders, clear(), the phone map.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';

const ctx2d = new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern' ? () => ({ addColorStop() {} })
  : k === 'measureText' ? () => ({ width: 100 }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };
const { SITE } = await import('../src/world/oradea/sites/ferdinand-olosig.js');
const { LIST, SKIP } = await import('../src/world/oradea/sites/ferdinand-olosig/data.js');
const { buildAtlas } = await import('../src/world/oradea/sites/ferdinand-olosig/atlas.js');
const { PT } = await import('../src/world/oradea/sites/ferdinand-olosig/cells-poynar.js');
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
const WANT = { poynar: 6481083, transilvania: 421787916, fuchsl: 1534824825, adorjan1: 421787914, adorjan2: 489773508, rimanoczy: 421787874, rimanoczy2: 21056820 };

// ---- contract and data
check(SITE.id === 'ferdinand-olosig' && SITE.ground === true && typeof SITE.build === 'function', 'site contract');
check(SITE.skip === SKIP && new Set(SITE.skip).size === SITE.skip.length, 'skip lists every modelled building once');
check(LIST.every((b, i) => SKIP[i] === b.id && typeof b.build === 'function' && (b.group === 'ferdinand' || b.group === 'fuchsl')), 'LIST entries carry id, builder and group');
for (const id of SITE.skip) check(byId.has(id), `skip id ${id} is in map_buildings.json`);
for (const [k, id] of Object.entries(WANT)) check(SKIP.includes(id), `${k} (${id}) is modelled`);
check(SKIP.length === Object.keys(WANT).length, `${SKIP.length} skipped ids`);

// no other site may take one of these footprints (every file under sites/ is auto-loaded, a clash would double the building)
const dir = new URL('../src/world/oradea/sites/', import.meta.url);
let others = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.js') && n !== 'ferdinand-olosig.js')) {
  let m; const log = console.log; console.log = () => {};
  try { m = await import(new URL(f, dir)); } catch { m = null; } finally { console.log = log; }
  if (!m?.SITE?.skip) continue;
  others++;
  for (const id of m.SITE.skip) check(!SKIP.includes(id), `${f} also skips ${id}`);
}
check(others >= 5, `${others} other sites checked for clashing skip ids`);

// ---- the places: kind, footprints, a name and a note in both languages (through t(ro, en)), no em-dash
const WANT_IDS = ['poynar', 'fuchsl', 'transilvania', 'adorjan', 'rimanoczy'];
const PLACES = ALL.filter((p) => WANT_IDS.includes(p.id)); // in places.js
check(PLACES.map((p) => p.id).sort().join() === [...WANT_IDS].sort().join(), `the places: ${PLACES.map((p) => p.id)}`);
check(new Set(ALL.map((p) => p.id)).size === ALL.length && SITE.places.length === 0, 'place ids are unique in places.js; the site keeps no copy');
for (const p of PLACES) {
  check(p.kind === 'improved', `${p.id}: improved (visitoradea.com has no page of its own for it)`);
  check(typeof p.name === 'string' && p.name.length > 3 && typeof p.note === 'string' && p.note.length > 20 && typeof p.icon === 'string', `${p.id}: name, note, icon`);
  check(Array.isArray(p.bld) && p.bld.length >= 1 && p.bld.every((id) => byId.has(id) && SKIP.includes(id)), `${p.id}: footprints are modelled ones in the map`);
  check(!/[—Ѐ-ӿ]/.test(p.name + p.note), `${p.id}: no em-dash and no Cyrillic`);
}
{ // the Poynár cut keeps the highlight to the house at the tip
  const p = PLACES.find((q) => q.id === 'poynar');
  check(p?.cut?.p?.length === 2 && p.cut.n.length === 2 && Math.abs(Math.hypot(...p.cut.n) - 1) < 0.02, 'poynar: a cut {p, n} with a unit normal');
}

// ---- the atlas
const atlas = buildAtlas(rng(1902));
const cells = atlas.A.cells;
check(Object.keys(cells).length > 40, `${Object.keys(cells).length} atlas cells`);
check(atlas.used > 0.2 && atlas.used < 0.92, `the 2048 x 2048 sheet is ${(atlas.used * 100).toFixed(0)} % used`);
for (const n of Object.keys(cells)) { const u = atlas.uv(n); check(u.u0 >= 0 && u.u1 <= 1 && u.v0 >= 0 && u.v1 <= 1 && u.u1 > u.u0 && u.v1 > u.v0, `uv of ${n} inside the atlas`); }
for (const n of ['pt.g', 'pt.f1', 'pt.f2', 'pt.f2R', 'pt.tg', 'pt.drum', 'pt.gA', 'pt.gB', 'rail.PB', 'rail.PB1']) check(cells[n], `cell ${n}`);
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
check(fps.every((f) => f.poly.length >= 3 && f.id && f.h > 4 && f.h < 40), 'footprints carry rings, ids and plausible heights');
check(fps.every((f) => SKIP.includes(f.id)), 'the footprints are all skipped ids');
for (const id of SKIP) check(fps.some((f) => f.id === id), `a footprint for ${id}`);
const fp = (id, name) => fps.find((f) => f.id === id && (name ? f.name === name : f.name));
const H = { 6481083: [11, 20], 421787916: [13, 22], 1534824825: [10, 20], 421787914: [10, 20], 489773508: [9, 19], 421787874: [11, 22], 21056820: [8, 20] };
for (const [id, [lo, hi]] of Object.entries(H)) { const f = fp(+id); if (f) check(f.h > lo && f.h < hi, `${id} stands ${f.h.toFixed(1)} m (${lo}-${hi})`); }

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
console.log(site.stats.buildings, groups, { total, calls, solids: cw.count, maxRoofDy: +maxDy.toFixed(1), atlas: +site.stats.atlasUsed.toFixed(2) });
check(nan === 0, 'all vertices are finite');
check(steep === 0, `${steep} roof triangles climb over 14 m`);
const V = site.stats.buildings, cap = { poynar: 25000, transilvania: 15000, fuchsl: 15000, adorjan: 15000, rimanoczy: 25000 };
for (const [k, n] of Object.entries(cap)) if (V[k] != null) check(V[k] > 200 && V[k] <= n, `${k}: ${V[k]} verts (budget ${n})`);
check(LIST.every((b) => V[b.key] > 0), 'every building drew something');
check(total <= 90000, `${total} verts over the 90k budget`);
check(calls <= 12, `${calls} draw calls over the budget of 12`);
check(cw.count >= SKIP.length * 2, `${cw.count} colliders registered`);

// ---- a collider stands in every footprint: a point just inside a long edge, three metres up, is inside a solid
const inPoly = (P, x, z) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < ((P[j][0] - P[i][0]) * (z - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) o = !o; return o; };
for (const f of fps) {
  const P = f.poly; let hit = false;
  for (let i = 0; i < P.length && !hit; i++) {
    const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 6) continue;
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
    for (const s of [1, -1]) { const x = mx + nx * s * 1.5, z = mz + nz * s * 1.5; if (inPoly(P, x, z) && cw.inside(x, hf.heightAt(x, z) + 3, z)) hit = true; }
  }
  check(hit, `building ${f.id} ${f.name ?? '(neighbours)'} has a collider`);
}

// ---- clear() keeps generated trees off the lots; update()
const mid = (P) => { let x = 0, z = 0; for (const p of P) { x += p[0]; z += p[1]; } return [x / P.length, z / P.length]; };
for (const f of fps) { const [x, z] = mid(f.poly); if (inPoly(f.poly, x, z)) check(site.clear(x, z), `clear() covers ${f.id} ${f.name ?? ''}`); }
check(!site.clear(0, 0) && !site.clear(-300, 300) && !site.clear(600, 100), 'clear() leaves the rest of the city alone');
check(typeof site.update === 'function', 'update()');

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
check(!threw && gp && gp.errs.length === 0 && gp.site.footprints.length > 0, `two ids missing: builds the rest (${threw?.message ?? ''})`);
let threw2 = null;
try { build({ ...map, buildings: [] }); } catch (e) { threw2 = e; }
check(!threw2, `no buildings at all does not throw (${threw2?.message ?? ''})`);

if (fails.length) { console.log(`\n${fails.length} failed`); process.exit(1); }
console.log('ok: ferdinand-olosig');

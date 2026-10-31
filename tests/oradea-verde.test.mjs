// Headless checks for Dealul Ciuperca and the zoo (src/world/oradea/sites/verde.js and ./verde/) on the compiled map:
//   node tests/oradea-verde.test.mjs
// Contract, skip ids (none shared with another site), places, vertex and draw-call budgets, finite geometry, colliders on every building,
// clear() on the lots, the phone map (disc of 1800 m), a missing building, no roads.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';

const ctx2d = new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' || k === 'createPattern' ? () => ({ addColorStop() {} })
  : k === 'measureText' ? () => ({ width: 100 }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };
const { SITE } = await import('../src/world/oradea/sites/verde.js');
const { CIUPERCA_ID, RING, PAD } = await import('../src/world/oradea/sites/verde/ciuperca.js');
const { GATE_FROM, GATE_DIR, CHAPEL_AT } = await import('../src/world/oradea/sites/verde/zoo.js');
const { PLACES: ALL } = await import('../src/world/oradea/places.js');

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const fails = [];
const check = (ok, msg) => { if (!ok) { fails.push(msg); console.log('FAIL', msg); } };
const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
const hf = createHeightField(map, dem);
const byId = new Map(map.buildings.map((b) => [b.id, b]));
const inPoly = (P, x, z) => { let o = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) if ((P[i][1] > z) !== (P[j][1] > z) && x < ((P[j][0] - P[i][0]) * (z - P[i][1])) / (P[j][1] - P[i][1]) + P[i][0]) o = !o; return o; };

// ---- contract
check(SITE.id === 'verde' && SITE.ground === true && typeof SITE.build === 'function' && !SITE.shape, 'site contract (no terrain hook: a pad raised the road beside the restaurant)');
check(SITE.skip.length === 1 && SITE.skip[0] === CIUPERCA_ID && byId.has(CIUPERCA_ID), 'skip is the Ciuperca restaurant, which is in the map');
{ const b = byId.get(CIUPERCA_ID), P = Array.from({ length: b.p.length / 2 }, (_, i) => [b.p[2 * i], b.p[2 * i + 1]]); check(P.length === RING.length && P.every((p, i) => Math.hypot(p[0] - RING[i][0], p[1] - RING[i][1]) < 0.1), 'RING is the OSM outline of 331203796'); }
const dir = new URL('../src/world/oradea/sites/', import.meta.url);
let others = 0;
for (const f of readdirSync(dir).filter((n) => n.endsWith('.js') && n !== 'verde.js')) {
  let m; const log = console.log; console.log = () => {};
  try { m = await import(new URL(f, dir)); } catch { m = null; } finally { console.log = log; }
  if (!m?.SITE?.skip) continue;
  others++; check(!m.SITE.skip.includes(CIUPERCA_ID), `${f} also skips ${CIUPERCA_ID}`);
}
check(others >= 5, `${others} other sites checked for clashing skip ids`);

// ---- the places: in SITE.places until the orchestrator moves them into ../places.js (then SITE.places is empty); either way listed once
{
  const listed = [...SITE.places, ...ALL.filter((p) => p.id === 'ciuperca' || p.id === 'zoo')];
  check(listed.map((p) => p.id).sort().join() === 'ciuperca,zoo', `the places: ${listed.map((p) => p.id)}`);
  check(new Set(ALL.map((p) => p.id)).size === ALL.length, 'place ids are unique in places.js');
  for (const p of listed) {
    check(p.kind === 'sight', `${p.id}: a sight`);
    check(typeof p.name === 'string' && p.name.length > 3 && typeof p.note === 'string' && p.note.length > 20 && typeof p.icon === 'string', `${p.id}: name, note, icon`);
    check(p.bld ? p.bld.every((id) => byId.has(id)) : Array.isArray(p.xz) && Array.isArray(p.ring) && p.ring.length >= 6, `${p.id}: a building in the map or a spot and a ring`);
    check(!/[—Ѐ-ӿ]/.test(p.name + p.note), `${p.id}: no em-dash and no Cyrillic`);
  }
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
check(errs.length === 0, `nothing logged as failed: ${errs.join(' | ').slice(0, 300)}`);
const fps = site.footprints;
{ const bad = fps.filter((f) => !(f.poly.length >= 3 && f.id && f.h > 2 && f.h < 40)); check(fps.length >= 3 && bad.length === 0, `footprints carry rings, ids and plausible heights ${JSON.stringify(bad.map((f) => [f.id, f.h]))}`); }
check(fps.some((f) => f.id === CIUPERCA_ID), 'a footprint for the restaurant');
check(fps.some((f) => f.id === 'verde:chapel') && fps.some((f) => f.id === 'verde:ticket'), 'the chapel and the ticket house have footprints');

// ---- geometry
const groups = {}; let nan = 0;
root.children.forEach((g) => {
  const e = groups[g.name] = { verts: 0, meshes: 0 };
  g.traverse((o) => { if (!o.isMesh) return; const P = o.geometry.attributes.position; e.verts += P.count; e.meshes++; if (process.env.V) console.log(o.name, P.count); for (const v of P.array) if (!Number.isFinite(v)) nan++; });
});
const calls = Object.values(groups).reduce((s, e) => s + e.meshes, 0);
console.log(groups, { calls, solids: cw.count, stats: JSON.stringify(site.stats) });
check(nan === 0, 'all vertices are finite');
check(groups['verde-ciuperca']?.verts > 1500 && groups['verde-ciuperca'].verts <= 20000, `Ciuperca ${groups['verde-ciuperca']?.verts} verts (budget 20000)`);
check(groups['verde-zoo']?.verts > 1500 && groups['verde-zoo'].verts <= 20000, `zoo ${groups['verde-zoo']?.verts} verts (budget 20000)`);
check(calls <= 12, `${calls} draw calls over the budget of 12`);
check(cw.count >= 12, `${cw.count} colliders registered`);
check(site.stats.zoo.paddocks >= 1, `${site.stats.zoo.paddocks} paddocks`);
const t3 = (x, z) => hf.heightAt(x, z);

// ---- colliders: the restaurant, the chapel and the ticket house each stand in a solid
for (const f of fps) {
  const P = f.poly; let hit = false;
  for (let i = 0; i < P.length && !hit; i++) {
    const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]);
    if (L < 2.5) continue;
    const mx = (a[0] + b[0]) / 2, mz = (a[1] + b[1]) / 2, nx = (b[1] - a[1]) / L, nz = -(b[0] - a[0]) / L;
    for (const s of [1, -1]) { const x = mx + nx * s * 1.2, z = mz + nz * s * 1.2; if (inPoly(P, x, z) && cw.inside(x, t3(x, z) + 2, z)) hit = true; }
  }
  check(hit, `building ${f.id} ${f.name ?? ''} has a collider`);
}
// ---- clear(): the lots and the zoo's yard, and none of the rest
const mid = (P) => { let x = 0, z = 0; for (const p of P) { x += p[0]; z += p[1]; } return [x / P.length, z / P.length]; };
for (const f of fps) { const [x, z] = mid(f.poly); if (inPoly(f.poly, x, z)) check(site.clear(x, z), `clear() covers ${f.id} ${f.name ?? ''}`); }
check(site.clear(1240, -1183), 'clear() on the terrace');
check(!site.clear(0, 0) && !site.clear(-300, 300) && !site.clear(1500, 100), 'clear() leaves the rest of the city alone');
{ // no generic OSM statue, fountain or memorial point of parks.js lies inside a lot without clear()
  const near = (x, z) => site.footprints.some((f) => inPoly(f.poly, x, z));
  const bad = map.pois.filter((p) => /fountain|statue|memorial|bust|cross/.test(JSON.stringify(p.tags ?? {})) && near(p.x, p.z) && !site.clear(p.x, p.z));
  check(bad.length === 0, `${bad.length} parks.js points inside a lot are not cleared`);
}
check(typeof site.update === 'function', 'update()');
// the chapel and the gate stand clear of every OSM building
{
  const hit = (x, z) => map.buildings.find((b) => inPoly(Array.from({ length: b.p.length / 2 }, (_, i) => [b.p[2 * i], b.p[2 * i + 1]]), x, z));
  for (const f of fps.filter((q) => String(q.id).startsWith('verde:'))) check(!f.poly.some(([x, z]) => hit(x, z)), `${f.id} stands clear of OSM buildings`);
  const c = fps.find((f) => f.id === 'verde:chapel'), [cx, cz] = mid(c.poly); check(Math.hypot(cx - CHAPEL_AT[0], cz - CHAPEL_AT[1]) < 45, `the chapel stands ${Math.hypot(cx - CHAPEL_AT[0], cz - CHAPEL_AT[1]).toFixed(0)} m from the quest card's spot`);
}

// ---- deterministic
const again = build();
const sizes = (r) => r.children.map((g) => g.children.map((m) => m.geometry.attributes.position.count).join(',')).join('|');
check(sizes(again.root) === sizes(root), 'the build is deterministic');

// ---- the phone map: buildings and roads clipped to a disc of 1800 m, flagged phoneCentre; the restaurant is inside it
const disc = (p) => { for (let i = 0; i < p.length; i += 2) if (Math.hypot(p[i], p[i + 1]) < 1800) return true; return false; };
const phoneMap = { ...map, phoneCentre: true, buildings: map.buildings.filter((b) => disc(b.p)), roads: map.roads.filter((r) => disc(r.p)) };
check(phoneMap.buildings.some((b) => b.id === CIUPERCA_ID), 'the restaurant is inside the phone disc');
{ const far = (P) => P.every(([x, z]) => Math.hypot(x, z) < 1800); check(far(RING) && far(PAD), 'the restaurant and its pad lie inside the phone disc');
  const rr = fps.filter((f) => String(f.id).startsWith('verde:')).every((f) => far(f.poly)); check(rr, 'the zoo buildings lie inside the phone disc'); }
const ph = build(phoneMap);
check(ph.errs.length === 0 && ph.site.footprints.length === fps.length, `the phone map builds all ${ph.site.footprints.length} footprints`);
{ let pc = 0; ph.root.children.forEach((g) => g.children.forEach(() => pc++)); check(pc === calls, `the phone draws ${pc} calls (the desktop ${calls})`); }
let threw = null, gp = null;
try { gp = build({ ...map, buildings: map.buildings.filter((b) => b.id !== CIUPERCA_ID) }); } catch (e) { threw = e; }
check(!threw && gp && gp.errs.length === 0, `the restaurant missing: builds the rest (${threw?.message ?? ''})`);
let threw2 = null; try { build({ ...map, buildings: [] }); } catch (e) { threw2 = e; }
check(!threw2, `no buildings at all does not throw (${threw2?.message ?? ''})`);
let threw3 = null; try { build({ ...map, roads: [] }); } catch (e) { threw3 = e; }
check(!threw3, `no roads does not throw (${threw3?.message ?? ''})`);

if (fails.length) { console.log(`\n${fails.length} failed`); process.exit(1); }
console.log('ok: verde');

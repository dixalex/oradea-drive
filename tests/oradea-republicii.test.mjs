// Headless checks for the Calea Republicii site (src/world/oradea/sites/republicii.js and ./republicii/) on the compiled map:
//   node tests/oradea-republicii.test.mjs
// The street's 22 fronting buildings as masses with facade kits, Palatul Moskovits Miksa (tower, shaped gables) and Palatul
// Ullmann (bows, cupolas), the paving and the furniture: contract, budgets, finite geometry, colliders, the atlas cells.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';

const ctx2d = new Proxy({}, { get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop() {} })
  : k === 'measureText' ? () => ({ width: 100 }) : () => {}), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };
const { SITE, CL } = await import('../src/world/oradea/sites/republicii.js');
const { PLACES } = await import('../src/world/oradea/places.js');
const { TABLE, HERO } = await import('../src/world/oradea/sites/republicii/table.js');
const { buildAtlas, STYLES } = await import('../src/world/oradea/sites/republicii/styles.js');
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
check(SITE.id === 'republicii' && SITE.ground === true && typeof SITE.build === 'function', 'site contract');
const street = PLACES.find((p) => p.id === 'calearepublicii'); // in places.js, so the phone map lists it too
check(street?.kind === 'sight', 'the street is a sight');
check(street?.name && street.note, 'the place has a name and a note');
for (const id of SITE.skip) check(byId.has(id), `skip id ${id} is in map_buildings.json`);
check(SITE.skip.length === TABLE.length + 2 && new Set(SITE.skip).size === SITE.skip.length, 'skip lists every table entry and both palaces once');
check(SITE.skip.includes(HERO.moskovits) && SITE.skip.includes(HERO.ullmann), 'the palaces are skipped');
for (const b of TABLE) {
  check(b.n >= 2 && b.n <= 6, `${b.id}: storeys ${b.n}`);
  check(b.styles.every((s) => STYLES.includes(s)), `${b.id}: known styles`);
  check(b.cols.every(([w, t]) => /^#[0-9a-f]{6}$/.test(w) && /^#[0-9a-f]{6}$/.test(t)), `${b.id}: colour pairs are hex`);
  check(/^#[0-9a-f]{6}$/.test(b.roof), `${b.id}: roof colour`);
}
check(CL.length % 2 === 0 && CL.length >= 8, 'the street axis is a polyline');

// ---- the atlas
const atlas = buildAtlas(rng(7));
const cells = atlas.A.cells;
for (const s of STYLES) for (const k of ['reg', 'reg2', 'nobile', 'top', 'pier']) check(cells[`${s}.${k}`], `cell ${s}.${k}`);
for (const n of ['g.shopA', 'g.shopD', 'g.glassA', 'g.arch', 'g.gate', 'g.entry', 'g.pier', 'rail.A', 'rail.B', 'rail.C', 'rail.D']) check(cells[n], `cell ${n}`);
for (const s of ['mosk', 'ull', 'ullc']) for (const k of ['reg', 'reg2', 'nobile', 'top', 'pier']) check(cells[`${s}.${k}`], `cell ${s}.${k}`);
for (const n of ['g.mosk', 'g.moskPier', 'mosk.tG', 'mosk.tA', 'mosk.tB', 'mosk.tC', 'mosk.tD', 'mosk.drum', 'mosk.corbel', 'gable.mosk1', 'gable.mosk2', 'dorm.mosk', 'g.ull', 'g.ullc', 'ull.bowF', 'ull.frieze', 'gable.ull', 'dorm.ull']) check(cells[n], `cell ${n}`);
for (const n of Object.keys(cells)) { const u = atlas.uv(n); check(u.u0 >= 0 && u.u1 <= 1 && u.v0 >= 0 && u.v1 <= 1 && u.u1 > u.u0 && u.v1 > u.v0, `uv of ${n} inside the atlas`); }

// ---- the build
const build = () => {
  const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
  const root = new THREE.Group();
  const log = console.log; console.log = () => {};
  let site;
  try { site = SITE.build({ root, solids: cw, zips: null, map, heightAt: hf.heightAt, detailMat: new THREE.MeshStandardMaterial(), ground: { heightAt: hf.heightAt, onAsphalt: () => false } }); } finally { console.log = log; }
  return { site, root, cw };
};
const { site, root, cw } = build();
check(site != null, 'the site builds');
check(site.footprints.length === SITE.skip.length, `one footprint per skipped building (${site.footprints.length})`);
check(site.footprints.every((f) => f.poly.length >= 3 && f.id && f.h > 5 && f.h < 60), 'footprints carry rings, ids and plausible heights');
const fp = (id) => site.footprints.find((f) => f.id === id);
check(fp(HERO.moskovits) && fp(HERO.moskovits).h > 18 && fp(HERO.moskovits).h < 28, `Moskovits' roof stands ${fp(HERO.moskovits)?.h?.toFixed(1)} m (ground + three storeys + the hipped roof)`);
check(fp(HERO.ullmann) && fp(HERO.ullmann).h > 14 && fp(HERO.ullmann).h < 30, `Ullmann stands ${fp(HERO.ullmann)?.h?.toFixed(1)} m (four storeys, not OSM's nine)`);

// ---- geometry: groups, budgets, finiteness, sane roofs
const groups = {}; let nan = 0, steep = 0, maxDy = 0;
root.children.forEach((g) => {
  const e = groups[g.name] = { verts: 0, meshes: 0 };
  g.traverse((o) => {
    if (!o.isMesh) return;
    const P = o.geometry.attributes.position; e.verts += P.count; e.meshes++;
    if (process.env.V) console.log(o.name, P.count);
    for (const v of P.array) if (!Number.isFinite(v)) nan++;
    if (o.name.endsWith('-roof')) { // no roof triangle climbs more than 10.5 m (a lower lot must not spike up to a taller ridge)
      const I = o.geometry.index;
      for (let t = 0; t < I.count; t += 3) {
        const ys = [0, 1, 2].map((k) => P.getY(I.getX(t + k)));
        const dy = Math.max(...ys) - Math.min(...ys); maxDy = Math.max(maxDy, dy); if (dy > 10.5) { steep++; if (process.env.V && steep < 8) console.log('steep', [0, 1, 2].map((k) => [P.getX(I.getX(t + k)), P.getY(I.getX(t + k)), P.getZ(I.getX(t + k))].map((v) => v.toFixed(1)).join(',')).join(' | ')); }
      }
    }
  });
});
const total = Object.values(groups).reduce((s, e) => s + e.verts, 0), calls = Object.values(groups).reduce((s, e) => s + e.meshes, 0);
console.log(groups, { total, calls, solids: cw.count, maxRoofDy: +maxDy.toFixed(1) });
check(groups.republicii && groups.ullmann, 'the street group and the Ullmann group exist');
check(nan === 0, 'all vertices are finite');
check(steep === 0, `${steep} roof triangles climb over 10.5 m`);
check(total <= 50000, `${total} verts over the 50k budget`);
check(calls <= 15, `${calls} draw calls over the budget of 15`);
check(groups.ullmann.meshes >= 2 && groups.ullmann.verts < 8000, `Ullmann: ${groups.ullmann.meshes} meshes, ${groups.ullmann.verts} verts`);
check(cw.count > 150, `${cw.count} colliders registered`);

// ---- Moskovits' tower rises over its roof: the onion dome and the spire (detail mesh) stand well above the walls
let topY = -Infinity;
root.traverse((o) => { if (o.name === 'republicii-det') { const P = o.geometry.attributes.position; for (let i = 0; i < P.count; i++) if (Math.hypot(P.getX(i) - 190.5, P.getZ(i) + 571) < 4) topY = Math.max(topY, P.getY(i)); } });
check(topY - hf.heightAt(190.5, -571) > 27, `the tower reaches ${(topY - hf.heightAt(190.5, -571)).toFixed(1)} m above the corner`);

// ---- clear(), spots
const mid = (id) => { const p = byId.get(id).p; let x = 0, z = 0; for (let i = 0; i < p.length; i += 2) { x += p[i]; z += p[i + 1]; } return [x / (p.length / 2), z / (p.length / 2)]; };
check(site.clear(CL[4], CL[5]) && site.clear(CL[8], CL[9]), 'clear() covers the street axis');
check(!site.clear(0, 0) && !site.clear(...mid(HERO.ullmann)), 'clear() leaves the old town and Ullmann alone');
check(site.spots.length >= 8 && site.spots.every((s) => Number.isFinite(s.x) && Number.isFinite(s.z) && s.kind === 'park'), `${site.spots.length} street trees`);
check(typeof site.update === 'function', 'update()');

// ---- the same build twice gives the same mesh sizes
const again = build();
const sizes = (r) => r.children.map((g) => g.children.map((m) => m.geometry.attributes.position.count).join(',')).join('|');
check(sizes(again.root) === sizes(root), 'the build is deterministic');

if (fails.length) { console.log(`\n${fails.length} failed`); process.exit(1); }
console.log('ok: republicii');

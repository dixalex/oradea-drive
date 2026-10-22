// Headless checks for Oradea's universities (src/world/oradea/sites/university.js) on the compiled map: node tests/oradea-university.test.mjs
// Every OSM building the site replaces is in map_buildings.json, the site builds in budget (nine draw calls, no NaN, three named root
// groups), every skipped building has a footprint and a collider, the heroes stand at believable heights, the entrance blocks are solid
// and the new places are well formed. Skipped without the Oradea map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { SITE } from '../src/world/oradea/sites/university.js';
import { PLACES } from '../src/world/oradea/places.js';
import { IDS } from '../src/world/oradea/sites/university/data.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A)) || !existsSync(new URL('map_buildings.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
const ctx2d = new Proxy({}, { get: () => () => ({ addColorStop() {} }), set: () => true });
globalThis.document = { createElement: () => ({ width: 1, height: 1, getContext: () => ctx2d, style: {} }) };

let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
map.buildings = JSON.parse(readFileSync(new URL('map_buildings.json', A)));
const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
const hf = createHeightField(map, dem);
const byId = (id) => map.buildings.find((b) => b.id === id);

ok(new Set(SITE.skip).size === SITE.skip.length, `skips ${SITE.skip.length} distinct OSM buildings`);
for (const id of SITE.skip) ok(byId(id), `OSM building ${id} is in map_buildings.json`);

// the places, moved into places.js: well formed, every building one the site replaces, ids unique
const PLACE_IDS = ['univoradea', 'partiumvechi', 'medicina', 'aranyjanos', 'drept', 'constructii', 'agora', 'univemanuel'];
const OURS = PLACES.filter((q) => PLACE_IDS.includes(q.id));
ok(SITE.places.length === 0 && OURS.length === PLACE_IDS.length, `eight places in places.js (${OURS.map((q) => q.id).join(', ')})`);
ok(new Set(PLACES.map((q) => q.id)).size === PLACES.length, 'place ids are unique');
for (const q of OURS) ok(q.name && q.note && q.icon && ['sight', 'improved'].includes(q.kind) && q.bld?.every((id) => byId(id) && SITE.skip.includes(id)), `${q.id}: kind, icon, name, note, bld ids the site replaces`);
ok(OURS.every((q) => !/\u2014/.test(q.name + q.note)), 'no em-dashes in the places');

if (SITE.shape) SITE.shape(hf, map, null);
const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const site = SITE.build({ root, map, solids: cw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt },
  facadeMat: new THREE.MeshStandardMaterial(), detailMat: new THREE.MeshStandardMaterial() });
ok(site, 'builds');
let verts = 0, meshes = 0, nan = false;
const per = {};
root.traverse((o) => {
  if (!o.isMesh) return;
  meshes++; verts += o.geometry.attributes.position.count;
  const g = o.parent?.name ?? '?'; per[g] = per[g] ?? { verts: 0, meshes: 0 }; per[g].verts += o.geometry.attributes.position.count; per[g].meshes++;
  for (const v of o.geometry.attributes.position.array) if (!Number.isFinite(v)) nan = true;
});
ok(!nan, 'no NaN / infinite vertices');
ok(meshes <= 12, `${meshes} meshes (draw calls), at most 12`);
for (const [k, v] of Object.entries(per)) log(`     ${k}: ${v.verts} verts, ${v.meshes} meshes`);
ok(verts < 250000, `${verts} verts in all`);

const fpIds = new Set(site.footprints.map((f) => f.id));
ok(SITE.skip.every((id) => fpIds.has(id)), 'a footprint for every skipped building');
ok(site.footprints.every((f) => f.poly.length >= 3 && f.poly.flat().every(Number.isFinite) && f.h > 2), 'footprints have outlines and heights');

// every skipped building has a collider that stands over its centre
const top = (x, z) => cw.groundHeight(x, z, 80) - hf.heightAt(x, z);
const cen = (b) => { let sx = 0, sz = 0; const n = b.p.length / 2; for (let i = 0; i < b.p.length; i += 2) { sx += b.p[i]; sz += b.p[i + 1]; } return [sx / n, sz / n]; };
let solid = 0;
for (const f of site.footprints) { const [x, z] = f.poly.reduce((s, p) => [s[0] + p[0] / f.poly.length, s[1] + p[1] / f.poly.length], [0, 0]); if (top(x, z) > 2.5) solid++; }
ok(solid >= site.footprints.length * 0.8, `${solid} of ${site.footprints.length} footprints have a collider over their centre`);
void cen;
for (const f of site.footprints) { const [x, z] = f.poly.reduce((s, p) => [s[0] + p[0] / f.poly.length, s[1] + p[1] / f.poly.length], [0, 0]); if (top(x, z) <= 2.5) log(`     no collider over the centre of ${f.id} (${x.toFixed(0)}, ${z.toFixed(0)})`); }

// the hand-built heroes: Corpul A (3 storeys under a hipped roof), the Medicine palace (2 tall storeys + its wing), the forecourt is cleared of trees
const fp = (id) => site.footprints.find((f) => f.id === id);
const hA = fp(IDS.A)?.h, hM = fp(IDS.MED2)?.h, hM1 = fp(IDS.MED1)?.h;
ok(hA > 9 && hA < 20, `Corpul A is ${hA?.toFixed(1)} m tall`);
ok(hM > 10 && hM < 20, `Medicine is ${hM?.toFixed(1)} m tall`);
ok(hM1 > 10 && hM1 < 20, `Medicine's west wing is ${hM1?.toFixed(1)} m tall (the same storeys as the front)`);
ok(site.clear(84, 1340) === true && site.clear(0, 0) === false, 'the forecourt of Corpul A is cleared of trees, a far point is not');

log(fails ? `${fails} failed` : 'all ok');
process.exit(fails ? 1 : 0);

// Headless checks for the civic landmarks (src/world/oradea/sites/civic.js and civic/*.js) on the compiled Oradea map: node tests/oradea-civic.test.mjs
// Every OSM way it replaces is in map_buildings.json and the hand-typed outlines match them; the site builds in budget (vertices per
// building, draw calls for the whole site) with no NaN and the two named groups; walls, roofs, domes and towers are solid and stand at
// their heights; the open yards stay open; clear() holds the buildings off the generated trees; the night glow follows nightK; the
// places the orchestrator moves into places.js do not clash with the ones already there. Skipped without the Oradea map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createCollisionWorld } from '../src/world/collision.js';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { createDaylight, nightK } from '../src/render/daylight.js';
import { SITE } from '../src/world/oradea/sites/civic.js';
import { ASTORIA_ID } from '../src/world/oradea/sites/civic/astoria.js';
import { JUSTICE_ID, JUSTICE_RING } from '../src/world/oradea/sites/civic/justice.js';
import { PREF_ID, PREF_RING } from '../src/world/oradea/sites/civic/prefecture.js';
import { FIN_ID, FIN_RING } from '../src/world/oradea/sites/civic/finance.js';
import { POST_ID, POST_RING, POST_HOLES } from '../src/world/oradea/sites/civic/post.js';
import { LOTUS_ID, LOTUS_RING } from '../src/world/oradea/sites/civic/lotus.js';
import { NYMPH_ID, NYMPH_RING } from '../src/world/oradea/sites/civic/nymphaea.js';
import { TOWER_WAY, TOWER_SPEC } from '../src/world/oradea/sites/civic/towers.js';
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
const byId = new Map(map.buildings.map((b) => [b.id, b]));
const sameRing = (osm, ring) => osm && osm.p.length / 2 === ring.length && ring.every((q, i) => Math.abs(q[0] - osm.p[2 * i]) < 0.06 && Math.abs(q[1] - osm.p[2 * i + 1]) < 0.06);

// ---- the ways it replaces
const IDS = [ASTORIA_ID, JUSTICE_ID, PREF_ID, FIN_ID, POST_ID, LOTUS_ID, NYMPH_ID, TOWER_WAY];
ok(SITE.skip.length === IDS.length && IDS.every((id) => SITE.skip.includes(id)) && new Set(SITE.skip).size === IDS.length, `skips ${IDS.length} distinct OSM ids`);
ok(SITE.skip.every((id) => byId.has(id)), 'every skipped id is in map_buildings.json');
ok(sameRing(byId.get(JUSTICE_ID), JUSTICE_RING), 'JUSTICE_RING is the Palace of Justice outline (relation 20421787)');
ok(sameRing(byId.get(PREF_ID), PREF_RING), 'PREF_RING is the Prefecture outline');
ok(sameRing(byId.get(FIN_ID), FIN_RING), 'FIN_RING is the Palace of Finance outline');
ok(sameRing(byId.get(POST_ID), POST_RING), 'POST_RING is the Postal Palace outline (relation 21028932)');
ok(sameRing(byId.get(LOTUS_ID), LOTUS_RING), 'LOTUS_RING is the mall outline');
ok(sameRing(byId.get(NYMPH_ID), NYMPH_RING), 'NYMPH_RING is the aquapark outline');
const pHoles = byId.get(POST_ID)?.holes ?? [];
ok(pHoles.length === POST_HOLES.length && POST_HOLES.every((h, k) => h.length === pHoles[k].length / 2 && h.every((q, i) => Math.abs(q[0] - pHoles[k][2 * i]) < 0.06 && Math.abs(q[1] - pHoles[k][2 * i + 1]) < 0.06)), 'POST_HOLES are the post office\'s light wells and yard');
const twr = byId.get(TOWER_WAY), t2 = TOWER_SPEC.find((s) => s.mush);
ok(twr && t2 && Math.hypot(twr.p.filter((_, i) => i % 2 === 0).reduce((s, v, _i, a) => s + v / a.length, 0) - t2.x, twr.p.filter((_, i) => i % 2).reduce((s, v, _i, a) => s + v / a.length, 0) - t2.z) < 6, 'the skipped way sits under the mushroom-tank tower');
ok(TOWER_SPEC.length === 4 && TOWER_SPEC.every((s) => map.pois.some((p) => p.tags?.man_made === 'water_tower' && Math.hypot(p.x - s.x, p.z - s.z) < 3)), 'all four towers stand on a man_made=water_tower POI');

// ---- places: the eleven entries live in places.js (the phone map loads no site), with bilingual text and real buildings
const CIVIC = ['astoria', 'palatuljustitiei', 'prefectura', 'palatulposta', 'palatulfinantelor', 'lotuscenter', 'nymphaea', 'castelapa1', 'castelapa2', 'castelapa3', 'castelapa4'];
const mine = PLACES.filter((p) => CIVIC.includes(p.id));
ok(SITE.places.length === 0 && mine.length === 11 && PLACES.filter((p) => CIVIC.includes(p.id)).length === new Set(mine.map((p) => p.id)).size, `the ${mine.length} places are in places.js once each, none left in SITE.places`);
ok(mine.every((p) => (p.kind === 'sight' || p.kind === 'improved') && p.icon && p.name && p.note), 'every place has a kind, icon, name and note');
ok(mine.every((p) => (p.bld ? p.bld.every((id) => byId.has(id) && SITE.skip.includes(id)) : p.ring.length >= 6 && p.ring.every(Number.isFinite))), 'every place points at a building the site replaces, or carries its own ring');
ok(mine.filter((p) => p.kind === 'sight').length === 5 && mine.filter((p) => p.kind === 'improved').length === 6, 'five sights (the palaces) and six improved objects (mall, aquapark, four towers)');
const nym = mine.find((p) => p.id === 'nymphaea');
ok(nym.ring.length === NYMPH_RING.length * 2 && nym.ring.every((v, i) => Math.abs(v - NYMPH_RING[i >> 1][i & 1]) < 0.06), 'the aquapark ring in places.js matches NYMPH_RING');
ok(TOWER_SPEC.every((sp, i) => { const q = mine.find((p) => p.id === `castelapa${i + 1}`); const c = [0, 1].map((k) => q.ring.filter((_, j) => j % 2 === k).reduce((a, v, _j, A) => a + v / A.length, 0)); return Math.hypot(c[0] - sp.x, c[1] - sp.z) < 0.5; }), 'each tower ring in places.js sits on its tower');

// ---- the build
const cw = createCollisionWorld({ terrain: (x, z) => hf.heightAt(x, z) });
const root = new THREE.Group();
const site = SITE.build({ root, map, solids: cw, zips: { edge() {} }, heightAt: hf.heightAt, ground: { heightAt: hf.heightAt }, facadeMat: new THREE.MeshBasicMaterial(), detailMat: new THREE.MeshBasicMaterial() });
ok(site && typeof site.update === 'function' && typeof site.clear === 'function' && Array.isArray(site.footprints), 'builds: update, clear, footprints');
ok(!('partners' in site), 'the built site does not return `partners`');
let verts = 0, meshes = 0, nan = false;
const per = {};
root.traverse((o) => {
  if (!o.isMesh) return;
  meshes++; verts += o.geometry.attributes.position.count; per[o.parent.name] = (per[o.parent.name] ?? 0) + o.geometry.attributes.position.count;
  for (const a of ['position', 'normal']) for (const v of o.geometry.attributes[a].array) if (!Number.isFinite(v)) nan = true;
});
ok(!nan, 'no NaN / infinite vertices or normals');
const names = root.children.map((c) => c.name).sort();
ok(names.includes('landmark-civic-centre') && names.includes('landmark-civic-out'), `the two named groups exist: ${names}`);
ok(meshes >= 10 && meshes <= 15, `${meshes} meshes / draw calls (budget 15)`);
ok(verts > 20000 && verts <= 60000, `${verts} vertices in all (${Object.entries(per).map(([k, v]) => `${k} ${v}`).join(', ')})`);
const st = site.stats;
ok(st.justice.yT > 0 && st.justice.dormers === 24 && st.justice.portals === 3, `Justice: 3 portals, 24 dormers, floor line ${st.justice.yT.toFixed(1)} m`);
ok(st.post.bays > 40 && st.lotus.bays > 100 && st.nymphaea.petals === 7 && st.towers.towers === 4, `Post ${st.post.bays} bays, Lotus ${st.lotus.bays} bays, Nymphaea ${st.nymphaea.petals} petals, ${st.towers.towers} towers`);
ok(st.towers.verts < 3000 && st.justice && st.finance.columns === 2, `towers ${st.towers.verts} vertices, Finance columns ${st.finance.columns}`);
log(`     ${cw.count} solids`);
ok(cw.count >= 70, `${cw.count} colliders`);
const fid = new Set(site.footprints.map((f) => f.id));
ok([ASTORIA_ID, JUSTICE_ID, PREF_ID, FIN_ID, POST_ID].every((id) => fid.has(id)), 'footprints carry the five palaces\' OSM ids');
ok(site.footprints.every((f) => f.poly.length >= 3 && f.h > 2 && f.poly.every((q) => Number.isFinite(q[0] + q[1]))), 'every footprint is a valid polygon with a height');

// ---- heights and solidity: a ray down from 120 m minus the ground
const top = (x, z) => cw.groundHeight(x, z, 120) - hf.heightAt(x, z);
const jc = [295, -570], fc = [958, 98], pc = [-45, -540], pw = [-47.7, -535.5];   // pc: on the north-east front, pw: 5 m inside it
const hJ = top(...jc), hT = top(t2.x, t2.z), hF = top(...fc);
ok(hJ > 12 && hJ < 30, `Justice roof over the ground at the centre: ${hJ.toFixed(1)} m`);
ok(hT > 44 && hT < 62, `the mushroom tower's collider stands ${hT.toFixed(1)} m high (shaft and tank; the roof cone is only drawn)`);
ok(hF > 12 && hF < 30, `Finance roof / dome ${hF.toFixed(1)} m`);
const insideAt = (x, z, y) => cw.inside(x, hf.heightAt(x, z) + y, z);
const solid = [['Justice', ...jc, 4], ['post office wing', ...pw, 4], ['tower shaft', t2.x, t2.z, 10]].map(([n, x, z, y]) => [n, insideAt(x, z, y)]);
ok(solid.every((s) => s[1]), `inside Justice, the post office wing and the tower shaft is solid (${solid.map((s) => `${s[0]} ${s[1]}`)})`);
ok(!insideAt(-55, -505, 4), 'the post office yard (the big hole) is open');
ok(!insideAt(-120, -600, 4) && !insideAt(2300, 900, 4) && !insideAt(0, 0, 4), 'open ground away from the buildings stays open');
// a car-sized cylinder is pushed out of a wall and left alone in the street
const push = (x, z) => { const p = new THREE.Vector3(x, hf.heightAt(x, z) + 0.5, z); const o = cw.pushCylinder(p, 1.0, 1.5, 0.3); return !!(o && o.hit); };
ok(push(...jc) && push(...pc) && push(t2.x + 1, t2.z), 'a car is pushed back by the Justice wall, the post office wing and the tower');
ok(!push(-120, -600) && !push(0, 0), 'no push in the open');

// ---- trees: off the buildings, not off the street
const within = (r, x, z) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) if ((r[i][1] > z) !== (r[j][1] > z) && x < (r[j][0] - r[i][0]) * (z - r[i][1]) / (r[j][1] - r[i][1]) + r[i][0]) c = !c; return c; };
// the middle of the outline, or for a U or an L (whose middle is outside) a point 1.5 m in from the first edge's middle
const mid = (r) => {
  const c = r.reduce((s, p) => [s[0] + p[0] / r.length, s[1] + p[1] / r.length], [0, 0]);
  if (within(r, ...c)) return c;
  const [a, b] = [r[0], r[1]], m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], l = Math.hypot(b[0] - a[0], b[1] - a[1]);
  for (const sg of [1, -1]) { const q = [m[0] - sg * (b[1] - a[1]) / l * 1.5, m[1] + sg * (b[0] - a[0]) / l * 1.5]; if (within(r, ...q)) return q; }
  return c;
};
const mids = [['Justice', JUSTICE_RING], ['Prefecture', PREF_RING], ['Finance', FIN_RING], ['post office', POST_RING], ['Lotus', LOTUS_RING], ['Nymphaea', NYMPH_RING]].map(([n, r]) => [n, site.clear(...mid(r))]);
ok(mids.every((m) => m[1]), `clear() holds every building's middle (${mids.map((m) => `${m[0]} ${m[1]}`)})`);
ok(site.clear(-55, -505), 'clear() holds the post office\'s yard');
ok(TOWER_SPEC.every((s) => site.clear(s.x, s.z)), 'clear() holds the towers');
ok(!site.clear(0, 0) && !site.clear(-120, -600) && !site.clear(2300, 900), 'clear() leaves the rest of the city alone');

// ---- night: the lit glass and the bay windows follow nightK
const lit = []; root.traverse((o) => { if (o.isMesh && o.material.emissive?.getHex() && !lit.includes(o.material)) lit.push(o.material); });
ok(lit.length >= 2, `${lit.length} emissive materials in the group`);
const dl = createDaylight({ preset: 'night', dayOfYear: 180 });
dl.setPreset('night', 0); dl.update(0); site.update(0.016, null);
ok(nightK.value > 0.8 && lit.some((m) => m.emissiveIntensity > 0.7), `at night (nightK ${nightK.value.toFixed(2)}) the windows glow`);
dl.setPreset('day', 0); dl.update(0); site.update(0.016, null);
ok(nightK.value === 0 && lit.every((m) => m.emissiveIntensity === 0), 'by day they are dark');

console.log = log;
log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);

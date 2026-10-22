// Headless checks for Oradea's park furniture and street sculpture (src/world/oradea/parks.js) on the compiled map:
// node tests/oradea-parks.test.mjs
// Lamps and benches line the park footways, inside the parks and off the carriageway; playgrounds get equipment; the
// unclaimed fountains, statues and wayside crosses are built and a `covered` area is left to its site; the pool draws
// only the nearest lamps and benches; every piece has a collider; clear() keeps trees off them. Skipped without the map.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { createCollisionWorld } from '../src/world/collision.js';
import { buildParks } from '../src/world/oradea/parks.js';
import { ringPts, inPoly } from '../src/world/cherkasy/geo.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A))) { console.log('skip: no public/assets/oradea/map.json'); process.exit(0); }
const map = JSON.parse(readFileSync(new URL('map.json', A)));
let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const hf = createHeightField(map, new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0)));
const build = (covered) => {
  const S = createCollisionWorld({ cell: 24, terrain: hf.heightAt }), root = new THREE.Group();
  return { S, root, site: buildParks({ root, map, solids: S, heightAt: hf.heightAt, onAsphalt: () => false, covered }) };
};
const { S, root, site } = build(() => false);
const st = site?.stats ?? {};
ok(site && st.lamps > 200 && st.benches > 200, `park footways: ${st.lamps} lamps, ${st.benches} benches in ${st.parks} parks`);
ok(st.playgrounds >= 20 && st.playItems >= st.playgrounds * 3, `${st.playItems} items on ${st.playgrounds} playgrounds`);
ok(st.fountains >= 5 && st.sculptures >= 10 && st.crosses >= 1, `${st.fountains} fountains, ${st.sculptures} statues / memorials, ${st.crosses} wayside crosses`);
ok(S.count >= st.lamps + st.benches + st.fountains + st.sculptures, `every piece has a collider (${S.count} solids)`);

// every lamp stands in a park, by a footway
const parks = (map.cover.park ?? []).map((r) => r.map(ringPts));
const inAnyPark = (x, z) => parks.some((P) => inPoly(P[0], x, z) && !P.slice(1).some((h) => inPoly(h, x, z)));
const lampsMesh = root.getObjectByName('parks-lamps'), benchMesh = root.getObjectByName('parks-benches');
const cam = new THREE.PerspectiveCamera();
const parkAt = parks.find((P) => P[0].length > 20)?.[0][0] ?? [0, 0];
cam.position.set(parkAt[0], 50, parkAt[1]);
site.update(1, cam);
ok(lampsMesh.count > 0 && lampsMesh.count <= 600 && benchMesh.count <= 600, `the pool draws the nearest ${lampsMesh.count} lamps and ${benchMesh.count} benches`);
const M = new THREE.Matrix4(), P = new THREE.Vector3();
let out = 0, far = 0;
for (let i = 0; i < lampsMesh.count; i++) { lampsMesh.getMatrixAt(i, M); P.setFromMatrixPosition(M); if (!inAnyPark(P.x, P.z)) out++; if (Math.hypot(P.x - cam.position.x, P.z - cam.position.z) > 320) far++; }
ok(!out, `every drawn lamp stands in a park (${out} outside)`);
ok(!far, `none drawn beyond 320 m (${far})`);
cam.position.set(1e5, 50, 1e5); site.update(1, cam);
ok(lampsMesh.count === 0 && benchMesh.count === 0, 'nothing drawn far from every park');

// a covered area is left to its site
const { site: none } = build(() => true);
ok(none.stats.lamps === 0 && none.stats.fountains === 0 && none.stats.sculptures === 0 && none.stats.playItems === 0, 'a covered map gets nothing');

// clear() holds trees off a bench
cam.position.set(parkAt[0], 50, parkAt[1]); site.update(1, cam);
benchMesh.getMatrixAt(0, M); P.setFromMatrixPosition(M);
ok(benchMesh.count > 0 && site.clear(P.x, P.z), 'clear() keeps trees off a bench');

console.log = log;
console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);

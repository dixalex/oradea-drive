// Headless checks for Oradea's river (src/world/oradea/river.js) on the compiled map: node tests/oradea-river.test.mjs
// After liftBanks and shapeBridges no land point of the play area and no point of a motor road (bridges included)
// lies under the river plane, the main bridges are found with decks above the water, a dual carriageway gets a median
// instead of two parapets, and the bridge meshes build with parapet collision. Skipped when the Oradea map is absent.
import { readFileSync, existsSync } from 'node:fs';
import * as THREE from 'three';
import { createHeightField } from '../src/world/cherkasy/ground.js';
import { WATER_Y } from '../src/world/water.js';
import { liftBanks, shapeBridges, buildBridges } from '../src/world/oradea/river.js';
import { pointAt } from '../src/world/cherkasy/bridgekit.js';

const A = new URL('../public/assets/oradea/', import.meta.url);
if (!existsSync(new URL('map.json', A))) { console.log('skip: no public/assets/oradea/map.json (npm run map:oradea)'); process.exit(0); }
let fails = 0;
const log = console.log; console.log = () => {};
const ok = (c, msg) => { if (!c) { fails++; log('FAIL', msg); } else log('ok  ', msg); };

const map = JSON.parse(readFileSync(new URL('map.json', A)));
const dem = new Int16Array(readFileSync(new URL('dem.bin', A)).buffer.slice(0));
const hf = createHeightField(map, dem);
const lifted = liftBanks(hf, dem, map.dem);
const bridges = shapeBridges(hf, map);
ok(lifted > 0, `bank lattice nodes lifted: ${lifted}`);

const inRing = (r, x, z) => { let o = false; for (let a = 0, b = r.length - 2; a < r.length; b = a, a += 2) { const ax = r[a], az = r[a + 1], bx = r[b], bz = r[b + 1]; if ((az > z) !== (bz > z) && x < ax + (bx - ax) * (z - az) / (bz - az)) o = !o; } return o; };
const wet = (x, z) => map.water.some((w) => inRing(w[0], x, z) && !w.slice(1).some((h) => inRing(h, x, z)));
const R = map.region;
let land = 0;
for (let x = R.x0; x < R.x1; x += 10) for (let z = R.z0; z < R.z1; z += 10) if (hf.heightAt(x, z) < WATER_Y + 0.05 && !wet(x, z)) land++;
ok(land === 0, `land points (10 m grid) under the river plane: ${land}`);
let road = 0, n = 0;
for (const r of map.roads) {
  if (r.k !== 'm') continue;
  for (let i = 0; i + 3 < r.p.length; i += 2) {
    const ax = r.p[i], az = r.p[i + 1], bx = r.p[i + 2], bz = r.p[i + 3], m = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / 4));
    for (let k = 0; k < m; k++) {
      const x = ax + (bx - ax) * k / m, z = az + (bz - az) * k / m;
      if (x < R.x0 || x > R.x1 || z < R.z0 || z > R.z1) continue;
      n++; if (hf.heightAt(x, z) < WATER_Y + 0.3) road++;
    }
  }
}
ok(road === 0, `motor road points (4 m) within 0.3 m of the river plane or under it: ${road} of ${n}`);

const names = new Set(bridges.map((b) => b.name));
for (const want of ['Podul Sf. Ladislau', 'Podul Dacia', 'Podul Centenarului', 'Podul Carol I', 'Bulevardul Decebal']) ok(names.has(want), `bridge found: ${want}`);
ok(bridges.every((b) => b.yA > WATER_Y + 0.5 && b.yB > WATER_Y + 0.5), 'every deck stands clear of the water at both ends');
const dacia = bridges.filter((b) => b.name === 'Podul Dacia');
ok(dacia.length === 2 && dacia.every((b) => !b.side[-1].par || !b.side[1].par), 'Podul Dacia: two carriageways meeting at a median (no parapet between them)');

const root = new THREE.Group(), solids = { n: 0, prism() { this.n++; return this.n; } };
const site = buildBridges({ root, solids, ground: { isWater: wet, root: new THREE.Group() }, detailMat: null }, bridges);
let verts = 0;
root.traverse((o) => { if (o.geometry) verts += o.geometry.attributes.position.count; });
ok(site && verts > 1000 && verts < 120000, `bridge meshes: ${verts} vertices`);
ok(solids.n > bridges.length * 4, `bridge colliders: ${solids.n}`);
const L = bridges.find((b) => b.name === 'Podul Sf. Ladislau'), [mx, mz] = pointAt(L.L, L.cum, L.len / 2), dk = site.deckAt(mx, mz);
ok(dk != null && Math.abs(dk - hf.heightAt(mx, mz)) < 0.3, `deckAt agrees with the raised lattice mid-span on Podul Sf. Ladislau (${dk?.toFixed(2)} vs ${hf.heightAt(mx, mz).toFixed(2)})`);

console.log = log;
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);

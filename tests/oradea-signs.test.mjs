// Headless checks for the shop-sign placer of the Oradea map build (tools/oradea/signs.mjs): node tests/oradea-signs.test.mjs
// A named shop gets a board on its building's street wall, facing the street; boards on one wall never overlap; malls,
// unnamed shops, shops outside the map and shops far from any street wall get none; kinds map to the board colours.
// With a built map (public/assets/oradea/map.json carrying `signs`), every board faces out of its building.
import { existsSync, readFileSync } from 'node:fs';
import { placeSigns } from '../tools/oradea/signs.mjs';

let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };

// lat = z, lon = x; a 30 x 12 m block whose first edge (z = 0, x 0..30) is the street wall
const proj = (lat, lon) => [lon, lat], region = { x0: -500, x1: 500, z0: -500, z1: 500 };
const blds = [{ id: 1, outer: [[0, 0], [30, 0], [30, 12], [0, 12]], f: '1000' }, { id: 2, outer: [[100, 100], [110, 100], [110, 110], [100, 110]], f: '0000' }];
const node = (id, x, z, tags) => ({ type: 'node', id, lat: z, lon: x, tags });
const shops = [
  node(1, 5, 4, { shop: 'bakery', name: 'Brutăria  Deli' }),
  node(2, 6, 5, { shop: 'clothes', name: 'Moda' }),
  node(3, 20, 3, { shop: 'mall', name: 'Mall' }),
  node(4, 22, 3, { shop: 'shoes' }),
  node(5, 900, 3, { shop: 'shoes', name: 'Away' }),
  node(6, 105, 105, { shop: 'shoes', name: 'Back yard' }),
];
const pois = [node(7, 25, 4, { amenity: 'bank', name: 'Banca' }), node(8, 15, 6, { amenity: 'pharmacy', name: 'Farmacia' }), node(9, 12, 6, { amenity: 'bench', name: 'Bench' })];
const out = placeSigns({ shops, pois, blds, proj, region }), by = Object.fromEntries(out.map((s) => [s.n, s]));

ok(out.length === 4, `four boards (${out.map((s) => s.n).join(', ')})`);
ok(by['Brutăria Deli']?.k === 'food' && by.Banca?.k === 'bank' && by.Farmacia?.k === 'health' && by.Moda?.k === 'shop', 'kinds: bakery food, bank, pharmacy health, clothes shop');
ok(out.every((s) => s.b === 1 && Math.abs(s.z) < 1e-6 && s.x > 0 && s.x < 30), 'every board on the street wall of block 1');
ok(out.every((s) => Math.abs(Math.sin(s.a)) < 1e-2 && Math.cos(s.a) < -0.99), 'every board faces the street (out of the block, -z)');
const iv = out.map((s) => [s.x - s.w / 2, s.x + s.w / 2]).sort((a, b) => a[0] - b[0]);
ok(iv.every((v, i) => !i || v[0] >= iv[i - 1][1]), 'boards on one wall do not overlap');
ok(!by.Mall && !by.Away && !by['Back yard'] && !by.Bench, 'no board for a mall, a shop off the map, one with no street wall near, a bench');
ok(out.every((s) => s.w >= 1.5 && s.w <= 9), 'board widths within 1.5-9 m');

const MAP = 'public/assets/oradea/map.json', BLD = 'public/assets/oradea/map_buildings.json';
const map = existsSync(MAP) ? JSON.parse(readFileSync(MAP, 'utf8')) : null;
if (map?.signs?.length && existsSync(BLD)) {
  const B = new Map(JSON.parse(readFileSync(BLD, 'utf8')).map((b) => [b.id, b.p]));
  const inRing = (x, z, p) => { let c = false; for (let i = 0, j = p.length - 2; i < p.length; j = i, i += 2) { if ((p[i + 1] > z) !== (p[j + 1] > z) && x < (p[j] - p[i]) * (z - p[i + 1]) / (p[j + 1] - p[i + 1]) + p[i]) c = !c; } return c; };
  const bad = map.signs.filter((s) => !B.has(s.b) || inRing(s.x + Math.sin(s.a), s.z + Math.cos(s.a), B.get(s.b)));
  ok(!bad.length, `built map: all ${map.signs.length} boards face out of their buildings (${bad.length} do not)`);
} else console.log('skip  built map has no signs yet');

console.log(fails ? `${fails} FAILED` : 'all passed');
process.exit(fails ? 1 : 0);

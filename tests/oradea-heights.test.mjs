// Headless checks for the measured-heights step of the Oradea map build (tools/oradea/heights.mjs), on a synthetic
// heights.bin: node tests/oradea-heights.test.mjs
// A footprint reads the 75th percentile of the cells inside it, a footprint over empty cells reads null, the fit is
// monotone and calibrated on tagged buildings, an untagged block takes its measured storeys, a house measured tall
// becomes a block, and a block the raster missed is capped at its tallest measured neighbour.
import { writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadHeights, footprintHeight, fitStoreys, applyHeights } from '../tools/oradea/heights.mjs';

let fails = 0;
const ok = (c, msg) => { if (!c) { fails++; console.log('FAIL', msg); } else console.log('ok  ', msg); };

// a 400 x 400 m grid at 5 m from (0, 0); paint rectangles of height (metres)
const W = 80, H = 80, CELL = 5, v = new Uint16Array(W * H);
const paint = (x0, z0, x1, z1, m) => { for (let j = z0 / CELL; j < z1 / CELL; j++) for (let i = x0 / CELL; i < x1 / CELL; i++) v[j * W + i] = m * 10; };
const box = (x0, z0, x1, z1) => [[x0, z0], [x1, z0], [x1, z1], [x0, z1]];
// tagged calibration blocks: storeys s stand ~2.4 * s + 2 m tall (the source reads tall blocks low)
const tagged = [];
for (let k = 0; k < 60; k++) {
  const s = 1 + (k % 10), x = (k % 8) * 45 + 5, z = Math.floor(k / 8) * 45 + 5;
  paint(x, z, x + 20, z + 20, 2.4 * s + 2); tagged.push({ id: 1000 + k, outer: box(x, z, x + 20, z + 20), holes: [], k: 'apt', lv: s, tagLv: s, t: {}, A: 400, cx: x + 10, cz: z + 10 });
}
const dir = mkdtempSync(join(tmpdir(), 'heights-')), file = join(dir, 'heights.bin');
const hdr = new Int32Array([0x54484748, 0, 0, CELL, W, H]);
writeFileSync(file, Buffer.concat([Buffer.from(hdr.buffer), Buffer.from(v.buffer)]));

const G = loadHeights(file);
ok(G.w === W && G.h === H && G.cell === CELL, 'heights.bin header reads back');
ok(Math.abs(footprintHeight(G, box(5, 5, 25, 25)) - 4.4) < 0.01, 'a footprint reads its cells (4.4 m)');
ok(footprintHeight(G, box(370, 370, 395, 395)) === null, 'a footprint over empty cells reads null');

const fit = fitStoreys(tagged.map((b) => [footprintHeight(G, b.outer), b.lv]));
let mono = true; for (let h = 0; h < 40; h += 0.5) if (fit(h + 0.5) < fit(h)) mono = false;
ok(mono, 'the storey fit never falls as the height rises');
ok(fit(2.4 * 7 + 2) === 7 && fit(2.4 * 2 + 2) === 2, `the fit is calibrated on the tagged buildings (18.8 m -> ${fit(18.8)}, 6.8 m -> ${fit(6.8)})`);

// untagged: a block over a 4-storey cell, a house over a 9-storey one, a block in an empty spot among measured ones
const blk = { id: 1, outer: box(50, 5, 70, 25), holes: [], k: 'apt', lv: 9, tagLv: null, t: {}, A: 400, cx: 60, cz: 15 };
paint(50, 5, 70, 25, 2.4 * 4 + 2);
const tallHouse = { id: 2, outer: box(95, 50, 115, 70), holes: [], k: 'house', lv: 1, tagLv: null, t: {}, A: 400, cx: 105, cz: 60 };
paint(95, 50, 115, 70, 2.4 * 9 + 2);
const missed = { id: 3, outer: box(38, 38, 42, 42), holes: [], k: 'apt', lv: 14, tagLv: null, t: {}, A: 16, cx: 40, cz: 40 };
const church = { id: 4, outer: box(140, 5, 160, 25), holes: [], k: 'church', lv: 2, tagLv: null, t: {}, A: 400, cx: 150, cz: 15 };
writeFileSync(file, Buffer.concat([Buffer.from(hdr.buffer), Buffer.from(v.buffer)]));
const all = [...tagged, blk, tallHouse, missed, church];
const line = applyHeights(all, file);
ok(typeof line === 'string' && /fitted on 60 tagged/.test(line), `stats line: ${line}`);
ok(blk.lv === 4, `an untagged block takes its measured storeys (9 -> ${blk.lv})`);
ok(tallHouse.k === 'apt' && tallHouse.lv === 9, `a house measured nine storeys tall becomes a block (${tallHouse.k} ${tallHouse.lv})`);
ok(missed.lv < 14 && missed.lv <= Math.max(...tagged.filter((b) => Math.hypot(b.cx - 40, b.cz - 40) <= 60).map((b) => b.lv)), `a block the raster missed is capped at its tallest measured neighbour (14 -> ${missed.lv})`);
ok(church.lv === 2, 'a church keeps its own rule');
ok(tagged.every((b, k) => b.lv === 1 + (k % 10)), 'tagged buildings keep their storeys');
ok(applyHeights(all, join(dir, 'missing.bin')) === null, 'a missing file leaves the guesses alone');

rmSync(dir, { recursive: true, force: true });
console.log(fails ? `${fails} FAILED` : 'all ok');
process.exit(fails ? 1 : 0);

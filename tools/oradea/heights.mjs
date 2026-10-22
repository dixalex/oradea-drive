// Storeys from measured heights, for build_map.mjs (config tools.heights): applyHeights(blds, file) reads heights.bin
// (tools/oradea/heights.py: a 5 m game-frame grid of building heights in decimetres) and gives every untagged house,
// block or public building the storeys its footprint measures. Height -> storeys is fitted on the buildings OSM does tag
// (median storeys per metre of height, made monotone), so a source that reads tall blocks low, or counts in other
// units, is calibrated by the city itself. Returns a stats line for the build log, or null when the file is missing.
//   footprintHeight(H, outer, holes) -> metres (75th percentile of the cells inside) or null (the raster saw no building)
//   fitStoreys(pairs [[h, lv]]) -> (h) -> storeys
import { existsSync, readFileSync } from 'node:fs';

export function loadHeights(file) {
  const b = readFileSync(file), buf = b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength);
  const [magic, x0, z0, cell, w, h] = new Int32Array(buf, 0, 6);
  if (magic !== 0x54484748) throw new Error(`${file}: not a heights.bin`);
  return { x0, z0, cell, w, h, v: new Uint16Array(buf, 24, w * h) };
}

const inRing = (x, z, r) => { let c = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, zi] = r[i], [xj, zj] = r[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };

export function footprintHeight(H, outer, holes = []) {
  let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
  for (const [x, z] of outer) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); z0 = Math.min(z0, z); z1 = Math.max(z1, z); }
  const i0 = Math.max(0, Math.floor((x0 - H.x0) / H.cell)), i1 = Math.min(H.w - 1, Math.floor((x1 - H.x0) / H.cell));
  const j0 = Math.max(0, Math.floor((z0 - H.z0) / H.cell)), j1 = Math.min(H.h - 1, Math.floor((z1 - H.z0) / H.cell));
  const vals = []; let n = 0;
  for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
    const x = H.x0 + (i + 0.5) * H.cell, z = H.z0 + (j + 0.5) * H.cell;
    if (!inRing(x, z, outer) || holes.some((r) => inRing(x, z, r))) continue;
    n++; const v = H.v[j * H.w + i]; if (v) vals.push(v / 10);
  }
  if (!n) { // smaller than a cell: the cell under its middle
    const cx = outer.reduce((s, p) => s + p[0], 0) / outer.length, cz = outer.reduce((s, p) => s + p[1], 0) / outer.length;
    const i = Math.floor((cx - H.x0) / H.cell), j = Math.floor((cz - H.z0) / H.cell);
    if (i < 0 || j < 0 || i >= H.w || j >= H.h) return null;
    const v = H.v[j * H.w + i]; return v ? v / 10 : null;
  }
  if (vals.length < Math.max(1, 0.25 * n)) return null;
  vals.sort((a, b) => a - b);
  return vals[Math.min(vals.length - 1, Math.floor(0.75 * vals.length))];
}

export function fitStoreys(pairs) {
  if (pairs.length < 50) return (h) => Math.max(1, Math.round(h / 3));
  const bins = new Map();
  for (const [h, lv] of pairs) { const k = Math.floor(h); (bins.get(k) ?? bins.set(k, []).get(k)).push(lv); }
  let pts = [...bins].filter(([, a]) => a.length >= 3).sort((a, b) => a[0] - b[0])
    .map(([k, a]) => { a.sort((p, q) => p - q); return { h: k + 0.5, lv: a[a.length >> 1], w: a.length }; });
  // pool adjacent violators: storeys never fall as the height rises
  const st = [];
  for (const p of pts) {
    st.push({ ...p, n: 1 });
    while (st.length > 1 && st[st.length - 2].lv > st[st.length - 1].lv) {
      const b = st.pop(), a = st.pop(), w = a.w + b.w;
      st.push({ h: (a.h * a.w + b.h * b.w) / w, lv: (a.lv * a.w + b.lv * b.w) / w, w, n: a.n + b.n });
    }
  }
  pts = st;
  return (h) => {
    let lv;
    if (h <= pts[0].h) lv = pts[0].lv;
    else if (h >= pts[pts.length - 1].h) lv = pts[pts.length - 1].lv + (h - pts[pts.length - 1].h) / 3; // above the data: 3 m a storey
    else { let k = 1; while (pts[k].h < h) k++; const a = pts[k - 1], b = pts[k]; lv = a.lv + (b.lv - a.lv) * (h - a.h) / (b.h - a.h); }
    return Math.max(1, Math.round(lv));
  };
}

// kinds whose storeys a height means: halls (indus), churches (towers), sheds and garages keep their own rules
const MEASURED = new Set(['house', 'apt', 'public']);

export function applyHeights(blds, file) {
  if (!existsSync(file)) { console.warn(`heights: no ${file} (npm run heights:oradea), storeys stay guessed`); return null; }
  const H = loadHeights(file);
  const hOf = (b) => (b.measH === undefined ? (b.measH = footprintHeight(H, b.outer, b.holes)) : b.measH);
  const pairs = blds.filter((b) => b.tagLv && b.tagLv <= 30 && !b.t.man_made && MEASURED.has(b.k)).map((b) => [hOf(b), Math.round(b.tagLv), b.id]).filter((p) => p[0] != null);
  // how well it predicts: fit on half the tagged buildings, test on the other half
  const fitA = fitStoreys(pairs.filter((p) => p[2] % 2 === 0)), test = pairs.filter((p) => p[2] % 2 === 1);
  const err = test.reduce((s, [h, lv]) => s + Math.abs(fitA(h) - lv), 0) / Math.max(1, test.length);
  const near = test.filter(([h, lv]) => Math.abs(fitA(h) - lv) <= 1).length / Math.max(1, test.length);
  const fit = fitStoreys(pairs);
  let set = 0, toApt = 0, toHouse = 0, capped = 0;
  const seen = new Map(), unseen = [], CELL = 60, key = (x, z) => Math.floor(x / CELL) * 1e5 + Math.floor(z / CELL);
  const keep = (b) => { const k = key(b.cx, b.cz); (seen.get(k) ?? seen.set(k, []).get(k)).push(b); };
  for (const b of blds) {
    if (b.t.man_made || !MEASURED.has(b.k)) continue;
    if (b.tagLv) { keep(b); continue; } // a tagged neighbour is a known height too
    const h = hOf(b); if (h == null) { unseen.push(b); continue; }
    let lv = fit(h);
    if (b.k === 'house' && lv >= 4 && b.A > 150) { b.k = 'apt'; b.row = false; toApt++; } else if (b.k === 'house') lv = Math.min(lv, 3);
    else if (b.k === 'apt' && lv === 1 && b.A < 250) { b.k = 'house'; toHouse++; } // a one-storey yard annex, not a block of flats
    b.lv = Math.min(40, lv); set++; keep(b);
  }
  // the raster missed it (built after 2021, or a gap): a guessed block stands no taller than its tallest measured neighbour
  for (const b of unseen) {
    if (b.k === 'house') continue;
    let top = 0, n = 0;
    for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const q of seen.get(key(b.cx + i * CELL, b.cz + j * CELL)) ?? []) {
      if (Math.hypot(q.cx - b.cx, q.cz - b.cz) <= CELL) { top = Math.max(top, q.lv); n++; }
    }
    if (n >= 3 && b.lv > top) { b.lv = top; capped++; }
  }
  return `heights: ${set} buildings measured (${toApt} houses turned blocks, ${toHouse} blocks turned annexes), ${unseen.length} not seen by the raster ` +
    `(${capped} capped at their tallest measured neighbour); fitted on ${pairs.length} tagged, held-out error ${err.toFixed(2)} storeys, ${(100 * near).toFixed(0)}% within one`;
}

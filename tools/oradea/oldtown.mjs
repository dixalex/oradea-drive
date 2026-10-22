// Oradea's old quarters, for build_map.mjs (config tools.oldTown: the names of the historic quarters): every building
// takes the quarter of the nearest named place=suburb point (OSM maps the quarters only as points), and in the old ones
//   - an untagged block or public building that is not a free-standing slab is a historic town house: `old` (buildings.js
//     draws tall storeys, tall windows under cornices, shops on the street, a tiled roof), at most 4 storeys (3 under
//     300 m2) unless measured (tools.heights) – the upstream guess borrowed nine-storey slabs here; checked against
//     GlobalBuildingAtlas heights in the old quarters, it halves the error (2.35 -> 1.19 storeys on 1,555 buildings);
//   - untagged walls and roofs take the old town's colours: pastel render, terracotta tiles.
//   applyOldTown(blds, { places, historic }) -> stats line;  places: [{ name, x, z }] the named suburb points
// blds records: { id, outer: [[x, z]..], holes, t (tags), k, lv, tagLv, A, cx, cz, measH? } (build_map.mjs), changed in place.
const WALLS = ['#e8c9a0', '#f0d9a8', '#e6b98a', '#d9a07a', '#c9d8c0', '#b8d0d8', '#d8c8e0', '#f2e6cc', '#e9d27a', '#cfa58a', '#a9c8b8', '#ecd9c6'];
const ROOFS = [[5, '#8a3b28'], [3, '#7a3424'], [3, '#9c4a2e'], [2, '#6b4a3a'], [1, '#4f5254'], [0.4, '#5d6b5f']];
const hash = (n) => { let x = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b); x ^= x >>> 13; x = Math.imul(x, 0xc2b2ae35); x ^= x >>> 16; return (x >>> 0) / 4294967296; };
const pick = (r, W) => { let s = W.reduce((a, w) => a + w[0], 0) * r; for (const [w, v] of W) { s -= w; if (s <= 0) return v; } return W[W.length - 1][1]; };

// long / short side of the minimum-area rectangle over the ring's edge directions
function obb(R) {
  let best = null;
  for (let i = 0; i < R.length; i++) {
    const a = R[i], b = R[(i + 1) % R.length], dx = b[0] - a[0], dz = b[1] - a[1], l = Math.hypot(dx, dz); if (l < 1) continue;
    const ux = dx / l, uz = dz / l; let a0 = Infinity, a1 = -Infinity, b0 = Infinity, b1 = -Infinity;
    for (const [x, z] of R) { const p = x * ux + z * uz, q = -x * uz + z * ux; a0 = Math.min(a0, p); a1 = Math.max(a1, p); b0 = Math.min(b0, q); b1 = Math.max(b1, q); }
    const A = (a1 - a0) * (b1 - b0); if (!best || A < best.A) best = { A, L: Math.max(a1 - a0, b1 - b0), W: Math.min(a1 - a0, b1 - b0) };
  }
  return best ?? { A: 0, L: 0, W: 0 };
}

// share of each outer ring's length that runs along another building's edge (party walls), 1.5 m samples within 0.8 m
function partyWalls(blds) {
  const CELL = 40, grid = new Map(), key = (x, z) => Math.floor(x / CELL) * 1e6 + Math.floor(z / CELL), segs = [];
  blds.forEach((b, bi) => b.outer.forEach((a, i) => {
    const c = b.outer[(i + 1) % b.outer.length], s = segs.push([a[0], a[1], c[0], c[1], bi]) - 1;
    for (let x = Math.floor(Math.min(a[0], c[0]) / CELL); x <= Math.floor(Math.max(a[0], c[0]) / CELL); x++)
      for (let z = Math.floor(Math.min(a[1], c[1]) / CELL); z <= Math.floor(Math.max(a[1], c[1]) / CELL); z++) { const k = x * 1e6 + z; (grid.get(k) ?? grid.set(k, []).get(k)).push(s); }
  }));
  const dSeg = (x, z, s) => { const dx = s[2] - s[0], dz = s[3] - s[1], L2 = dx * dx + dz * dz || 1, t = Math.max(0, Math.min(1, ((x - s[0]) * dx + (z - s[1]) * dz) / L2)); return Math.hypot(s[0] + dx * t - x, s[1] + dz * t - z); };
  return (bi) => {
    const R = blds[bi].outer; let tot = 0, shared = 0;
    R.forEach((a, i) => {
      const c = R[(i + 1) % R.length], len = Math.hypot(c[0] - a[0], c[1] - a[1]), k = Math.max(1, Math.ceil(len / 1.5));
      for (let s = 0; s < k; s++) {
        const x = a[0] + (c[0] - a[0]) * (s + 0.5) / k, z = a[1] + (c[1] - a[1]) * (s + 0.5) / k; tot += len / k;
        if ((grid.get(key(x, z)) ?? []).some((si) => segs[si][4] !== bi && dSeg(x, z, segs[si]) < 0.8)) shared += len / k;
      }
    });
    return tot ? shared / tot : 0;
  };
}

export function applyOldTown(blds, { places, historic }) {
  const seeds = places.filter((p) => p.name), old = new Set(historic);
  if (!seeds.some((p) => old.has(p.name))) return `old town: none of ${historic.join(', ')} among the suburb points, skipped`;
  const quarter = (x, z) => { let best = null, d = Infinity; for (const p of seeds) { const e = Math.hypot(p.x - x, p.z - z); if (e < d) { d = e; best = p; } } return best?.name; };
  const party = partyWalls(blds);
  let town = 0, capped = 0, painted = 0, slabs = 0;
  blds.forEach((b, i) => {
    if (!old.has(quarter(b.cx, b.cz))) return;
    const r = hash(b.id), t = b.t ?? {};
    if (b.k === 'apt' || b.k === 'public') {
      const o = obb(b.outer), slab = o.L >= 40 && o.W >= 9 && o.W <= 17 && party(i) < 0.1;
      if (slab) { slabs++; return; } // a free-standing post-war slab keeps its look
      if (b.u) return; // a mall, market or hall (tools.buildingUse) keeps its own
      b.old = 1; town++;
      if (!b.tagLv && b.measH == null) { const cap = b.A < 300 ? 3 : 4; if (b.lv > cap) { b.lv = cap; capped++; } }
    } else if (b.k !== 'house') return;
    if (!t['building:colour']) b.bc = WALLS[Math.floor(r * WALLS.length)];
    if (!t['roof:colour']) b.rc = pick(hash(b.id + 7), ROOFS);
    painted++;
  });
  return `old town (${historic.join(', ')}): ${town} historic town houses (${capped} lowered), ${slabs} slabs kept, ${painted} painted`;
}

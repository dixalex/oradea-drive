// Oradea's river, the Crișul Repede: 40–80 m wide, where the shared terrain was made for Cherkasy's broad Dnipro.
//   liftBanks(hf, dem, D) -> lattice nodes lifted    call right after createHeightField, before the ground is built.
//     The 16 m height lattice averages the deep river cells into the banks and drags them under the water plane, so
//     the water showed over the bank, the walks and the riverside streets; and the radar terrain has no quay walls.
//     Land within QUAY.near of the water is kept at least BANK, easing back to the ground by QUAY.far, and every
//     lattice cell that holds both land and water (the raw 8 m DEM, one cell around) gets its four corners at BANK:
//     nothing drawn on land dips below the river, the ground's bank band becomes a quay wall, and inside the river
//     only the bed rises, which nothing draws.
//   shapeBridges(hf, map) -> bridges    after liftBanks. OSM bridges over the river (chains of `br` roads that cross a
//     water ring) get a deck: a straight grade between the heights at the chain's ends, and the lattice under it raised
//     to it, so the asphalt the ground drapes there, the lanes and the car all ride the deck.
//     bridge: { L: [[x, z]..] (the chain), cum, len, hw (half carriageway), walk, foot (a footbridge), y(s),
//       side: { [-1 | 1]: { walk, par } } (a median toward the other half of a dual carriageway has no parapet; a footway
//       bridge alongside widens the walk), merged (a footbridge taken into a road bridge's walk: not built on its own) }
//   buildBridges({ root, solids, ground, detailMat }, bridges) -> site { deckAt(x, z), clear(x, z), update() } | null
//     What the ground does not draw: the walks beside the carriageway (ground material, pavers), the fascia and soffit,
//     parapet kerbs with steel railings, piers into the river. Collision: the walks (the car can mount them) and the
//     parapets. deckAt feeds the lane network (npc/lanes.js), clear keeps generated trees off the decks.
import * as THREE from 'three';
import { MB } from '../../kit/mesh.js';
import { DP } from '../materials.js';
import { WATER_Y } from '../water.js';
import { GY, SURF } from '../cherkasy/ground.js';
import { along, cumulate, pointAt, topMesh, groundMat } from '../cherkasy/bridgekit.js';

const FLOOR = WATER_Y + 0.35; // lowest deck end: clears the water by 0.35 m plus the deck's own lift
// the quays: the radar terrain (~30 m) cannot see the stone walls the Crișul runs between in town, so the land within
// QUAY.near m of the water is kept at least BANK (3.2 m over the river), easing back to the ground by QUAY.far
const BANK = WATER_Y + 3.2, QUAY = { near: 24, far: 80 };
const DECK = { walk: 2.2, footWalk: 0.4, depth: 1.2, kerb: 0.18, par: 0.3, rail: 1.05, pier: 32 };

export function liftBanks(hf, dem, D) {
  const { meta: { nx, nz }, grid: g } = hf.data, cell = hf.cell, step = Math.round(cell / D.cell);
  const wetAt = (a, b) => (a < 0 || b < 0 || a >= D.nx || b >= D.nz ? -1 : dem[b * D.nx + a] * D.scale < WATER_Y ? 1 : 0);
  let n = 0;
  const lift = (k, y) => { if (g[k] < y) { g[k] = y; n++; } };
  // metres from every lattice node to the nearest wet one (two-pass chamfer)
  const dist = new Float32Array(nx * nz);
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) dist[j * nx + i] = wetAt(step * i, step * j) === 1 ? 0 : 1e9;
  const dg = cell * Math.SQRT2;
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const k = j * nx + i; let d = dist[k];
    if (i > 0) d = Math.min(d, dist[k - 1] + cell);
    if (j > 0) { d = Math.min(d, dist[k - nx] + cell); if (i > 0) d = Math.min(d, dist[k - nx - 1] + dg); if (i < nx - 1) d = Math.min(d, dist[k - nx + 1] + dg); }
    dist[k] = d;
  }
  for (let j = nz - 1; j >= 0; j--) for (let i = nx - 1; i >= 0; i--) {
    const k = j * nx + i; let d = dist[k];
    if (i < nx - 1) d = Math.min(d, dist[k + 1] + cell);
    if (j < nz - 1) { d = Math.min(d, dist[k + nx] + cell); if (i < nx - 1) d = Math.min(d, dist[k + nx + 1] + dg); if (i > 0) d = Math.min(d, dist[k + nx - 1] + dg); }
    dist[k] = d;
  }
  // quays: land near the river at least BANK, easing back to the natural ground by QUAY.far
  for (let k = 0; k < g.length; k++) {
    const d = dist[k];
    if (d === 0 || d >= QUAY.far) continue;
    const f = d <= QUAY.near ? 0 : (d - QUAY.near) / (QUAY.far - QUAY.near);
    lift(k, BANK - (BANK - WATER_Y - 1.2) * f * f * (3 - 2 * f));
  }
  // cells holding both land and water (the raw 8 m DEM, one cell around): all four corners at the quay's top, so the
  // land is level to the water's edge and the ground's bank band drops from there as a wall
  for (let j = 0; j < nz - 1; j++) for (let i = 0; i < nx - 1; i++) {
    const k = j * nx + i, c = [k, k + 1, k + nx, k + nx + 1];
    if (c.every((q) => dist[q] > 0) || c.every((q) => dist[q] === 0 && g[q] >= BANK)) continue;
    let land = false, wet = false;
    for (let b = step * j - 1; b <= step * (j + 1) + 1 && !(land && wet); b++) {
      for (let a = step * i - 1; a <= step * (i + 1) + 1; a++) { const w = wetAt(a, b); if (w === 1) wet = true; else if (w === 0) land = true; }
    }
    if (land && wet) for (const q of c) lift(q, BANK);
  }
  return n;
}

// ------------------------------------------------------------------------------------------------ bridges
const inRing = (r, x, z) => { let o = false; for (let a = 0, b = r.length - 2; a < r.length; b = a, a += 2) { const ax = r[a], az = r[a + 1], bx = r[b], bz = r[b + 1]; if ((az > z) !== (bz > z) && x < ax + (bx - ax) * (z - az) / (bz - az)) o = !o; } return o; };
// bridge roads joined end to end (OSM splits a bridge at lane changes and mid-span) into chains of [x, z] points
function chains(roads) {
  const key = (x, z) => `${Math.round(x * 2)},${Math.round(z * 2)}`;
  const ways = roads.map((r) => ({ r, P: Array.from({ length: r.p.length / 2 }, (_, i) => [r.p[2 * i], r.p[2 * i + 1]]) }));
  const ends = new Map();
  for (const w of ways) for (const p of [w.P[0], w.P[w.P.length - 1]]) { const k = key(...p); (ends.get(k) ?? ends.set(k, []).get(k)).push(w); }
  const used = new Set(), out = [];
  for (const w of ways) {
    if (used.has(w)) continue;
    used.add(w);
    let L = w.P.slice(), rs = [w.r];
    for (let grew = true; grew;) { // extend at either end through a point exactly two ways share
      grew = false;
      for (const atEnd of [true, false]) {
        const p = atEnd ? L[L.length - 1] : L[0], nb = (ends.get(key(...p)) ?? []).filter((q) => !used.has(q));
        if (nb.length !== 1 || (ends.get(key(...p)) ?? []).length !== 2) continue;
        const q = nb[0], Q = key(...q.P[0]) === key(...p) ? q.P : q.P.slice().reverse();
        used.add(q); rs.push(q.r); grew = true;
        L = atEnd ? [...L, ...Q.slice(1)] : [...Q.slice().reverse().slice(0, -1), ...L];
      }
    }
    out.push({ L, rs });
  }
  return out;
}

export function shapeBridges(hf, map) {
  const water = map.water.map((w) => {
    const R = w[0]; let x0 = Infinity, z0 = Infinity, x1 = -Infinity, z1 = -Infinity;
    for (let i = 0; i < R.length; i += 2) { x0 = Math.min(x0, R[i]); x1 = Math.max(x1, R[i]); z0 = Math.min(z0, R[i + 1]); z1 = Math.max(z1, R[i + 1]); }
    return { w, x0, z0, x1, z1 };
  });
  const wet = (x, z) => water.some((b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1 && inRing(b.w[0], x, z) && !b.w.slice(1).some((h) => inRing(h, x, z)));
  const H = hf.heightAt, { meta: { x0, z0, cell, nx, nz }, grid: g } = hf.data;
  const out = [];
  for (const { L, rs } of chains(map.roads.filter((r) => r.br && (r.k === 'm' || r.k === 'p')))) {
    const cum = cumulate(L), len = cum[cum.length - 1];
    if (len < 8) continue;
    // over the river: a 2 m walk along the chain finds water
    let wetRun = 0;
    for (let s = 1; s < len; s += 2) { const [x, z] = pointAt(L, cum, s); if (wet(x, z)) wetRun += 2; }
    if (wetRun < 6) continue;
    const foot = rs.every((r) => r.k === 'p');
    const hw = Math.max(1.2, Math.max(...rs.map((r) => r.w || 6)) / 2);
    // the ends: the terrain where they stand on land (an end in the river borrows the other end's height)
    const endY = (s) => { const [x, z] = pointAt(L, cum, s); return wet(x, z) ? null : H(x, z); };
    let yA = endY(0), yB = endY(len);
    yA ??= yB ?? FLOOR + 1.5; yB ??= yA;
    yA = Math.max(yA, FLOOR + 0.6); yB = Math.max(yB, FLOOR + 0.6);
    const y = (s) => yA + (yB - yA) * Math.min(1, Math.max(0, s / len));
    // raise every lattice node whose cell can hold the deck (half width + a cell diagonal) to the deck, never lower
    const reach = hw + (foot ? DECK.footWalk : DECK.walk) + cell * Math.SQRT2;
    const xs = L.map((p) => p[0]), zs = L.map((p) => p[1]);
    const i0 = Math.max(0, Math.floor((Math.min(...xs) - reach - x0) / cell)), i1 = Math.min(nx - 1, Math.ceil((Math.max(...xs) + reach - x0) / cell));
    const j0 = Math.max(0, Math.floor((Math.min(...zs) - reach - z0) / cell)), j1 = Math.min(nz - 1, Math.ceil((Math.max(...zs) + reach - z0) / cell));
    let raised = 0;
    for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
      const { d, s } = along(L, x0 + i * cell, z0 + j * cell);
      if (d > reach || s <= 0.01 || s >= len - 0.01) continue;
      const k = j * nx + i, v = y(s);
      if (g[k] < v) { g[k] = v; raised++; }
    }
    out.push({ L, cum, len, hw, walk: foot ? DECK.footWalk : DECK.walk, foot, y, yA, yB, raised, name: rs.find((r) => r.n)?.n ?? '' });
  }
  return pairSides(out);
}

// OSM draws a dual carriageway as two bridges side by side and the sidewalks as footway bridges beside them: per side
// of each road bridge, a road bridge next to it makes that side a median (the deck meets the other half-way, no
// parapet), a footway bridge next to it widens the walk to take it in (that footbridge is then not built on its own).
// -> the same list with side: { [-1 | 1]: { walk, par } } and merged: true on the footbridges taken in
function pairSides(list) {
  for (const B of list) {
    B.side = { [-1]: { walk: B.walk, par: true }, [1]: { walk: B.walk, par: true } };
    if (B.foot) continue;
    for (const sg of [-1, 1]) {
      for (const f of [0.3, 0.5, 0.7]) {
        const [x, z, dx, dz] = pointAt(B.L, B.cum, f * B.len), probe = [x - dz * sg * (B.hw + 1.5), z + dx * sg * (B.hw + 1.5)];
        for (const O of list) {
          if (O === B) continue;
          const a = along(O.L, ...probe);
          if (a.d > O.hw + 9 || a.s <= 0 || a.s >= O.len) continue;
          const D = along(O.L, x, z).d; // axis to axis
          if (!O.foot) { B.side[sg] = { walk: Math.max(0, D / 2 - B.hw), par: false }; break; }
          B.side[sg] = { walk: Math.max(B.side[sg].walk, D - B.hw + O.hw + 0.3), par: true }; O.merged = true; break;
        }
        if (!B.side[sg].par || B.side[sg].walk > B.walk) break;
      }
    }
  }
  return list;
}

export function buildBridges({ root, solids: S, ground, detailMat }, bridges) {
  if (!bridges?.length) return null;
  const t0 = performance.now();
  const det = new MB(), top = topMesh();
  const isWater = ground?.isWater ?? (() => false);
  let piers = 0;
  for (const B of bridges) {
    if (B.merged) continue;
    const { L, cum, len, hw, y } = B, n = Math.max(1, Math.ceil(len / 4));
    const P = (s, o) => { const [x, z, dx, dz] = pointAt(L, cum, s); return [x - dz * o, z + dx * o, dx, dz]; };
    // each side: the walk's outer edge, and the deck's (past the parapet, if there is one)
    const sides = [-1, 1].map((sg) => { const { walk, par } = B.side[sg]; return { sg, walk, par, edge: hw + walk, out: hw + walk + (par ? DECK.par : 0) }; });
    const wy = (yy) => yy + DECK.kerb;
    for (let k = 0; k < n; k++) {
      const sa = (k / n) * len, sb = ((k + 1) / n) * len, ya = y(sa), yb = y(sb), yLo = Math.min(ya, yb) - DECK.depth;
      for (const { sg, walk, par, edge, out } of sides) {
        const [ax0, az0] = P(sa, sg * hw), [bx0, bz0] = P(sb, sg * hw), [ax1, az1] = P(sa, sg * edge), [bx1, bz1] = P(sb, sg * edge);
        const [ax2, az2] = P(sa, sg * out), [bx2, bz2] = P(sb, sg * out);
        const [, , dx, dz] = P((sa + sb) / 2, 0), nrm = [-dz * sg, 0, dx * sg], inw = nrm.map((v) => -v);
        if (walk > 0.05) { // the walk: pavers on a kerb, in the ground material so it joins the streets' walks
          top.quad([[ax0, wy(ya), az0], [bx0, wy(yb), bz0], [bx1, wy(yb), bz1], [ax1, wy(ya), az1]], [0, 1, 0], SURF.PAVERS);
          top.quad([[ax0, ya, az0], [bx0, yb, bz0], [bx0, wy(yb), bz0], [ax0, wy(ya), az0]], inw, SURF.CURB);
          S?.prism([[ax0, az0], [bx0, bz0], [bx1, bz1], [ax1, az1]], yLo, Math.max(wy(ya), wy(yb)), 0, 0, 'walk');
        }
        det.setPart(DP.CONC).setColor('#b9b6ae');
        const yt = par ? DECK.par : walk > 0.05 ? 0 : -DECK.kerb; // the top of the deck's edge over its walk line
        if (par) { // parapet kerb: inner face and top; collision up to the railing's height
          det.face([[ax1, wy(ya), az1], [bx1, wy(yb), bz1], [bx1, wy(yb) + yt, bz1], [ax1, wy(ya) + yt, az1]], inw);
          det.face([[ax1, wy(ya) + yt, az1], [bx1, wy(yb) + yt, bz1], [bx2, wy(yb) + yt, bz2], [ax2, wy(ya) + yt, az2]], [0, 1, 0]);
          S?.prism([[ax1, az1], [bx1, bz1], [bx2, bz2], [ax2, az2]], yLo, Math.max(wy(ya), wy(yb)) + DECK.par + DECK.rail, 0, 0, 'wall');
        }
        if (par || walk > 0.05) det.face([[ax2, ya - DECK.depth, az2], [bx2, yb - DECK.depth, bz2], [bx2, wy(yb) + yt, bz2], [ax2, wy(ya) + yt, az2]], nrm); // fascia
      }
      const [l, r] = sides, [cx, cz] = P(sa, -l.out), [ex, ez] = P(sb, -l.out), [fx, fz] = P(sb, r.out), [gx, gz] = P(sa, r.out);
      det.setPart(DP.CONC).setColor('#8f8c86').face([[cx, ya - DECK.depth, cz], [ex, yb - DECK.depth, ez], [fx, yb - DECK.depth, fz], [gx, ya - DECK.depth, gz]], [0, -1, 0]); // soffit
    }
    // railings on the parapets: posts every 2 m, a top rail and a mid rail
    det.setPart(DP.STEEL).setColor('#3c4146');
    for (const { sg, par, edge } of sides) {
      if (!par) continue;
      const o = sg * (edge + DECK.par / 2);
      for (let s = 0; s <= len; s += 2) { const [x, z] = P(s, o), yy = wy(y(s)) + DECK.par; det.box(x - 0.04, yy, z - 0.04, x + 0.04, yy + DECK.rail, z + 0.04); }
      const m = Math.max(1, Math.ceil(len / 6));
      for (let k = 0; k < m; k++) {
        const sa = (k / m) * len, sb = ((k + 1) / m) * len, [ax, az] = P(sa, o), [bx, bz] = P(sb, o), l = Math.hypot(bx - ax, bz - az);
        const nn = [-(bz - az) / l, 0, (bx - ax) / l];
        for (const [h, t] of [[DECK.rail, 0.05], [DECK.rail * 0.5, 0.025]]) {
          const ya = wy(y(sa)) + DECK.par + h, yb = wy(y(sb)) + DECK.par + h, q = [[ax, ya - t, az], [bx, yb - t, bz], [bx, yb + t, bz], [ax, ya + t, az]];
          det.face(q, nn); det.face(q.slice().reverse(), nn.map((v) => -v));
        }
      }
    }
    // piers: a wall across the deck where it stands in the river, ~every 32 m between the banks
    const span = Math.max(1, Math.round(len / DECK.pier));
    det.setPart(DP.CONC).setColor('#a9a59c');
    for (let k = 1; k < span; k++) {
      const s = (k / span) * len, [x, z, dx, dz] = P(s, 0);
      if (!isWater(x, z)) continue;
      const t = 0.7, yy = y(s) - DECK.depth, wl = sides[0].out - 0.6, wr = sides[1].out - 0.6;
      const c = (a, o) => [x + dx * a - dz * o, z + dz * a + dx * o];
      const ring = [c(-t, -wl), c(t, -wl), c(t, wr), c(-t, wr)];
      for (let e = 0; e < 4; e++) {
        const [p, q] = [ring[e], ring[(e + 1) % 4]], ex = q[0] - p[0], ez = q[1] - p[1], l = Math.hypot(ex, ez);
        det.face([[p[0], WATER_Y - 3, p[1]], [q[0], WATER_Y - 3, q[1]], [q[0], yy, q[1]], [p[0], yy, p[1]]], [ez / l, 0, -ex / l]);
      }
      S?.prism(ring, WATER_Y - 3, yy, 0, 0, 'wall');
      piers++;
    }
  }
  const group = Object.assign(new THREE.Group(), { name: 'oradea-bridges' });
  root.add(group);
  const walkM = top.mesh(groundMat(ground), 'bridge-walks');
  if (walkM) group.add(walkM);
  const mat = detailMat ?? new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 });
  group.add(Object.assign(new THREE.Mesh(det.build({ part: true }), mat), { name: 'bridge-structure', castShadow: true, receiveShadow: true }));
  console.log(`[oradea] ${bridges.length} river bridges (${bridges.filter((b) => b.foot && !b.merged).length} footbridges, ${bridges.filter((b) => b.merged).length} footways taken into a road bridge's walk), ${piers} piers, ${((det.v + top.v) / 1000).toFixed(1)}k verts in ${(performance.now() - t0).toFixed(0)} ms`);

  const near = (x, z, pad) => {
    for (const B of bridges) {
      const { d, s } = along(B.L, x, z);
      if (d <= B.hw + Math.max(B.side[-1].walk, B.side[1].walk) + pad && s > 0.01 && s < B.len - 0.01) return B.y(s);
    }
    return null;
  };
  return {
    deckAt: (x, z) => { for (const B of bridges) { const { d, s } = along(B.L, x, z); if (!B.foot && d <= B.hw + 0.5 && s > 0.01 && s < B.len - 0.01) return B.y(s) + GY.ROAD; } return null; },
    clear: (x, z) => near(x, z, 3) != null,
    update() {},
  };
}

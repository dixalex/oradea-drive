// OWNER: oradea. The ground of Calea Republicii (not a site module): granite-sett paving with a flag strip along the fronts,
// lamps, benches, planters and the few street trees.
//   buildStreet({ CL, g, onAsphalt, index, S, rnd, det, sett, slab }) -> { spots, stats, ext }
//     CL: the axis polyline; g(x, z): terrain; onAsphalt(x, z): a cross street's carriageway (the paving stops there); index:
//     BuildingIndex; S: solids; det: the detail builder (parts: DP); sett / slab: builders for the two paving materials
//     (uv in metres / 3.2 and / 2); spots: trees for the city's tree builder
import { MB } from '../../../../kit/mesh.js';
import { DP } from '../../../materials.js';
import { quad } from '../../../cherkasy/slabkit.js';

const LIFT = 0.19, STEP = 3, SLAB = 2.2;

export function buildStreet({ CL, g, onAsphalt, index, S, rnd, det, sett, slab, from = 6 }) {
  // ---- stations along the axis
  const segs = []; let total = 0;
  for (let i = 0; i + 3 < CL.length; i += 2) { const L = Math.hypot(CL[i + 2] - CL[i], CL[i + 3] - CL[i + 1]); segs.push({ i, L, t0: total }); total += L; }
  const at = (t) => {
    const s = segs.find((q) => t <= q.t0 + q.L) ?? segs[segs.length - 1], f = (t - s.t0) / s.L, ax = CL[s.i], az = CL[s.i + 1], dx = (CL[s.i + 2] - ax) / s.L, dz = (CL[s.i + 3] - az) / s.L;
    return { x: ax + dx * (t - s.t0), z: az + dz * (t - s.t0), dx, dz, nx: -dz, nz: dx, t };
  };
  const reach = (p, side, max = 14) => { // the free width from the axis to the first building on one side, or null in a cross street's mouth
    for (let l = 1; l <= max; l += 0.5) if (index.at(p.x + p.nx * side * l, p.z + p.nz * side * l) != null) return l - 0.15;
    return null;
  };
  const st = [];
  for (let t = from; t <= total - 4; t += STEP) {
    const p = at(t), a = reach(p, 1), b = reach(p, -1);
    st.push({ ...p, a: a ?? 4.5, b: b ?? 4.5, open: a == null || b == null, asph: onAsphalt(p.x, p.z) || onAsphalt(p.x + p.nx * 2, p.z + p.nz * 2) || onAsphalt(p.x - p.nx * 2, p.z - p.nz * 2) });
  }
  // a narrow mouth never makes the paving wider than its neighbours (a median filter over 3 stations on each side)
  const med = (k, key) => { const v = [st[Math.max(0, k - 1)][key], st[k][key], st[Math.min(st.length - 1, k + 1)][key]].sort((x, y) => x - y); return v[1]; };
  const ea = st.map((_, k) => med(k, 'a')), eb = st.map((_, k) => med(k, 'b'));
  st.forEach((s, k) => { s.a = ea[k]; s.b = eb[k]; });

  // ---- the paving: a strip per station pair (skipped across a carriageway), flag bands along both fronts
  const pt = (s, side, l) => [s.x + s.nx * side * l, s.z + s.nz * side * l];
  const V = (s, side, l) => { const [x, z] = pt(s, side, l); return [x, g(x, z) + LIFT, z]; };
  let lenS = 0;
  for (let k = 0; k + 1 < st.length; k++) {
    const s0 = st[k], s1 = st[k + 1];
    if (s0.asph || s1.asph) continue;
    const len = STEP, u0 = lenS / 3.2, u1 = (lenS + len) / 3.2; lenS += len;
    for (const side of [1, -1]) {
      const e0 = side > 0 ? s0.a : s0.b, e1 = side > 0 ? s1.a : s1.b, f0 = Math.max(0.3, e0 - SLAB), f1 = Math.max(0.3, e1 - SLAB);
      // the sett field from the axis to the flag band
      quad(sett, V(s0, side, 0), V(s1, side, 0), V(s1, side, f1), V(s0, side, f0), [0, 1, 0], [[u0, side > 0 ? 0 : 0], [u1, 0], [u1, f1 / 3.2], [u0, f0 / 3.2]]);
      // the flag band to the front
      quad(slab, V(s0, side, f0), V(s1, side, f1), V(s1, side, e1), V(s0, side, e0), [0, 1, 0], [[(lenS - len) / 2, f0 / 2], [lenS / 2, f1 / 2], [lenS / 2, e1 / 2], [(lenS - len) / 2, e0 / 2]]);
    }
  }

  // ---- lamps, benches, planters
  const stats = { lamps: 0, benches: 0, planters: 0 }, spots = [];
  const D = det;
  const lamp = (x, z) => {
    const y = g(x, z) + LIFT;
    D.setPart(DP.STEEL).setColor('#25292b').cyl(x, y, z, 0.13, 0.08, 0.4, 6, false).cyl(x, y + 0.4, z, 0.06, 0.05, 3.85, 5, false);
    D.cyl(x, y + 4.2, z, 0.2, 0.08, 0.12, 6, true);
    D.setPart(DP.LIGHT).setColor('#ffdba0').ellipsoid([x, y + 4.5, z], [0.18, 0.25, 0.18], 6, 4);
    D.setPart(DP.STEEL).setColor('#25292b').cyl(x, y + 4.78, z, 0.18, 0.02, 0.1, 6, false);
    S.cyl(x, z, y, y + 4.9, 0.12, 0.08, 'pole'); stats.lamps++;
  };
  const bench = (x, z, yaw) => {
    const y = g(x, z) + LIFT, c = Math.cos(yaw), s = Math.sin(yaw);
    const p = (a, b) => [x + a * c - b * s, z + a * s + b * c];
    for (const [da, db, w, d, y0, y1, part, col] of [[0, 0, 1.8, 0.5, 0.44, 0.49, DP.WOOD, '#7a5230'], [0, -0.23, 1.8, 0.06, 0.55, 0.9, DP.WOOD, '#7a5230'], [-0.78, 0, 0.06, 0.5, 0, 0.44, DP.STEEL, '#26292b'], [0.78, 0, 0.06, 0.5, 0, 0.44, DP.STEEL, '#26292b']]) {
      const [cx, cz] = p(da, db);
      D.setPart(part).setColor(col);
      boxYaw(D, cx, y + y0, cz, w, y1 - y0, d, yaw);
    }
    S.obox(x, z, 0.95, 0.3, yaw, y, y + 0.5, 'bench'); stats.benches++;
  };
  const planter = (x, z, big) => {
    const y = g(x, z) + LIFT, w = big ? 1.5 : 1.0, h = big ? 0.75 : 0.7;
    D.setPart(DP.WOOD).setColor('#4a3426'); D.box(x - w / 2, y, z - w / 2, x + w / 2, y + h, z + w / 2, 63);
    D.setPart(DP.PAINT).setColor('#4a6a3c').ellipsoid([x, y + h + 0.05, z], [w * 0.5, 0.3, w * 0.5], 7, 4);
    D.setColor('#6c8a48').ellipsoid([x + 0.15, y + h + 0.18, z - 0.1], [w * 0.28, 0.22, w * 0.28], 7, 4);
    S.box(x - w / 2, y, z - w / 2, x + w / 2, y + h, z + w / 2, 'planter'); stats.planters++;
  };
  let nextLamp = 14, nextBench = 40, side = 1;
  st.forEach((s, k) => {
    if (s.asph || s.open) return;
    if (s.t >= nextLamp) { const e = side > 0 ? s.a : s.b; const [x, z] = pt(s, side, Math.max(1.4, e - SLAB - 0.4)); lamp(x, z); side = -side; nextLamp = s.t + 22 + rnd() * 6; }
    if (s.t >= nextBench) {
      const e = side > 0 ? s.a : s.b, [x, z] = pt(s, side, Math.max(1.4, e - SLAB - 1.4));
      bench(x, z, Math.atan2(s.nx * side, -s.nz * side));
      nextBench = s.t + 55 + rnd() * 25;
    }
    if (k % 5 === 2 && rnd() < 0.7) { // a planter (or two) by a front
      const sd = rnd() < 0.5 ? 1 : -1, e = sd > 0 ? s.a : s.b, [x, z] = pt(s, sd, e - 1.0); planter(x, z, rnd() < 0.4);
      if (rnd() < 0.4) { const [x2, z2] = pt({ ...s, x: s.x + s.dx * 1.4, z: s.z + s.dz * 1.4 }, sd, e - 1.0); planter(x2, z2, false); }
    }
    if (k % 9 === 4) { // a street tree in a large square planter
      const sd = k % 18 === 4 ? 1 : -1, e = sd > 0 ? s.a : s.b, [x, z] = pt(s, sd, Math.max(2.2, e - SLAB - 1.6));
      const y = g(x, z) + LIFT;
      D.setPart(DP.CONC).setColor('#8c867c'); D.box(x - 0.9, y, z - 0.9, x + 0.9, y + 0.45, z + 0.9, 63);
      D.setPart(DP.PAINT).setColor('#4b3a2c').box(x - 0.8, y + 0.4, z - 0.8, x + 0.8, y + 0.47, z + 0.8, 4);
      S.box(x - 0.9, y, z - 0.9, x + 0.9, y + 0.45, z + 0.9, 'planter');
      spots.push({ x, z, kind: 'park', variant: 'linden', sc: 0.5 + rnd() * 0.15 });
    }
  });
  return { spots, stats, st };
}

// a box with yaw about its own centre (x, y0, z), sizes w (along local x), h, d (along local z)
function boxYaw(D, x, y0, z, w, h, d, yaw) {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const P = (a, b, yy) => [x + a * c - b * s, yy, z + a * s + b * c];
  const hw = w / 2, hd = d / 2, y1 = y0 + h;
  const f = (pts, n) => D.face(pts, n);
  f([P(-hw, -hd, y1), P(hw, -hd, y1), P(hw, hd, y1), P(-hw, hd, y1)], [0, 1, 0]);
  for (const [a0, b0, a1, b1, na, nb] of [[-hw, -hd, hw, -hd, 0, -1], [hw, -hd, hw, hd, 1, 0], [hw, hd, -hw, hd, 0, 1], [-hw, hd, -hw, -hd, -1, 0]]) {
    f([P(a0, b0, y0), P(a1, b1, y0), P(a1, b1, y1), P(a0, b0, y1)], [na * c - nb * s, 0, na * s + nb * c]);
  }
}

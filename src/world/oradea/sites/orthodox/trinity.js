// OWNER: oradea. Biserica «Sfânta Treime» (Holy Trinity, Parcul Traian 13, Oradea): built from 1692 as the Roman Catholic St Bridget's,
// rebuilt 1722, Ruthenian Greek Catholic from 1786, Orthodox since 1948; a historic monument. The OSM way is the untagged building
// 423125889 (the Wikipedia coordinates fall 18 m off it). After the Commons photos «Biserica Sf. Brigita Oradea» / «Biserica Sf. Treime
// (fosta Sf. Brigitta)»: a small hall in tan rough-cast with a brown base and cream cornices, a Dutch (volute) gable on the west front
// with pylon pinnacles and a round window with a cross over the mosaic of the Holy Trinity, two arched mosaic niches with the
// apostles Peter and Paul flanking an arched double door under a small canopy, a red-tile roof, a clad wooden bell turret on the
// ridge with a silver onion, a needle and a double-bar cross, and the black iron fence along the street. A side annex on the north.
//   buildTrinity({ B, S, g, ring }) -> { footprints, stats, top }
import {
  PI, begin, end, edgeFrame, at, nrm, rect, slab, poly, archWin, archDoor, archOutline, gable, PROFILES, spire, cross, ball, rectFrames,
} from './kit.js';
import { frameOf } from './church.js';

export const TRINITY_ID = 423125889;
const C = { wall: '#cdb994', wallLo: '#8f7b62', trim: '#f2ebd6', roof: '#a34a31', tower: '#cdc5b0', silver: '#b9bec2', glass: '#232b38', door: '#a4501f', iron: '#1b1b1d', blue: '#566f98', halo: '#c9a24a', robe: '#a08a60' };

// the half profile of the Dutch gable above the cornice (x from the shoulder in, y up), mirrored about the axis
// (a Catmull-Rom curve through the key points, so the S-curves of the gable read as curves)
const smooth = (K, sub = 4) => {
  const P = [K[0], ...K, K[K.length - 1]], out = [];
  for (let i = 1; i + 2 < P.length; i++) for (let j = 0; j < sub; j++) {
    const t = j / sub, t2 = t * t, t3 = t2 * t, f = (k) => 0.5 * ((2 * P[i][k]) + (-P[i - 1][k] + P[i + 1][k]) * t + (2 * P[i - 1][k] - 5 * P[i][k] + 4 * P[i + 1][k] - P[i + 2][k]) * t2 + (-P[i - 1][k] + 3 * P[i][k] - 3 * P[i + 1][k] + P[i + 2][k]) * t3);
    out.push([f(0), f(1)]);
  }
  out.push(K[K.length - 1]);
  return out;
};
const HALF = smooth([[0, 0], [0.1, 0.45], [0.45, 0.95], [1.0, 1.25], [1.6, 1.45], [2.05, 1.85], [2.35, 2.5], [2.85, 3.2], [3.5, 3.65], [4.1, 3.9], [4.75, 4.0]]);

export function buildTrinity({ B, S, g, ring }) {
  const F = frameOf(ring), R = F.ring, toW = F.toMap, st = { windows: 0, solids: 0 };
  let hi = -1e9, lo = 1e9;
  for (const [u, v] of R.concat([[0, 0], [-10.5, 0]])) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.3, gLo = lo - 0.5, Y = (h) => Fy + h;
  const H = 6.7, ridge = 9.7;
  begin(B, F.cx, F.cz, F.yaw);
  const W = B.wall, ST = B.stone;
  // nave band: the long middle slab of the ring (v from the nave's north wall to the south wall)
  const minU = F.minU, maxU = F.maxU;
  const vt = Math.min(...R.filter((p) => p[0] < -5).map((p) => p[1])), vb = Math.max(...R.filter((p) => p[0] < -5).map((p) => p[1])), vc = (vt + vb) / 2, hw = (vb - vt) / 2;
  const edges = R.map((a, i) => edgeFrame(a, R[(i + 1) % R.length]));

  // ---- walls of the whole ring: tan above a brown base, cream cornices
  edges.forEach((f) => {
    if (f.L < 0.2) return;
    W.setColor(C.wall); rect(W, f, 0, f.L, gLo, Y(H));
    ST.setColor(C.wallLo); slab(ST, f, -0.02, f.L + 0.02, gLo, Y(1.25), 0, 0.06, 'ft');
    ST.setColor(C.trim); slab(ST, f, -0.3, f.L + 0.3, Y(H) - 0.42, Y(H) + 0.04, 0, 0.34, 'ftb'); slab(ST, f, -0.18, f.L + 0.18, Y(H) - 0.7, Y(H) - 0.46, 0, 0.12, 'f');
    const west = f.n[0] < -0.7 && f.a[0] < minU + 0.5, east = f.n[0] > 0.7;
    if (west || east || f.L < 2.4) return;
    const n = Math.max(1, Math.round((f.L - 1.0) / 3.3));
    for (let k = 0; k < n; k++) { archWin(B, f, (k + 0.5) * f.L / n, Y(1.7), 0.95, 3.5, { sur: 0.2, tcol: C.trim, gcol: C.glass, n: 4 }); st.windows++; }
  });
  const fw = edges.find((f) => f.n[0] < -0.7 && f.a[0] < minU + 0.5 && f.L > 5);
  const L = fw.L, c = L / 2;
  // ---- the west front: door, niches, mosaics
  { const f = fw;
    archDoor(B, f, c, Y(0.3), 2.0, 3.5, { col: C.door, tcol: C.trim, sur: 0.3 });
    // the canopy over the door: a light lean-to
    B.det.setColor('#e9e6dc'); poly(B.det, [at(f, c - 1.5, Y(4.2), 0.05), at(f, c + 1.5, Y(4.2), 0.05), at(f, c + 1.5, Y(3.75), 1.25), at(f, c - 1.5, Y(3.75), 1.25)], [-1, 1, 0]);
    // the niches with the apostles
    for (const [s, w] of [[1.25, 1.25], [L - 1.25, 1.25]]) {
      const O = archOutline(s, Y(1.5), w, 3.3, w / 2, 6), Q = archOutline(s, Y(1.38), w + 0.4, 3.42 + 0.2, w / 2 + 0.2, 6);
      ST.setColor(C.trim); for (let i = 0; i < O.length; i++) { const j = (i + 1) % O.length; ST.face([at(f, Q[i][0], Q[i][1], 0.07), at(f, Q[j][0], Q[j][1], 0.07), at(f, O[j][0], O[j][1], 0.07), at(f, O[i][0], O[i][1], 0.07)], nrm(f)); }
      B.det.setColor(C.blue); B.det.face(O.map(([a, b]) => at(f, a, b, 0.07)), nrm(f));
      B.det.setColor(C.robe); slab(B.det, f, s - 0.32, s + 0.32, Y(1.7), Y(3.7), 0.07, 0.1, 'f');
      B.det.setColor(C.halo); const hy = Y(4.15); B.det.face(Array.from({ length: 10 }, (_, i) => at(f, s + Math.cos(i / 10 * PI * 2) * 0.24, hy + Math.sin(i / 10 * PI * 2) * 0.24, 0.1)), nrm(f));
    }
    // the Holy Trinity mosaic in its arched frame, the round window with a cross above it
    const mw = 2.6, my = H + 0.9, O = archOutline(c, Y(my), mw, 1.9, 0.5, 6), Q = archOutline(c, Y(my - 0.12), mw + 0.34, 2.14, 0.68, 6);
    ST.setColor(C.trim); for (let i = 0; i < O.length; i++) { const j = (i + 1) % O.length; ST.face([at(f, Q[i][0], Q[i][1], 0.07), at(f, Q[j][0], Q[j][1], 0.07), at(f, O[j][0], O[j][1], 0.07), at(f, O[i][0], O[i][1], 0.07)], nrm(f)); }
    B.det.setColor('#5d79a3'); B.det.face(O.map(([a, b]) => at(f, a, b, 0.07)), nrm(f));
    B.det.setColor(C.halo); slab(B.det, f, c - 0.9, c + 0.9, Y(my + 0.3), Y(my + 1.1), 0.07, 0.1, 'f');
    B.det.setColor('#8a4a30'); slab(B.det, f, c - 0.5, c + 0.5, Y(my + 0.45), Y(my + 0.95), 0.1, 0.12, 'f');
    const ty = Y(H + 3.3), pts = (r) => Array.from({ length: 12 }, (_, i) => at(f, c + Math.cos(i / 12 * PI * 2) * r, ty + Math.sin(i / 12 * PI * 2) * r, 0.07));
    ST.setColor(C.trim); ST.face(pts(0.55), nrm(f)); B.lit.setColor(C.glass); B.lit.face(pts(0.42).map((p) => [p[0], p[1], p[2]]), nrm(f));
    ST.setColor(C.trim); slab(ST, f, c - 0.04, c + 0.04, ty - 0.38, ty + 0.38, 0.0, 0.1, 'f'); slab(ST, f, c - 0.3, c + 0.3, ty - 0.04, ty + 0.04, 0.0, 0.1, 'f');
    // the Dutch gable: a plate with the profile, a cream band along its edge, the pinnacles on the shoulders
    const sc = L / 9.5, P = [...HALF, ...HALF.slice(0, -1).reverse().map(([x, y]) => [9.5 - x, y])].map(([x, y]) => [x * sc, y]);
    W.setColor(C.wall);
    for (let i = 0; i + 1 < P.length; i++) {
      const a = P[i], b = P[i + 1];
      W.face([at(f, a[0], Y(H), 0), at(f, b[0], Y(H), 0), at(f, b[0], Y(H + b[1]), 0), at(f, a[0], Y(H + a[1]), 0)], nrm(f));
      W.face([at(f, b[0], Y(H), -0.3), at(f, a[0], Y(H), -0.3), at(f, a[0], Y(H + a[1]), -0.3), at(f, b[0], Y(H + b[1]), -0.3)], [-nrm(f)[0], 0, -nrm(f)[2]]);
    }
    ST.setColor(C.trim);
    for (let i = 0; i + 1 < P.length; i++) {
      const a = P[i], b = P[i + 1], t = 0.24;
      ST.face([at(f, a[0], Y(H + a[1] - t), 0.1), at(f, b[0], Y(H + b[1] - t), 0.1), at(f, b[0], Y(H + b[1] + 0.06), 0.1), at(f, a[0], Y(H + a[1] + 0.06), 0.1)], nrm(f));
      ST.face([at(f, a[0], Y(H + a[1] + 0.06), 0.1), at(f, b[0], Y(H + b[1] + 0.06), 0.1), at(f, b[0], Y(H + b[1] + 0.06), -0.3), at(f, a[0], Y(H + a[1] + 0.06), -0.3)], [0, 1, 0]);
    }
    for (const s of [0.02, L - 0.02]) {
      const sg = s < 1 ? 1 : -1, s0 = s - sg * 0.0;
      ST.setColor(C.trim); slab(ST, f, Math.min(s0, s0 + sg * 0.5), Math.max(s0, s0 + sg * 0.5), Y(H), Y(H + 1.15), -0.1, 0.35, 'ftlr');
      cross(B.dome, f.a[0] + f.t[0] * (s0 + sg * 0.25) + f.n[0] * 0.1, Y(H + 1.15), f.a[1] + f.t[1] * (s0 + sg * 0.25) + f.n[1] * 0.1, 0.65, '#d8d2c0');
    }
  }
  // ---- roof (tile): the nave's gable, the annex's hip
  gable(B.tile, { a0: minU + 0.05, a1: maxU, b0: vt, b1: vb, yE: Y(H), yR: Y(ridge), ridge: 'u', ov: 0.45, rake: 0.0, hip1: true, col: C.roof, G: W, gcol: C.wall });
  const annex = R.filter((p) => p[1] < vt - 1);
  if (annex.length) {
    const au0 = Math.min(...annex.map((p) => p[0])), au1 = Math.max(...annex.map((p) => p[0])), av0 = Math.min(...annex.map((p) => p[1]));
    gable(B.tile, { a0: av0 - 0.05, a1: vt + 0.2, b0: au0, b1: au1, yE: Y(H - 0.5), yR: Y(H + 1.9), ridge: 'v', ov: 0.4, rake: 0.2, col: C.roof, G: W, gcol: C.wall });
  }
  // ---- the bell turret on the ridge: clad shaft with a louvred opening on each face, a short hip, a neck, the silver onion, needle and cross
  { const tu0 = minU + 1.2, tu1 = tu0 + 2.5, tv0 = vc - 1.25, tv1 = vc + 1.25, y0 = Y(ridge) - 1.2, y1 = Y(H + 5.5);
    Object.values(rectFrames(tu0, tu1, tv0, tv1)).forEach((f) => {
      W.setColor(C.tower); rect(W, f, 0, f.L, y0, y1);
      ST.setColor(C.trim); slab(ST, f, -0.12, f.L + 0.12, y1 - 0.3, y1, 0, 0.2, 'ftb');
      B.lit.setColor('#3a2c26'); B.lit.face(Array.from({ length: 10 }, (_, i) => at(f, f.L / 2 + Math.cos(i / 10 * PI * 2) * 0.55, Y(H + 3.9) + Math.sin(i / 10 * PI * 2) * 0.55, 0.04)), nrm(f));
    });
    B.dome.setColor(C.silver); const tx = (tu0 + tu1) / 2, tz = vc;
    B.dome.cyl(tx, y1 - 0.02, tz, 1.55, 0.75, 0.55, 4, true);
    B.dome.cyl(tx, y1 + 0.5, tz, 0.55, 0.5, 0.35, 8, true);
    spire(B.dome, PROFILES.onion, 8, tx, tz, y1 + 0.82, 1.0, 1.95);
    B.dome.cyl(tx, y1 + 2.7, tz, 0.16, 0.08, 1.2, 6, true);
    ball(B.dome, tx, y1 + 3.95, tz, 0.17, C.silver); cross(B.dome, tx, y1 + 4.05, tz, 1.7, '#d4d6d8');
    var topY = y1 + 5.9;
    S.obox(...toW(tx, tz), 1.25, 1.25, F.yaw, Y(ridge) - 1, y1 + 0.8, 'tower'); st.solids++;
  }
  // ---- the iron fence along the street: posts and spears
  { const f = fw, fo = 2.1;
    B.det.setColor(C.iron);
    const posts = Math.max(2, Math.round((L + 1.5) / 2.6) + 1), s0 = -0.75, s1 = L + 0.75;
    for (let i = 0; i < posts; i++) { const s = s0 + (s1 - s0) * i / (posts - 1), p = at(f, s, Y(-0.1), fo); B.det.box(p[0] - 0.09, p[1], p[2] - 0.09, p[0] + 0.09, p[1] + 2.35, p[2] + 0.09); }
    const nb = Math.round((s1 - s0) / 0.2);
    for (let i = 0; i <= nb; i++) { const s = s0 + (s1 - s0) * i / nb, p = at(f, s, Y(-0.1), fo); B.det.box(p[0] - 0.015, p[1] + 0.1, p[2] - 0.015, p[0] + 0.015, p[1] + 2.05, p[2] + 0.015, 7); }
    for (const yy of [0.25, 1.85]) { const a = at(f, s0, Y(yy), fo), b = at(f, s1, Y(yy), fo); B.det.tube(a, b, 0.025, 4); }
    // the fence is a low wall for the car
    const [mx, mz] = toW(f.a[0] + f.t[0] * L / 2 + f.n[0] * fo, f.a[1] + f.t[1] * L / 2 + f.n[1] * fo);
    S.obox(mx, mz, 0.12, (s1 - s0) / 2, F.yaw, gLo, Y(1.9), 'fence'); st.solids++;
  }
  end(B);
  // ---- colliders
  const wr = R.map(([u, v]) => toW(u, v));
  S.prism(wr.flat(), gLo, Y(H), 0, 0, 'wall'); st.solids++;
  const k = (ridge - H) / hw, V = F.V, a0 = minU + 0.05;
  const slope = (v0, v1, sg, edgeV) => { const pts = [[a0, v0], [maxU, v0], [maxU, v1], [a0, v1]].map(([u, v]) => toW(u, v)).flat(); S.prism(pts, Y(H), Y(H) - sg * k * (edgeV + F.cx * V[0] + F.cz * V[1]), sg * k * V[0], sg * k * V[1], 'roof'); st.solids++; };
  slope(vt, vc, 1, vt); slope(vc, vb, -1, vb);
  const top = topY;
  return { footprints: [{ poly: wr, h: top - gLo, kind: 'church', name: 'Biserica Sfânta Treime', id: TRINITY_ID }], stats: st, top, F, Fy, gLo };
}

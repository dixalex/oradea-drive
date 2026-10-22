// OWNER: oradea. Piața Regele Ferdinand I, the paved square in front of the theatre, as it looks today (photos on Wikimedia
// Commons, 2021–2023): light granite setts in running bond inside darker bands, two rectangular lawn beds with ornamental
// grasses and young trees flanking a paved axis that runs up to the Szigligeti Ede monument (a stepped limestone plinth, a
// relief of a seated Thalia on the shaft, the bronze bust on top; 1912, sculptor Margó Ede) at the foot of the theatre
// steps, black cast-iron candelabra, benches with timber slats, notice boards at the wings, and, on the road side, the long
// granite-kerbed planted island (juniper) with the sandstone plinth and bronze statue of Queen Maria standing behind it.
// There is no fountain in the square today and no tram track: the OSM tram lines stop at Piața Unirii, across the river.
//   buildSquare(ctx, th) -> { spots, clear(x, z), lamps }     th: what buildTheatre returned (frame T, oFoot, ...)
import { M4 } from '../../../../kit/mesh.js';
import { SG } from '../../../cherkasy/sculpt.js';
import { box as sbox } from '../../../cherkasy/slabkit.js';
import { robed, seated, bust, place } from './kit.js';

const COL = { kerb: '#c2bdb2', plinth: '#d9d3c5', ochre: '#bd9f6c', dark: '#26282a', wood: '#8a5a34', iron: '#1f2123', leaf: '#6f8a58', dleaf: '#46603f', gold: '#e9c97a' };

// the paved area in the theatre frame (s along the front, o toward the square), clockwise from the NW corner
const PAVE = [[-5, 0.6], [45, 0.6], [45, 12], [78, 15.5], [78, 30], [65, 33.5], [50, 37.5], [40, 40.5], [30, 44.5], [20, 49], [10, 55.5], [0, 61.5], [-5, 63]];

export function buildSquare(ctx, th) {
  const { B, S, g, r, wash, stone, bronze, flood } = ctx;
  const { T } = th, W = T.W, CX = W / 2, toMap = T.toMap, yawN = -T.ang, ang = T.ang;
  const LP = 0.24, gAt = (s, o) => { const [x, z] = toMap(s, o); return g(x, z); };
  const lampsOut = [];

  // ------------------------------------------------------------------------------------------ the paving: row-scanned and draped
  {
    const P = B.pave; P.setColor('#ffffff');
    const os = PAVE.map((p) => p[1]), o0 = Math.min(...os), o1 = Math.max(...os), ROW = 4.5;
    const rows = [];
    const nR = Math.ceil((o1 - o0) / ROW);
    const span = (o) => { // the polygon's s-interval on the line o
      const xs = [];
      PAVE.forEach(([s, oo], i) => { const [s2, o2] = PAVE[(i + 1) % PAVE.length]; if ((oo - o) * (o2 - o) <= 0 && oo !== o2) xs.push(s + ((o - oo) / (o2 - oo)) * (s2 - s)); });
      return xs.length ? [Math.min(...xs), Math.max(...xs)] : null;
    };
    for (let k = 0; k <= nR; k++) { const o = o0 + 1e-3 + ((o1 - o0 - 2e-3) * k) / nR, sp = span(o); if (sp) rows.push({ o, lo: sp[0], hi: sp[1] }); }
    const nS = Math.ceil(Math.max(...rows.map((q) => q.hi - q.lo)) / ROW);
    const ids = rows.map((q) => Array.from({ length: nS + 1 }, (_, i) => { const s = q.lo + ((q.hi - q.lo) * i) / nS, [x, z] = toMap(s, q.o); return P.vert(x, g(x, z) + LP, z, 0, 1, 0, s / 5, -q.o / 5); }));
    for (let k = 0; k + 1 < rows.length; k++) for (let i = 0; i < nS; i++) { P.tri(ids[k][i], ids[k + 1][i + 1], ids[k][i + 1]); P.tri(ids[k][i], ids[k + 1][i], ids[k + 1][i + 1]); }
  }

  // ------------------------------------------------------------------------------------------ small builders
  const kerbed = (s0, s1, o0, o1, h, col, lawn) => { // a rectangular bed: granite kerb all round, soil / lawn inside
    const pts = [[s0, o0], [s1, o0], [s1, o1], [s0, o1]].map(([s, o]) => toMap(s, o));
    const hs = pts.map(([x, z]) => g(x, z)), top = Math.max(...hs) + LP + h, lo = Math.min(...hs) + LP - 0.3, k = 0.18;
    const inner = [[s0 + k, o0 + k], [s1 - k, o0 + k], [s1 - k, o1 - k], [s0 + k, o1 - k]].map(([s, o]) => toMap(s, o));
    B.stone.setColor(col); B.stone.extrude(pts, [inner], lo, top, { top: true, bottom: false, sides: true });
    B.plant.setColor(lawn); B.plant.fill(inner, [], top - 0.06, true);
    return top;
  };
  const tuft = (x, y, z, s, col) => B.plant.setColor(col).ellipsoid([x, y + s * 0.5, z], [s * 0.7, s * 0.55, s * 0.7], 5, 3);
  const lamp = (s, o, tall = false) => {
    const [x, z] = toMap(s, o), y = g(x, z) + LP;
    B.det.setColor(COL.iron);
    B.det.cyl(x, y, z, 0.17, 0.12, 0.5, 8, true).cyl(x, y + 0.5, z, 0.075, 0.055, tall ? 6.4 : 3.5, 8, true);
    B.det.cyl(x, y + (tall ? 6.9 : 4.0), z, 0.1, 0.1, 0.12, 8, true);
    if (tall) { // the swan-neck bracket of the roadside lamps: a short arm bent over the road, one lantern
      const ax = T.N[0] * 0.9, az = T.N[1] * 0.9;
      B.det.tube([x, y + 6.3, z], [x + ax * 0.6, y + 7.05, z + az * 0.6], 0.045, 6).tube([x + ax * 0.6, y + 7.05, z + az * 0.6], [x + ax * 1.4, y + 6.85, z + az * 1.4], 0.04, 6);
      B.glow.setColor('#fff1d2').ellipsoid([x + ax * 1.4, y + 6.7, z + az * 1.4], [0.2, 0.28, 0.2], 6, 4);
      B.det.cyl(x + ax * 1.4, y + 6.98, z + az * 1.4, 0.26, 0.05, 0.14, 8, true);
    } else { // a candelabra: a ring and three arms, each carrying a globe
      for (let k = 0; k < 3; k++) {
        const a = (k / 3) * Math.PI * 2 + 0.5, dx = Math.cos(a) * 0.5, dz = Math.sin(a) * 0.5;
        B.det.setColor(COL.iron).tube([x, y + 3.9, z], [x + dx * 0.9, y + 4.2, z + dz * 0.9], 0.03, 5);
        B.glow.setColor('#fff1d2').ellipsoid([x + dx, y + 4.35, z + dz], [0.16, 0.2, 0.16], 6, 4);
      }
      B.glow.ellipsoid([x, y + 4.35, z], [0.17, 0.22, 0.17], 6, 4);
    }
    S.cyl(x, z, y - 0.3, y + (tall ? 7 : 4), 0.17, 0.1, 'pole'); lampsOut.push([x, y + (tall ? 6.7 : 4.3), z]);
  };
  const bench = (s, o, faceDs, faceDo) => {
    const [x, z] = toMap(s, o), y = g(x, z) + LP, dx = T.U[0] * faceDs + T.N[0] * faceDo, dz = T.U[1] * faceDs + T.N[1] * faceDo, yaw = Math.atan2(dx, dz);
    B.det.with(M4(x, y, z, yaw), (q) => {
      q.setColor(COL.wood);
      for (let k = 0; k < 3; k++) q.box(-0.85, 0.43, -0.22 + k * 0.14, 0.85, 0.47, -0.11 + k * 0.14, 63);
      for (let k = 0; k < 3; k++) q.box(-0.85, 0.6 + k * 0.14, -0.3, 0.85, 0.71 + k * 0.14, -0.26, 63);
      q.setColor(COL.iron);
      for (const a of [-0.78, 0.78]) { q.box(a - 0.04, 0, -0.26, a + 0.04, 0.45, 0.24, 63); q.box(a - 0.04, 0.45, -0.34, a + 0.04, 1.0, -0.29, 63); q.box(a - 0.05, 0.45, 0.22, a + 0.05, 0.62, 0.3, 63); }
    });
    S.obox(x, z, 0.9, 0.34, Math.atan2(-dx, dz), y, y + 0.5, 'bench');
  };

  // ------------------------------------------------------------------------------------------ beds and the monument on the axis
  const bedTop = [];
  for (const [s0, s1] of [[0.4, 13.2], [20.2, 33.0]]) {
    bedTop.push(kerbed(s0, s1, 9.6, 15.6, 0.16, COL.kerb, '#7c9560'));
    const y = Math.max(...[[s0, 9.6], [s1, 9.6], [s0, 15.6], [s1, 15.6]].map(([s, o]) => gAt(s, o))) + LP + 0.16 - 0.06;
    for (let i = 0; i < 8; i++) for (let j = 0; j < 3; j++) { // ornamental grass tufts, pale
      const [x, z] = toMap(s0 + 1.2 + (i + 0.5 * (j & 1)) * ((s1 - s0 - 2.4) / 7.5) + (r() - 0.5) * 0.5, 10.8 + j * 2.0 + (r() - 0.5) * 0.4);
      tuft(x, y, z, 0.5 + r() * 0.2, r() < 0.5 ? '#9cb27a' : '#b3b78a');
    }
  }
  { // the Szigligeti monument: three granite steps, a stepped limestone plinth, a shaft with the seated figure in relief, the bronze bust (about 6 m)
    const [mx, mz] = toMap(CX, 12.0), y0 = Math.max(gAt(CX - 2.0, 10.0), gAt(CX + 2.0, 14.0)) + LP;
    B.stone.setColor('#cfc9bb');
    let y = y0;
    for (const [h, hw] of [[0.22, 2.0], [0.22, 1.7], [0.22, 1.4]]) { B.stone.with(M4(mx, 0, mz, yawN), (q) => q.box(-hw, y, -hw, hw, y + h, hw, 63)); y += h; }
    B.stone.setColor('#ded8c9');
    B.stone.with(M4(mx, 0, mz, yawN), (q) => {
      q.box(-1.15, y, -1.15, 1.15, y + 0.8, 1.15, 63);
      q.setColor('#ebe6da').box(-0.8, y + 0.8, -0.8, 0.8, y + 3.8, 0.8, 63);
      q.setColor('#ded8c9').box(-0.95, y + 3.8, -0.95, 0.95, y + 4.05, 0.95, 63);
    });
    place(stone, seated(new SG()), mx + T.N[0] * 0.8, y + 1.3, mz + T.N[1] * 0.8, yawN, 1.5);
    B.stone.setColor('#ded8c9').cyl(mx, y + 4.05, mz, 0.42, 0.34, 0.35, 10, true);
    place(bronze, bust(new SG()), mx, y + 4.4, mz, yawN, 1.45);
    S.obox(mx, mz, 2.0, 2.0, ang, y0 - 0.2, y + 5.2, 'monument');
    flood.push([mx + T.N[0] * 3.6 - T.U[0] * 2.4, y0 + 0.3, mz + T.N[1] * 3.6 - T.U[1] * 2.4], [mx + T.N[0] * 3.6 + T.U[0] * 2.4, y0 + 0.3, mz + T.N[1] * 3.6 + T.U[1] * 2.4]);
    wash.push(flood.at(-1));
  }
  // notice boards at the wings, shrubs by the steps, benches round the beds
  for (const s of [3.2, W - 3.2]) {
    const [x, z] = toMap(s, 3.0), y = g(x, z) + LP;
    B.det.with(M4(x, y, z, yawN), (q) => { q.setColor('#3c2a20').box(-0.7, 0.5, -0.06, 0.7, 2.1, 0.06, 63); q.setColor('#d8cfb8').box(-0.58, 0.62, 0.06, 0.58, 1.95, 0.075, 16); q.setColor(COL.iron).box(-0.7, 0, -0.04, -0.62, 0.5, 0.04, 63).box(0.62, 0, -0.04, 0.7, 0.5, 0.04, 63); });
    S.obox(x, z, 0.7, 0.1, ang, y, y + 2.1, 'sign');
  }
  for (const [s, o] of [[CX - 12.4, 9.0], [CX + 12.4, 9.0], [CX - 13.4, 6.2], [CX + 13.4, 6.2]]) {
    const [x, z] = toMap(s, o), y = g(x, z) + LP;
    B.plant.setColor(COL.dleaf).ellipsoid([x, y + 0.6, z], [1.0, 0.75, 0.9], 8, 5);
    B.plant.setColor('#557a46').ellipsoid([x + 0.5, y + 0.45, z + 0.3], [0.6, 0.5, 0.6], 7, 4);
  }
  bench(-1.6, 12.6, 1, 0); bench(W + 1.6, 12.6, -1, 0); bench(6.4, 17.4, 0, -1); bench(27.0, 17.4, 0, -1);
  bench(-1.0, 25, 1, 0); bench(W + 1.0, 25, -1, 0);
  for (const [s, o] of [[-2.2, 3.0], [W + 2.2, 3.0], [-3.0, 19], [W + 3.5, 19], [-2, 33], [41, 34], ]) lamp(s, o);

  // ------------------------------------------------------------------------------------------ the island and Queen Maria
  const C = [38, -208.5], d = [0.894, -0.447], n = [-0.447, -0.894], HL = 15.0, HW = 3.3;
  const capsule = (hl, hw, n_ = 12) => { // a stadium outline round C along d, as map points, clockwise on the map
    const out = [];
    for (let i = 0; i <= n_; i++) { const a = -Math.PI / 2 + (Math.PI * i) / n_; out.push([C[0] + d[0] * (hl - hw + Math.cos(a) * hw) + n[0] * Math.sin(a) * hw, C[1] + d[1] * (hl - hw + Math.cos(a) * hw) + n[1] * Math.sin(a) * hw]); }
    for (let i = 0; i <= n_; i++) { const a = Math.PI / 2 + (Math.PI * i) / n_; out.push([C[0] - d[0] * (hl - hw - Math.cos(a) * hw) + n[0] * Math.sin(a) * hw, C[1] - d[1] * (hl - hw - Math.cos(a) * hw) + n[1] * Math.sin(a) * hw]); }
    return out;
  };
  {
    const outer = capsule(HL, HW), inner = capsule(HL - 0.4, HW - 0.4);
    const hs = outer.map(([x, z]) => g(x, z)), top = Math.max(...hs) + LP + 0.5, lo = Math.min(...hs) - 0.3;
    B.stone.setColor(COL.kerb); B.stone.extrude(outer, [inner], lo, top, { top: true, bottom: false, sides: true });
    B.plant.setColor('#4f6b43'); B.plant.fill(inner, [], top - 0.12, true);
    for (let i = 0; i < 26; i++) { // juniper mounds
      const t = ((i % 13) + 0.5) / 13 * 2 - 1, side = i < 13 ? -0.45 : 0.45, x = C[0] + d[0] * t * (HL - 2) + n[0] * side * (HW - 1) * (1 + (r() - 0.5) * 0.4), z = C[1] + d[1] * t * (HL - 2) + n[1] * side * (HW - 1);
      B.plant.setColor(r() < 0.5 ? '#3f5b3a' : '#56734a').ellipsoid([x, top - 0.12 + 0.12, z], [1.1 + r() * 0.4, 0.34, 1.0 + r() * 0.3], 6, 3);
    }
    S.prism(outer.flat(), lo, top, 0, 0, 'ledge', 0);
    // swan-neck lamps on the island's long axis
    for (const t of [-0.62, 0, 0.62]) { const [x, z] = [C[0] + d[0] * t * HL, C[1] + d[1] * t * HL], [s, o] = T.toLocal(x, z); lamp(s, o, true); }
  }
  { // the statue of Queen Maria behind the island's north kerb: a sandstone plinth with dark panels, a bronze figure
    const P = [C[0] + n[0] * (HW + 2.8), C[1] + n[1] * (HW + 2.8)], y0 = g(P[0], P[1]) + LP, yaw = Math.atan2(-n[0], -n[1]);   // facing the road (-n)
    B.stone.setColor('#d3ccbc');
    B.stone.with(M4(P[0], 0, P[1], yaw), (q) => {
      let y = y0;
      for (const [h, hw] of [[0.2, 1.9], [0.2, 1.6]]) { q.box(-hw, y, -hw, hw, y + h, hw, 63); y += h; }
      q.setColor(COL.ochre).box(-0.95, y, -0.95, 0.95, y + 0.3, 0.95, 63);
      q.setColor('#bd9f6c').box(-0.8, y + 0.3, -0.8, 0.8, y + 2.5, 0.8, 63);
      q.setColor('#2d2a26');
      for (const [ox, oz, w, dz] of [[0, 0.805, 0.5, 0.02], [0, -0.805, 0.5, 0.02]]) q.box(ox - w, y + 0.8, oz - dz, ox + w, y + 2.0, oz + dz, 63);
      q.setColor(COL.ochre).box(-0.95, y + 2.5, -0.95, 0.95, y + 2.75, 0.95, 63);
      y += 2.75;
    });
    const yTop = y0 + 0.4 + 0.3 + 2.5 + 0.25;
    place(bronze, robed(new SG(), { crown: true, pose: 0 }), P[0], yTop, P[1], yaw, 1.5);
    S.obox(P[0], P[1], 1.9, 1.9, 0, y0 - 0.2, yTop + 2.6, 'monument');
    flood.push([P[0] + n[0] * 3.5 - d[0] * 2.4, y0 + 0.4, P[1] + n[1] * 3.5 - d[1] * 2.4], [P[0] + n[0] * 3.5 + d[0] * 2.4, y0 + 0.4, P[1] + n[1] * 3.5 + d[1] * 2.4]);
    wash.push(flood.at(-2), flood.at(-1));
  }

  const spots = [];
  for (const [s, o] of [[CX - 12.8, 10.4], [CX + 12.8, 10.4], [4.0, 10.8], [W - 4.0, 10.8]]) { const [x, z] = toMap(s, o); spots.push({ x, z, kind: 'park', variant: 'linden', sc: 0.55 }); }
  void sbox;
  return {
    spots, lamps: lampsOut,
    clear: (x, z) => { const [s, o] = T.toLocal(x, z); return s > -6 && s < 80 && o > 0 && o < 64 && inPave(s, o); },
  };
}

function inPave(s, o) { // the paved polygon plus a margin of the island strip
  let c = false;
  for (let i = 0, j = PAVE.length - 1; i < PAVE.length; j = i++) {
    const [si, oi] = PAVE[i], [sj, oj] = PAVE[j];
    if ((oi > o) !== (oj > o) && s < ((sj - si) * (o - oi)) / (oj - oi) + si) c = !c;
  }
  return c || (o > 28 && o < 66);
}

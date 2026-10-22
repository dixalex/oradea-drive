// OWNER: oradea. Facultatea de Medicină și Farmacie, Piața 1 Decembrie 10 – the former Chamber of Commerce (Palatul Camerei de
// Comerț, 1893–94, Phann and Gaál; OSM way 423119162, 3,030 m² against the 3,022 m² of the heritage record) (not a site module).
//   buildMedicine(ctx, kit) -> { res } | null
// Neo-Renaissance with Baroque touches, as the photographs show it from the tram street: an ochre-cream render, a rusticated ground
// storey of round-arched windows, a first floor of tall windows in white surrounds that alternate pediments and segmental heads, a
// string course, a cornice under a balustrade, the round corner pavilion with its copper-red onion dome and finial on the west
// corner, and a central pavilion of giant pilasters with an attic and a steep red-copper mansard roof with dormers. The west
// neighbour (way 423119164, the long wing along the same street) is a plainer block in the same colours (see data.js).
import { STYLE, LAYER } from '../../../facade.js';
import { DP } from '../../../materials.js';
import { IDS } from './data.js';
import { roofRect } from './roofs.js';
import { dormer } from './block.js';
import { dressBays, balustrade, pilasters, obox, edgeFrame } from './dress.js';
import { tint } from './util.js';
import { positive } from './geom.js';

const WALL = '#ece0b6', RUST = '#e6d8a8', TRIM = '#f4f0e4', COPPER = '#8a3a2d', COPPER2 = '#7b3228', SLATE = '#6a4339', SLATE2 = '#5e3b33';

// the street front's dressing along an edge frame: lunette-headed ground storey, first-floor windows that alternate pediments and
// segmental heads, a string course and the cornice; skip(s) leaves a stretch bare (the central pavilion has its own)
function dressFront(D, e, fl, gh, sh, He, skip) {
  dressBays(D, e, { bay: 3.9, rows: [{ y0: fl, F: gh, winW: 0.4, winH: 0.58, head: 'lunette', col: TRIM }], skip: (i, s) => skip(s) });
  dressBays(D, e, { bay: 3.9, rows: [{ y0: fl + gh, F: sh, winW: 0.42, winH: 0.62, head: 'pediment', col: TRIM }], skip: (i, s) => skip(s) || i % 2 === 1 });
  dressBays(D, e, { bay: 3.9, rows: [{ y0: fl + gh, F: sh, winW: 0.42, winH: 0.62, head: 'segment', col: TRIM }], skip: (i, s) => skip(s) || i % 2 === 0 });
  obox(D, e, 0, e.L, 0, 0.55, He - 0.62, He - 0.16, TRIM);
  obox(D, e, 0, e.L, 0, 0.3, fl + gh - 0.3, fl + gh + 0.12, TRIM);
}

export function buildMedicine(ctx, kit) {
  const { D, F, g } = ctx, got = ctx.bld(IDS.MED2);
  if (!got) return null;
  const V = got.ring, n0 = V.length;
  // ---- the ring: the west corner (vertex 0) becomes a three-facet round pavilion
  const c0 = V[0], last = V[n0 - 1], nxt = V[1], RR = 5.6;
  const uf = [last[0] - c0[0], last[1] - c0[1]], uw = [nxt[0] - c0[0], nxt[1] - c0[1]];
  const lf = Math.hypot(...uf), lw = Math.hypot(...uw);
  uf[0] /= lf; uf[1] /= lf; uw[0] /= lw; uw[1] /= lw;
  const C = [c0[0] + (uf[0] + uw[0]) * RR, c0[1] + (uf[1] + uw[1]) * RR];
  const P1 = [c0[0] + uf[0] * RR, c0[1] + uf[1] * RR], P2 = [c0[0] + uw[0] * RR, c0[1] + uw[1] * RR];
  const a1 = Math.atan2(P1[1] - C[1], P1[0] - C[0]);
  let da = Math.atan2(P2[1] - C[1], P2[0] - C[0]) - a1;
  da = ((da + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; // the short way round: the outer corner
  const arc = Array.from({ length: 4 }, (_, k) => [C[0] + Math.cos(a1 + da * k / 3) * RR, C[1] + Math.sin(a1 + da * k / 3) * RR]);
  const ring = positive([...V.slice(1), ...arc]);
  const gh = 5.6, sh = 5.8;
  const spec = {
    id: IDS.MED2, ring, name: 'Facultatea de Medicină și Farmacie', n: 2, gh, sh, wall: WALL, stone: RUST, stoneLayer: LAYER.LIME,
    bay: 3.9, winW: 0.4, winH: 0.64, gwinW: 0.38, gwinH: 0.6, lintel: 0, trim: TRIM, cornice: 0.55, gain: 1.12,
    roof: { col: SLATE, col2: SLATE2, pitch: 0.62, ov: 0, maxRise: 3.4, fascia: false, course: 1.0 }, door: null, chimneys: 2,
  };
  const res = kit.block(spec);
  if (!res) return null;
  const { fl, He, E } = res;
  const e0 = E.reduce((m, q) => (q.L > m.L ? q : m), E[0]);
  const eg = edgeFrame(e0.A, e0.B);
  const P3 = (s, o, y) => [eg.A[0] + eg.ux * s + eg.nx * o, y, eg.A[1] + eg.uz * s + eg.nz * o];

  // the pavilion spans 22 m, 32 m from the west end (A is the east end of the front)
  const sC = eg.L - 32, pav = [sC - 11, sC + 11], inPav = (s) => s > pav[0] - 1 && s < pav[1] + 1;
  dressFront(D, eg, fl, gh, sh, He, (s) => inPav(s));
  balustrade(D, eg, He - 0.16, 1.05, 0.0, TRIM, { from: 0, to: pav[0], pier: 4.5 });
  balustrade(D, eg, He - 0.16, 1.05, 0.0, TRIM, { from: pav[1], to: eg.L, pier: 4.5 });

  // ---- the west wing (way 423119164) continues the same front along the same line: the same storeys, render and dressing
  let res1 = null;
  const m1 = ctx.bld(IDS.MED1);
  if (m1) {
    res1 = kit.block({
      id: IDS.MED1, name: 'Clădirea vest a Camerei de Comerț', n: 2, gh, sh, wall: WALL, stone: RUST, stoneLayer: LAYER.LIME, bay: 3.9, winW: 0.4,
      winH: 0.64, gwinW: 0.38, gwinH: 0.6, lintel: 0, trim: TRIM, cornice: 0.55, gain: 1.12, door: null, chimneys: 1,
      roof: { col: SLATE, col2: SLATE2, pitch: 0.5, ov: 0, maxRise: 3.4, fascia: false, course: 1.0 },
    });
    if (res1) {
      const dot = (a, b) => a.ux * b.ux + a.uz * b.uz, off = (q) => Math.abs((q.A[0] - eg.A[0]) * eg.nx + (q.A[1] - eg.A[1]) * eg.nz);
      for (const q of res1.E) {
        if (q.L < 12 || dot(q, eg) < 0.985 || off(q) > 1.2) continue;
        const ef = edgeFrame(q.A, q.B);
        dressFront(D, ef, res1.fl, gh, sh, res1.He, () => false);
        balustrade(D, ef, res1.He - 0.16, 1.05, 0.0, TRIM, { pier: 4.5 });
      }
    }
  }

  // ---- the central pavilion: a 1 m projection with giant pilasters, an attic and the mansard
  const o1 = 1.0, Hatt = He + 3.4;
  const pTint = tint(WALL, 0, 1.12), gTint = tint(RUST, LAYER.LIME, 1.12);
  const wp = (s) => [eg.A[0] + eg.ux * s + eg.nx * o1, eg.A[1] + eg.uz * s + eg.nz * o1];
  const [fa, fb] = [wp(pav[0]), wp(pav[1])];
  const ydn = Math.min(g(fa[0], fa[1]), g(fb[0], fb[1])) - 0.6;
  const mk = (extra) => ({ bayW: 5.5, winW: 0.42, winH: 0.66, plinth: 0, depth: 0.25, lintel: 0, seed: 77, ...extra });
  // F.wall runs a -> b with the outward normal (dz, -dx); the edge frame runs east to west, so the pavilion's front runs from pav[1] to pav[0]
  F.wall(fb[0], fb[1], fa[0], fa[1], ydn, fl, mk({ floorH: 10, layer: LAYER.LIME, base: LAYER.LIME, tint: gTint, baseY: ydn, topY: fl }), STYLE.BLANK, -10);
  F.wall(fb[0], fb[1], fa[0], fa[1], fl, fl + gh, mk({ floorH: gh, winH: 0.58, layer: LAYER.LIME, base: LAYER.LIME, tint: gTint, baseY: fl, topY: fl + gh }), STYLE.PUNCHED, -gh);
  F.wall(fb[0], fb[1], fa[0], fa[1], fl + gh, Hatt, mk({ floorH: sh, layer: LAYER.STUCCO, base: LAYER.STUCCO, tint: pTint, baseY: fl + gh, topY: Hatt }), STYLE.PUNCHED, -sh);
  for (const s of pav) { // the two returns, 1 m deep
    const a = [eg.A[0] + eg.ux * s, eg.A[1] + eg.uz * s], b = wp(s), out = s === pav[0] ? [b, a] : [a, b];
    F.wall(out[0][0], out[0][1], out[1][0], out[1][1], ydn, Hatt, mk({ floorH: 12, layer: LAYER.STUCCO, base: LAYER.STUCCO, tint: pTint, baseY: ydn, topY: Hatt }), STYLE.BLANK, -12);
  }
  const eP = edgeFrame([eg.A[0] + eg.nx * o1, eg.A[1] + eg.nz * o1], [eg.B[0] + eg.nx * o1, eg.B[1] + eg.nz * o1]);
  const bx = pav[0] + 0.5, step = (pav[1] - pav[0] - 1) / 4;
  pilasters(D, eP, { s: [0, 1, 2, 3, 4].map((k) => bx + k * step), w: 0.9, o: 0.28, y0: fl + 0.2, y1: He + 0.1, col: TRIM, cap: '#e6dfcc' });
  obox(D, eP, pav[0], pav[1], 0, 0.5, He - 0.6, He + 0.1, TRIM);
  obox(D, eP, pav[0], pav[1], 0, 0.3, fl + gh - 0.3, fl + gh + 0.12, TRIM);
  const Q = (s, o, y) => [eP.A[0] + eP.ux * s + eP.nx * o, y, eP.A[1] + eP.uz * s + eP.nz * o];
  for (let k = 0; k < 4; k++) { // round attic windows between the pilasters
    const s = bx + (k + 0.5) * step, rr = 0.72, pts = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return Q(s + Math.cos(a) * rr, 0.06, He + 1.9 + Math.sin(a) * rr); });
    D.setPart(DP.GLASS).setColor('#232b30').face(pts, [eP.nx, 0, eP.nz]);
  }
  // the door: a portal with a stepped surround
  const sd = sC, dw2 = 1.5;
  D.setPart(DP.WOOD).setColor('#4a3426').face([Q(sd - dw2, 0.07, fl), Q(sd + dw2, 0.07, fl), Q(sd + dw2, 0.07, fl + 3.4), Q(sd - dw2, 0.07, fl + 3.4)], [eP.nx, 0, eP.nz]);
  obox(D, eP, sd - dw2 - 0.4, sd + dw2 + 0.4, 0, 0.3, fl + 3.4, fl + 3.8, TRIM);
  for (const sg of [-1, 1]) obox(D, eP, sd + sg * (dw2 + 0.3) - 0.25, sd + sg * (dw2 + 0.3) + 0.25, 0, 0.25, fl, fl + 3.8, TRIM);
  obox(D, eP, sd - 3.0, sd + 3.0, 0, 1.6, fl - 0.1, fl + 0.2, '#b9b2a2', DP.CONC);
  // the mansard: ridge parallel to the front, 6.5 m behind it; dormers on the front slope
  const pc = [eg.A[0] + eg.ux * sC - eg.nx * 6.5, eg.A[1] + eg.uz * sC - eg.nz * 6.5];
  const yR = roofRect(D, { cx: pc[0], cz: pc[1], ux: eg.ux, uz: eg.uz, hl: 11.6, hw: 7.8 }, Hatt, { pitch: 0.85, ov: 0.35, maxRise: 6.2, col: COPPER, col2: COPPER2, course: 1.05, fascia: false });
  const slope = 6.2 / 7.8;
  for (const k of [-2, -0.7, 0.7, 2]) {
    const s = sC + k * 4.4, q = 2.5, x = eg.A[0] + eg.ux * s + eg.nx * (o1 - q), z = eg.A[1] + eg.uz * s + eg.nz * (o1 - q);
    dormer(D, x, Hatt + slope * q - 0.5, z, eg.nx, eg.nz, { w: 0.95, h: 1.0, col: '#6f5448', roof: COPPER2, glass: '#222a30', drop: slope });
  }
  D.setPart(DP.PAINT).setColor('#2e2c2a').cyl(pc[0], yR, pc[1], 0.14, 0.14, 1.0, 5, true);

  // ---- the round corner pavilion: balustrade and the copper onion dome with its lantern and spire
  for (let k = 0; k < 3; k++) {
    const a = arc[k], b = arc[k + 1], ea = edgeFrame(a, b);
    balustrade(D, ea, He - 0.16, 1.05, 0.0, TRIM, { pier: 3.2 });
  }
  const yD = He + 0.9;
  D.setPart(DP.PAINT).setColor(COPPER).lathe([[RR + 0.15, yD - 0.4], [RR + 0.05, yD + 0.2], [RR - 0.6, yD + 1.6], [RR - 1.6, yD + 3.4], [RR - 2.9, yD + 5.1], [RR - 3.9, yD + 6.2], [RR - 4.45, yD + 6.9], [RR - 4.7, yD + 7.5], [RR - 4.45, yD + 7.9], [RR - 4.8, yD + 8.5], [RR - 5.0, yD + 10.0]], 14, C[0], C[1]);
  D.setColor('#2f2c29').cyl(C[0], yD + 9.9, C[1], 0.07, 0.07, 3.2, 5, true);
  D.setColor('#d4b45a').cyl(C[0], yD + 11.2, C[1], 0.2, 0.2, 0.34, 6, true);
  for (let k = 0; k < 4; k++) { // oval dormers on the dome
    const a = (k / 4) * Math.PI * 2 + 0.4, r = RR - 1.0;
    dormer(D, C[0] + Math.cos(a) * r, yD + 1.5, C[1] + Math.sin(a) * r, Math.cos(a), Math.sin(a), { w: 0.7, h: 0.8, col: '#6f5448', roof: COPPER2, glass: '#232b30', drop: 1.4 });
  }
  return { res, res1 };
}

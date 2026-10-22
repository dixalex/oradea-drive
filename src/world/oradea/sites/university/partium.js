// OWNER: oradea. Universitatea Creștină Partium (not a site module).
//   buildPartium(ctx, kit) -> { res, skip }
//   – the historic seat, Str. Primăriei 27 (the «Sulyok» building, OSM way 6482683 round its courtyard; Bolyai's plaque): a Secession row
//     of four fronts on the tram street – a big white block with a tripartite round window in a segmental gable and a stone portal, a
//     white block with a rounded gable and a fan window, a green-rendered block, and a narrow white bay with a small fan gable;
//   – the Arany János Kollégium, Str. Primăriei 36 (OSM way 439861563): the 1990s faux half-timbered hall of residence – pale-green
//     render under cream, red mansard roofs with dormers, dark-brown half-timbered balconies, the three-language lettering.
// Both from the university's and Wikimedia Commons photographs; the facades' bay counts are read off them, the courtyard side is plain.
import { STYLE, LAYER } from '../../../facade.js';
import { DP } from '../../../materials.js';
import { IDS } from './data.js';
import { edgeFrame, obox } from './dress.js';
import { textOnEdge } from './letters.js';
import { tint } from './util.js';
import { positive } from './geom.js';
import { area2 } from '../../../cherkasy/geo.js';

const WHITE = '#f1efe8', GREEN = '#b8cfa2', STONE = '#a9a496', TILE = '#9c4a36', TILE2 = '#8d4130', BROWN = '#4d3326';

// a gable rising over the wall top: polygon in the facade shader's wall, parabola top
function gable(ctx, ef, s0, s1, y0, rise, col, o = {}) {
  const { F, D } = ctx, w = s1 - s0, sm = (s0 + s1) / 2, n = 10, side = o.side ?? 0.5;
  const P = (s, y) => [ef.A[0] + ef.ux * s, y, ef.A[1] + ef.uz * s];
  const pts = [P(s0, y0), P(s1, y0)];
  for (let i = 0; i <= n; i++) { const t = 1 - (2 * i) / n; pts.push(P(sm + (t * w) / 2, y0 + side + rise * (1 - t * t))); }
  F.poly(pts, [ef.nx, 0, ef.nz], { floorH: 12, bayW: 3, layer: LAYER.STUCCO, base: LAYER.STUCCO, tint: tint(col, 0, 1.12), plinth: 0, seed: o.seed ?? 5 });
  // the stucco coping: a thin white band following the top
  D.setPart(DP.PAINT).setColor('#ece8dd');
  for (let i = 0; i < n; i++) {
    const a = pts[2 + i], b = pts[3 + i], up = (q) => [q[0] + ef.nx * 0.14, q[1], q[2] + ef.nz * 0.14];
    D.face([a, b, [b[0], b[1] + 0.22, b[2]], [a[0], a[1] + 0.22, a[2]]], [ef.nx, 0, ef.nz]);
    D.face([[a[0], a[1] + 0.22, a[2]], [b[0], b[1] + 0.22, b[2]], up([b[0], b[1] + 0.22, b[2]]), up([a[0], a[1] + 0.22, a[2]])], [0, 1, 0]);
  }
}

// a half-round (fan) window in the plane of the wall: glass, a white frame, mullions radiating from the centre
function fan(ctx, ef, s, y, r, o = {}) {
  const { D } = ctx, k = o.spokes ?? 5, P = (ss, yy, off) => [ef.A[0] + ef.ux * ss + ef.nx * off, yy, ef.A[1] + ef.uz * ss + ef.nz * off];
  const arc = (rr, off) => Array.from({ length: 13 }, (_, i) => { const a = Math.PI * i / 12; return P(s + Math.cos(a) * rr, y + Math.sin(a) * rr, off); });
  D.setPart(DP.PAINT).setColor('#f4f1e8').face(arc(r + 0.14, 0.05), [ef.nx, 0, ef.nz]);
  D.setPart(DP.GLASS).setColor('#25303a').face(arc(r, 0.08), [ef.nx, 0, ef.nz]);
  D.setPart(DP.PAINT).setColor('#f4f1e8');
  for (let i = 0; i <= k; i++) {
    const a = Math.PI * i / k, c = Math.cos(a), sn = Math.sin(a), w = 0.045;
    D.face([P(s - sn * w, y + c * 0 + 0.0, 0.1), P(s + sn * w, y, 0.1), P(s + Math.cos(a) * r + sn * w, y + Math.sin(a) * r, 0.1), P(s + Math.cos(a) * r - sn * w, y + Math.sin(a) * r, 0.1)], [ef.nx, 0, ef.nz]);
  }
  obox(D, ef, s - r - 0.14, s + r + 0.14, 0, 0.1, y - 0.1, y + 0.02, '#f4f1e8');
}

function sulyok(ctx, kit) {
  const { D, g } = ctx, got = ctx.bld(IDS.PARTIUM);
  if (!got) return null;
  const R = got.ring.map((p) => p.slice());
  // the street front: vertex 3 -> 4 (the long edge toward Str. Primăriei); split it where the four fronts meet
  const A = R[3], B = R[4], L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L;
  const cuts = [12, 22, 31];
  R.splice(4, 0, ...cuts.map((c) => [A[0] + ux * c, A[1] + uz * c]));
  const cen = R.reduce((q, p) => [q[0] + p[0] / R.length, q[1] + p[1] / R.length], [0, 0]);
  // the frame in which (uz, -ux) points away from the building
  const flip = (uz * (cen[0] - A[0]) - ux * (cen[1] - A[1])) > 0;
  const P0 = flip ? B : A, Q0 = flip ? A : B, ef = edgeFrame(P0, Q0);
  const sOf = (sa) => (flip ? L - sa : sa);
  const segs = [[0, 12, WHITE], [12, 22, WHITE], [22, 31, GREEN], [31, L, WHITE]];
  const colAt = (sa) => segs.find((q) => sa >= q[0] - 1e-6 && sa <= q[1] + 1e-6)?.[2] ?? WHITE;
  const onFront = (e) => { const dx = e.mx - A[0], dz = e.mz - A[1], d = Math.abs(-uz * dx + ux * dz), t = dx * ux + dz * uz; return d < 0.4 && t > 0 && t < L; };
  const spec = {
    id: IDS.PARTIUM, ring: R, keepCollinear: true, name: 'Partium – clădirea veche', n: 3, gh: 4.0, sh: 3.8, wall: WHITE, stone: null, plinth: 1.3, baseLayer: LAYER.CONCRETE,
    bay: 2.9, winW: 0.46, winH: 0.58, gwinH: 0.5, lintel: 1, trim: '#efebe0', cornice: 0.5, door: null, chimneys: 2, gain: 1.12,
    roof: { col: TILE, col2: TILE2, pitch: 0.55, ov: 0.5, maxRise: 4.2 },
    edgeWall: (e) => (onFront(e) ? colAt(Math.hypot(e.mx - A[0], e.mz - A[1])) : null),
  };
  const res = kit.block(spec);
  if (!res) return null;
  const { fl, He } = res, Y0 = He - 0.1;
  // fronts: big block, rounded gable block, narrow bay
  gable(ctx, ef, ...[sOf(0), sOf(12)].sort((a, b) => a - b), Y0, 3.3, WHITE, { seed: 3 });
  gable(ctx, ef, ...[sOf(12), sOf(22)].sort((a, b) => a - b), Y0, 2.7, WHITE, { seed: 4 });
  gable(ctx, ef, ...[sOf(31), sOf(L)].sort((a, b) => a - b), Y0, 2.0, WHITE, { seed: 6 });
  fan(ctx, ef, (sOf(0) + sOf(12)) / 2, Y0 + 0.9, 2.5, { spokes: 6 });
  fan(ctx, ef, (sOf(12) + sOf(22)) / 2, Y0 + 0.8, 1.7, { spokes: 5 });
  fan(ctx, ef, (sOf(31) + sOf(L)) / 2, Y0 + 0.7, 1.05, { spokes: 4 });
  // the stone portal of the big block
  const sd = sOf(6);
  const Q = (s, o, y) => [ef.A[0] + ef.ux * s + ef.nx * o, y, ef.A[1] + ef.uz * s + ef.nz * o];
  obox(D, ef, sd - 2.1, sd + 2.1, 0, 0.35, fl - 0.1, fl + 0.18, STONE, DP.CONC);
  for (const sg of [-1, 1]) obox(D, ef, sd + sg * 1.5 - 0.3, sd + sg * 1.5 + 0.3, 0, 0.3, fl, fl + 3.2, STONE, DP.CONC);
  obox(D, ef, sd - 1.9, sd + 1.9, 0, 0.35, fl + 3.2, fl + 3.55, STONE, DP.CONC);
  D.setPart(DP.WOOD).setColor('#3f2d20').face([Q(sd - 1.15, 0.06, fl + 0.18), Q(sd + 1.15, 0.06, fl + 0.18), Q(sd + 1.15, 0.06, fl + 3.05), Q(sd - 1.15, 0.06, fl + 3.05)], [ef.nx, 0, ef.nz]);
  // the stone base under the green and white fronts
  obox(D, ef, 0, L, 0, 0.1, fl, fl + 1.3, '#a8a395', DP.CONC, 0b000001);
  return { res, g };
}

function arany(ctx, kit) {
  const { D } = ctx, got = ctx.bld(IDS.ARANY);
  if (!got) return null;
  const spec = {
    id: IDS.ARANY, name: 'Căminul Arany János Kollégium', n: 4, gh: 3.9, sh: 3.4, wall: '#cfdcbd', stone: null, plinth: 0.9, baseLayer: LAYER.CONCRETE, bay: 3.0, winW: 0.4, winH: 0.58,
    trim: '#f1ede2', cornice: 0.3, belt: false, door: null, chimneys: 1, gain: 1.1, dormers: { step: 4.2, w: 1.3, h: 1.1, col: '#f1ede2', roof: '#8a4333' },
    roof: { col: '#a2493a', col2: '#933f31', pitch: 1.05, maxRise: 3.8, ov: 0.9, fascia: true },
  };
  const res = kit.block(spec);
  if (!res) return null;
  const { fl, He, E } = res;
  // half-timbered balconies: dark-brown rails and brackets along the longest front, two levels
  const e0 = E.reduce((m, q) => (q.L > m.L ? q : m), E[0]), ef = edgeFrame(e0.A, e0.B);
  const Q = (s, o, y) => [ef.A[0] + ef.ux * s + ef.nx * o, y, ef.A[1] + ef.uz * s + ef.nz * o];
  for (const [s0, s1, y] of [[ef.L * 0.3, ef.L * 0.7, fl + 3.9 + 3.4 * 1], [ef.L * 0.3, ef.L * 0.7, fl + 3.9 + 3.4 * 2]]) {
    obox(D, ef, s0, s1, 0, 1.2, y - 0.16, y, '#cfc8b8', DP.CONC);
    obox(D, ef, s0, s1, 1.1, 1.2, y, y + 0.1, BROWN, DP.WOOD, 0b000011);
    obox(D, ef, s0, s1, 1.1, 1.14, y + 0.9, y + 1.0, BROWN, DP.WOOD, 0b000011);
    const k = Math.round((s1 - s0) / 0.9);
    for (let i = 0; i <= k; i++) { const s = s0 + ((s1 - s0) * i) / k; obox(D, ef, s - 0.04, s + 0.04, 1.1, 1.16, y, y + 1.0, BROWN, DP.WOOD, 0b000001); }
    for (let i = 0; i < k; i++) { const sa = s0 + ((s1 - s0) * i) / k, sb = s0 + ((s1 - s0) * (i + 1)) / k; D.setPart(DP.WOOD).setColor(BROWN).tube(Q(sa, 1.17, i % 2 ? y + 0.95 : y + 0.1), Q(sb, 1.17, i % 2 ? y + 0.1 : y + 0.95), 0.03, 4); }
  }
  textOnEdge(D, ef, ef.L * 0.82, fl + 7.9, ['PARTIUMI', 'KERESZTÉNY EGYETEM', 'UNIVERSITATEA', 'CREȘTINA PARTIUM', 'CĂMINUL', 'ARANY JÁNOS KOLLÉGIUM'], { h: 0.26, lead: 0.5, col: '#4a3626', o: 0.04 });
  void He;
  return { res };
}

export function buildPartium(ctx, kit) {
  const out = { res: {}, skip: [] };
  const a = sulyok(ctx, kit); if (a) { out.res.sulyok = a.res; out.skip.push(IDS.PARTIUM); }
  const b = arany(ctx, kit); if (b) { out.res.arany = b.res; out.skip.push(IDS.ARANY); }
  void positive; void area2; void STYLE;
  return out;
}

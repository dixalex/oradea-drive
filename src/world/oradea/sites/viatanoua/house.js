// OWNER: oradea. The house of the Viața Nouă church and BCUO, Strada Nicolae Jiga 25, Oradea (OSM way 420863618): the geometry. Not a
// site module; ../viatanoua.js builds the materials, the colliders and the yard around it.
// Plan frame (local X along the street front from the west corner, Y up from the floor line, Z out toward the street; Z < 0 is
// inside): FR gives the map frame, toWorld(lx, lz) -> [x, z]. Everything below is emitted in that frame; the caller sets the
// builders' transform to M4(O.x, yF, O.z, FR.th).
//   front range  X 0..WF, depth 0..D1 (12 m): the one-storey 1900s street house with four arched windows in two pairs, a raised
//                brick plinth, cream render and ochre piers, a sawtooth band, a frieze with four round vents, a dentil cornice, and a
//                brick-gabled tiled roof (ridge along the street, 36 degrees) with the 7 x 3 solar array on the street slope;
//   rear wing    X 1.25..WF, depth D1..D2: a lower tiled gable roof along the depth, an entrance on the east wall (steps, canopy, lamp);
//   gate         the pedestrian leaf, two brick piers and the wide iron gate east of the front, a stretch of the neighbour's pink wall.
//   buildHouse(B) -> { stats }   B = { wall, brick, roof, det, lit, sign } builders (MB)
//   buildGate(B)  -> { solids: [{ cx, cz, hx, hz, y1 }] }  the gate group, its colliders in the local frame
import { quad } from '../../../cherkasy/slabkit.js';
import { tri, arch } from './kit.js';

// ---- the frame: the OSM front wall, west corner -> east corner
const O = [-50.1, -1070.0], E = [-39.3, -1069.8], LEN = Math.hypot(E[0] - O[0], E[1] - O[1]);
const ux = (E[0] - O[0]) / LEN, uz = (E[1] - O[1]) / LEN;
export const FR = { O, ux, uz, th: -Math.atan2(uz, ux), ang: Math.atan2(uz, ux) };
export const toWorld = (lx, lz) => [O[0] + lx * ux - lz * uz, O[1] + lx * uz + lz * ux];

export const WF = 10.8, D1 = 12.0, D2 = 23.3, WX0 = 1.25;
export const H_EAVE = 5.45, H_RIDGE = 10.1, WING_EAVE = 4.0, WING_RIDGE = 7.34;
export const OSM_RING = [[-49.8, -1082.1], [-48.9, -1088], [-47, -1087.9], [-46.9, -1089.7], [-48.7, -1089.8], [-48.5, -1093.6], [-39, -1092.9], [-40.1, -1082.7], [-38.6, -1081.5], [-39.3, -1069.8], [-50.1, -1070]];

const C = {
  cream: '#f8eec6', lite: '#faf2d2', ochre: '#b7a47e', hood: '#a98d62', sill: '#cdbd96', belt: '#a89f8f', brown: '#4a301f',
  brick: '#f3ece6', east: '#e4d8ac', glass: '#2e3a43', curtain: '#d9caa6', zinc: '#7c7f80', pipe: '#4a3a2e', white: '#ece9e0',
  tile: '#775148', tileBack: '#6f4b42', solar: '#1f2733', solarLine: '#454d5a', iron: '#18191b', pink: '#c8aab3', cap: '#b8b2a5',
};
const N = { px: [1, 0, 0], nx: [-1, 0, 0], py: [0, 1, 0], pz: [0, 0, 1], nz: [0, 0, -1] };
// a face of a plane Z = z (front), X = x (side): uv in metres
const frontQ = (D, x0, y0, x1, y1, z, n = N.pz) => quad(D, [x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], n, [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]);
const sideQ = (D, x, y0, y1, z0, z1, n) => quad(D, [x, y0, z0], [x, y0, z1], [x, y1, z1], [x, y1, z0], n, [[z0, y0], [z1, y0], [z1, y1], [z0, y1]]);
const disc = (D, cx, cy, z, r, n = 10) => { for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2; tri(D, [cx, cy, z], [cx + Math.cos(a) * r, cy + Math.sin(a) * r, z], [cx + Math.cos(b) * r, cy + Math.sin(b) * r, z], N.pz); } };

// ------------------------------------------------------------------------------------------------ the front range
const WIN = { w: 1.0, sill: 1.6, spring: 3.0, n: 8, dep: 0.22 };
const ZONES = [[1.2, 5.15, [2.05, 4.3]], [5.65, 9.6, [6.5, 8.75]]]; // the two window pairs: the raised cream panels and their window centres
const Y0 = 1.0, Y1 = 4.55; // the belt's top, the frieze's foot

function window4(B, cx) {
  const { wall, det, lit } = B, { w, sill, spring, n, dep } = WIN, r = w / 2, wl = cx - r, wr = cx + r;
  const arc = arch(cx, spring, r, n);
  // reveals: jambs, the arch soffit, the stone sill inside
  wall.setColor(C.cream);
  sideQ(wall, wl, sill, spring, 0, -dep, N.px); sideQ(wall, wr, sill, spring, 0, -dep, N.nx);
  for (let i = 0; i < n; i++) {
    const p = arc[i], q = arc[i + 1], mx = (p[0] + q[0]) / 2 - cx, my = (p[1] + q[1]) / 2 - spring, l = Math.hypot(mx, my);
    quad(wall, [p[0], p[1], 0], [q[0], q[1], 0], [q[0], q[1], -dep], [p[0], p[1], -dep], [-mx / l, -my / l, 0], [[p[0], 0], [q[0], 0], [q[0], -dep], [p[0], -dep]]);
  }
  det.setColor(C.sill); quad(det, [wl, sill, 0], [wr, sill, 0], [wr, sill, -dep], [wl, sill, -dep], N.py);
  // the timber frame (a dark ring and sash bars) and the glass behind it
  const f = 0.075, zf = -dep + 0.05, zg = -dep + 0.02, inner = arch(cx, spring, r - f, n);
  det.setColor(C.brown);
  for (let i = 0; i < n; i++) quad(det, [arc[i][0], arc[i][1], zf], [arc[i + 1][0], arc[i + 1][1], zf], [inner[i + 1][0], inner[i + 1][1], zf], [inner[i][0], inner[i][1], zf], N.pz);
  frontQ(det, wl, sill, wl + f, spring, zf); frontQ(det, wr - f, sill, wr, spring, zf);
  frontQ(det, wl + f, sill, wr - f, sill + 0.09, zf);
  frontQ(det, wl + f, spring - 0.03, wr - f, spring + 0.03, zf);
  frontQ(det, cx - 0.02, sill + 0.09, cx + 0.02, spring - 0.03, zf); // the sash's centre bar
  // glass: the curtain below, dark glass above it, the fanlight in the arch
  lit.setColor(C.curtain); frontQ(lit, wl + f, sill + 0.09, wr - f, 2.5, zg);
  lit.setColor(C.glass); frontQ(lit, wl + f, 2.5, wr - f, spring - 0.03, zg);
  for (let i = 0; i < n; i++) quad(lit, [inner[i][0], spring + 0.03, zg], [inner[i + 1][0], spring + 0.03, zg], [inner[i + 1][0], inner[i + 1][1], zg], [inner[i][0], inner[i][1], zg], N.pz);
  // the hood: an ochre band round the arch and down both jambs, a keystone, the stone sill, the dado panel, the tablet
  const hw = 0.14, zh = 0.05, outer = arch(cx, spring, r + hw, n);
  det.setColor(C.hood);
  for (let i = 0; i < n; i++) {
    quad(det, [arc[i][0], arc[i][1], zh], [arc[i + 1][0], arc[i + 1][1], zh], [outer[i + 1][0], outer[i + 1][1], zh], [outer[i][0], outer[i][1], zh], N.pz);
    const p = outer[i], q = outer[i + 1], mx = (p[0] + q[0]) / 2 - cx, my = (p[1] + q[1]) / 2 - spring, l = Math.hypot(mx, my);
    quad(det, [p[0], p[1], 0], [q[0], q[1], 0], [q[0], q[1], zh], [p[0], p[1], zh], [mx / l, my / l, 0]);
  }
  for (const [a, b, nn] of [[wl - hw, wl, N.nx], [wr, wr + hw, N.px]]) {
    frontQ(det, a, sill + 0.05, b, spring, zh);
    sideQ(det, nn === N.nx ? a : b, sill + 0.05, spring, 0, zh, nn);
  }
  det.box(cx - 0.12, spring + r + 0.02, 0, cx + 0.12, spring + r + hw + 0.17, 0.075, 16 | 1 | 2 | 4);
  det.setColor(C.sill); det.box(cx - 0.66, sill - 0.1, 0, cx + 0.66, sill, 0.13, 63 & ~32 & ~8);
  det.box(cx - 0.5, sill - 0.2, 0, cx + 0.5, sill - 0.1, 0.07, 16 | 8);
  wall.setColor(C.lite);
  wall.box(cx - 0.42, 1.12, 0, cx + 0.42, 1.5, 0.035, 16 | 1 | 2 | 4); // the dado panel under the sill
  wall.box(cx - 0.75, 3.95, 0, cx + 0.75, 4.42, 0.045, 16 | 1 | 2 | 4 | 8); // the tablet over the window
}

export function buildHouse(B) {
  const { wall, brick, roof, det, lit, sign } = B;
  const { w, sill, spring, n } = WIN, r = w / 2;

  // ---- front: plinth, belt, wall zones, piers
  brick.setColor('#e0cbbb'); brick.box(0, -0.5, 0, WF, 0.85, 0.03, 16 | 4);
  wall.setColor(C.belt); wall.box(0, 0.85, 0, WF, 1.0, 0.07, 16 | 4 | 8);
  det.setColor('#8d9195'); det.box(0.45, 0.12, 0.03, 1.75, 0.76, 0.055, 16); det.setColor('#6e7276'); det.box(1.08, 0.12, 0.055, 1.12, 0.76, 0.06, 16);
  det.setColor('#8d9195'); det.box(9.95, 1.2, -0.05, 10.3, 1.72, 0, 16); // the meter box on the east pier
  det.setColor('#2f64a8'); frontQ(det, 10.42, 2.1, 10.64, 2.25, -0.035); det.setColor('#f4f1ea'); frontQ(det, 10.47, 2.15, 10.59, 2.2, -0.03); // the address plate
  const archY = (cx, x) => spring + Math.sqrt(Math.max(0, r * r - (x - cx) ** 2));
  for (const [xa, xb, wins] of ZONES) {
    const xs = new Set([xa, xb]);
    for (const cx of wins) for (const [x] of arch(cx, spring, r, n)) xs.add(+x.toFixed(5));
    const X = [...xs].sort((a, b) => a - b);
    wall.setColor(C.cream);
    for (let i = 0; i < X.length - 1; i++) {
      const xl = X[i], xr = X[i + 1], win = wins.find((cx) => (xl + xr) / 2 > cx - r && (xl + xr) / 2 < cx + r);
      if (win === undefined) frontQ(wall, xl, Y0, xr, Y1, 0);
      else {
        frontQ(wall, xl, Y0, xr, sill, 0);
        const yl = archY(win, xl), yr = archY(win, xr);
        quad(wall, [xl, yl, 0], [xr, yr, 0], [xr, Y1, 0], [xl, Y1, 0], N.pz, [[xl, yl], [xr, yr], [xr, Y1], [xl, Y1]]);
      }
    }
    sideQ(wall, xa, Y0, Y1, -0.05, 0, N.nx); sideQ(wall, xb, Y0, Y1, -0.05, 0, N.px);
    for (const cx of wins) window4(B, cx);
    // the sawtooth band over the pair
    det.setColor(C.hood);
    const nt = Math.round((xb - xa) / 0.22), pt = (xb - xa) / nt;
    frontQ(det, xa, Y1, xb, Y1 + 0.07, 0.05);
    for (let i = 0; i < nt; i++) tri(det, [xa + i * pt, Y1 + 0.07, 0.05], [xa + (i + 1) * pt, Y1 + 0.07, 0.05], [xa + (i + 0.5) * pt, Y1 + 0.31, 0.05], N.pz);
    // an air-conditioner between the two windows of the pair
    const mid = (wins[0] + wins[1]) / 2;
    det.setColor('#e8eaeb'); det.box(mid - 0.42, 2.78, 0.0, mid + 0.42, 3.1, 0.26, 63 & ~32);
    det.setColor('#c4c8cb'); det.box(mid - 0.36, 2.84, 0.26, mid + 0.36, 2.88, 0.265, 16);
    // the round vents in the frieze, above each window
    det.setColor('#2b2520'); for (const cx of wins) disc(det, cx, 5.0, 0.046, 0.09);
  }
  wall.setColor(C.ochre); // the piers sit 5 cm behind the cream panels
  for (const [a, b] of [[0, 1.2], [5.15, 5.65], [9.6, WF]]) frontQ(wall, a, Y0, b, Y1, -0.05);
  // the frieze across the whole front, the dentils, the crown
  wall.setColor(C.lite); wall.box(0, Y1, 0, WF, 5.25, 0.04, 16 | 8);
  wall.setColor(C.lite);
  for (let i = 0; i < 49; i++) { const x = 0.11 + i * 0.22; wall.box(x, 5.25, 0.04, x + 0.11, 5.35, 0.1, 16 | 8); }
  wall.box(-0.05, 5.35, 0, WF + 0.05, H_EAVE + 0.01, 0.3, 63 & ~32 & ~4);
  // the gutter along the front eave and the downpipe on the west party wall
  det.setColor(C.zinc); det.tube([-0.1, 5.46, 0.43], [WF + 0.12, 5.46, 0.43], 0.065, 6);
  det.setColor(C.pipe); det.tube([0.08, 0.0, 0.2], [0.08, 5.4, 0.2], 0.045, 6); det.tube([WF - 0.07, 0.9, 0.12], [WF - 0.07, 5.4, 0.12], 0.04, 6);
  det.setColor('#d6b03c'); det.tube([-0.2, -0.3, 0.1], [-0.2, 1.9, 0.1], 0.03, 5);

  // the name plate on the east pier (the real facade carries none: an addition, see viatanoua.js NAMEPLATE)
  if (sign) { sign.setColor('#ffffff'); quad(sign, [9.66, 2.45, -0.03], [10.56, 2.45, -0.03], [10.56, 2.73, -0.03], [9.66, 2.73, -0.03], N.pz, [[0, 0], [1, 0], [1, 1], [0, 1]]); }

  // ---- the side walls and the gables of the front range
  const Hm = H_RIDGE - 0.12;
  for (const [x, dir] of [[WF, 1], [0, -1]]) {
    const nrm = dir > 0 ? N.px : N.nx, xs = dir > 0 ? x : x + 0.02;
    if (dir > 0) {
      wall.setColor(C.east); sideQ(wall, x, 0.85, H_EAVE, 0, -D1, nrm);
      brick.setColor('#f1e6dc'); brick.box(x, -0.5, -D1, x + 0.03, 0.85, 0, 1 | 4);
      wall.setColor(C.lite); wall.box(x, 5.2, -D1, x + 0.12, H_EAVE, 0.0, 1 | 4 | 16 | 32);
    }
    brick.setColor('#f6efe8');
    tri(brick, [xs, H_EAVE, 0], [xs, H_EAVE, -D1], [xs, Hm, -D1 / 2], nrm, [[0, H_EAVE], [-D1, H_EAVE], [-D1 / 2, Hm]].map(([a, b]) => [a, b]));
  }
  // the east gable's boarded window, its lintel and sill, a vent
  det.setColor('#6b4b31'); sideQ(det, WF + 0.012, 5.7, 6.85, -6.43, -5.63, N.px);
  det.setColor('#b9b2a2'); det.box(WF, 6.85, -6.55, WF + 0.07, 7.0, -5.51, 1 | 4 | 16 | 32); det.box(WF, 5.58, -6.55, WF + 0.07, 5.7, -5.51, 1 | 4 | 16 | 32);
  det.setColor('#2b2520'); sideQ(det, WF + 0.012, 7.3, 7.5, -6.1, -5.9, N.px);
  // the back wall of the front range (the wing hides most of it)
  wall.setColor(C.east); frontQ(wall, 0, 0.85, WF, H_EAVE, -D1, N.nz);

  // ---- the roof of the front range: ridge along the street, 36 degrees, eave overhang 0.35
  const eZ = 0.35, eY = 5.5, rZ = -D1 / 2, rY = H_RIDGE, bZ = -D1 - 0.35;
  const sl = Math.hypot(eZ - rZ, rY - eY), nF = [0, (eZ - rZ) / sl, (rY - eY) / sl], nB = [0, (eZ - rZ) / sl, -(rY - eY) / sl];
  const xa = -0.12, xb = WF + 0.12;
  roof.setColor(C.tile);
  quad(roof, [xa, eY, eZ], [xb, eY, eZ], [xb, rY, rZ], [xa, rY, rZ], nF, [[xa, 0], [xb, 0], [xb, sl], [xa, sl]]);
  roof.setColor(C.tileBack);
  quad(roof, [xa, rY, rZ], [xb, rY, rZ], [xb, eY, bZ], [xa, eY, bZ], nB, [[xa, sl], [xb, sl], [xb, 0], [xa, 0]]);
  det.setColor('#6d3f33'); det.tube([xa, rY + 0.02, rZ], [xb, rY + 0.02, rZ], 0.13, 6);
  det.setColor('#5a463a'); frontQ(det, xa, eY - 0.1, xb, eY, eZ + 0.005); // the fascia board
  // the solar array on the street slope: 7 x 3 panels, framed
  const P = (s, t) => { const k = t / sl; return [s, eY + (rY - eY) * k + 0.05 * nF[1], eZ + (rZ - eZ) * k + 0.05 * nF[2]]; };
  const nS = nF;
  for (let row = 0; row < 3; row++) for (let col = 0; col < 7; col++) {
    const s0 = 0.6 + col * 1.08, s1 = s0 + 1.04, t0 = 0.65 + row * 1.66, t1 = t0 + 1.62;
    det.setColor(C.solar); quad(det, P(s0, t0), P(s1, t0), P(s1, t1), P(s0, t1), nS);
  }
  det.setColor(C.solarLine);
  const L = (s, t) => { const p = P(s, t); return [p[0], p[1] + 0.012 * nF[1], p[2] + 0.012 * nF[2]]; };
  for (let col = 0; col <= 7; col++) { const s = 0.6 + col * 1.08 - (col ? 0.02 : 0); quad(det, L(s - 0.014, 0.65), L(s + 0.014, 0.65), L(s + 0.014, 5.63), L(s - 0.014, 5.63), nS); }
  for (let row = 0; row <= 3; row++) { const t = 0.65 + row * 1.66 - (row ? 0.02 : 0); quad(det, L(0.6, t - 0.014), L(8.12, t - 0.014), L(8.12, t + 0.014), L(0.6, t + 0.014), nS); }

  // ---- the rear wing
  const X0 = WX0, X1 = WF, Z0 = -D1, Z1 = -D2, EV = WING_EAVE, RG = WING_RIDGE, XM = (X0 + X1) / 2;
  wall.setColor(C.east);
  sideQ(wall, X1, 0.6, EV, Z0, Z1, N.px); sideQ(wall, X0, 0.6, EV, Z0, Z1, N.nx); frontQ(wall, X0, 0.6, X1, EV, Z1, N.nz);
  brick.setColor('#efe2d8');
  brick.box(X1, -0.5, Z1, X1 + 0.03, 0.6, Z0, 1 | 4); brick.box(X0 - 0.03, -0.5, Z1, X0, 0.6, Z0, 2 | 4); brick.box(X0, -0.5, Z1 - 0.03, X1, 0.6, Z1, 32 | 4);
  wall.setColor(C.lite); wall.box(X1, EV - 0.15, Z1, X1 + 0.08, EV, Z0, 1 | 4);
  brick.setColor('#f6efe8');
  tri(brick, [X0, EV, Z1], [X1, EV, Z1], [XM, RG - 0.1, Z1], N.nz, [[X0, EV], [X1, EV], [XM, RG - 0.1]]);
  // windows of the wing: a pale frame, glass behind, a sill (flat overlays)
  const ovWin = (face, along, y0, y1, ww) => {
    const f = 0.07;
    if (face === 'E' || face === 'W') {
      const x = face === 'E' ? X1 : X0, s = face === 'E' ? 1 : -1, nn = face === 'E' ? N.px : N.nx;
      det.setColor(C.white); sideQ(det, x + s * 0.012, y0 - f, y1 + f, along - ww / 2 - f, along + ww / 2 + f, nn);
      lit.setColor(C.glass); sideQ(lit, x + s * 0.02, y0, y1, along - ww / 2, along + ww / 2, nn);
      lit.setColor(C.curtain); sideQ(lit, x + s * 0.022, y0, y0 + (y1 - y0) * 0.5, along - ww / 2, along + ww / 2, nn);
      det.setColor(C.white); sideQ(det, x + s * 0.03, y0 + (y1 - y0) * 0.5 - 0.02, y0 + (y1 - y0) * 0.5 + 0.02, along - ww / 2, along + ww / 2, nn);
      det.setColor(C.sill); det.box(face === 'E' ? x : x - 0.1, y0 - f - 0.07, along - ww / 2 - 0.1, face === 'E' ? x + 0.1 : x, y0 - f, along + ww / 2 + 0.1, 63 & ~(face === 'E' ? 2 : 1));
    } else {
      det.setColor(C.white); frontQ(det, along - ww / 2 - f, y0 - f, along + ww / 2 + f, y1 + f, Z1 - 0.012, N.nz);
      lit.setColor(C.glass); frontQ(lit, along - ww / 2, y0, along + ww / 2, y1, Z1 - 0.02, N.nz);
    }
  };
  ovWin('E', -14.0, 1.25, 2.75, 1.0); ovWin('E', -20.6, 1.25, 2.75, 1.0); ovWin('E', -22.5, 1.25, 2.75, 0.8);
  ovWin('W', -14.4, 1.25, 2.75, 1.0); ovWin('W', -18.0, 1.25, 2.75, 1.0); ovWin('W', -21.6, 1.25, 2.75, 1.0);
  ovWin('N', 4.0, 1.25, 2.75, 1.0); ovWin('N', 8.0, 1.25, 2.75, 1.0);
  det.setColor('#6b4b31'); frontQ(det, XM - 0.3, WING_EAVE + 1.0, XM + 0.3, WING_EAVE + 1.9, Z1 - 0.07 + 0.06, N.nz); // gable window (a guess)
  // the entrance on the east wall of the wing: double doors, a pale frame, a small pent canopy, three steps, a lamp
  const dz = -17.0, dw = 1.5, dh = 2.2, yd = 0.45;
  det.setColor(C.white); sideQ(det, X1 + 0.012, yd, yd + dh + 0.1, dz - dw / 2 - 0.1, dz + dw / 2 + 0.1, N.px);
  det.setColor(C.brown); sideQ(det, X1 + 0.02, yd, yd + dh, dz - dw / 2, dz + dw / 2, N.px);
  det.setColor('#3b2619'); sideQ(det, X1 + 0.03, yd, yd + dh, dz - 0.02, dz + 0.02, N.px);
  lit.setColor('#8e9ba3'); sideQ(lit, X1 + 0.028, yd + 1.0, yd + dh - 0.1, dz - dw / 2 + 0.12, dz - 0.07, N.px); sideQ(lit, X1 + 0.028, yd + 1.0, yd + dh - 0.1, dz + 0.07, dz + dw / 2 - 0.12, N.px);
  det.setColor('#4a3a30'); quad(det, [X1, 3.3, dz - 1.0], [X1 + 1.1, 2.95, dz - 1.0], [X1 + 1.1, 2.95, dz + 1.0], [X1, 3.3, dz + 1.0], [0.3, 0.95, 0]);
  det.box(X1, 3.18, dz - 1.0, X1 + 1.1, 3.23, dz - 0.97, 63 & ~4); det.box(X1, 3.18, dz + 0.97, X1 + 1.1, 3.23, dz + 1.0, 63 & ~4);
  det.setColor('#b0ada5');
  det.box(X1, 0, dz - 1.0, X1 + 0.5, 0.45, dz + 1.0, 63 & ~2 & ~8); det.box(X1 + 0.5, 0, dz - 1.0, X1 + 0.95, 0.3, dz + 1.0, 63 & ~2 & ~8); det.box(X1 + 0.95, 0, dz - 1.0, X1 + 1.4, 0.15, dz + 1.0, 63 & ~2 & ~8);
  lit.setColor('#fff2d2'); lit.box(X1 + 0.02, 2.88, dz - 0.09, X1 + 0.18, 3.08, dz + 0.09, 63 & ~2);
  // roofs of the wing
  const eo = 0.3, tg = (RG - EV) / (X1 - XM), yE = (dx) => EV - dx * tg, wsl = Math.hypot(X1 - XM + eo, RG - yE(eo));
  const nE = [tg / Math.hypot(1, tg), 1 / Math.hypot(1, tg), 0], nW = [-nE[0], nE[1], 0];
  roof.setColor(C.tile);
  const zS = Z0 + 0.0, zN = Z1 - 0.3;
  quad(roof, [XM, RG, zS], [XM, RG, zN], [X1 + eo, yE(eo), zN], [X1 + eo, yE(eo), zS], nE, [[0, 0], [0, 12], [wsl, 12], [wsl, 0]]);
  roof.setColor(C.tileBack);
  quad(roof, [XM, RG, zN], [XM, RG, zS], [X0 - eo, yE(eo), zS], [X0 - eo, yE(eo), zN], nW, [[0, 12], [0, 0], [wsl, 0], [wsl, 12]]);
  // the south end of the wing roof runs 3 m under the front range's north slope (the valley); inset so it clears the walls
  roof.setColor(C.tile);
  const zV = Z0 + 3.0, xi = 0.0;
  quad(roof, [XM, RG, zV], [XM, RG, zS], [X1 - xi, yE(0), zS], [X1 - xi, yE(0), zV], nE);
  roof.setColor(C.tileBack);
  quad(roof, [XM, RG, zS], [XM, RG, zV], [X0 + xi, yE(0), zV], [X0 + xi, yE(0), zS], nW);
  det.setColor('#6d3f33'); det.tube([XM, RG + 0.02, zN], [XM, RG + 0.02, zV + 0.2], 0.12, 6);
  det.setColor('#5a463a'); sideQ(det, X1 + eo, yE(eo) - 0.1, yE(eo), zN, Z0 - 0.0, N.px);
  return { ridge: H_RIDGE };
}

// ------------------------------------------------------------------------------------------------ the gate group east of the front
export const GATE = { doorX0: WF + 0.15, doorX1: 12.0, pierA: [12.0, 12.5], gate: [12.5, 15.85], pierB: [15.85, 16.35], pink: [16.35, 21.9] };

export function buildGate(B) {
  const { wall, brick, det } = B, G = GATE, out = [];
  // the pedestrian leaf: black planks
  det.setColor('#1f1d1b'); frontQ(det, G.doorX0, 0.1, G.doorX1, 2.05, 0.02);
  det.setColor('#34302c');
  for (let i = 1; i < 5; i++) { const x = G.doorX0 + (G.doorX1 - G.doorX0) * i / 5; frontQ(det, x - 0.008, 0.1, x + 0.008, 2.05, 0.025); }
  frontQ(det, G.doorX0, 0.95, G.doorX1, 1.0, 0.025);
  det.setColor('#5a5047'); det.box(G.doorX1 - 0.16, 0.95, 0.025, G.doorX1 - 0.12, 1.1, 0.04, 16); // the latch
  out.push({ cx: (G.doorX0 + G.doorX1) / 2, cz: 0.0, hx: (G.doorX1 - G.doorX0) / 2, hz: 0.07, y1: 2.05 });
  // the piers: brick shaft, a concrete cap, a black ball finial
  for (const [a, b] of [G.pierA, G.pierB]) {
    brick.setColor('#dcc0b2'); brick.box(a, -0.5, -0.25, b, 2.62, 0.25, 63 & ~8);
    wall.setColor(C.cap); wall.box(a - 0.07, 2.62, -0.32, b + 0.07, 2.76, 0.32, 63 & ~8);
    wall.box(a - 0.03, 2.4, -0.28, b + 0.03, 2.5, 0.28, 63 & ~8);
    det.setColor('#1b1b1c'); det.ellipsoid([(a + b) / 2, 2.9, 0], [0.12, 0.13, 0.12], 8, 4); det.tube([(a + b) / 2, 2.76, 0], [(a + b) / 2, 2.82, 0], 0.05, 6);
    out.push({ cx: (a + b) / 2, cz: 0, hx: (b - a) / 2 + 0.05, hz: 0.3, y1: 2.9 });
  }
  // the wide iron gate: two leaves, rails, a bar every 12.5 cm, the scroll crest over the meeting stile
  const [g0, g1] = G.gate, gm = (g0 + g1) / 2, yb = 0.2, yt = 1.98;
  det.setColor(C.iron);
  for (const y of [0.78, 1.25, yt - 0.08, yt]) det.box(g0, y, -0.03, g1, y + 0.07, 0.03, 16 | 32 | 4 | 8);
  det.box(g0, yb, -0.025, g1, 0.78, 0.025, 16 | 32 | 4); // the solid lower panels of the leaves
  const nb = Math.round((g1 - g0) / 0.125);
  for (let i = 0; i <= nb; i++) { const x = g0 + (g1 - g0) * i / nb; det.box(x - 0.014, 0.78, -0.014, x + 0.014, yt, 0.014, 63 & ~4 & ~8); }
  for (const x of [g0 + 0.03, gm - 0.04, gm + 0.04, g1 - 0.03]) det.box(x - 0.03, 0.12, -0.03, x + 0.03, yt + 0.06, 0.03, 63);
  const crest = [];
  for (let i = 0; i <= 14; i++) { const a = Math.PI * (1 - i / 14); crest.push([gm + Math.cos(a) * 0.55, yt + 0.06 + Math.sin(a) * 0.55, 0]); }
  for (let i = 0; i < 14; i++) det.tube(crest[i], crest[i + 1], 0.022, 4);
  det.tube([gm, yt + 0.06, 0], [gm, yt + 0.64, 0], 0.02, 4); det.tube([gm - 0.28, yt + 0.06, 0], [gm - 0.22, yt + 0.5, 0], 0.016, 4); det.tube([gm + 0.28, yt + 0.06, 0], [gm + 0.22, yt + 0.5, 0], 0.016, 4);
  det.ellipsoid([gm, yt + 0.7, 0], [0.05, 0.07, 0.05], 6, 3);
  for (const sg of [-1, 1]) { // two C-scrolls either side of the stem
    let prev = null;
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI * 0.2 + i / 12 * Math.PI * 1.7, rr = 0.15 - i * 0.009, p = [gm + sg * (0.2 + Math.cos(a) * rr), yt + 0.3 + Math.sin(a) * rr, 0];
      if (prev) det.tube(prev, p, 0.014, 4);
      prev = p;
    }
  }
  out.push({ cx: gm, cz: 0, hx: (g1 - g0) / 2, hz: 0.06, y1: 2.0 });
  // the neighbour's pink front wall: brick foot, pink render, two cream tablets, a grey cap
  const [p0, p1] = G.pink;
  brick.setColor('#dcc0b2'); brick.box(p0, -0.5, -0.15, p1, 0.55, 0.15, 16 | 4 | 32 | 2);
  wall.setColor(C.pink); wall.box(p0, 0.55, -0.15, p1, 2.15, 0.15, 16 | 4 | 32 | 2);
  wall.setColor('#e7dbb7'); wall.box(p0 + 0.6, 0.95, 0.15, p0 + 2.7, 1.85, 0.19, 16 | 1 | 2 | 4); wall.box(p0 + 3.0, 0.95, 0.15, p1 - 0.5, 1.85, 0.19, 16 | 1 | 2 | 4);
  wall.setColor(C.cap); wall.box(p0 - 0.03, 2.15, -0.2, p1, 2.25, 0.2, 63 & ~8);
  out.push({ cx: (p0 + p1) / 2, cz: 0, hx: (p1 - p0) / 2, hz: 0.17, y1: 2.25 });
  return { solids: out };
}

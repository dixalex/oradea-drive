// OWNER: oradea. The Ursuline church «Sfânta Ana» (Biserica Romano-Catolică «Sf. Ana», Calea Republicii, consecrated 1774; the Baroque front
// was made neo-Gothic in the 1850s), as the Commons photographs of the front show it: a pale pink-white stepped gable with vertical strips down
// the step edges, a pointed portal under a rose window, a blind lancet and a small oculus, and a tower beside it with a round window, a blind
// panel, a ring window, a pointed belfry window, stepped gablets and a dark slate spire. OSM has no outline of its own: the church stands in
// the street front of the convent block that sites/republicii draws as the «Liceul Ady Endre» ring (OSM 313967734), so this module adds only
// what shows: the front, 0.5 m proud of the ring's street edge, and the tower, both set on that edge (the nave and the convent lie inside the
// ring and are not drawn twice). A node (OSM 703829100) marks the church; the front stands ~15 m north of the ring's south corner, where the
// aerial photograph shows the gap in the street front.
//   buildUrsuline({ B, S, g }) -> { footprints, stats, top }
import { begin, end, frontFrame, sideFrame, lathe, PROFILES, cross, ball, GOLD, poly, nrm, PI } from './kit.js';

export const URSULINE_NODE = 703829100;
const CORNER = [84.2, -339.0];                    // the ring's south-east corner (vertex 0 of OSM 313967734)
const U = [-0.9290, -0.3700];                     // inward from the street edge (west-south-west), unit
const YAW = Math.atan2(U[1], U[0]);
const V = [-Math.sin(YAW), Math.cos(YAW)];        // along the street edge, north-north-east
export const toW = (u, v) => [CORNER[0] + U[0] * u + V[0] * v, CORNER[1] + U[1] * u + V[1] * v];

const WALL = '#e9dedb', TRIM = '#f7f3ef', GREY = '#97918f', PLINTH = '#b8aaa5', SLATE = '#52575d', GLASS = '#3b4658', DARK = '#2f2824', WOOD = '#a37c4c';

// a diamond (a blind quatrefoil seen flat) on a plane
const diamond = (M, F, w, y, r, col, d = 0.05) => { M.setColor(col); M.face([F.pt(w - r, y, d), F.pt(w, y + r, d), F.pt(w + r, y, d), F.pt(w, y - r, d)], nrm(F)); };
// rows of a stepped gable centred on vm: levels [[half, yTop], ...] ascending from y0, a coping on each exposed ledge
function stepped(B, F, vm, y0, levels, depth = 0.12) {
  let yb = y0;
  levels.forEach(([h, yt], k) => {
    B.wall.setColor(WALL); F.rect(B.wall, vm - h, vm + h, yb, yt, 0);
    const nxt = levels[k + 1];
    B.wall.setColor(GREY);
    if (nxt) {
      F.slab(B.wall, vm - h - 0.1, vm - nxt[0] + 0.0, yt - 0.02, yt + 0.2, -0.05, depth + 0.1, 'ftl');
      F.slab(B.wall, vm + nxt[0] - 0.0, vm + h + 0.1, yt - 0.02, yt + 0.2, -0.05, depth + 0.1, 'ftr');
    } else F.slab(B.wall, vm - h - 0.1, vm + h + 0.1, yt - 0.02, yt + 0.2, -0.05, depth + 0.1, 'ftlr');
    yb = yt;
  });
}

export function buildUrsuline({ B, S, g }) {
  const st = { windows: 0, towers: 1, solids: 0 };
  const uF = -0.5, vT0 = 21.5, vT1 = 27.1, vN0 = 27.1, vN1 = 36.1, vm = (vN0 + vN1) / 2, uT1 = 5.1;
  // ground: the front stands on the highest point of its foot, the plinth reaches the lowest
  let hi = -1e9, lo = 1e9;
  for (const [u, v] of [[uF, vT0], [uF, vN1], [uT1, vT0], [uF, (vT0 + vN1) / 2], [uT1, vT1]]) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const Fy = hi + 0.15, gLo = lo - 0.6, Y = (h) => Fy + h;
  begin(B, CORNER[0], CORNER[1], YAW);
  const Fn = frontFrame(uF, vN0, vN1, -1), Ft = frontFrame(uF, vT0, vT1, -1);

  // ---- the nave's front: the stepped gable
  stepped(B, Fn, vm, gLo, [[4.5, Y(11.4)], [3.75, Y(13.0)], [2.95, Y(14.6)], [2.15, Y(16.2)], [1.0, Y(17.5)]]);
  // the pinnacle's little gable and the cross
  B.wall.setColor(GREY); poly(B.wall, [Fn.pt(vm - 1.15, Y(17.6), 0.1), Fn.pt(vm + 1.15, Y(17.6), 0.1), Fn.pt(vm, Y(18.6), 0.08)], nrm(Fn));
  // the back and the sides of the thin skin, so it reads from the yard side too
  const Fb = frontFrame(uF + 1.0, vN0, vN1, +1);
  B.wall.setColor(WALL);
  [[4.5, Y(11.4)], [3.75, Y(13.0)], [2.95, Y(14.6)], [2.15, Y(16.2)], [1.0, Y(17.5)]].reduce((yb, [h, yt]) => { Fb.rect(B.wall, vm - h, vm + h, yb, yt, 0); return yt; }, gLo);
  const Fr = sideFrame(vN1, uF, uF + 1.0, +1);
  B.wall.setColor(WALL); Fr.rect(B.wall, uF, uF + 1.0, gLo, Y(11.4), 0);
  // strips down the step edges, the plinth, the string course
  B.wall.setColor(PLINTH); Fn.slab(B.wall, vN0 - 0.05, vN1 + 0.05, gLo, Y(0.95), 0, 0.14, 'ft');
  for (const [h, yt] of [[4.38, 11.0], [3.88, 11.0], [3.63, 12.6], [2.83, 14.2], [2.03, 15.8]]) {
    B.wall.setColor(TRIM);
    for (const s of [-1, 1]) Fn.slab(B.wall, vm + s * h - 0.08, vm + s * h + 0.08, Y(0.95), Y(yt), 0, 0.07, 'flr');
  }
  for (const [h, y] of [[3.63, 12.75], [2.83, 14.35], [2.03, 15.95], [4.38, 11.1]]) for (const s of [-1, 1]) diamond(B.wall, Fn, vm + s * h, Y(y) - 0.02, 0.28, TRIM, 0.08);
  // the portal: a pointed door under a pointed surround, a wooden leaf, steps
  B.wall.setColor(GREY); Fn.slab(B.wall, vm - 1.9, vm + 1.9, gLo, Y(0.5), 0, 0.9, 'ft');
  Fn.door(B, vm, Y(0.5), 2.3, 4.5, { kind: 'pointed', rise: 1.5, col: WOOD, trim: TRIM, sur: 0.55, d: 0.1 });
  B.wall.setColor('#d6b2a6'); poly(B.wall, [Fn.pt(vm - 1.0, Y(0.5) + 3.0, 0.14), Fn.pt(vm + 1.0, Y(0.5) + 3.0, 0.14), Fn.pt(vm, Y(0.5) + 4.9, 0.14)], nrm(Fn));
  // the rose window with its ring, a pointed blind lancet, the oculus in the gable
  Fn.oculus(B, vm, Y(8.3), 1.1, { trim: TRIM, glass: '#4b5b70', ring: 0.5, d: 0.07, n: 16 });
  { // the star of the rose window: eight spokes and a hub
    B.det.setColor('#ddd6ca');
    for (let i = 0; i < 8; i++) { const a = i * PI / 4, c = Math.cos(a), sn = Math.sin(a), nx = -sn * 0.035, ny = c * 0.035;
      B.det.face([Fn.pt(vm + nx, Y(8.3) + ny, 0.1), Fn.pt(vm + c * 1.1 + nx, Y(8.3) + sn * 1.1 + ny, 0.1), Fn.pt(vm + c * 1.1 - nx, Y(8.3) + sn * 1.1 - ny, 0.1), Fn.pt(vm - nx, Y(8.3) - ny, 0.1)], nrm(Fn)); }
    Fn.oculus(B, vm, Y(8.3), 0.2, { trim: '#ddd6ca', glass: '#5a6c84', ring: 0.1, d: 0.1, n: 8 });
  }
  for (const [dv, dy] of [[-1.55, 1.5], [1.55, 1.5], [-1.55, -1.5], [1.55, -1.5]]) diamond(B.wall, Fn, vm + dv, Y(8.3) + dy, 0.26, TRIM, 0.08);
  B.wall.setColor(GREY); Fn.slab(B.wall, vm - 1.6, vm + 1.6, Y(9.9), Y(10.1), 0, 0.22, 'ftlr');
  Fn.win(B, vm, Y(10.1), 0.85, 2.7, { kind: 'pointed', rise: 0.9, sur: 0.2, trim: TRIM, glass: '#8c8582', d: 0.06 });
  Fn.oculus(B, vm, Y(14.9), 0.4, { trim: TRIM, glass: '#4b5b70', ring: 0.2, d: 0.06, n: 10 });
  cross(B.cap, ...toLocal(Fn, vm, Y(18.55)), 1.7, GOLD, 0);
  st.windows += 4;

  // ---- the tower
  const yS = Y(21.0), cxT = (-0.5 + uT1) / 2, czT = (vT0 + vT1) / 2;
  const faces = [
    { F: Ft, mid: czT, plane: 'u' },
    { F: sideFrame(vT0, uF, uT1, -1), mid: cxT, plane: 'v' },
    { F: sideFrame(vT1, uF, uT1, +1), mid: cxT, plane: 'v', north: true },
  ];
  B.wall.setColor(WALL);
  Ft.rect(B.wall, vT0, vT1, gLo, yS, 0);
  faces[1].F.rect(B.wall, uF, uT1, gLo, yS, 0);
  faces[2].F.rect(B.wall, uF, uT1, Y(10.5), yS, 0);
  const Fw = frontFrame(uT1, vT0, vT1, +1);
  Fw.rect(B.wall, vT0, vT1, Y(10.5), yS, 0);                 // the yard-side wall above the convent roof
  for (const { F, mid, north } of faces) {
    const wlo = F === Ft ? vT0 : uF, whi = F === Ft ? vT1 : uT1, y0 = north ? 10.5 : 0;
    B.wall.setColor(PLINTH); if (!north) F.slab(B.wall, wlo - 0.05, whi + 0.05, gLo, Y(1.0), 0, 0.14, 'ft');
    B.wall.setColor(TRIM);
    for (const w of [wlo + 0.18, whi - 0.18]) F.slab(B.wall, w - 0.17, w + 0.17, north ? Y(10.5) : Y(1.0), yS - 0.5, 0, 0.07, 'flr');
    B.wall.setColor(GREY);
    for (const y of [8.0, 14.0, 16.4]) if (y > y0) F.slab(B.wall, wlo - 0.1, whi + 0.1, Y(y), Y(y) + 0.22, 0, 0.18, 'ftb');
    if (!north) {
      F.win(B, mid, Y(2.1), 0.5, 2.1, { kind: 'flat', sur: 0.1, trim: TRIM, glass: '#33353a', d: 0.04, bars: true });
      F.oculus(B, mid, Y(5.3), 0.5, { trim: TRIM, glass: '#4b5b70', ring: 0.28, d: 0.06, n: 12 });
      // the blind stepped panel and the two small diamonds under it
      B.wall.setColor(TRIM);
      F.slab(B.wall, mid - 1.1, mid + 1.1, Y(9.0), Y(11.4), -0.02, 0.06, 'ftlr');
      F.slab(B.wall, mid - 0.6, mid + 0.6, Y(11.4), Y(12.0), -0.02, 0.06, 'ftlr');
      B.wall.setColor(WALL); F.rect(B.wall, mid - 0.9, mid + 0.9, Y(9.2), Y(11.3), 0.075);
      diamond(B.wall, F, mid - 0.45, Y(7.4), 0.22, TRIM, 0.07); diamond(B.wall, F, mid + 0.45, Y(7.4), 0.22, TRIM, 0.07);
    }
    F.oculus(B, mid, Y(13.0) + 0.2, 0.62, { trim: TRIM, glass: '#4b5b70', ring: 0.32, d: 0.06, n: 14 });
    B.wall.setColor(TRIM); F.slab(B.wall, mid - 0.75, mid + 0.75, Y(14.2), Y(14.9), 0, 0.08, 'ftlr');   // the sill panel under the belfry window
    diamond(B.wall, F, mid, Y(14.55), 0.2, GREY, 0.1);
    F.win(B, mid, Y(15.0), 1.25, 4.3, { kind: 'pointed', rise: 1.5, sur: 0.24, trim: TRIM, glass: '#3a2f29', d: 0.07, bars: true });
    F.oculus(B, mid, Y(19.9), 0.3, { trim: TRIM, glass: '#4b5b70', ring: 0.14, d: 0.06, n: 8 });
    st.windows += 4;
  }
  // the cornice and the stepped gablets, one on each side, the slate spire behind them
  const gab = [[2.3, 21.6], [1.6, 22.3], [0.8, 23.1]];
  const ring = [[uF, vT0], [uT1, vT0], [uT1, vT1], [uF, vT1]];
  void ring;
  B.wall.setColor(GREY);
  Ft.slab(B.wall, vT0 - 0.25, vT1 + 0.25, yS - 0.1, yS + 0.3, 0, 0.3, 'ftb'); faces[1].F.slab(B.wall, uF - 0.25, uT1 + 0.25, yS - 0.1, yS + 0.3, 0, 0.3, 'ftb');
  faces[2].F.slab(B.wall, uF - 0.25, uT1 + 0.25, yS - 0.1, yS + 0.3, 0, 0.3, 'ftb'); Fw.slab(B.wall, vT0 - 0.25, vT1 + 0.25, yS - 0.1, yS + 0.3, 0, 0.3, 'ftb');
  for (const { F, mid } of [...faces, { F: Fw, mid: czT }]) {
    let yb = yS + 0.3;
    gab.forEach(([h, yt]) => { B.wall.setColor(WALL); F.rect(B.wall, mid - h, mid + h, yb, Y(yt), 0.0); B.wall.setColor(GREY); F.slab(B.wall, mid - h - 0.06, mid + h + 0.06, Y(yt) - 0.02, Y(yt) + 0.14, -0.04, 0.12, 'ftlr'); yb = Y(yt); });
    diamond(B.wall, F, mid, yS + 1.0, 0.25, TRIM, 0.04);
  }
  // the slate spire: an eight-sided needle from a square shoulder
  B.det.setColor(SLATE);
  const y0S = yS + 0.3, H = 10.6;
  lathe(B.det, PROFILES.needle, 8, cxT, czT, y0S, 2.3, H, PI / 8);
  const tip = y0S + H;
  ball(B.cap, cxT, tip + 0.08, czT, 0.22); cross(B.cap, cxT, tip + 0.2, czT, 1.9, GOLD, 0);
  end(B);

  // ---- colliders on the part that stands proud of the street edge, and the footprint
  const box = (u0, u1, v0, v1) => [toW(u0, v0), toW(u1, v0), toW(u1, v1), toW(u0, v1)];
  S.prism(box(uF, 0.4, vN0, vN1).flat(), gLo, Y(11.4), 0, 0, 'wall'); st.solids++;
  S.prism(box(uF, uT1, vT0, vT1).flat(), gLo, yS, 0, 0, 'tower'); st.solids++;
  S.cyl(...toW(cxT, czT), yS, tip, 1.2, 0.2, 'tower'); st.solids++;
  const poly2 = box(uF, uT1, vT0, vN1);
  return { footprints: [{ poly: poly2, h: tip + 2 - gLo, kind: 'church', name: 'Biserica Sfânta Ana (Ursuline)', id: URSULINE_NODE }], stats: st, top: tip + 2 };
}

function toLocal(F, w, y) { const [u, , v] = F.pt(w, y, 0.1); return [u, y, v]; }

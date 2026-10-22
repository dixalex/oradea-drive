// OWNER: oradea. Catedrala Episcopală «Învierea Domnului», Oradea (OSM way 286245390, Piața Emanuil Gojdu 43): the Orthodox Episcopal
// Cathedral, built 1995–2012 (consecrated 2020), one of the largest in western Romania, 1 423 m² on the ground, up to 67 m high. Built
// after the Commons photos (2022 / 2023 / 2025): walls clad in cream limestone (Podeni / Hidiș) with bands, pilaster strips and window
// frames in mauve granite, a dark granite base, a broad stair and a tall arched portal with the mosaic of the Resurrection on the west
// front, a gabled nave and transept, a rounded apse, and three octagonal drums with paired arched windows under flared dark spires
// (the central one over the crossing on an octagonal stage, the two west ones on tall corner masses), gold balls and crosses.
//   buildCathedral({ B, S, g, ring }) -> { footprints, stats, top }     B: kit.js newSet(), S: collision, g(x, z) ground, ring: OSM ring
//   Local frame (frameOf): u from the west front (u = -24) to the apse (u = +24), v across (v = 0.6 is the nave axis).
import {
  PI, begin, end, edgeFrame, at, rect, slab, poly, archWin, archOutline, gable, fanRoof, PROFILES, spire, cross, ball, rectFrames, ngonFrames, GOLD, nrm,
} from './kit.js';
import { frameOf } from './church.js';

export const CATHEDRAL_ID = 286245390;
const VA = 0.6;
const C = { wall: '#ece5d2', wallD: '#ddd4bd', mauve: '#9d808c', mauveD: '#85686f', belt: '#b5a0aa', base: '#5b4c55', roof: '#44464b', spire: '#3a3d43', glass: '#232b38', door: '#5a3a24', gold: GOLD, mosaicBlue: '#2d4a7c', mosaicGold: '#c9a24a' };

export function buildCathedral({ B, S, g, ring }) {
  const F = frameOf(ring), toW = F.toMap, st = { windows: 0, drums: 0, solids: 0 };
  let hi = -1e9, lo = 1e9;
  for (const [u, v] of [[-24, -8], [-24, 10], [20, -10], [20, 10], [0, -14], [0, 14], [24, 0], [-20, -12], [-20, 13]]) { const [x, z] = toW(u, v), h = g(x, z); if (Number.isFinite(h)) { hi = Math.max(hi, h); lo = Math.min(lo, h); } }
  if (!Number.isFinite(hi)) { hi = 3; lo = 3; }
  const RISE = 1.3, Fy = hi + RISE, gLo = lo - 0.6, Y = (h) => Fy + h;   // the cathedral stands on a floor 1.3 m over the plaza, reached by nine steps
  begin(B, F.cx, F.cz, F.yaw);
  const W = B.wall, ST = B.stone;

  // ---- one volume: four walls from the ground to H with the dark granite base, mauve belts, a cornice and tall arched slit windows
  // o: sides { W, E, N, S }: false to leave a side out, belts [heights], win { y0, h, w, bay, sides }
  const volume = (u0, u1, v0, v1, H, o = {}) => {
    const FR = rectFrames(u0, u1, v0, v1), sides = o.sides ?? { W: 1, E: 1, N: 1, S: 1 };
    for (const [k, f] of Object.entries(FR)) {
      if (!sides[k]) continue;
      W.setColor(o.wall ?? C.wall); rect(W, f, 0, f.L, gLo, Y(H));
      ST.setColor(C.base); slab(ST, f, -0.08, f.L + 0.08, gLo, Y(o.baseH ?? 1.2), 0, 0.28, 'ftl' + 'r');
      ST.setColor(C.belt); for (const by of o.belts ?? [4.4, 9.5, 14.2].filter((y) => y < H - 2)) slab(ST, f, -0.02, f.L + 0.02, Y(by), Y(by + 0.16), 0, 0.08, 'f');
      ST.setColor(C.wallD); slab(ST, f, -0.25, f.L + 0.25, Y(H) - 0.55, Y(H) + 0.05, 0, 0.42, 'ftb');
      ST.setColor(C.mauve); slab(ST, f, -0.3, f.L + 0.3, Y(H) - 0.18, Y(H) + 0.1, 0, 0.5, 'ft');
      const wn = o.win;
      if (wn && (wn.sides ?? 'WENS').includes(k)) {
        const bays = Math.max(1, Math.round(f.L / (wn.bay ?? 4.8)));
        for (let i = 0; i < bays; i++) {
          const s = (i + 0.5) * f.L / bays;
          // recessed mauve strip behind the window, the cream arch surround, the glass
          ST.setColor(C.mauveD); slab(ST, f, s - wn.w / 2 - 0.42, s + wn.w / 2 + 0.42, Y(wn.y0 - 0.2), Y(wn.y0 + wn.h - wn.w / 2 + 0.1), 0, 0.06, 'f');
          archWin(B, f, s, Y(wn.y0), wn.w, wn.h, { sur: 0.26, tcol: C.wall, gcol: C.glass, n: 4, d: 0.07 }); st.windows++;
        }
      }
    }
    return FR;
  };

  // ======================================================================== the hall (nave + transept)
  const hu0 = -20.1, hu1 = 17.7, hv0 = VA - 12.75, hv1 = VA + 12.75, Hn = 17.5, ridge = 24.4;
  const hall = volume(hu0, hu1, hv0, hv1, Hn, { sides: { W: 0, E: 1, N: 1, S: 1 }, win: { y0: 5.4, h: 8.2, w: 1.0, bay: 4.7, sides: 'NS' } });
  // the west wall of the hall is behind the front masses: built plain where it shows between them
  W.setColor(C.wall); rect(W, hall.W, 0, hall.W.L, gLo, Y(Hn));
  gable(B.roof, { a0: hu0 - 0.2, a1: hu1, b0: hv0, b1: hv1, yE: Y(Hn), yR: Y(ridge), ridge: 'u', ov: 0.6, rake: 0.5, hip0: false, hip1: false, col: C.roof, G: W, gcol: C.wall });
  cross(B.dome, hu1 - 0.1, Y(ridge) + 0.55, VA, 3.2, GOLD);

  // ======================================================================== the west front
  const fu0 = -24.1, fv0 = VA - 9.2, fv1 = VA + 9.2;
  const bay = volume(fu0, hu0 + 0.3, fv0, fv1, Hn, { sides: { W: 1, E: 0, N: 0, S: 0 }, win: null, belts: [4.4, 9.5] });
  // the front bay's pediment: a gable over the bay
  gable(B.roof, { a0: fu0 - 0.2, a1: hu0 + 1.5, b0: fv0, b1: fv1, yE: Y(Hn), yR: Y(Hn + 5.4), ridge: 'u', ov: 0.6, rake: 0.55, col: C.roof, G: W, gcol: C.wall });
  { // mauve fascia along the pediment's slopes and a cornice
    const f = bay.W, y0 = Y(Hn), y1 = Y(Hn + 5.4), vm = VA;
    ST.setColor(C.mauve);
    for (const sg of [-1, 1]) {
      const vA = vm + sg * 9.2, p = (v, y, du) => [fu0 - 0.6 + du, y, v];
      poly(ST, [p(vA, y0 - 0.1, 0), p(vm, y1 - 0.1, 0), p(vm, y1 + 0.5, 0), p(vA, y0 + 0.45, 0)], [-1, 0, 0]);
    }
    void f;
    cross(B.dome, fu0 + 1.2, Y(Hn + 5.4) + 0.5, VA, 3.0, GOLD);
    // a round Chi-Rho window in the pediment
    archWin(B, bay.W, bay.W.L / 2, Y(Hn + 1.5), 1.1, 1.1, { rise: 0.55, sur: 0.2, tcol: C.mauve, gcol: C.glass, n: 4 });
  }
  { // the portal: a deep arched recess with a mauve frame, the mosaic lunette, the doors
    const f = bay.W, s = f.L / 2, aw = 7.4, ah = 12.2, a0 = 1.5;
    const O = archOutline(s, Y(a0), aw, ah, aw / 2, 6);
    W.setColor(C.wallD); W.face(O.map(([a, b]) => at(f, a, b, 0.06)), nrm(f));
    const Q = archOutline(s, Y(a0), aw + 1.2, ah + 0.6, aw / 2 + 0.6, 6);
    ST.setColor(C.mauve);
    for (let i = 1; i < O.length; i++) { const j = (i + 1) % O.length; ST.face([at(f, Q[i][0], Q[i][1], 0.14), at(f, Q[j][0], Q[j][1], 0.14), at(f, O[j][0], O[j][1], 0.14), at(f, O[i][0], O[i][1], 0.14)], nrm(f)); }
    // the lunette's mosaic: gold ground, a blue band, the doors under a dark panel
    // the inner arch band (cream) and the golden lunette that fills the head of the arch
    { const I = archOutline(s, Y(a0 + 4.2), aw - 0.5, ah - 4.4, (aw - 0.5) / 2, 6), J = archOutline(s, Y(a0 + 4.55), aw - 1.3, ah - 4.9, (aw - 1.3) / 2, 6);
      W.setColor(C.wall); for (let i = 1; i < I.length; i++) { const j = (i + 1) % I.length; W.face([at(f, I[i][0], I[i][1], 0.1), at(f, I[j][0], I[j][1], 0.1), at(f, J[j][0], J[j][1], 0.1), at(f, J[i][0], J[i][1], 0.1)], nrm(f)); }
      B.det.setColor(C.mosaicGold); B.det.face(J.map(([a, b]) => at(f, a, b, 0.12)), nrm(f)); }
    B.det.setColor(C.mosaicBlue); slab(B.det, f, s - 1.5, s + 1.5, Y(a0 + 5.9), Y(a0 + 8.0), 0.14, 0.2, 'f');
    B.det.setColor('#8a2e2a'); slab(B.det, f, s - 2.0, s - 1.5, Y(a0 + 5.9), Y(a0 + 7.2), 0.14, 0.2, 'f'); slab(B.det, f, s + 1.5, s + 2.0, Y(a0 + 5.9), Y(a0 + 7.0), 0.14, 0.2, 'f');
    B.det.setColor('#4d5a52'); slab(B.det, f, s - 2.2, s + 2.2, Y(a0 + 4.6), Y(a0 + 5.6), 0.05, 0.16, 'f');
    B.det.setColor(C.door); slab(B.det, f, s - 2.2, s + 2.2, Y(0.9), Y(a0 + 4.6), 0.05, 0.14, 'f');
    B.det.setColor('#2e1d12'); slab(B.det, f, s - 0.04, s + 0.04, Y(0.9), Y(a0 + 4.6), 0.14, 0.2, 'f');
    ST.setColor(C.mauve); slab(ST, f, s - 2.5, s + 2.5, Y(a0 + 4.55), Y(a0 + 4.75), 0.05, 0.3, 'ft');
    // the two mauve panels above the arch
    ST.setColor(C.mauveD); slab(ST, f, s - 3.9, s - 0.2, Y(a0 + ah + 0.8), Y(a0 + ah + 2.7), 0.04, 0.12, 'f'); slab(ST, f, s + 0.2, s + 3.9, Y(a0 + ah + 0.8), Y(a0 + ah + 2.7), 0.04, 0.12, 'f');
    // the stair: nine steps across the bay, widening a little as they go down
    const dy = RISE / 9;
    for (let k = 0; k < 9; k++) { ST.setColor(k % 2 ? '#6d5a63' : '#76636c'); slab(ST, f, 0.1 - k * 0.14, f.L - 0.1 + k * 0.14, gLo, Fy - dy * (k + 1), 0.62 * k, 0.62 * (k + 1), 'ftlr'); }
    ST.setColor(C.base); slab(ST, f, -0.5, 0.1, gLo, Fy + 0.5, 0, 5.6, 'ftr'); slab(ST, f, f.L - 0.1, f.L + 0.5, gLo, Fy + 0.5, 0, 5.6, 'ftl');
  }

  // ======================================================================== the corner masses and the two west drums
  const mu0 = -21.7, mu1 = -13.5, Hm = 27.2;
  const masses = [[hv0, VA - 5.3], [VA + 5.3, hv1]].map(([v0, v1], k) => {
    const FR = volume(mu0, mu1, v0, v1, Hm, { sides: { W: 1, E: 1, N: k === 0 ? 1 : 0, S: k === 1 ? 1 : 0 }, belts: [4.4, 9.5, 14.2, 19.0, 23.6], baseH: 1.5 });
    // the narrow stacked windows of the west face, each in its mauve strip
    const f = FR.W, s = f.L / 2;
    ST.setColor(C.mauveD); slab(ST, f, s - 0.55, s + 0.55, Y(2.8), Y(Hm - 3.8), 0, 0.07, 'f');
    for (const y0 of [3.6, 8.6, 13.6, 18.6]) { archWin(B, f, s, Y(y0), 0.55, 3.8, { sur: 0.16, tcol: C.wall, gcol: C.glass, n: 3, d: 0.09 }); st.windows++; }
    const fo = FR[k === 0 ? 'N' : 'S'];
    ST.setColor(C.mauveD); slab(ST, fo, fo.L * 0.5 - 0.5, fo.L * 0.5 + 0.5, Y(2.8), Y(Hm - 3.8), 0, 0.07, 'f');
    for (const y0 of [3.6, 8.6, 13.6, 18.6]) { archWin(B, fo, fo.L * 0.5, Y(y0), 0.55, 3.8, { sur: 0.16, tcol: C.wall, gcol: C.glass, n: 3, d: 0.09 }); st.windows++; }
    return { u: (mu0 + mu1) / 2, v: k === 0 ? VA - 9.4 : VA + 9.4 };
  });
  const side = masses.map((m) => ({ ...m }));

  // ======================================================================== drums and spires
  // an octagonal drum: cream faces with a tall arched window set in a double arch, mauve strips on every corner, a dark cornice;
  // returns the cornice y
  const drumOct = (cx, cz, y0, R, H, o = {}) => {
    const n = o.n ?? 8, fr = ngonFrames(cx, cz, R, n, PI / n), ww = o.ww ?? R * 0.36;
    for (const f of fr) {
      W.setColor(o.wall ?? C.wall); rect(W, f, 0, f.L, y0, y0 + H);
      ST.setColor(C.mauve); slab(ST, f, -0.04, 0.5, y0 + 0.2, y0 + H - 0.1, 0, 0.12, 'f'); slab(ST, f, f.L - 0.5, f.L + 0.04, y0 + 0.2, y0 + H - 0.1, 0, 0.12, 'f');
      if (o.win !== false) {
        ST.setColor(C.wallD); slab(ST, f, f.L / 2 - ww * 0.9, f.L / 2 + ww * 0.9, y0 + 0.9, y0 + H - 0.6, 0, 0.08, 'f');
        archWin(B, f, f.L / 2, y0 + 1.1, ww, H - 2.0, { sur: ww * 0.34, tcol: C.wall, gcol: C.glass, n: 5, d: 0.1 }); st.windows++;
      }
      ST.setColor(C.wallD); slab(ST, f, -0.18, f.L + 0.18, y0 + H - 0.4, y0 + H, 0, 0.34, 'ftb');
      ST.setColor(C.mauve); slab(ST, f, -0.2, f.L + 0.2, y0 + H - 0.15, y0 + H + 0.08, 0, 0.4, 'ft');
    }
    st.drums++;
    return y0 + H + 0.08;
  };
  const crown = (cx, cz, yEave, R, Hs, crossH) => {
    // the flared slate cap (an eight-sided body of revolution), then the ball and the cross
    B.roof.setColor(C.spire); spire(B.roof, PROFILES.bell, 8, cx, cz, yEave, R, Hs);
    B.roof.setColor(C.spire); B.roof.cyl(cx, yEave - 0.35, cz, R * 0.99, R * 1.22, 0.36, 8, true);
    ball(B.dome, cx, yEave + Hs + 0.25, cz, 0.38); cross(B.dome, cx, yEave + Hs + 0.45, cz, crossH, GOLD);
    return yEave + Hs + 0.45 + crossH;
  };
  // the central tower: an octagonal stage over the crossing, then the arched drum, then the cap
  const cu = 0.0, cv = VA;
  { const R1 = 6.5, y1 = Y(21.4); const t1 = drumOct(cu, cv, y1, R1, 9.6, { win: true, ww: 2.0, wall: C.wall });
    const t2 = drumOct(cu, cv, t1, 4.9, 9.2, { ww: 1.7 });
    var topC = crown(cu, cv, t2 + 0.1, 5.6, 14.5, 5.2);
  }
  // the two west drums on the corner masses
  const topS = masses.map((m) => { const t = drumOct(m.u, m.v, Y(Hm), 3.5, 8.0, { ww: 1.35 }); return crown(m.u, m.v, t + 0.1, 4.2, 9.5, 3.6); });
  // a stepped base under each west drum: a plain octagonal neck
  for (const m of masses) { ST.setColor(C.wallD); ST.cyl(m.u, Y(Hm) - 0.05, m.v, 3.9, 3.8, 0.4, 8, true); }

  // ======================================================================== the conches, the east block and the apse
  // the north / south conches of the crossing
  const conch = (u0, u1, v0, v1, sg) => {
    const FR = volume(u0, u1, v0, v1, 11.4, { sides: { W: 1, E: 1, N: sg < 0, S: sg > 0 }, belts: [4.4, 9.0], win: { y0: 3.6, h: 5.6, w: 0.9, bay: 4.2, sides: sg < 0 ? 'N' : 'S' } });
    gable(B.roof, { a0: v0 + (sg < 0 ? 0 : -0.2), a1: v1 + (sg < 0 ? 0.2 : 0), b0: u0, b1: u1, yE: Y(11.4), yR: Y(11.4 + 3.4), ridge: 'v', ov: 0.5, rake: 0.4, col: C.roof, G: W, gcol: C.wall });
    return FR;
  };
  conch(-6.2, 6.3, hv0 - 2.5, hv0 + 0.3, -1); conch(-3.6, 7.3, hv1 - 0.3, hv1 + 2.5, 1);
  // the east block (the sanctuary) and the polygonal apse
  const eu0 = hu1 - 0.3, eu1 = 20.3, ev0 = VA - 9.7, ev1 = VA + 9.7;
  volume(eu0, eu1, ev0, ev1, 14.6, { sides: { W: 0, E: 0, N: 1, S: 1 }, belts: [4.4, 9.5], win: { y0: 4.0, h: 6.6, w: 0.95, bay: 4.4, sides: 'NS' } });
  gable(B.roof, { a0: eu0, a1: eu1 + 3.2, b0: ev0, b1: ev1, yE: Y(14.6), yR: Y(14.6 + 4.6), ridge: 'u', ov: 0.5, rake: 0.3, hip1: true, col: C.roof, G: W, gcol: C.wall });
  const AP = [[20.3, -4.7], [22.3, -3.8], [23.4, -2.4], [24.1, -1.0], [23.8, 1.9], [21.6, 4.5], [20.3, 5.0]].map(([u, v]) => [u + 0.0, v + 0.0]);
  // the apse polygon in local (u, v): the OSM ring's eastern points, a half-height wall with three windows
  const apRing = AP.concat([[20.3, 5.0], [20.3, -4.7]]).slice(0, AP.length);
  { const Ha = 11.2;
    for (let i = 0; i + 1 < apRing.length; i++) {
      const f = edgeFrame(apRing[i + 1], apRing[i]), L = f.L;
      const f2 = f.n[0] * (apRing[i][0] + apRing[i + 1][0]) / 2 + f.n[1] * ((apRing[i][1] + apRing[i + 1][1]) / 2 - VA) < 0 ? edgeFrame(apRing[i], apRing[i + 1]) : f;
      W.setColor(C.wall); rect(W, f2, 0, f2.L, gLo, Y(Ha));
      ST.setColor(C.base); slab(ST, f2, -0.05, f2.L + 0.05, gLo, Y(1.5), 0, 0.26, 'ft');
      ST.setColor(C.mauve); slab(ST, f2, -0.02, f2.L + 0.02, Y(4.4), Y(4.72), 0, 0.1, 'f'); slab(ST, f2, -0.02, f2.L + 0.02, Y(9.0), Y(9.32), 0, 0.1, 'f');
      ST.setColor(C.wallD); slab(ST, f2, -0.2, f2.L + 0.2, Y(Ha) - 0.5, Y(Ha) + 0.05, 0, 0.4, 'ftb');
      ST.setColor(C.mauve); slab(ST, f2, -0.25, f2.L + 0.25, Y(Ha) - 0.15, Y(Ha) + 0.1, 0, 0.48, 'ft');
      if (L > 2.2) { archWin(B, f2, f2.L / 2, Y(3.8), 0.9, 5.4, { sur: 0.22, tcol: C.wall, gcol: C.glass, n: 4 }); st.windows++; }
    }
    const apex = [eu1 - 0.1, Y(Ha + 3.8), VA], eave = apRing.map(([u, v]) => { const dx = u - apex[0], dz = v - apex[2], d = Math.hypot(dx, dz) || 1; return [u + dx / d * 0.45, Y(Ha) - 0.2, v + dz / d * 0.45]; });
    B.roof.setColor(C.roof); fanRoof(B.roof, apex, eave);
    cross(B.dome, 22.0, apex[1] + 0.2, VA, 2.4, GOLD);
  }
  // the dark granite base all round (the volumes added their own); the pilaster strips of the hall corners
  for (const [u, v] of [[hu1, hv0], [hu1, hv1]]) { ST.setColor(C.mauve); ST.box(u - 0.5, gLo, v - 0.5, u + 0.5, Y(Hn), v + 0.5); }

  end(B);

  // ---- colliders: the hall and its roof, the front bay with its stair, the masses, the crossing tower and the drums, the apse
  const obox = (u0, u1, v0, v1, y0, y1, kind = 'wall') => { S.obox(...toW((u0 + u1) / 2, (v0 + v1) / 2), (u1 - u0) / 2, (v1 - v0) / 2, F.yaw, y0, y1, kind); st.solids++; };
  obox(hu0, hu1, hv0, hv1, gLo, Y(Hn)); obox(fu0, hu0 + 0.3, fv0, fv1, gLo, Y(Hn)); obox(mu0, mu1, hv0, VA - 5.3, gLo, Y(Hm)); obox(mu0, mu1, VA + 5.3, hv1, gLo, Y(Hm));
  obox(-6.2, 6.3, hv0 - 2.5, hv0 + 0.3, gLo, Y(11.4)); obox(-3.6, 7.3, hv1 - 0.3, hv1 + 2.5, gLo, Y(11.4)); obox(eu0, eu1, ev0, ev1, gLo, Y(14.6));
  { const ap = apRing.map(([u, v]) => toW(u, v)).concat([toW(20.3, VA)]); S.prism(ap.flat(), gLo, Y(11.2), 0, 0, 'wall'); st.solids++; }
  const k = (ridge - Hn) / 12.75, V = F.V, slope = (v0, v1, sg, edgeV) => {
    const pts = [[hu0, v0], [hu1, v0], [hu1, v1], [hu0, v1]].map(([u, v]) => toW(u, v)).flat();
    S.prism(pts, Y(Hn), Y(Hn) - sg * k * (edgeV + F.cx * V[0] + F.cz * V[1]), sg * k * V[0], sg * k * V[1], 'roof'); st.solids++;
  };
  slope(hv0, VA, 1, hv0); slope(VA, hv1, -1, hv1);
  S.cyl(...toW(cu, cv), Y(Hn), Y(40.2), 6.3, 4.9, 'drum'); S.cyl(...toW(cu, cv), Y(40.2), topC - 5.0, 5.5, 0.3, 'spire'); st.solids += 2;
  for (const m of masses) { S.cyl(...toW(m.u, m.v), Y(Hm), Y(Hm + 8.1), 3.5, 3.4, 'drum'); S.cyl(...toW(m.u, m.v), Y(Hm + 8.1), Y(Hm + 17.6), 4.0, 0.25, 'spire'); st.solids += 2; }
  { // the stair as a ramp a car can climb: rises RISE over 5.6 m
    const slopeU = RISE / 5.58, pts = [[fu0 - 5.58, fv0 - 0.1], [fu0, fv0 - 0.1], [fu0, fv1 + 0.1], [fu0 - 5.58, fv1 + 0.1]].map(([u, v]) => toW(u, v)).flat();
    S.prism(pts, gLo, Fy - slopeU * fu0 - slopeU * (F.U[0] * F.cx + F.U[1] * F.cz), slopeU * F.U[0], slopeU * F.U[1], 'stair'); st.solids++;
  }
  const wr = F.ring.map(([u, v]) => toW(u, v));
  const top = Math.max(topC, ...topS);
  return { footprints: [{ poly: wr, h: top - gLo, kind: 'church', name: 'Catedrala Episcopală «Învierea Domnului»', id: CATHEDRAL_ID }], stats: st, top, F, Fy, gLo, toW };
}

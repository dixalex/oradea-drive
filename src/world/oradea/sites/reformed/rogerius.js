// OWNER: oradea. The Reformed church of Rogerius (Biserica reformată Rogerius, Strada Spartacus; OSM way 1210617912, a Microsoft footprint): a
// modern round church, drawn from the Bing aerial view alone (no photograph of it was found), so its shapes are the aerial's and its walls are
// a guess: a cream round hall with a flat roof, a fan of orange tiled roof facets round its south half (which the 22-point footprint traces),
// a five-sided nave with a dark brown pyramid-like roof to the north, a paved cream terrace on the east.
//   buildRogerius({ B, S, g, spec, ring }) -> { footprints, stats }
import { PI, TAU, begin, end, edgeFrame, rect, slab, poly, win, fanRoof, groundOf } from './kit.js';

const CREAM = '#efe6c8', TRIMC = '#f8f3e4', ORANGE = '#c8683e', BROWN = '#6b4a3a', GLASS = '#33405a', PAVE = '#e6dcc0';

export function buildRogerius({ B, S, g, spec, ring }) {
  const { Fy, gLo } = groundOf(ring, g), Y = (h) => Fy + h, st = { windows: 0, towers: 0 };
  const cx = -1144.5, cz = -1291, WL = B.wall, TL = B.tile, SH = B.sheet, DT = B.det;
  begin(B, 0, 0, 0);
  // the round hall: a 14-sided drum with tall arched windows, a flat roof with a parapet
  const Rd = 8.3, HD = 7.4, n = 14, drum = Array.from({ length: n }, (_, k) => [cx + Math.cos(k * TAU / n) * Rd, cz + Math.sin(k * TAU / n) * Rd]);
  drum.forEach((a, k) => {
    const f = edgeFrame(a, drum[(k + 1) % n]);
    WL.setColor(CREAM); rect(WL, f, 0, f.L, gLo, Y(HD));
    WL.setColor(TRIMC); slab(WL, f, -0.05, f.L + 0.05, Y(HD - 0.5), Y(HD + 0.3), 0, 0.25, 'ftb');
    const ang = (k + 0.5) * TAU / n;
    if (Math.sin(ang) < 0.1) win(B, f, f.L / 2, Y(3.8), 1.0, 3.0, { kind: 'round', trim: TRIMC, glass: GLASS, sur: 0.12, d: 0.06 }), st.windows++;   // the north side is hidden by the nave
  });
  WL.setColor('#d8cfb2'); WL.fill(drum, [], Y(HD + 0.3), true);
  // the fan: eleven orange facets from the drum's foot to a low outer wall, the south half
  const R2 = 16.4, a0 = 8 * PI / 180, a1 = 196 * PI / 180, nf = 11, HO = 3.6;
  const pt = (R, a, y) => [cx + Math.cos(a) * R, y, cz + Math.sin(a) * R];
  for (let i = 0; i < nf; i++) {
    const t0 = a0 + (a1 - a0) * i / nf, t1 = a0 + (a1 - a0) * (i + 1) / nf, tm = (t0 + t1) / 2;
    TL.setColor(i % 2 ? '#c4623a' : ORANGE);
    TL.face([pt(Rd + 0.1, t0, Y(6.0)), pt(Rd + 0.1, t1, Y(6.0)), pt(R2 + 0.5, t1 - 0.02, Y(HO)), pt(R2 + 0.5, t0 + 0.02, Y(HO))], [Math.cos(tm) * 0.4, 0.9, Math.sin(tm) * 0.4]);
    const A = [cx + Math.cos(t0) * R2, cz + Math.sin(t0) * R2], Bp = [cx + Math.cos(t1) * R2, cz + Math.sin(t1) * R2], f = edgeFrame(A, Bp);
    WL.setColor(CREAM); rect(WL, f, 0, f.L, gLo, Y(HO));
    WL.setColor(TRIMC); slab(WL, f, -0.05, f.L + 0.05, Y(HO - 0.3), Y(HO), 0, 0.2, 'ft');
    win(B, f, f.L / 2, Y(0.9), 0.9, 2.0, { kind: 'round', trim: TRIMC, glass: GLASS, sur: 0.1, d: 0.05 }); st.windows++;
  }
  // the nave: a pentagon of walls under a pyramid roof of dark brown sheet
  const N = [[-1161, -1301], [-1161, -1322], [-1153, -1327], [-1143, -1321], [-1135, -1310], [-1137, -1301]];
  N.forEach((a, k) => {
    const f = edgeFrame(a, N[(k + 1) % N.length]);
    WL.setColor(CREAM); rect(WL, f, 0, f.L, gLo, Y(7.0));
    WL.setColor(TRIMC); slab(WL, f, -0.1, f.L + 0.1, Y(6.5), Y(7.1), 0, 0.3, 'ftb'); slab(WL, f, -0.05, f.L + 0.05, gLo, Y(0.7), 0, 0.12, 'ft');
    const m = Math.max(1, Math.round(f.L / 4.2));
    for (let j = 0; j < m; j++) { win(B, f, (j + 0.5) * f.L / m, Y(1.8), 1.1, 3.8, { kind: 'round', trim: TRIMC, glass: GLASS, sur: 0.14, d: 0.06 }); st.windows++; }
  });
  { const apex = [-1149, Y(13.2), -1311], eave = N.map(([x, z]) => { const dx = x - apex[0], dz = z - apex[2], d = Math.hypot(dx, dz); return [x + dx / d * 0.5, Y(6.8), z + dz / d * 0.5]; });
    eave.push(eave[0]);
    SH.setColor(BROWN); fanRoof(SH, apex, eave, BROWN); }
  // the terrace on the east
  { WL.setColor(PAVE); WL.extrude([[-1136, -1308], [-1127, -1313], [-1118, -1293], [-1127, -1288], [-1137, -1293]], [], Y(0), Y(0.3), { top: true, bottom: false, sides: true }); }
  end(B);
  S.cyl(cx, cz, gLo, Y(5.2), R2, R2, 'wall');
  S.cyl(cx, cz, gLo, Y(HD + 0.3), Rd, Rd, 'wall');
  S.prism(N.flat(), gLo, Y(7.2), 0, 0, 'wall');
  return { footprints: [{ poly: ring.map((p) => [p[0], p[1]]), h: 14, kind: 'church', name: spec.name, id: spec.id }], stats: st };
}
void poly;

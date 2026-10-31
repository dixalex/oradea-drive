// OWNER: oradea. One building of the Piața Unirii east side (not a site module): the OSM footprint turned into a mass whose
// public edges carry facade lots, the rest plain walls, a sloped roof band round a flat top. A copy of republicii/building.js
// (finished, committed, not edited) with three additions the east side needs: explicit lots on ANY edge (`spec.edges`), a
// `spec.dressed(i, e)` switch per edge, and a per-spec roof `fall` (the share of the roof's rise a lot's slope keeps).
//   assembleBuilding(ctx, b) -> { footprint, top, floor, lots, E, pieces }
//     ctx: { K, rnd, g (terrain height), index (BuildingIndex), isPublic(x, z), S (solids), pal }
//     b:   { id, ring, holes, spec }     spec: { n, styles, cols: [[wall, trim]], roof: '#hex', kind, name, rise, depth, cap,
//          allPublic, minEdge, tower: [edge indices], towerSpec, towerCells, edgeLots: { i: lot }, edges: { i: [lot, ...] },
//          lots (the main front), lotDefaults, dressed(i, e) -> bool | undefined, after(h) }
//     lot: { w?, style, n, gh, sh, ground, glass, gate, entry, balc, gcell, gpier, nb, piers, cols }  (republicii/facade.js dressLot)
import { face } from '../../../cherkasy/slabkit.js';
import { quad } from '../../../cherkasy/slabkit.js';
import { DP } from '../../../materials.js';
import { dressLot, plainWall } from '../republicii/facade.js';
import { dressTower } from '../republicii/herokit.js';
import { cleanRing, positive, offsetRing } from '../republicii/ring.js';
import { area2 } from '../../../cherkasy/geo.js';

const RISE = 3.4, DEPTH = 3.4;
const shade = (hex, k) => '#' + [1, 3, 5].map((i) => Math.round(parseInt(hex.slice(i, i + 2), 16) * k).toString(16).padStart(2, '0')).join('');

export function assembleBuilding(ctx, b) {
  const { K, rnd, g, index, isPublic, S, pal } = ctx, sp = b.spec;
  const R = cleanRing(positive(b.ring), sp.minVert ?? 0.6), n = R.length;
  const holes = (b.holes ?? []).map((h) => { const c = cleanRing(h); return area2(c) > 0 ? c.slice().reverse() : c; });
  const gAt = (x, z) => { const h = g(x, z); return Number.isFinite(h) ? h : 2; };

  // ---- edges: direction, outward normal, public or plain
  const E = R.map((A, i) => {
    const B = R[(i + 1) % n], L = Math.hypot(B[0] - A[0], B[1] - A[1]), ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L, nx = uz, nz = -ux;
    const mx = (A[0] + B[0]) / 2 + nx * 2.5, mz = (A[1] + B[1]) / 2 + nz * 2.5;
    const tower = !!sp.tower?.includes(i);
    const auto = L >= (sp.minEdge ?? 3.2) && index.at(mx, mz, b.id) == null && (sp.allPublic || isPublic(mx, mz));
    const over = sp.dressed?.(i, { A, B, L, nx, nz });
    return { i, A, B, L, ux, uz, nx, nz, tower, dressed: tower || (over ?? auto), lots: [] };
  });
  const dressed = E.filter((e) => e.dressed);
  const main = dressed.length ? dressed.reduce((m, e) => (e.L > m.L ? e : m), dressed[0]) : null;

  // ---- lots
  let prevCol = -1, lotNo = 0;
  const styleAt = (k) => sp.styles[(k + Math.floor(rnd() * 2)) % sp.styles.length];
  const lotSpec = (e, ov0, k) => {
    const ov = { ...sp.lotDefaults, ...ov0 };
    let ci = Math.floor(rnd() * sp.cols.length); if (sp.cols.length > 1 && ci === prevCol) ci = (ci + 1) % sp.cols.length; prevCol = ci;
    const col = ov.cols ?? sp.cols[ci], style = ov.style ?? styleAt(k);
    const nn = ov.n ?? sp.n;
    return { style, n: nn, pal: pal.idx(col[0], col[1]), trim: col[1], wall: col[0], ground: ov.ground ?? 'A', glass: ov.glass ?? 'A',
      gate: ov.gate ?? null, entry: ov.entry ?? null, balc: ov.balc ?? null, gh: ov.gh, sh: ov.sh, piers: ov.piers, erker: ov.erker, gcell: ov.gcell, gpier: ov.gpier, nb: ov.nb, extra: ov.extra };
  };
  const spread = (e, list) => { // lots read left to right as seen from the street; a lot without w takes the rest
    const tot = list.reduce((s, l) => s + (l.w ?? 0), 0), free = list.filter((l) => !l.w).length, rest = Math.max(0, e.L - tot) / Math.max(1, free);
    let s = 0;
    list.forEach((l, k) => { const w = l.w ?? rest, a = s / e.L; s += w; e.lots.push({ a, b: Math.min(1, s / e.L), spec: lotSpec(e, { ...l, w }, k), def: l }); });
    if (e.lots.length) e.lots[e.lots.length - 1].b = 1;
  };
  for (const e of E) {
    if (!e.dressed) { e.lots = [{ a: 0, b: 1, plain: true }]; continue; }
    if (e.tower) e.lots.push({ a: 0, b: 1, tower: true, spec: lotSpec(e, { w: e.L, ...sp.towerSpec }, 0) });
    else if (sp.edges?.[e.i]) spread(e, sp.edges[e.i]);
    else if (sp.edgeLots?.[e.i]) e.lots.push({ a: 0, b: 1, spec: lotSpec(e, { w: e.L, ...sp.edgeLots[e.i] }, 0), def: sp.edgeLots[e.i] });
    else if (e === main && sp.lots) spread(e, sp.lots);
    else e.lots.push({ a: 0, b: 1, spec: lotSpec(e, { w: e.L, ...(sp.sideLot ?? {}) }, lotNo++), def: sp.sideLot ?? {} });
  }
  // ---- heights: floor level and wall top per lot, the eave of the plain walls, the cap
  const base = Math.min(...R.map((p) => gAt(p[0], p[1])));
  const pieces = [];
  for (const e of E) for (const l of e.lots) {
    const x0 = e.A[0] + e.ux * l.a * e.L, z0 = e.A[1] + e.uz * l.a * e.L, x1 = e.A[0] + e.ux * l.b * e.L, z1 = e.A[1] + e.uz * l.b * e.L;
    const hs = [gAt(x0, z0), gAt(x1, z1), gAt((x0 + x1) / 2, (z0 + z1) / 2)];
    l.e = e; l.lo = Math.min(...hs); l.floor = Math.max(...hs) + 0.14;
    if (l.spec) { const sh = l.spec.sh ?? 3.95, gh = l.spec.gh ?? 4.6; l.He = l.floor + gh + (l.spec.n - 1) * sh; }
    pieces.push(l);
  }
  const hesDressed = pieces.filter((p) => p.spec).map((p) => p.He);
  const Hback = hesDressed.length ? Math.max(...hesDressed) - 0.5 : base + (sp.n ?? 4) * 3.9 + 1;
  for (const p of pieces) if (!p.spec) { p.floor = p.lo; p.He = Math.max(p.floor + 6, Hback); }
  const rise = sp.rise ?? RISE;
  const Hcap = Math.max(...pieces.map((p) => p.He)) + rise;
  for (const p of pieces) p.Hl = Math.min(Hcap, p.He + rise * (sp.fall ?? 1.5));

  // ---- the roof ring: inset DEPTH, or the footprint itself (a parapet) when it folds over
  let ring2 = null, depth = sp.depth ?? DEPTH;
  for (const f of [1, 0.7, 0.45]) { ring2 = offsetRing(R, depth * f); if (ring2) { depth *= f; break; } }
  const Ro = ring2 ?? R;

  // ---- walls
  let nPlain = 0;
  for (const e of E) {
    const f = face(e.B, e.A, e.nx, e.nz); // s runs B -> A: to the viewer's right
    for (const l of e.lots) {
      const sf0 = (1 - l.b) * e.L, sf1 = (1 - l.a) * e.L;
      if (l.plain) {
        const y0 = Math.min(l.lo, gAt(e.A[0], e.A[1]), gAt(e.B[0], e.B[1])) - 1.4;
        plainWall(K, f, sf0, sf1, y0, l.He, pal.idx(sp.cols[0][0], sp.cols[0][1]), rnd()); nPlain++;
      } else if (l.tower) (sp.dressTower ?? ((...a) => dressTower(...a.slice(0, 7), sp.towerCells)))(K, f, sf0, sf1, l.floor, l.spec, rnd, l, e);
      else if (sp.dress) sp.dress(K, f, sf0, sf1, l.floor, l.spec, rnd, l);
      else dressLot(K, f, sf0, sf1, l.floor, l.spec, rnd);
    }
  }
  for (const h of holes) h.forEach((A, i) => { // courtyard walls: plain, normals into the courtyard
    const B = h[(i + 1) % h.length], L = Math.hypot(B[0] - A[0], B[1] - A[1]); if (L < 0.8) return;
    const f = face(B, A, (B[1] - A[1]) / L, -(B[0] - A[0]) / L);
    plainWall(K, f, 0, L, base - 1.4, Hcap, pal.idx(sp.cols[0][0], sp.cols[0][1]), rnd());
  });
  // ---- the roof band: one sloped quad per lot, the cap, the party-wall triangles where heights differ
  const roofCol = sp.roof ?? '#9b4a36', R3 = K.roof;
  R3.setColor(roofCol).setPart(0);
  const P3 = (p, y) => [p[0], y, p[1]];
  const lerp = (P, Q, t) => [P[0] + (Q[0] - P[0]) * t, P[1] + (Q[1] - P[1]) * t];
  const slope = (a, b2, c, d, uv) => {
    const u = [b2[0] - a[0], b2[1] - a[1], b2[2] - a[2]], v = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
    let nn = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]]; if (nn[1] < 0) nn = nn.map((q) => -q);
    const l = Math.hypot(...nn) || 1; quad(R3, a, b2, c, d, nn.map((q) => q / l), uv);
  };
  for (const e of E) {
    const Oa = Ro[e.i], Ob = Ro[(e.i + 1) % n];
    for (const l of e.lots) {
      const E0 = lerp(e.A, e.B, l.a), E1 = lerp(e.A, e.B, l.b), O0 = lerp(Oa, Ob, l.a), O1 = lerp(Oa, Ob, l.b);
      const run = Math.hypot(O0[0] - E0[0], O0[1] - E0[1]), len = Math.hypot(E1[0] - E0[0], E1[1] - E0[1]), sl = Math.hypot(run, l.Hl - l.He);
      slope(P3(E0, l.He + 0.12), P3(E1, l.He + 0.12), P3(O1, l.Hl), P3(O0, l.Hl), [[0, 0], [len, 0], [len, sl], [0, sl]]);
      if (l.Hl < Hcap - 0.05) { R3.setColor('#c9c4b8'); R3.face([P3(O0, l.Hl), P3(O1, l.Hl), P3(O1, Hcap), P3(O0, Hcap)], [e.nx, 0, e.nz]); R3.setColor(roofCol); }
    }
  }
  K.det.setPart(DP.PAINT).setColor(sp.cap ?? shade(roofCol, 0.88));
  K.det.fill(Ro, holes, Hcap, true);
  pieces.forEach((p, k) => {
    const q = pieces[(k + 1) % pieces.length]; if (Math.abs(p.He - q.He) < 0.05) return;
    const same = p.e === q.e, e = q.e, ex = p.e;
    const Bpt = same ? lerp(ex.A, ex.B, p.b) : e.A, Opt = same ? lerp(Ro[ex.i], Ro[(ex.i + 1) % n], p.b) : Ro[e.i];
    const tall = p.He > q.He ? p : q, low = tall === p ? q : p, dirx = same ? ex.ux : (ex.ux + e.ux) / 2, dirz = same ? ex.uz : (ex.uz + e.uz) / 2;
    const sgn = tall === p ? 1 : -1;
    const tri = [P3(Bpt, low.He + 0.12), P3(Bpt, tall.He + 0.12), P3(Opt, tall.Hl), P3(Opt, low.Hl)];
    K.roof.setColor('#c9c4b8'); K.roof.face(tri, [dirx * sgn, 0, dirz * sgn]); K.roof.setColor(roofCol);
  });

  // ---- collision, footprint
  const ringFlat = R.flat(), holeFlat = holes.map((h) => h.flat());
  S.prism(ringFlat, base - 1.5, Hback + rise * 0.5, 0, 0, 'wall', 0, holeFlat);
  const kind = sp.kind ?? 'apt';
  sp.after?.({ K, E, R, Ro, Hcap, depth, pieces, gAt, rnd, pal, S, base, holes, ctx });
  return { footprint: { poly: R, h: Hcap - base, kind, name: sp.name, id: b.id }, top: Hcap, floor: base, nPlain, lots: pieces.length, E, pieces };
}

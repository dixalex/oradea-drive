// The princely palace of the Oradea Fortress: the pentagonal ring of three-storey wings (corps A-E and C of the plan) round the
// courtyard, the corner block at the south-east, and the vaulted passage through the west wing the car drives in by. Not a
// site module: ../cetate.js calls it.
//   buildPalace({ G, B, S, A, r }) -> { footprints, eave, ridge, passage, courtyard, chimneys, stats }
//     G: the platform height;  B: MeshBuilders { plaster, plain, tile, stone, det, glow };  S: the collision world;
//     A: the palace bay atlas (textures.js plasterAtlas().A);  r: seeded rng
// Plan (data.js RING indices): every wing is a band between an outer and an inner path of the ring polygon, cut by chords
// (outer point, inner point) into cells; a wall goes up each boundary edge (bay atlas, kinds in textures.js KIND), the roof of a
// cell is two slopes from the eaves to a ridge through the chords' midpoints, rising with the chord's length.
import { face, at, quad } from '../../../cherkasy/slabkit.js';
import { band, blockBase } from '../../../cherkasy/bayatlas.js';
import { RING } from './data.js';
import { KIND, FH } from './textures.js';
import { roofPoly as roof } from './roofkit.js';

export const EAVE = 3 * FH;         // 11.4 m: three storeys
const TAN = 0.55, RISE = [2.4, 5.2];  // the roof's pitch, and the least / most a ridge stands over the eaves
const hv = ([x, z]) => [x, z];
const P = (i) => RING[i];
const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const same = (a, b, e = 0.35) => dist(a, b) < e;
const dedupe = (pts, e = 0.35) => pts.filter((p, k) => !same(p, pts[(k + pts.length - 1) % pts.length], e));
const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
const dot = (a, b) => a[0] * b[0] + a[1] * b[1];
const cross3 = (u, v) => [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];

// a wing: its outer and inner path (ring indices); `inner` is the facade kind of its courtyard side
const WINGS = [
  { id: 'C', o: [2, 3, 4], i: [1, 0], inner: 'arcade1' },
  { id: 'J', o: [4, 8], i: [0], inner: 'plain', skin: false },
  { id: 'B', o: [8, 9], i: [0, 25], inner: 'arcade1' },
  { id: 'A', o: [9, 10, 11, 12], i: [25, 24, 23], inner: 'arcade1' },
  { id: 'E', o: [12, 13, 14, 15, 16], i: [23, 22, 21], inner: 'plain' },
  { id: 'T', o: [16, 17, 18], i: [21], inner: 'plain' },
  { id: 'D', o: [18, 19], i: [21, 20], inner: 'plain', storeys: 2 },   // the one-storey-and-attic wing of 1775 beside the church
];
const BLOCK = { id: 'K', o: [4, 5, 6], i: [8, 7], inner: 'plain', ends: true };
export const PASSAGE = { hw: 2.1, spring: 2.6, back: 3.0, N: 12 };   // the west wing's vaulted passage, 4.2 m wide

function nearestOnPoly(poly, p) {
  let best = { d: Infinity, pt: poly[0], t: 0 }, acc = 0;
  for (let k = 0; k + 1 < poly.length; k++) {
    const a = poly[k], b = poly[k + 1], e = sub(b, a), L2 = dot(e, e) || 1e-9, L = Math.sqrt(L2);
    const f = Math.max(0, Math.min(1, dot(sub(p, a), e) / L2)), q = [a[0] + e[0] * f, a[1] + e[1] * f], d = dist(p, q);
    if (d < best.d) best = { d, pt: q, t: acc + L * f };
    acc += L;
  }
  return best;
}
const polyLen = (poly) => poly.reduce((s, p, k) => (k ? s + dist(p, poly[k - 1]) : 0), 0);

// chords (outer point, inner point) across a wing, sorted along it; `force` adds chords (cuts of a passage)
function chords(O, I, force = []) {
  const LO = polyLen(O) || 1, out = [];
  const add = (o, i, tag) => out.push({ o, i, tag, key: nearestOnPoly(O, o).t / LO });
  O.forEach((o, k) => { if (k && k < O.length - 1) add(o, nearestOnPoly(I, o).pt); });
  I.forEach((i, k) => { if (k && k < I.length - 1) add(nearestOnPoly(O, i).pt, i); });
  for (const f of force) add(f.o, f.i, f.tag);
  out.sort((a, b) => a.key - b.key);
  const res = [{ o: O[0], i: I[0], key: 0 }];
  for (const c of out) { const p = res[res.length - 1]; if (!(same(c.o, p.o, 0.6) && same(c.i, p.i, 0.6)) || c.tag) res.push(c); }
  const last = { o: O[O.length - 1], i: I[I.length - 1], key: 1 }, p = res[res.length - 1];
  if (same(last.o, p.o, 0.6) && same(last.i, p.i, 0.6)) res[res.length - 1] = { ...last, tag: p.tag }; else res.push(last);
  return res;
}

export function buildPalace({ G, B, S, A, r }) {
  const yE = G + EAVE, stats = { walls: 0, roofs: 0, solids: 0 };
  const kindA = (k) => ({ ...A, base: blockBase(A, KIND[k].r0, KIND[k].nk, G) });
  const cc = [0, 1, 20, 21, 22, 23, 24, 25].reduce((s, i) => [s[0] + P(i)[0] / 8, s[1] + P(i)[1] / 8], [0, 0]);
  const facing = (a, b, ref, away) => {
    const f = face(a, b, 0, 0);
    let nx = f.uz, nz = -f.ux;
    if ((nx * ((a[0] + b[0]) / 2 - ref[0]) + nz * ((a[1] + b[1]) / 2 - ref[1]) > 0) !== away) { nx = -nx; nz = -nz; }
    return Object.assign(f, { nx, nz, N: [nx, 0, nz] });
  };
  const footprints = [];
  const chimneys = [];
  const yEw = (w) => G + (w.storeys ?? 3) * FH;
  const ridgeAt = (c, y0 = yE) => y0 + Math.min(RISE[1], Math.max(RISE[0], dist(c.o, c.i) * 0.5 * TAN));

  // ----------------------------------------------------------------------------------------------- the passage (west wing)
  // from the outer facade (edge 9 -> 10) to the courtyard side (edge 25 -> 24), PASSAGE.back before each edge's end
  const fo = facing(P(9), P(10), cc, true), fi = facing(P(25), P(24), cc, false);
  const so = fo.L - PASSAGE.back, si = fi.L - PASSAGE.back, hw = PASSAGE.hw;
  const tun = {
    oL: at(fo, so - hw, 0), oR: at(fo, so + hw, 0), iL: at(fi, si - hw, 0), iR: at(fi, si + hw, 0),
    oC: at(fo, so, 0), iC: at(fi, si, 0),
  };
  const xz = (p) => [p[0], p[2]];
  const forceA = [{ o: xz(tun.oL), i: xz(tun.iL), tag: 'tl' }, { o: xz(tun.oR), i: xz(tun.iR), tag: 'tr' }];

  // ----------------------------------------------------------------------------------------------- wings: cells, roofs, collision
  const cellsOf = [];
  for (const w of [...WINGS, BLOCK]) {
    const O = w.o.map((i) => P(i)), I = w.i.map((i) => P(i));
    const cs = chords(O, I, w.id === 'A' ? forceA : []);
    for (let k = 0; k + 1 < cs.length; k++) {
      const a = cs[k], b = cs[k + 1];
      cellsOf.push({ w, a, b, lintel: a.tag === 'tl' && b.tag === 'tr' });
    }
    w.cs = cs;
  }
  for (const { w, a, b, lintel } of cellsOf) {
    const yW = yEw(w), Ra = mid(a.o, a.i), Rb = mid(b.o, b.i), ya = ridgeAt(a, yW), yb = ridgeAt(b, yW);
    // the two slopes (outer, inner): polygons of [x, y, z]
    const outer = [[...a.o], [...b.o], Rb, Ra].map((p, k) => [p[0], k < 2 ? yW : (k === 2 ? yb : ya), p[1]]);
    const inner = [[...b.i], [...a.i], Ra, Rb].map((p, k) => [p[0], k < 2 ? yW : (k === 2 ? ya : yb), p[1]]);
    for (const poly of [outer, inner]) roofPoly(poly, lintel);
  }
  // the corner block's two roof ends close with a vertical triangle (the other ends meet a neighbouring roof)
  for (const c of [BLOCK.cs[0], BLOCK.cs[BLOCK.cs.length - 1]]) {
    const R = mid(c.o, c.i), blockMid = mid(P(4), P(7)), y = ridgeAt(c);
    B.plain.setColor('#ece4cc');
    tri3(B.plain, [c.o[0], yE, c.o[1]], [c.i[0], yE, c.i[1]], [R[0], y, R[1]], blockMid);
  }
  // the tip's roof ends against the lower wing D: its end closes with a triangle
  {
    const c = WINGS.find((w) => w.id === 'T').cs.slice(-1)[0], R = mid(c.o, c.i), y = ridgeAt(c);
    B.plain.setColor('#ece4cc');
    tri3(B.plain, [c.o[0], yE, c.o[1]], [c.i[0], yE, c.i[1]], [R[0], y, R[1]], mid(P(16), P(21)));
    const y2 = yEw(WINGS.find((w) => w.id === 'D')) - 0.2, inside = mid(P(16), P(21));
    tri3(B.plain, [c.o[0], y2, c.o[1]], [c.i[0], y2, c.i[1]], [c.i[0], yE, c.i[1]], inside);
    tri3(B.plain, [c.o[0], y2, c.o[1]], [c.i[0], yE, c.i[1]], [c.o[0], yE, c.o[1]], inside);
  }
  // a triangle whose normal points away from the point `inside` (plan)
  function tri3(D, a, b, c, inside) {
    const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    let n = cross3(u, v);
    if (n[0] * (a[0] - inside[0]) + n[2] * (a[2] - inside[1]) < 0) n = n.map((q) => -q);
    const l = Math.hypot(...n) || 1;
    quad(D, a, b, c, c, n.map((q) => q / l));
  }
  function roofPoly(pts, lintel) {
    if (roof(B.tile, S, G, pts, { from: lintel ? G + 4.6 : G, kind: 'palace' })) { stats.roofs++; stats.solids++; }
  }

  // ----------------------------------------------------------------------------------------------- walls
  const wall = (a, b, ref, away, kind, top = yE) => {
    const f = facing(a, b, ref, away);
    band(B.plaster, f, kindA(kind), G, top);
    stats.walls++;
    return f;
  };
  for (const w of [...WINGS, BLOCK]) {
    if (w.skin === false) continue;
    const ref = w.id === 'K' ? mid(P(4), P(7)) : cc;
    for (let k = 0; k + 1 < w.o.length; k++) {
      const a = P(w.o[k]), b = P(w.o[k + 1]);
      if (w.id === 'A' && k === 0) { passageFacade(a, b, true); continue; }
      wall(a, b, ref, true, 'plain', yEw(w));
    }
    for (let k = 0; k + 1 < w.i.length; k++) {
      const a = P(w.i[k]), b = P(w.i[k + 1]);
      if (w.id === 'A' && k === 0) { passageFacade(a, b, false); continue; }
      wall(a, b, ref, w.id === 'K', w.id === 'K' ? 'plain' : w.inner, yEw(w));
    }
  }
  wall(P(6), P(7), mid(P(4), P(7)), true, 'plain');                 // the block's south end

  // the facade pieces round the passage: left of it, right of it, and the strip over its arch
  function passageFacade(a, b, outerSide) {
    const f = facing(a, b, cc, outerSide), s0 = (outerSide ? so : si) - hw, s1 = (outerSide ? so : si) + hw;
    const kind = outerSide ? 'plain' : 'arcade1', Ak = kindA(kind);
    const piece = (p0, p1, y0, y1) => {
      const g = facing(at(f, p0, 0).filter((_, k) => k !== 1), at(f, p1, 0).filter((_, k) => k !== 1), cc, outerSide);
      band(B.plaster, g, Ak, y0, y1);
      stats.walls++;
    };
    piece(0, s0, G, yE); piece(s1, f.L, G, yE);
    const top = G + PASSAGE.spring + hw + 0.45;
    piece(s0, s1, top, yE);
    // the arch's spandrels up to `top`, plain plaster; the stone frame round the opening
    const N = PASSAGE.N, sc = (s0 + s1) / 2;
    const arch = (k) => { const th = Math.PI * k / N; return [sc - hw * Math.cos(th), G + PASSAGE.spring + hw * Math.sin(th)]; };
    B.plain.setColor('#ece4cc');
    for (let k = 0; k < N; k++) {
      const [x0, h0] = arch(k), [x1, h1] = arch(k + 1);
      quad(B.plain, at(f, x0, h0), at(f, x1, h1), at(f, x1, top), at(f, x0, top), f.N);
    }
    B.stone.setColor('#ddd3b8');
    const bd = 0.42;
    for (let k = 0; k < N; k++) {
      const th0 = Math.PI * k / N, th1 = Math.PI * (k + 1) / N, [x0, h0] = arch(k), [x1, h1] = arch(k + 1);
      const X0 = sc - (hw + bd) * Math.cos(th0), H0 = G + PASSAGE.spring + (hw + bd) * Math.sin(th0), X1 = sc - (hw + bd) * Math.cos(th1), H1 = G + PASSAGE.spring + (hw + bd) * Math.sin(th1);
      quad(B.stone, at(f, x0, h0, 0.1), at(f, x1, h1, 0.1), at(f, X1, H1, 0.1), at(f, X0, H0, 0.1), f.N, [[0, 0], [0.4, 0], [0.4, bd], [0, bd]]);
    }
    for (const [sa, sb] of [[s0 - bd, s0], [s1, s1 + bd]]) quad(B.stone, at(f, sa, G, 0.1), at(f, sb, G, 0.1), at(f, sb, G + PASSAGE.spring, 0.1), at(f, sa, G + PASSAGE.spring, 0.1), f.N, [[0, 0], [bd, 0], [bd, PASSAGE.spring], [0, PASSAGE.spring]]);
  }
  // the tunnel: side walls and the barrel vault, in plaster
  {
    const N = PASSAGE.N, ax = sub(xz(tun.iC), xz(tun.oC)), L = Math.hypot(...ax), u = [ax[0] / L, ax[1] / L], t = [-u[1], u[0]];
    const c0 = xz(tun.oC), c1 = xz(tun.iC);
    B.plain.setColor('#e8dfc4');
    const pt = (c, s, y) => [c[0] + t[0] * s, y, c[1] + t[1] * s];
    for (const sd of [-1, 1]) quad(B.plain, pt(c0, sd * hw, G), pt(c1, sd * hw, G), pt(c1, sd * hw, G + PASSAGE.spring), pt(c0, sd * hw, G + PASSAGE.spring), [-t[0] * sd, 0, -t[1] * sd]);
    for (let k = 0; k < N; k++) {
      const th0 = Math.PI * k / N, th1 = Math.PI * (k + 1) / N, m = Math.PI * (k + 0.5) / N;
      const s0 = -hw * Math.cos(th0), s1 = -hw * Math.cos(th1), h0 = G + PASSAGE.spring + hw * Math.sin(th0), h1 = G + PASSAGE.spring + hw * Math.sin(th1);
      quad(B.plain, pt(c0, s0, h0), pt(c1, s0, h0), pt(c1, s1, h1), pt(c0, s1, h1), [Math.cos(m) * t[0], -Math.sin(m), Math.cos(m) * t[1]]);
    }
  }

  // ----------------------------------------------------------------------------------------------- chimneys along the ridges
  B.plain.setColor('#8a4a38');
  for (const { w, a, b } of cellsOf) {
    if (w.id === 'T' || w.id === 'J') continue;
    const Ra = mid(a.o, a.i), Rb = mid(b.o, b.i), L = dist(Ra, Rb);
    if (L < 9) continue;
    const n = Math.max(1, Math.round(L / 22));
    for (let k = 0; k < n; k++) {
      const f = (k + 0.5) / n + (r() - 0.5) * 0.1, x = Ra[0] + (Rb[0] - Ra[0]) * f, z = Ra[1] + (Rb[1] - Ra[1]) * f, y = ridgeAt(a, yEw(w)) + (ridgeAt(b, yEw(w)) - ridgeAt(a, yEw(w))) * f;
      B.plain.box(x - 0.55, y - 0.8, z - 0.55, x + 0.55, y + 2.6, z + 0.55, 0b101111);
      B.stone.setColor('#d4cbb4'); B.stone.box(x - 0.7, y + 2.6, z - 0.7, x + 0.7, y + 2.85, z + 0.7, 0b111111); B.plain.setColor('#8a4a38');
      chimneys.push([x, z, y + 2.85]);
    }
  }

  // ----------------------------------------------------------------------------------------------- footprints, extras
  const ringPoly = RING.map(hv);
  footprints.push({ poly: ringPoly, h: EAVE + 4, kind: 'public', name: 'Palatul Cetății', id: 190653953 });
  return { footprints, eave: yE, passage: { ...PASSAGE, from: xz(tun.oC), to: xz(tun.iC) }, chimneys, cc, stats, cellsOf };
}

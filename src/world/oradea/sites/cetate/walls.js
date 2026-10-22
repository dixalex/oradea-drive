// The walls of the Oradea Fortress: the curtains and bastions seen from the moat (brick over a limestone plinth, a stone
// cordon, a coping), their grassy ramparts inside, the two gates with their bridges, and the counterscarp that holds the
// moat's far side. Not a site module: ../cetate.js calls it.
//   buildWalls({ st, S, B }) -> { gates: [{ id, centre, inward, chord, passage, deck }], stats }
//     st: the shapeMoat result;  S: the collision world;  B: MeshBuilders { wall, rubble, bank, stone, timber, det, glow }
//   uv: `wall` runs one 8 m x WALL_TH tile (u = metres along / 8, v = metres up / WALL_TH); every other builder takes uv in
//   metres (its material's texture repeat is set to its tile size).
// Cross-section (PROFILE in moat.js), metres over the platform G: the moat floor G-5 .. G-3.7, the wall's outer face (the
// exact OSM outline) up to G+5 with a 1.6 m flat top, then an earth bank down to G at 6 m inside; the counterscarp, a stone
// face from the floor to G+1 with a 4 m wide top. A gate is a brick portal box let into the curtain (a barrel-vaulted
// passage, a stone-framed arch), a timber bridge on brick piers in front of it; crest, bank, colliders and the counterscarp
// stop at its sides.
import { PROFILE } from './moat.js';
import { OUTLINE, GATES } from './data.js';
import { orient } from './field.js';
import { crossing, gapArcs } from './ringcut.js';
import { ringFaces, face, at, quad } from '../../../cherkasy/slabkit.js';
import { WALL_TH } from './textures.js';

const PW = 5.8, PD = 6.6, BW = 4.4;        // portal half width and depth; the counterscarp's gap for the bridge (half width)
const ARCH = { r: 2.3, spring: 2.5 };       // the passage: round arch 4.6 m wide, crown 4.8 m over the road
const TOP = 6.4;                            // the portal's top over G
const DECK = { half: 3.0, top: 0.32, ramp: 1.6 };      // the street (land) surface is 0.15 over G
const N_ARCH = 14;

const pt = (loop, p) => { const n = loop.length, i = Math.floor(p) % n, f = p - Math.floor(p), [ax, az] = loop[i], [bx, bz] = loop[(i + 1) % n]; return [ax + (bx - ax) * f, az + (bz - az) * f]; };
const neg = (v) => v.map((q) => -q);

export function buildWalls({ st, S, B }) {
  const F = PROFILE, G = st.G;
  const OUT = orient(OUTLINE, true), { face: FACE, outer: OUTER, inner: INNER, crest: CREST } = st.loops;
  const yb = G - F.D - 0.2, yt = G + F.CREST, yfloor = G - (F.D - F.SLOPE) - 0.3, yTopC = G + F.CS_TOP;
  const stats = { solids: 0, faces: 0 };
  const solid = (pts, y0, y1, kind = 'wall', a = null, bx = 0, bz = 0) => {
    const id = S.prism(pts.flat(), y0, a ?? y1, bx, bz, kind);
    if (id >= 0) stats.solids++;
    return id;
  };
  const vWall = (y) => (y - yb) / WALL_TH;

  // ---------------------------------------------------------------------------------------------- the gates (frames)
  const gates = Object.entries(GATES).map(([id, g]) => {
    const u = g.inward, t = [-u[1], u[0]];
    const line = (side, hw) => ({ at: [g.at[0] + t[0] * side * hw, g.at[1] + t[1] * side * hw], dir: u });
    const wl = line(-1, PW), wr = line(1, PW);
    const gp = [crossing(OUT, wl), crossing(OUT, wr)];
    return { id, ...g, u, t, wall: { l: wl, r: wr }, moat: { l: line(-1, BW), r: line(1, BW) },
      pl: pt(OUT, gp[0]), pr: pt(OUT, gp[1]), centre: pt(OUT, crossing(OUT, { at: g.at, dir: u })), gp };
  });
  const wallGaps = gates.map((g) => g.wall), moatGaps = gates.map((g) => g.moat);

  // ---------------------------------------------------------------------------------------------- the outer face
  // one quad per outline edge (the brick tile runs on across corners), left out where a portal stands
  const n = OUT.length, faces = ringFaces(OUT);
  const inGap = (p) => gates.some((g) => {
    let a = g.gp[0], b = g.gp[1];
    if (((b - a) + n) % n > n / 2) [a, b] = [b, a];
    return ((p - a) + n) % n < ((b - a) + n) % n;
  });
  let cum = 0;
  B.wall.setColor('#ffffff');
  faces.forEach((f, i) => {
    const cuts = [0, 1];
    for (const g of gates) for (const gp of g.gp) { const fr = gp - i; if (fr > 1e-6 && fr < 1 - 1e-6) cuts.push(fr); }
    cuts.sort((a, b) => a - b);
    for (let k = 0; k + 1 < cuts.length; k++) {
      const a = cuts[k], b = cuts[k + 1];
      if (b - a < 1e-6 || inGap(i + (a + b) / 2)) continue;
      const s0 = a * f.L, s1 = b * f.L, u0 = (cum + s0) / 8, u1 = (cum + s1) / 8;
      quad(B.wall, at(f, s0, yb), at(f, s1, yb), at(f, s1, yt), at(f, s0, yt), f.N, [[u0, 0], [u1, 0], [u1, vWall(yt)], [u0, vWall(yt)]]);
      stats.faces++;
    }
    cum += f.L;
  });

  // ---------------------------------------------------------------------------------------------- crest, bank, rampart colliders
  const crestArcs = gapArcs(OUT, CREST, wallGaps), innerArcs = gapArcs(OUT, INNER, wallGaps);
  B.bank.setColor('#cdd7a0');
  for (const p of crestArcs) {
    const poly = [...p.a, ...p.b.slice().reverse()];
    if (poly.length >= 3) B.bank.fill(poly, [], yt, true);
  }
  B.bank.setColor('#b5c386');
  crestArcs.forEach((p, k) => zip(B.bank, p.b, yt, innerArcs[k].b, G + 0.02));
  for (const p of innerArcs) {
    const poly = [...p.a, ...p.b.slice().reverse()];
    if (poly.length >= 3) solid(orient(poly, true), yb, yt, 'rampart');
  }
  // a strip of triangles between two polylines that run the same way (the bank's slope), shaded flat
  function zip(D, A, yA, Q, yQ) {
    const P = (L, k, y) => [L[k][0], y, L[k][1]];
    const d = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const tri = (p, q, w) => {
      const e1 = [q[0] - p[0], q[1] - p[1], q[2] - p[2]], e2 = [w[0] - p[0], w[1] - p[1], w[2] - p[2]];
      let nx = e1[1] * e2[2] - e1[2] * e2[1], ny = e1[2] * e2[0] - e1[0] * e2[2], nz = e1[0] * e2[1] - e1[1] * e2[0];
      const up = ny >= 0, l = Math.hypot(nx, ny, nz) || 1, s = up ? 1 / l : -1 / l;
      nx *= s; ny *= s; nz *= s;
      const o = D.v;
      for (const v of [p, q, w]) D.vert(v[0], v[1], v[2], nx, ny, nz, v[0], v[2]);
      if (up) D.tri(o, o + 1, o + 2); else D.tri(o, o + 2, o + 1);
    };
    let i = 0, j = 0;
    while (i < A.length - 1 || j < Q.length - 1) {
      const dA = i < A.length - 1 ? d(A[i + 1], Q[j]) : Infinity, dQ = j < Q.length - 1 ? d(A[i], Q[j + 1]) : Infinity;
      if (dA <= dQ) { tri(P(A, i, yA), P(A, i + 1, yA), P(Q, j, yQ)); i++; } else { tri(P(A, i, yA), P(Q, j + 1, yQ), P(Q, j, yQ)); j++; }
    }
  }

  // ---------------------------------------------------------------------------------------------- the counterscarp
  const csArcs = gapArcs(OUTER, FACE, moatGaps);
  B.bank.setColor('#d3dba8');
  for (const p of csArcs) {
    const poly = [...p.a, ...p.b.slice().reverse()];
    if (poly.length >= 3) { B.bank.fill(poly, [], yTopC, true); solid(orient(poly, true), yfloor - 0.5, yTopC, 'counterscarp'); }
    B.rubble.setColor('#ffffff');
    strip(p.b, yfloor, yTopC, -1);                       // the moat face, looking into the moat
    strip(p.a, G - 0.3, yTopC, 1);                       // the street side: a kerb face
  }
  function strip(L, y0, y1, side) {
    let run = 0;
    for (let k = 0; k + 1 < L.length; k++) {
      const [ax, az] = L[k], [bx, bz] = L[k + 1], dx = bx - ax, dz = bz - az, len = Math.hypot(dx, dz);
      if (len < 1e-4) continue;
      const nx = side * dz / len, nz = -side * dx / len;
      quad(B.rubble, [ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], [nx, 0, nz], [[run, y0], [run + len, y0], [run + len, y1], [run, y1]]);
      run += len;
    }
  }

  // ---------------------------------------------------------------------------------------------- gates, built
  const info = gates.map(portal);
  return { gates: info, stats, G };

  // a box in a face's frame: s0..s1 along it, y0..y1, o0..o1 outward; uv in metres
  function boxF(f, D, s0, s1, y0, y1, o0, o1) {
    const P = (s, y, o) => at(f, s, y, o);
    const q = (a, b, c, d, nv, w, h) => quad(D, a, b, c, d, nv, [[0, 0], [w, 0], [w, h], [0, h]]);
    q(P(s0, y0, o1), P(s1, y0, o1), P(s1, y1, o1), P(s0, y1, o1), f.N, s1 - s0, y1 - y0);
    q(P(s0, y1, o0), P(s1, y1, o0), P(s1, y1, o1), P(s0, y1, o1), [0, 1, 0], s1 - s0, o1 - o0);
    q(P(s0, y0, o0), P(s0, y0, o1), P(s0, y1, o1), P(s0, y1, o0), neg(f.U), o1 - o0, y1 - y0);
    q(P(s1, y0, o0), P(s1, y0, o1), P(s1, y1, o1), P(s1, y1, o0), f.U, o1 - o0, y1 - y0);
    q(P(s1, y0, o0), P(s0, y0, o0), P(s0, y1, o0), P(s1, y1, o0), neg(f.N), s1 - s0, y1 - y0);
  }

  function portal(g) {
    const f = face(g.pl, g.pr, -g.u[0], -g.u[1]);              // s from the left end, o outward
    const Lc = f.L, rd = ARCH.r;
    const sc = Math.min(Lc - rd - 0.7, Math.max(rd + 0.7, (g.centre[0] - g.pl[0]) * f.ux + (g.centre[1] - g.pl[1]) * f.uz));
    const yTop = G + TOP, yG = G, ySp = G + ARCH.spring;
    const arch = (k) => { const th = Math.PI * k / N_ARCH; return [sc - rd * Math.cos(th), ySp + rd * Math.sin(th)]; };
    // brick faces round the arch (front o = 0, rear o = -PD): the tile up to the crest line, plain brick above it
    const brick = (o, nv) => {
      const q4 = (s0, s1, ya, yc) => quad(B.wall, at(f, s0, ya, o), at(f, s1, yc, o), at(f, s1, yt, o), at(f, s0, yt, o), nv,
        [[s0 / 8, vWall(ya)], [s1 / 8, vWall(yc)], [s1 / 8, vWall(yt)], [s0 / 8, vWall(yt)]]);
      q4(0, sc - rd, yb, yb); q4(sc + rd, Lc, yb, yb); q4(sc - rd, sc + rd, yb, yG);
      for (let k = 0; k < N_ARCH; k++) { const [s0, h0] = arch(k), [s1, h1] = arch(k + 1); q4(s0, s1, h0, h1); }
      quad(B.wall, at(f, 0, yt, o), at(f, Lc, yt, o), at(f, Lc, yTop, o), at(f, 0, yTop, o), nv, [[0, 0.3], [Lc / 8, 0.3], [Lc / 8, 0.3 + (yTop - yt) / WALL_TH], [0, 0.3 + (yTop - yt) / WALL_TH]]);
    };
    B.wall.setColor('#ffffff');
    brick(0, f.N); brick(-PD, neg(f.N));
    stats.faces += 2;
    // the stone frame: arch band, pilasters, imposts, keystone, cornice
    const st0 = B.stone, band = 0.62, o1 = 0.12;
    st0.setColor('#e3d9bf');
    for (let k = 0; k < N_ARCH; k++) {
      const [s0, h0] = arch(k), [s1, h1] = arch(k + 1);
      const c0 = Math.cos(Math.PI * k / N_ARCH), c1 = Math.cos(Math.PI * (k + 1) / N_ARCH), n0 = Math.sin(Math.PI * k / N_ARCH), n1 = Math.sin(Math.PI * (k + 1) / N_ARCH);
      const so0 = sc - (rd + band) * c0, ho0 = ySp + (rd + band) * n0, so1 = sc - (rd + band) * c1, ho1 = ySp + (rd + band) * n1;
      quad(st0, at(f, s0, h0, o1), at(f, s1, h1, o1), at(f, so1, ho1, o1), at(f, so0, ho0, o1), f.N, [[0, 0], [0.4, 0], [0.4, 0.6], [0, 0.6]]);
      const m = Math.PI * (k + 0.5) / N_ARCH;                          // the band's soffit, a strip between face and frame
      quad(st0, at(f, s0, h0, 0), at(f, s1, h1, 0), at(f, s1, h1, o1), at(f, s0, h0, o1), [Math.cos(m) * f.ux, -Math.sin(m), Math.cos(m) * f.uz], [[0, 0], [0.4, 0], [0.4, 0.12], [0, 0.12]]);
      quad(st0, at(f, so0, ho0, 0), at(f, so1, ho1, 0), at(f, so1, ho1, o1), at(f, so0, ho0, o1), [-Math.cos(m) * f.ux, Math.sin(m), -Math.cos(m) * f.uz], [[0, 0], [0.4, 0], [0.4, 0.12], [0, 0.12]]);
    }
    for (const side of [-1, 1]) {
      const sa = side < 0 ? sc - rd - band : sc + rd, sb = side < 0 ? sc - rd : sc + rd + band;
      boxF(f, st0, sa, sb, yG, ySp, 0, o1);                                    // the jamb pilasters
      boxF(f, st0, side < 0 ? sa - 0.18 : sb - 0.1, side < 0 ? sa + 0.1 + band : sb + 0.18, ySp - 0.2, ySp + 0.1, 0, o1 + 0.12);   // impost blocks
    }
    boxF(f, st0, sc - 0.3, sc + 0.3, ySp + rd + band - 0.1, ySp + rd + band + 0.4, 0, o1 + 0.1);           // keystone
    st0.setColor('#d4c9ad');
    boxF(f, st0, -0.15, Lc + 0.15, yTop - 0.45, yTop + 0.1, -PD - 0.15, 0.3);                               // the cornice over the portal
    // the box's sides, the passage inside
    for (const [s, ns] of [[0, neg(f.U)], [Lc, f.U]]) {
      quad(B.wall, at(f, s, yb, 0), at(f, s, yb, -PD), at(f, s, yTop, -PD), at(f, s, yTop, 0), ns, [[0, 0], [PD / 8, 0], [PD / 8, vWall(yTop)], [0, vWall(yTop)]]);
    }
    for (const s of [sc - rd, sc + rd]) {
      quad(B.wall, at(f, s, yG, 0), at(f, s, yG, -PD), at(f, s, ySp, -PD), at(f, s, ySp, 0), s < sc ? f.U : neg(f.U), [[0, 0.3], [PD / 8, 0.3], [PD / 8, 0.3 + 2.5 / WALL_TH], [0, 0.3 + 2.5 / WALL_TH]]);
    }
    for (let k = 0; k < N_ARCH; k++) {
      const [s0, h0] = arch(k), [s1, h1] = arch(k + 1), m = Math.PI * (k + 0.5) / N_ARCH;
      quad(B.wall, at(f, s0, h0, 0), at(f, s0, h0, -PD), at(f, s1, h1, -PD), at(f, s1, h1, 0), [Math.cos(m) * f.ux, -Math.sin(m), Math.cos(m) * f.uz],
        [[0, 0.5], [PD / 8, 0.5], [PD / 8, 0.56], [0, 0.56]]);
    }
    st0.setColor('#a39d8c');
    quad(st0, at(f, 0, yTop, 0), at(f, Lc, yTop, 0), at(f, Lc, yTop, -PD), at(f, 0, yTop, -PD), [0, 1, 0], [[0, 0], [Lc, 0], [Lc, PD], [0, PD]]);
    // a lantern on each side of the front
    for (const side of [-1, 1]) {
      const s = side < 0 ? sc - rd - band - 0.9 : sc + rd + band + 0.9;
      B.det.setColor('#2b2a28'); boxF(f, B.det, s - 0.06, s + 0.06, G + 2.2, G + 3.0, 0.05, 0.17);
      B.det.setColor('#2b2a28'); boxF(f, B.det, s - 0.14, s + 0.14, G + 3.0, G + 3.06, 0.0, 0.36);
      B.glow.setColor('#ffe2a0'); boxF(f, B.glow, s - 0.1, s + 0.1, G + 3.06, G + 3.5, 0.04, 0.3);
    }
    // colliders: two piers and the lintel over the road
    const sol = (s0, s1, o0, o1, a, b2) => {
      const P = [[s0, o0], [s1, o0], [s1, o1], [s0, o1]].map(([s, o]) => { const p = at(f, s, 0, o); return [p[0], p[2]]; });
      solid(orient(P, true), a, b2, 'portal');
    };
    sol(0, sc - rd, -PD, 0, yb, yTop); sol(sc + rd, Lc, -PD, 0, yb, yTop); sol(sc - rd, sc + rd, -PD, 0, G + 4.45, yTop);
    return { id: g.id, centre: g.centre, inward: g.u, chord: [g.pl, g.pr], passage: { half: rd, height: ARCH.spring + rd, depth: PD }, deck: bridge(g) };
  }

  // ---------------------------------------------------------------------------------------------- the bridge
  function bridge(g) {
    const pO = pt(OUTER, crossing(OUTER, { at: g.centre, dir: g.u }));
    const Ld = Math.hypot(pO[0] - g.centre[0], pO[1] - g.centre[1]) + 1.2, w = DECK.half, W = 2 * w;
    const a = [g.centre[0] - g.t[0] * w, g.centre[1] - g.t[1] * w], b = [g.centre[0] + g.t[0] * w, g.centre[1] + g.t[1] * w];
    const fb = face(a, b, -g.u[0], -g.u[1]);                   // s across, o outward from the portal's front
    const yD = G + DECK.top, rampFrom = Ld - DECK.ramp, yEnd = G + 0.16;
    const yAt = (o) => (o <= rampFrom ? yD : yD + (yEnd - yD) * (o - rampFrom) / DECK.ramp);
    // planks (two pieces: level, then the ramp down to the street)
    B.timber.setColor('#c79a68');
    quad(B.timber, at(fb, 0, yD, -0.3), at(fb, W, yD, -0.3), at(fb, W, yD, rampFrom), at(fb, 0, yD, rampFrom), [0, 1, 0], [[0, 0], [W, 0], [W, rampFrom + 0.3], [0, rampFrom + 0.3]]);
    quad(B.timber, at(fb, 0, yD, rampFrom), at(fb, W, yD, rampFrom), at(fb, W, yEnd, Ld), at(fb, 0, yEnd, Ld), [0, 1, 0], [[0, 0], [W, 0], [W, DECK.ramp], [0, DECK.ramp]]);
    // the fascia beams on both sides and the underside
    B.timber.setColor('#7d5638');
    for (const s of [0, W]) {
      quad(B.timber, at(fb, s, yD - 0.6, -0.3), at(fb, s, yD - 0.6, Ld), at(fb, s, yAt(Ld), Ld), at(fb, s, yD, -0.3), s ? fb.U : neg(fb.U), [[0, 0], [Ld, 0], [Ld, 0.6], [0, 0.6]]);
    }
    quad(B.timber, at(fb, 0, yD - 0.6, -0.3), at(fb, W, yD - 0.6, -0.3), at(fb, W, yD - 0.6, Ld), at(fb, 0, yD - 0.6, Ld), [0, -1, 0], [[0, 0], [W, 0], [W, Ld], [0, Ld]]);
    // brick piers: at both ends of the span and every ~7 m between, from the moat floor
    const bays = Math.max(1, Math.round((Ld - 3) / 7)), piers = [0.9];
    for (let k = 1; k < bays; k++) piers.push(0.9 + (Ld - 2.4) * k / bays);
    piers.push(Ld - 1.5);
    B.wall.setColor('#ffffff');
    for (const o of piers) pierBox(fb, o, W);
    // railings: posts, a top rail, a mid rail and the X braces of the photographs, both sides
    B.timber.setColor('#8f5d37');
    const posts = Math.max(2, Math.round((Ld - DECK.ramp) / 2.2)), dz = (rampFrom - 0.1) / posts;
    for (const s of [0.12, W - 0.12]) {
      for (let k = 0; k <= posts; k++) box3(fb, B.timber, s - 0.08, s + 0.08, yD, yD + 1.15, k * dz - 0.08, k * dz + 0.08);
      box3(fb, B.timber, s - 0.07, s + 0.07, yD + 1.0, yD + 1.14, 0, posts * dz);
      box3(fb, B.timber, s - 0.05, s + 0.05, yD + 0.25, yD + 0.35, 0, posts * dz);
      for (let k = 0; k < posts; k++) {
        const x0 = k * dz + 0.08, x1 = (k + 1) * dz - 0.08;
        B.timber.tube(at(fb, s, yD + 0.35, x0), at(fb, s, yD + 1.0, x1), 0.04, 4);
        B.timber.tube(at(fb, s, yD + 1.0, x0), at(fb, s, yD + 0.35, x1), 0.04, 4);
      }
    }
    // colliders: the deck (level, then the ramp), and a low rail each side so a car cannot slip off
    const P4 = (s0, s1, o0, o1) => [[s0, o0], [s1, o0], [s1, o1], [s0, o1]].map(([s, o]) => { const p = at(fb, s, 0, o); return [p[0], p[2]]; });
    solid(orient(P4(0, W, -0.3, rampFrom), true), G - 1.0, yD, 'deck');
    const k = (yD - yEnd) / DECK.ramp, nx = fb.nx, nz = fb.nz;            // top = yD - k * (o - rampFrom), o = (p - centre) . N
    const cN = g.centre[0] * nx + g.centre[1] * nz;
    solid(orient(P4(0, W, rampFrom, Ld), true), G - 1.0, yD, 'deck', yD + k * rampFrom + k * cN, -k * nx, -k * nz);
    solid(orient(P4(-0.12, 0.2, -0.3, Ld), true), yD, yD + 1.2, 'rail');
    solid(orient(P4(W - 0.2, W + 0.12, -0.3, Ld), true), yD, yD + 1.2, 'rail');
    // the counterscarp's cut ends where the bridge passes: stone faces closing the gap
    for (const line of [g.moat.l, g.moat.r]) {
      const pf = pt(FACE, crossing(FACE, line)), po = pt(OUTER, crossing(OUTER, line)), L = Math.hypot(po[0] - pf[0], po[1] - pf[1]) || 1;
      const side = line === g.moat.l ? 1 : -1;                              // the face looks toward the bridge's axis
      B.rubble.setColor('#ffffff');
      quad(B.rubble, [pf[0], yfloor, pf[1]], [po[0], yfloor, po[1]], [po[0], yTopC, po[1]], [pf[0], yTopC, pf[1]], [g.t[0] * side, 0, g.t[1] * side],
        [[0, yfloor], [L, yfloor], [L, yTopC], [0, yTopC]]);
    }
    return { a, b, len: Ld, width: W, y: yD, from: g.centre, dir: [-g.u[0], -g.u[1]], rampFrom, yAt };
  }
  function pierBox(fb, o, W) {
    const yTopP = G + DECK.top - 0.6, yBot = yfloor - 0.4, s0 = 0.35, s1 = W - 0.35, o0 = o - 0.55, o1 = o + 0.55;
    const P = (s, y, oo) => at(fb, s, y, oo), v0 = vWall(yBot), v1 = vWall(yTopP);
    const uv = (w) => [[0, v0], [w / 8, v0], [w / 8, v1], [0, v1]];
    quad(B.wall, P(s0, yBot, o1), P(s1, yBot, o1), P(s1, yTopP, o1), P(s0, yTopP, o1), fb.N, uv(s1 - s0));
    quad(B.wall, P(s0, yBot, o0), P(s1, yBot, o0), P(s1, yTopP, o0), P(s0, yTopP, o0), neg(fb.N), uv(s1 - s0));
    quad(B.wall, P(s0, yBot, o0), P(s0, yBot, o1), P(s0, yTopP, o1), P(s0, yTopP, o0), neg(fb.U), uv(o1 - o0));
    quad(B.wall, P(s1, yBot, o0), P(s1, yBot, o1), P(s1, yTopP, o1), P(s1, yTopP, o0), fb.U, uv(o1 - o0));
  }
  function box3(fb, D, s0, s1, y0, y1, o0, o1) {
    const P = (s, y, oo) => at(fb, s, y, oo), uvq = [[0, 0], [1, 0], [1, 1], [0, 1]];
    quad(D, P(s0, y0, o1), P(s1, y0, o1), P(s1, y1, o1), P(s0, y1, o1), fb.N, uvq);
    quad(D, P(s0, y0, o0), P(s1, y0, o0), P(s1, y1, o0), P(s0, y1, o0), neg(fb.N), uvq);
    quad(D, P(s0, y0, o0), P(s0, y0, o1), P(s0, y1, o1), P(s0, y1, o0), neg(fb.U), uvq);
    quad(D, P(s1, y0, o0), P(s1, y0, o1), P(s1, y1, o1), P(s1, y1, o0), fb.U, uvq);
    quad(D, P(s0, y1, o0), P(s1, y1, o0), P(s1, y1, o1), P(s0, y1, o1), [0, 1, 0], uvq);
  }
}

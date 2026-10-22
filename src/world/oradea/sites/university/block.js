// OWNER: oradea. The kit block of the university site (not a site module): an OSM footprint turned into a teaching building –
// a stone ground storey and render storeys drawn by the shared facade shader, a belt course and a cornice, a pitched roof over each
// wing of the plan (courses painted as tile strips), chimneys, dormers, an entrance canopy, the collider and the map footprint.
//   makeKit(ctx) -> { block(spec) -> res | null, slab, canopy, dormer, gableTri }
//     ctx { F (FacadeBuilder), D (detail MeshBuilder), S (solids), g(x, z) ground height, bld(id) -> { ring: [[x, z]..], rec } | null,
//           rnd, foot (array the footprints go to) }
//   spec { id, name?, kind? ('public'), n (storeys), gh (ground storey, 4.2), sh (storey, 3.7), wall '#hex', stone '#hex' | null,
//          layer (STUCCO), stoneLayer (GRANITE), baseLayer + plinth (a plinth band of that layer under a rendered ground storey), holes (courtyards), ring (own outline), keepCollinear, edgeWall (e) => '#hex' | null, bay (3), winW (.45), winH (.55), gwinH (.5), gbay, style, lintel (0..3),
//          trim ('#ebe7dc', the cornice and belt), belt (true), cornice (0.32 m, 0 = none), eave: 'hip' | 'gable' | 'flat' | 'none',
//          roof { col, col2, pitch, ov, maxRise, course, wallCol, ridge }, rects: [{ seed: [x, z], ang: deg }] (manual wings) | null,
//          cover { axes?, minW?, maxN? }, chimneys (count), chimCol, dormers { n per slope, w, col }, door: { e (edge index | 'long'), s (0..1),
//          w, kind ('canopy' | 'plain') }, blank: (edge) => bool, fascia ('#hex'), seed }
//   res { ring, E (edges), rects, fl (floor level), He (eave), yTop (highest ridge), lo, hi, yR: [ridge height per rect] }
import { FacadeBuilder as _F, STYLE, LAYER } from '../../../facade.js';
import { DP } from '../../../materials.js';
import { cleanRing, positive, edgesOf, ringOf, rectCover, growRect, rectCorners } from './geom.js';
import { roofRect, chimney } from './roofs.js';
import { tint, shade } from './util.js';
import { area2 } from '../../../cherkasy/geo.js';

void _F;
const snap = (v) => Math.round(v * 10) / 10;

// a slab along an edge a -> b (outward normal n = (nx, nz)): front face, top and underside; ext lengthens both ends (mitre-ish)
export function slab(D, A, B, nx, nz, y0, y1, off, col, ext = 0.2, part = DP.PAINT) {
  const L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1e-6, ux = (B[0] - A[0]) / L, uz = (B[1] - A[1]) / L;
  const ax = A[0] - ux * ext, az = A[1] - uz * ext, bx = B[0] + ux * ext, bz = B[1] + uz * ext;
  const ox = nx * off, oz = nz * off;
  D.setPart(part).setColor(col);
  D.face([[ax + ox, y0, az + oz], [bx + ox, y0, bz + oz], [bx + ox, y1, bz + oz], [ax + ox, y1, az + oz]], [nx, 0, nz]);
  D.face([[ax, y1, az], [bx, y1, bz], [bx + ox, y1, bz + oz], [ax + ox, y1, az + oz]], [0, 1, 0]);
  D.setColor(shade(col, 0.82));
  D.face([[ax, y0, az], [ax + ox, y0, az + oz], [bx + ox, y0, bz + oz], [bx, y0, bz]], [0, -1, 0]);
}

// a canopy over a door: slab + two brackets, in the frame of an edge (point p on the wall, outward normal n, along u)
export function canopy(D, p, n, u, y, w, depth = 1.2, col = '#d8d3c6') {
  const A = [p[0] - u[0] * w / 2, p[1] - u[1] * w / 2], B = [p[0] + u[0] * w / 2, p[1] + u[1] * w / 2];
  slab(D, A, B, n[0], n[1], y, y + 0.16, depth, col, 0.05);
  D.setPart(DP.STEEL).setColor('#303336');
  for (const s of [-0.42, 0.42]) {
    const x = p[0] + u[0] * w * s, z = p[1] + u[1] * w * s;
    D.tube([x, y - 0.55, z], [x + n[0] * depth * 0.92, y, z + n[1] * depth * 0.92], 0.025, 4);
  }
}

// a small gabled dormer window standing on a roof slope: base point (x, y, z) on the slope, facing the unit (fx, fz), slope drop per metre
export function dormer(D, x, y, z, fx, fz, { w = 1.3, h = 1.2, col = '#f1ede2', roof = '#6b5d52', glass = '#2a3238', drop = 0.62 } = {}) {
  const rx = fz, rz = -fx, hw = w / 2, dep = 1.1;
  const P = (s, q, yy) => [x + rx * s + fx * q, yy, z + rz * s + fz * q];
  D.setPart(DP.PAINT).setColor(col);
  D.face([P(-hw, 0, y), P(hw, 0, y), P(hw, 0, y + h), P(-hw, 0, y + h)], [fx, 0, fz]);
  for (const sg of [-1, 1]) D.face([P(sg * hw, 0, y), P(sg * hw, -dep, y + dep * drop), P(sg * hw, -dep, y + h), P(sg * hw, 0, y + h)].reverse(), [sg * rx, 0, sg * rz]);
  D.setPart(DP.GLASS).setColor(glass);
  D.face([P(-hw * 0.6, 0.02, y + 0.12), P(hw * 0.6, 0.02, y + 0.12), P(hw * 0.6, 0.02, y + h - 0.12), P(-hw * 0.6, 0.02, y + h - 0.12)], [fx, 0, fz]);
  D.setPart(DP.PAINT).setColor(roof);
  const top = y + h + hw * 0.42;
  D.face([P(-hw - 0.1, 0.12, y + h - 0.05), P(hw + 0.1, 0.12, y + h - 0.05), P(hw + 0.1, -dep, top - 0.3), P(-hw - 0.1, -dep, top - 0.3)].slice(0, 4), [0, 1, 0]);
  D.setColor(col);
  D.face([P(-hw, 0, y + h), P(hw, 0, y + h), P(0, 0, top)], [fx, 0, fz]);
}

export function makeKit(ctx) {
  const { F, D, S, g } = ctx;

  function block(spec) {
    const got = spec.ring ? { rec: {} } : ctx.bld(spec.id);
    if (!got) return null;
    const turn = spec.keepCollinear ? 0 : 0.035;
    const ring = spec.ring ? cleanRing(positive(spec.ring), spec.minEdge ?? 0.5, turn) : cleanRing(positive(got.ring), spec.minEdge ?? 0.7, turn);
    // courtyards: negative rings, so that the same edge frame points the walls into the hole
    const holes = (spec.holes ?? got.rec?.holes ?? []).map((h) => { const r = cleanRing(Array.isArray(h[0]) ? h : ringOf(h), 0.5); return area2(r) > 0 ? r.slice().reverse() : r; });
    const E = edgesOf(ring), EH = holes.flatMap((h) => edgesOf(h)), EA = [...E, ...EH], n = spec.n ?? 3, gh = snap(spec.gh ?? 4.2), sh = snap(spec.sh ?? 3.7);
    const gs = [...ring, ...holes.flat()].map(([x, z]) => g(x, z)), lo = Math.min(...gs), hi = Math.max(...gs);
    const fl = hi + 0.12, y0 = lo - 0.6, He = spec.He ?? fl + gh + (n - 1) * sh;
    const layer = spec.layer ?? LAYER.STUCCO, sLayer = spec.stoneLayer ?? LAYER.GRANITE;
    const gain = spec.gain ?? 1.14, wallT = tint(spec.wall ?? '#e9e2d0', layer, gain), stoneT = tint(spec.stone ?? spec.wall ?? '#9a958b', sLayer, gain);
    const bay = spec.bay ?? 3, seed = spec.seed ?? (spec.id % 251);
    const stoneStorey = spec.stone !== null && gh > 0;
    const pU = { floorH: sh, bayW: bay, winW: spec.winW ?? 0.45, winH: spec.winH ?? 0.55, layer, base: layer, tint: wallT, plinth: 0, seed, depth: spec.depth ?? 0.2, lintel: spec.lintel ?? 1, baseY: fl + gh, topY: He, margin: spec.margin ?? 0.6 };
    const pG = { floorH: gh, bayW: spec.gbay ?? bay, winW: spec.gwinW ?? spec.winW ?? 0.45, winH: spec.gwinH ?? 0.5, layer: stoneStorey ? sLayer : layer, base: spec.baseLayer ?? (stoneStorey ? sLayer : layer), tint: stoneStorey ? stoneT : wallT, plinth: spec.plinth ?? 0, seed: seed + 1, depth: spec.depth ?? 0.2, lintel: 0, baseY: fl, topY: fl + gh, margin: spec.margin ?? 0.6 };
    const style = spec.style ?? STYLE.PUNCHED;

    // ---- walls
    for (const e of EA) {
      if (e.L < 0.35) continue;
      const blank = spec.blank?.(e) || e.L < bay * 0.62;
      const st = blank ? STYLE.BLANK : (spec.edgeStyle?.(e) ?? style);
      const ov = spec.edgeWall?.(e); // a per-edge render colour
      const wU = ov ? { ...pU, tint: tint(ov, layer, gain) } : pU, wG = ov && !stoneStorey ? { ...pG, tint: tint(ov, layer, gain) } : pG;
      F.wall(e.A[0], e.A[1], e.B[0], e.B[1], y0, fl, { ...wG, floorH: 10, baseY: y0, topY: fl, winH: 0.2 }, STYLE.BLANK, -10);
      F.wall(e.A[0], e.A[1], e.B[0], e.B[1], fl, fl + gh, wG, spec.gstyle ?? st, -gh);
      if (n > 1) F.wall(e.A[0], e.A[1], e.B[0], e.B[1], fl + gh, He, wU, st, -sh);
    }

    // ---- belt course and cornice
    const cor = spec.cornice ?? 0.34, trim = spec.trim ?? '#ece8dd';
    for (const e of EA) {
      if (e.L < 0.8) continue;
      if (spec.belt !== false && n > 1) slab(D, e.A, e.B, e.nx, e.nz, fl + gh - 0.14, fl + gh + 0.1, 0.1, spec.beltCol ?? trim, 0.08);
      const cTop = (spec.eave ?? 'hip') === 'flat' ? He + 0.02 : He - 0.16;
      if (cor > 0) slab(D, e.A, e.B, e.nx, e.nz, cTop - cor, cTop, 0.18, trim, 0.2);
    }

    // ---- roof
    const eave = spec.eave ?? 'hip', ro = { pitch: 0.62, ov: 0.45, maxRise: 6.2, col: '#b4472c', col2: '#a63f26', course: 0.95, ...(spec.roof ?? {}) };
    let rects = [], yTop = He, yR = [];
    if (eave !== 'flat' && eave !== 'none') {
      rects = spec.rects
        ? spec.rects.map((q) => (q.rect ? { ...q.rect, _o: q.roof } : growRect(ring, holes, q.seed, (q.ang * Math.PI) / 180, { cell: 0.25 }))).filter(Boolean)
        : rectCover(ring, holes, { minW: 2.4, maxN: 4, stop: 0.09, minArea: 0.1, ...(spec.cover ?? {}) });
      if (!rects.length) rects = [rectCover(ring, holes, { minW: 1, maxN: 1, stop: 0.5 })[0]].filter(Boolean);
      for (const r of rects) {
        const ro1 = { ...ro, ...(r._o ?? {}) };
        const y = roofRect(D, r, He, { ...ro1, gable: eave === 'gable' || !!spec.gables?.(r) });
        yR.push(y); yTop = Math.max(yTop, y);
        // the fascia round the eave
        if (ro1.fascia !== false) {
          const c = rectCorners(r, ro1.ov + (eave === 'gable' ? -0.2 : 0));
          const slope = Math.min(r.hw * ro1.pitch, ro1.maxRise) / r.hw, yE = He - ro1.ov * slope;
          for (let i = 0; i < 4; i++) {
            const a = c[i], b = c[(i + 1) % 4], l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
            const nx = (b[1] - a[1]) / l, nz = -(b[0] - a[0]) / l;
            if (eave === 'gable' && i % 2 === 1) continue;
            D.setPart(DP.PAINT).setColor(spec.fascia ?? '#e6e1d4');
            D.face([[a[0], yE - 0.24, a[1]], [b[0], yE - 0.24, b[1]], [b[0], yE + 0.02, b[1]], [a[0], yE + 0.02, a[1]]], [nx, 0, nz]);
          }
        }
      }
      // what the wings leave bare is a flat roof, low
      D.setPart(DP.PAINT).setColor(shade(ro.col, 0.7)).fill(ring, holes, He - 0.01, true);
    } else if (eave === 'flat') {
      D.setPart(DP.PAINT).setColor(spec.flatCol ?? '#6c6a67').fill(ring, holes, He + 0.02, true);
      for (const e of EA) if (e.L > 0.8) slab(D, e.A, e.B, e.nx, e.nz, He - 0.05, He + 0.42, 0.06, trim, 0.06);
    }

    // ---- chimneys on the ridges
    const cn = spec.chimneys ?? (rects.length ? Math.min(3, rects.length + 1) : 0);
    for (let k = 0; k < cn && rects.length; k++) {
      const r = rects[k % rects.length], y = yR[k % rects.length], s = (k % 2 ? 1 : -1) * Math.max(0, r.hl - r.hw) * 0.7;
      chimney(D, r.cx + r.ux * s, y - 1.2, r.cz + r.uz * s, 0.75, 2.6, spec.chimCol ?? '#d4cdb9', spec.chimCap ?? '#4d6b4f', !!spec.chimRound);
    }

    // ---- dormers
    if (spec.dormers && rects.length) {
      const dd = spec.dormers;
      for (let ri = 0; ri < rects.length; ri++) {
        const r = rects[ri];
        if (r.hl < 4 || (dd.minHw && r.hw < dd.minHw)) continue;
        const rise = Math.min(r.hw * ro.pitch, ro.maxRise), per = dd.step ?? 6.5, k = Math.max(1, Math.floor((2 * r.hl - 3) / per));
        for (const sg of [-1, 1]) {
          if (dd.oneSide && sg < 0) continue;
          for (let q = 0; q < k; q++) {
            const s = (q - (k - 1) / 2) * per, qd = r.hw * 0.62, y = He + rise * (1 - qd / r.hw) - 0.3;
            const fx = -r.uz * sg, fz = r.ux * sg, x = r.cx + r.ux * s + fx * qd, z = r.cz + r.uz * s + fz * qd;
            dormer(D, x, y, z, fx, fz, { w: dd.w ?? 1.3, h: dd.h ?? 1.2, col: dd.col ?? '#f1ede2', roof: dd.roof ?? ro.col, drop: rise / r.hw });
          }
        }
      }
    }

    // ---- an entrance: a canopy over a door on the longest edge (or the one asked for)
    const dr = spec.door;
    if (dr !== null) {
      const d = dr ?? {};
      const e = typeof d.e === 'number' ? E[d.e] : E.reduce((m, q) => (q.L > m.L ? q : m), E[0]);
      if (e && e.L > 3.4) {
        const s = (d.s ?? 0.5) * e.L, p = [e.A[0] + e.ux * s, e.A[1] + e.uz * s], w = d.w ?? 2.4, yb = fl;
        const nn = [e.nx, e.nz], uu = [e.ux, e.uz];
        D.setPart(DP.WOOD).setColor(d.col ?? '#4a3426');
        D.face([[p[0] - uu[0] * w / 2 + nn[0] * 0.06, yb, p[1] - uu[1] * w / 2 + nn[1] * 0.06], [p[0] + uu[0] * w / 2 + nn[0] * 0.06, yb, p[1] + uu[1] * w / 2 + nn[1] * 0.06],
          [p[0] + uu[0] * w / 2 + nn[0] * 0.06, yb + 2.5, p[1] + uu[1] * w / 2 + nn[1] * 0.06], [p[0] - uu[0] * w / 2 + nn[0] * 0.06, yb + 2.5, p[1] - uu[1] * w / 2 + nn[1] * 0.06]], [nn[0], 0, nn[1]]);
        D.setPart(DP.PAINT).setColor(trim);
        for (const sg of [-1, 1]) {
          const q = [p[0] + uu[0] * (w / 2 + 0.12) * sg, p[1] + uu[1] * (w / 2 + 0.12) * sg];
          D.box(q[0] - 0.12 - nn[0] * 0.0, yb, q[1] - 0.12, q[0] + 0.12, yb + 2.8, q[1] + 0.12, 63 & ~8);
        }
        if ((d.kind ?? 'canopy') === 'canopy') canopy(D, p, nn, uu, yb + 2.9, w + 1.2, 1.2, trim);
        D.setPart(DP.CONC).setColor('#b3ada0');
        D.face([[p[0] - uu[0] * (w / 2 + 0.3) + nn[0] * 0.02, yb + 0.12, p[1] - uu[1] * (w / 2 + 0.3) + nn[1] * 0.02], [p[0] + uu[0] * (w / 2 + 0.3) + nn[0] * 0.02, yb + 0.12, p[1] + uu[1] * (w / 2 + 0.3) + nn[1] * 0.02],
          [p[0] + uu[0] * (w / 2 + 0.3) + nn[0] * 0.9, yb + 0.12, p[1] + uu[1] * (w / 2 + 0.3) + nn[1] * 0.9], [p[0] - uu[0] * (w / 2 + 0.3) + nn[0] * 0.9, yb + 0.12, p[1] - uu[1] * (w / 2 + 0.3) + nn[1] * 0.9]], [0, 1, 0]);
      }
    }

    // ---- collider, footprint
    S.prism(ring.flat(), lo - 1.2, He + 1.5 + (yTop - He) * 0.4, 0, 0, 'wall', 0, holes.map((h) => h.flat()));
    const foot = { poly: ring, h: yTop - lo, kind: spec.kind ?? 'public', name: spec.name ?? got.rec?.name, id: spec.fid ?? spec.id };
    ctx.foot.push(foot);
    return { ring, E, EH, holes, rects, fl, He, yTop, lo, hi, yR, y0, spec };
  }

  return { block };
}

export { ringOf };

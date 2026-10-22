// OWNER: oradea. Shared pieces of the Baroque ensemble (baroc.js): the three local frames, polygon offsets, roofs, curved
// walls, an arched opening, and the canvas textures the ensemble draws with. Not a site module.
//   frame(O, U) -> { O, U, V, yaw, xz(a, d), loc(x, z), m(y), ring(pts) }   a rotated frame: map = O + a*U + d*V (V = U turned
//     90 degrees), m(y) the Matrix4 for MeshBuilder.with() (local x -> U, local z -> V, y up)
//   BAS / PAL / CAN                    the Basilica, Palace and Canons' Row frames (fitted to the OSM outlines)
//   offsetRing(ring, k)                a ring pushed out by k (miter), either winding
//   frustumRoof(D, rect, levels, o)    hipped roof from stacked inset rectangles: levels [[inset, y], ...]
//   curvedWall(D, pts, y0, y1, o)      a vertical band along a polyline with smoothed normals; o { out: +-1, uvM, col }
//   archPts(cx, y0, w, rise, n)        the outline of an arched window / door opening, left to right
//   arch(D, f, cx, y0, w, h, ...)      see below
//   rg(...)                            a seeded generator
//   textures: plasterTex, rustTex, tileTex, sheetTex, cobbleTex, gravelTex, lawnTex, bedTex, atlas painters
import * as THREE from 'three';
import { M4 } from '../../../../kit/mesh.js';
import { canvasTex } from '../../../cherkasy/sculpt.js';
import { quad } from '../../../cherkasy/slabkit.js';

export const PI = Math.PI;

export function frame(O, U) {
  const V = [-U[1], U[0]], yaw = Math.atan2(-U[1], U[0]);
  const f = {
    O, U, V, yaw,
    xz: (a, d) => [O[0] + U[0] * a + V[0] * d, O[1] + U[1] * a + V[1] * d],
    loc: (x, z) => { const dx = x - O[0], dz = z - O[1]; return [dx * U[0] + dz * U[1], dx * V[0] + dz * V[1]]; },
    m: (y = 0) => M4(O[0], y, O[1], yaw),
    ring: (pts) => pts.map(([a, d]) => f.xz(a, d)),
  };
  return f;
}
export const BAS = frame([-589.3866, -1471.7899], [0.7040147, 0.7101853]);
export const PAL = frame([-585.4243, -1362.3259], [0.6851829, 0.728371]);
export const CAN = frame([-617.7699, -1630.2819], [0.6851829, 0.728371]);

const area = (R) => R.reduce((s, p, i) => { const q = R[(i + 1) % R.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
// a ring pushed out by k (miter joins); either winding
export function offsetRing(R, k) {
  const sg = Math.sign(area(R)) || 1, n = R.length;
  return R.map((p, i) => {
    const a = R[(i + n - 1) % n], b = R[(i + 1) % n];
    const e1 = [p[0] - a[0], p[1] - a[1]], e2 = [b[0] - p[0], b[1] - p[1]], l1 = Math.hypot(...e1) || 1, l2 = Math.hypot(...e2) || 1;
    const n1 = [e1[1] / l1 * sg, -e1[0] / l1 * sg], n2 = [e2[1] / l2 * sg, -e2[0] / l2 * sg];
    const d = 1 + n1[0] * n2[0] + n1[1] * n2[1], m = Math.min(k / Math.max(d, 0.15), k * 3);
    return [p[0] + (n1[0] + n2[0]) * m, p[1] + (n1[1] + n2[1]) * m];
  });
}

// quad with uv in metres (a, b, c, d in order round the quad)
const up3 = (D, a, b, c, d, n, uv) => quad(D, a, b, c, d, n, uv);
function norm3(a, b, c) {
  const u = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]], l = Math.hypot(...n) || 1;
  return n.map((q) => q / l);
}

// a roof from stacked inset rectangles: levels [[inset, y], ...] (the first is the eave rectangle, grown by `over`); a ring
// that collapses on a side becomes the ridge line. uv: metres / uvM along the eave and up the slope.
export function frustumRoof(D, [x0, z0, x1, z1], levels, { over = 0.5, uvM = 2, col = null } = {}) {
  if (col) D.setColor(col);
  x0 -= over; z0 -= over; x1 += over; z1 += over;
  const ring = (k) => {
    let ax = x0 + k, bx = x1 - k, az = z0 + k, bz = z1 - k;
    if (bx < ax) ax = bx = (x0 + x1) / 2;
    if (bz < az) az = bz = (z0 + z1) / 2;
    return [[ax, az], [bx, az], [bx, bz], [ax, bz]];
  };
  const rs = levels.map(([k, y]) => ({ P: ring(k), y }));
  for (let i = 1; i < rs.length; i++) {
    const lo = rs[i - 1], hi = rs[i];
    for (let e = 0; e < 4; e++) {
      const e1 = (e + 1) % 4, a = [lo.P[e][0], lo.y, lo.P[e][1]], b = [lo.P[e1][0], lo.y, lo.P[e1][1]], c = [hi.P[e1][0], hi.y, hi.P[e1][1]], d = [hi.P[e][0], hi.y, hi.P[e][1]];
      const ab = Math.hypot(b[0] - a[0], b[2] - a[2]), dc = Math.hypot(c[0] - d[0], c[2] - d[2]);
      if (ab < 0.05 && dc < 0.05) continue; // collapsed
      let nn = norm3(a, b, dc > 0.05 ? c : d); if (nn[1] < 0) nn = nn.map((q) => -q);
      const slope = Math.hypot(Math.hypot(hi.P[e][0] - lo.P[e][0], hi.P[e][1] - lo.P[e][1]), hi.y - lo.y);
      const uvs = [[0, 0], [ab / uvM, 0], [dc / uvM, slope / uvM], [0, slope / uvM]];
      if (dc < 0.05) { // a hip: triangle
        const m = D.vert(...a, ...nn, 0, 0), m2 = D.vert(...b, ...nn, ab / uvM, 0), m3 = D.vert(...d, ...nn, ab / (2 * uvM), slope / uvM);
        D.tri(m, m2, m3);
      } else up3(D, a, b, c, d, nn, uvs);
    }
  }
  return rs[rs.length - 1].y;
}

// a vertical band along a polyline (travel direction right-handed: the front is on the +out side when out = 1:
// normal = (dz, -dx) for out = 1), smooth normals at the interior points
export function curvedWall(D, pts, y0, y1, { out = 1, uvM = 0, col = null, smooth = true } = {}) {
  if (col) D.setColor(col);
  const n = pts.length, N = [];
  const seg = [];
  for (let i = 0; i < n - 1; i++) { const dx = pts[i + 1][0] - pts[i][0], dz = pts[i + 1][1] - pts[i][1], l = Math.hypot(dx, dz) || 1; seg.push([dz / l * out, -dx / l * out]); }
  for (let i = 0; i < n; i++) {
    const a = seg[Math.max(0, i - 1)], b = seg[Math.min(n - 2, i)];
    if (smooth) { const x = a[0] + b[0], z = a[1] + b[1], l = Math.hypot(x, z) || 1; N.push([x / l, z / l]); } else N.push(b);
  }
  let s = 0; const ids = [];
  for (let i = 0; i < n; i++) {
    if (i) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
    const u = uvM ? s / uvM : 0;
    ids.push([D.vert(pts[i][0], y0, pts[i][1], N[i][0], 0, N[i][1], u, uvM ? y0 / uvM : 0), D.vert(pts[i][0], y1, pts[i][1], N[i][0], 0, N[i][1], u, uvM ? y1 / uvM : 0)]);
  }
  for (let i = 0; i < n - 1; i++) {
    const [a0, a1] = ids[i], [b0, b1] = ids[i + 1];
    // winding: (a0, b0, b1) must face seg[i]
    D.quad(a0, b0, b1, a1);
  }
}

// the points of an arched opening: springline rise, left to right, from the left foot over the crown to the right foot
export function archPts(cx, y0, w, rise, n = 8) {
  const out = [[cx - w / 2, y0]], hy = y0 + rise;
  out.push([cx - w / 2, hy]);
  for (let i = 1; i < n; i++) { const a = PI - (PI * i) / n; out.push([cx + (w / 2) * Math.cos(a), hy + (w / 2) * Math.sin(a) * 0.95]); }
  out.push([cx + w / 2, hy], [cx + w / 2, y0]);
  return out;
}

export const hash = (x, y) => { let h = Math.imul(x * 374761393 + y * 668265263, 1274126177); h = Math.imul(h ^ (h >>> 13), 1103515245); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

// ------------------------------------------------------------------------------------------------------ textures
// fine speckle for plaster, 2.5 m a repeat, the hue from the vertex colour
export const plasterTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#f4f2ec'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2200; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.35)' : 'rgba(90,70,40,0.06)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  for (let i = 0; i < 26; i++) { g.fillStyle = `rgba(120,95,50,${0.025 + r() * 0.03})`; g.beginPath(); g.ellipse(r() * w, r() * h, 12 + r() * 38, 6 + r() * 20, r() * 3, 0, PI * 2); g.fill(); }
});
// rusticated courses: one groove every 1.1 m (two to a 2.2 m repeat), the hue from the vertex colour
export const rustTex = (r) => canvasTex(128, 256, (g, w, h) => {
  g.fillStyle = '#f2f0ea'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 1200; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.3)' : 'rgba(80,60,30,0.07)'; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  for (let k = 0; k < 2; k++) {
    const y = (k * h) / 2;
    g.fillStyle = 'rgba(70,50,20,0.55)'; g.fillRect(0, y, w, 4);
    g.fillStyle = 'rgba(255,250,230,0.5)'; g.fillRect(0, y + 4, w, 3);
    g.fillStyle = 'rgba(70,50,20,0.10)'; g.fillRect(0, y + 7, w, 14);
  }
});
// clay roof tiles, 2 m a repeat: rows of beaver-tails with varied tints
export const tileTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#9a8f86'; g.fillRect(0, 0, w, h);
  const rows = 16, cols = 11, th = h / rows, tw = w / cols;
  for (let j = 0; j < rows; j++) for (let i = -1; i < cols; i++) {
    const x = i * tw + (j & 1 ? tw / 2 : 0), y = j * th, v = 0.82 + r() * 0.3;
    g.fillStyle = `rgb(${Math.min(255, 238 * v) | 0},${Math.min(255, 218 * v) | 0},${Math.min(255, 205 * v) | 0})`;
    g.beginPath(); g.moveTo(x + 1, y); g.lineTo(x + tw - 1, y); g.lineTo(x + tw - 1, y + th * 0.62); g.quadraticCurveTo(x + tw / 2, y + th * 1.25, x + 1, y + th * 0.62); g.closePath(); g.fill();
    g.fillStyle = 'rgba(40,20,10,0.25)'; g.fillRect(x + 1, y + th * 0.55, tw - 2, 2);
  }
});
// sheet-metal roof with standing seams every 0.6 m (2.4 m a repeat)
export const sheetTex = () => canvasTex(256, 64, (g, w, h) => {
  g.fillStyle = '#e9ebec'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 4; i++) { const x = (i * w) / 4; g.fillStyle = '#9fa4a6'; g.fillRect(x, 0, 3, h); g.fillStyle = '#fbfcfc'; g.fillRect(x + 3, 0, 2, h); }
});
// fan-pattern cobbles, a 4 m square: overlapping rows of arcs of small grey setts
export const cobbleTex = (r) => canvasTex(512, 512, (g, w, h) => {
  g.fillStyle = '#6e6f70'; g.fillRect(0, 0, w, h);
  const R = 64, rows = Math.ceil(h / (R * 0.5)) + 2;
  for (let j = rows; j >= 0; j--) {
    for (let i = -1; i <= Math.ceil(w / (R * 2)) + 1; i++) {
      const cx = i * R * 2 + (j & 1 ? R : 0), cy = j * R * 0.5;
      for (let ring = 0; ring < 4; ring++) {
        const rr = R * (1 - ring * 0.2), n = Math.max(5, Math.round(rr * 0.4));
        for (let k = 0; k <= n; k++) {
          const a = (k / n) * PI, x = cx + rr * Math.cos(a), y = cy + rr * Math.sin(a) * 0.95;
          const v = 124 + (r() - 0.5) * 44, wv = 9 + r() * 3;
          g.fillStyle = `rgb(${v | 0},${(v + 1) | 0},${(v + 3) | 0})`; g.fillRect(x - wv / 2, y - 4, wv, 8);
        }
      }
    }
  }
  for (let q = 0; q < 2500; q++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.12)'; g.fillRect(r() * w, r() * h, 2, 2); }
});
// raked gravel for the park paths, 3 m a repeat
export const gravelTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#b9ae98'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 5200; i++) { const v = 130 + r() * 90; g.fillStyle = `rgba(${v | 0},${(v - 8) | 0},${(v - 24) | 0},0.55)`; g.fillRect(r() * w, r() * h, 1 + r() * 2.5, 1 + r() * 2); }
});
// mown lawn, 4 m a repeat
export const lawnTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#5d8a3c'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 90; i++) { g.fillStyle = r() < 0.5 ? 'rgba(160,190,90,0.10)' : 'rgba(20,60,20,0.10)'; g.beginPath(); g.ellipse(r() * w, r() * h, 8 + r() * 26, 5 + r() * 14, r() * 3, 0, PI * 2); g.fill(); }
  for (let i = 0; i < 6000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(30,70,20,0.3)' : 'rgba(180,215,110,0.22)'; g.fillRect(r() * w, r() * h, 1, 2 + r() * 2); }
});
// a flower bed, 2 m a repeat: dark soil, green leaves, red / yellow / white blooms
export const bedTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#3c3326'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(70,115,50,0.8)' : 'rgba(40,85,40,0.8)'; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 6, 2 + r() * 4, r() * 3, 0, PI * 2); g.fill(); }
  const col = ['#c9362f', '#e9c43a', '#f2efe6', '#d86fa0', '#c9362f'];
  for (let i = 0; i < 340; i++) { g.fillStyle = col[(r() * col.length) | 0]; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 2.4, 0, PI * 2); g.fill(); }
});

// a surface of revolution with real uv (metres / uvM): prof [[r, y], ...] bottom -> top with r in units of the squash radii
// sx / sz (an elliptical plan), smooth normals; the hue from the builder's colour
export function lathe2(D, prof, seg, cx, cz, sx, sz, uvM = 2, col = null) {
  if (col) D.setColor(col);
  const rows = [];
  let run = 0;
  prof.forEach(([r, y], i) => {
    if (i) { const [r0, y0] = prof[i - 1]; run += Math.hypot((r - r0) * Math.max(sx, sz), y - y0); }
    const [ra, ya] = prof[Math.max(0, i - 1)], [rb, yb] = prof[Math.min(prof.length - 1, i + 1)];
    const tr = (rb - ra) * Math.max(sx, sz), ty = yb - ya, tl = Math.hypot(tr, ty) || 1, nr = ty / tl, ny = -tr / tl;
    const ids = [];
    for (let k = 0; k <= seg; k++) {
      const a = (k / seg) * PI * 2, c = Math.cos(a), s = Math.sin(a);
      let nx = nr * c / sx, nz = nr * s / sz; const ny2 = ny; const l = Math.hypot(nx, ny2, nz) || 1;
      ids.push(D.vert(cx + c * r * sx, y, cz + s * r * sz, nx / l, ny2 / l, nz / l, (k / seg) * PI * 2 * r * (sx + sz) / 2 / uvM, run / uvM));
    }
    rows.push(ids);
  });
  for (let i = 1; i < rows.length; i++) for (let k = 0; k < seg; k++) D.quad(rows[i - 1][k], rows[i][k], rows[i][k + 1], rows[i - 1][k + 1]);
}

// ---------------------------------------------------------------------------------------------- faces and wall bands
// a wall face from map point p to q with the outward normal (nx, nz) (as civic.js builds them); s runs to the viewer's right
export function mkFace(p, q, nx, nz) {
  const rx = nz, rz = -nx, sp = p[0] * rx + p[1] * rz, sq = q[0] * rx + q[1] * rz, o = sp <= sq ? p : q;
  return { ax: o[0], az: o[1], rx, rz, nx, nz, w: Math.abs(sq - sp), N: [nx, 0, nz], R: [rx, 0, rz], L: [-rx, 0, -rz], open: [] };
}
export const sOn = (f, [x, z]) => (x - f.ax) * f.rx + (z - f.az) * f.rz;
// a face in frame F between the local points pa -> pb, outward normal (nu, nv) in the frame's own axes; gets the
// helpers sOf(t) / tOf(s) for the local coordinate t along the wall (v on a wall facing u, u on a wall facing v)
export function lface(F, pa, pb, nu, nv) {
  const p = F.xz(...pa), q = F.xz(...pb), n = [nu * F.U[0] + nv * F.V[0], nu * F.U[1] + nv * F.V[1]];
  return localize(F, mkFace(p, q, n[0], n[1]));
}
export function localize(F, f) {
  const [a0, d0] = F.loc(f.ax, f.az), da = f.rx * F.U[0] + f.rz * F.U[1], dd = f.rx * F.V[0] + f.rz * F.V[1];
  const alongU = Math.abs(da) > Math.abs(dd);
  f.nu = Math.round(f.nx * F.U[0] + f.nz * F.U[1]); f.nv = Math.round(f.nx * F.V[0] + f.nz * F.V[1]);
  f.t0 = alongU ? a0 : d0; f.dir = Math.sign(alongU ? da : dd) || 1; f.fixed = alongU ? d0 : a0;
  f.sOf = (t) => (t - f.t0) * f.dir; f.tOf = (s) => f.t0 + f.dir * s;
  return f;
}
// the wall of a face between s0..s1 and y0..y1 with rectangular holes opens [{s0, s1, y0, y1}] (skin() quads, plane o)
export function wallBand(D, f, skin, s0, s1, y0, y1, opens = [], { uvm = [2.5, 2.5], o = 0 } = {}) {
  const lv = [y0, y1];
  for (const q of opens) for (const y of [q.y0, q.y1]) if (y > y0 + 1e-3 && y < y1 - 1e-3 && !lv.some((v) => Math.abs(v - y) < 1e-4)) lv.push(y);
  lv.sort((a, b) => a - b);
  for (let k = 1; k < lv.length; k++) {
    const lo = lv[k - 1], hi = lv[k], mid = (lo + hi) / 2;
    const gaps = opens.filter((q) => q.y0 < mid && q.y1 > mid && q.s1 > s0 && q.s0 < s1).sort((a, b) => a.s0 - b.s0);
    let from = s0;
    for (const q of gaps) { skin(D, f, from, Math.max(from, Math.min(s1, q.s0)), lo, hi, o, uvm); from = Math.max(from, q.s1); }
    skin(D, f, from, s1, lo, hi, o, uvm);
  }
}

// ---------------------------------------------------------------------------------------------- gable roofs
// one roof quad (any corner order), the normal turned up, uv in metres / uvM
export function roofQuad(q, a, b, c, d, uvM = 2.4) {
  const e = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], g = [d[0] - a[0], d[1] - a[1], d[2] - a[2]];
  let n = [e[1] * g[2] - e[2] * g[1], e[2] * g[0] - e[0] * g[2], e[0] * g[1] - e[1] * g[0]]; const l = Math.hypot(...n) || 1; n = n.map((v) => v / l); if (n[1] < 0) n = n.map((v) => -v);
  const lu = Math.hypot(...e) / uvM, lv = Math.hypot(...g) / uvM;
  quad(q, a, b, c, d, n, [[0, 0], [lu, 0], [lu, lv], [0, lv]]);
}
// a gable roof over [a0, a1] x [b0, b1] (local), ridge along `ax` ('u' or 'v'), eaves at yE (before the overhang), ridge yR;
// hip0 / hip1 end the ridge in a hip at the a0 / a1 end (the apex sits half the span in)
export function gableRoof(q, a0, a1, b0, b1, yE, yR, { ax = 'u', ov = 0.5, hip0 = false, hip1 = false, uvM = 2.4 } = {}) {
  const bm = (b0 + b1) / 2, half = bm - b0 + ov, k = ((yR - yE) / (bm - b0)) * ov, P = (a, b, y) => (ax === 'u' ? [a, y, b] : [b, y, a]);
  const h0 = hip0 ? half - ov + ov * 0 : 0, h1 = hip1 ? half - ov + ov * 0 : 0;
  const ra0 = hip0 ? a0 + (bm - b0) : a0 - 0, ra1 = hip1 ? a1 - (bm - b0) : a1;
  const e0 = hip0 ? a0 - ov : a0, e1 = hip1 ? a1 + ov : a1;
  roofQuad(q, P(e0, b0 - ov, yE - k), P(e1, b0 - ov, yE - k), P(ra1, bm, yR), P(ra0, bm, yR), uvM);
  roofQuad(q, P(e1, b1 + ov, yE - k), P(e0, b1 + ov, yE - k), P(ra0, bm, yR), P(ra1, bm, yR), uvM);
  if (hip0) roofQuad(q, P(e0, b1 + ov, yE - k), P(e0, b0 - ov, yE - k), P(ra0, bm, yR), P(ra0, bm, yR), uvM);
  if (hip1) roofQuad(q, P(e1, b0 - ov, yE - k), P(e1, b1 + ov, yE - k), P(ra1, bm, yR), P(ra1, bm, yR), uvM);
}

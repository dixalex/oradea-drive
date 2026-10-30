// OWNER: oradea. Shared pieces of the free-church builders (./tabor.js, ./betel.js, ./filadelfia.js, ./betania.js, ./hall.js): a wall on a
// footprint edge with its plinth and cornice, a row of window bays, a canopy, a flight of steps, a chevron band, a stack of pale window strips.
// All of them draw into a builder set between begin() and end() of ./kit.js, in the building-local frame.
//   wallEdge(B, f, o)   o: y0, y1, wall, plinth { top, col }, cornice { h, col, out }
//   bays(B, f, o)       o: y, w, h, kind, pitch, m0, m1, from, to (an s range of the edge), trim, glass, sur, d, skip(s) -> bool, bars; returns the number of windows
//   canopy(B, f, s, w, y, o)   a flat canopy slab on two thin posts or a bracket; o: depth, th, col, posts
//   steps(B, f, s0, s1, n, o)  n risers climbing to the face; o: col, rise, tread
//   chevrons(B, f, s0, s1, y, o)   a sawtooth band of triangles along a face
//   strips(B, f, centres, o)   pale vertical strips behind window stacks
import { at, nrm, rect, slab, poly, win } from './kit.js';

export function wallEdge(B, f, { y0, y1, wall, plinth = null, cornice = null, wm = 'wall' }) {
  const M = B[wm] ?? B.wall;
  M.setColor(wall); rect(M, f, 0, f.L, y0, y1);
  if (plinth) { B.wall.setColor(plinth.col); slab(B.wall, f, -0.06, f.L + 0.06, y0, plinth.top, 0, 0.12, 'ft'); }
  if (cornice) { B.wall.setColor(cornice.col); const o = cornice.out ?? 0.3; slab(B.wall, f, -o * 0.6, f.L + o * 0.6, y1 - cornice.h, y1 + 0.02, 0, o, 'ftb'); }
}

export function bays(B, f, { y, w = 1.0, h = 1.6, kind = 'flat', pitch = 3.4, m0 = 1.2, m1 = 1.2, trim = '#f2ece0', glass = '#34465a', sur = 0.14, d = 0.05, skip = null, bars = false, sill = true, n: nFix = 0, from = 0, to = null }) {
  const end = to ?? f.L, span = end - from - m0 - m1;
  if (span < w) return 0;
  const n = nFix || Math.max(1, Math.round(span / pitch)), step = span / n;
  let c = 0;
  for (let k = 0; k < n; k++) {
    const s = from + m0 + (k + 0.5) * step;
    if (skip && skip(s, k)) continue;
    win(B, f, s, y, w, h, { kind, trim, glass, sur, d, bars, sill }); c++;
  }
  return c;
}

// pale vertical strips behind window stacks: a render panel from y0 to y1, w wide, proud by p
export function strips(B, f, centres, { y0, y1, w = 1.7, p = 0.05, col = '#eee6d2' }) {
  B.wall.setColor(col);
  for (const s of centres) slab(B.wall, f, s - w / 2, s + w / 2, y0, y1, 0, p, 'f');
}

// a flat canopy over a door: slab (s - w/2 .. s + w/2) at height y, `depth` out from the face, held by two posts when `posts`
export function canopy(B, f, s, w, y, { depth = 1.6, th = 0.22, col = '#6c4a3a', posts = false, post = '#d8d2c4', tilt = 0 } = {}) {
  B.trim.setColor(col);
  if (tilt) {   // a lean-to: high at the wall, falling outward by `tilt`
    const P = (ss, dd, yy) => at(f, ss, yy, dd);
    B.trim.face([P(s - w / 2, 0, y + tilt), P(s + w / 2, 0, y + tilt), P(s + w / 2, depth, y), P(s - w / 2, depth, y)], [0, 1, 0]);
    B.trim.face([P(s - w / 2, 0, y + tilt - th), P(s - w / 2, depth, y - th), P(s + w / 2, depth, y - th), P(s + w / 2, 0, y + tilt - th)], [0, -1, 0]);
    B.trim.face([P(s - w / 2, depth, y), P(s + w / 2, depth, y), P(s + w / 2, depth, y - th), P(s - w / 2, depth, y - th)], nrm(f));
  } else slab(B.trim, f, s - w / 2, s + w / 2, y - th, y, 0, depth, 'ftblr');
  if (posts) {
    B.trim.setColor(post);
    for (const ss of [s - w / 2 + 0.15, s + w / 2 - 0.15]) { const [x, , z] = at(f, ss, 0, depth - 0.15); B.trim.box(x - 0.08, y - th - 3.0, z - 0.08, x + 0.08, y - th, z + 0.08, 63); }
  }
}

// n risers climbing to the face from the ground (y0 = the floor, each riser `rise` high), centred on s, w wide, each tread `tread` deeper
export function steps(B, f, s, w, n, { col = '#b9b4a8', rise = 0.16, tread = 0.34, y0 }) {
  B.wall.setColor(col);
  for (let k = 0; k < n; k++) slab(B.wall, f, s - w / 2 - (n - k) * 0.05, s + w / 2 + (n - k) * 0.05, y0 - (k + 1) * rise, y0 - k * rise, 0, tread * (n - k), 'ft');
}

// a sawtooth band of triangles standing on a line along the face: peaks `pitch` apart, `h` tall, from s0 to s1 at height y
export function chevrons(B, f, s0, s1, y, { h = 0.5, pitch = 1.2, d = 0.07, col = '#dcd5c0', thick = 0.28 } = {}) {
  B.wall.setColor(col);
  const n = Math.max(1, Math.round((s1 - s0) / pitch)), st = (s1 - s0) / n;
  for (let k = 0; k < n; k++) {
    const a = s0 + k * st;
    poly(B.wall, [at(f, a, y, d), at(f, a + st, y, d), at(f, a + st / 2, y + h, d)], nrm(f));
  }
  slab(B.wall, f, s0, s1, y - thick, y, 0, d, 'f');
}

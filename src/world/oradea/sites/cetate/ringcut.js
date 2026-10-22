// Closed loops that run side by side (a wall's outline and its inner edge, a moat's edge and its counterscarp's outer
// edge) cut across at the gates. Not a site module: walls.js imports it.
//   Loops are closed point lists [[x, z], ..] that all run the same way round (orient(.., true)); a position on a loop is a
//   parameter p = index + fraction (0 <= p < n).
//   crossing(loop, c) -> p | null     where the line c = { at: [x, z], dir: [dx, dz] } crosses the loop nearest to c.at
//   gapArcs(A, B, gaps) -> [{ a: [[x, z]..], b: [[x, z]..] }]   the solid stretches between the gaps (each gap = { l, r }: two
//     lines that cross both loops), A's points and B's along the same stretch, each running the way the loops run
//   arc(loop, p0, p1) -> [[x, z], ..]  the points from p0 forward to p1 (wrapping), ends included
export function crossing(loop, c) {
  const [px, pz] = c.at, [dx, dz] = c.dir, n = loop.length;
  let best = null, bd = Infinity;
  for (let i = 0; i < n; i++) {
    const [ax, az] = loop[i], [bx, bz] = loop[(i + 1) % n], ex = bx - ax, ez = bz - az, den = ex * dz - ez * dx;
    if (Math.abs(den) < 1e-12) continue;
    const f = ((px - ax) * dz - (pz - az) * dx) / den; // a + f e on the line
    if (!(f >= 0 && f < 1)) continue;
    const d = Math.hypot(ax + ex * f - px, az + ez * f - pz);
    if (d < bd) { bd = d; best = i + f; }
  }
  return best;
}
export function arc(loop, p0, p1) {
  const n = loop.length, pt = (p) => { const i = Math.floor(p) % n, f = p - Math.floor(p), [ax, az] = loop[i], [bx, bz] = loop[(i + 1) % n]; return [ax + (bx - ax) * f, az + (bz - az) * f]; };
  if (p1 < p0) p1 += n;
  const out = [pt(p0)];
  for (let k = Math.floor(p0) + 1; k <= Math.floor(p1); k++) if (k < p1 - 1e-9) out.push(loop[k % n]);
  out.push(pt(p1));
  return out;
}
export function gapArcs(A, B, gaps) {
  const nA = A.length, nB = B.length, G = [];
  for (const g of gaps) {
    const l = [crossing(A, g.l), crossing(B, g.l)], r = [crossing(A, g.r), crossing(B, g.r)];
    if (l.some((v) => v == null) || r.some((v) => v == null)) continue;
    // the gap is the shorter way round between the two cuts on A
    let s = l, e = r;
    const fwd = (r[0] - l[0] + nA) % nA;
    if (fwd > nA / 2) { s = r; e = l; }
    G.push({ s, e });
  }
  G.sort((p, q) => p.s[0] - q.s[0]);
  if (!G.length) return [{ a: A.slice(), b: B.slice(), closed: true }];
  const out = [];
  for (let k = 0; k < G.length; k++) {
    const from = G[k].e, to = G[(k + 1) % G.length].s;
    out.push({ a: arc(A, from[0], to[0]), b: arc(B, from[1], to[1]) });
  }
  void nB;
  return out;
}

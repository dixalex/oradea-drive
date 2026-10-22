// The ground of the Oradea Fortress inside the walls: the gravel plaza over the whole platform, the sett-paved courtyard of the
// palace with its light cross bands, the trees of the yard and its lamps. Not a site module: ../cetate.js calls it.
//   buildCourt({ G, st, B, r, palace }) -> { spots, lamps, yard }
//     B: MeshBuilders { gravel, sett, det, glow };  palace: what palace.js returned (the yard polygon, the passage)
import { RING } from './data.js';
import { orient, polyTools, isoLoops, simplify, area2 } from './field.js';

const LAND = 0.15;                                              // the rendered land surface stands this far over heightAt (ground.js GY.LAND)
const YARD = [0, 1, 20, 21, 22, 23, 24, 25];                // the courtyard's outline, ring indices (the church side runs 1 -> 20)

export function buildCourt({ G, st, B, r, palace }) {
  const yard = YARD.map((i) => RING[i]);
  const spots = [], lamps = [];
  // the ring road: pale gravel round the palace (0.5 .. 6 m from its walls), the lawns of the bastions stay as the ground has them
  B.gravel.setColor('#cfc7b4');
  {
    const sd = polyTools(RING).sd, x0 = 1010, z0 = -300, h = 2, nx = 110, nz = 120, v = new Float32Array(nx * nz);
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) v[j * nx + i] = sd(x0 + i * h, z0 + j * h);
    const big = (loops) => loops.sort((a, b) => Math.abs(area2(b)) - Math.abs(area2(a)))[0];
    const outer = simplify(big(isoLoops(v, x0, z0, nx, nz, h, 6)), 0.3), hole = simplify(big(isoLoops(v, x0, z0, nx, nz, h, 0.5)), 0.3);
    B.gravel.fill(orient(outer, true), [orient(hole, false)], G + LAND + 0.03, true);
  }
  // the courtyard: setts (the ring's inner path, the church's long side closing it)
  B.gravel.setColor('#8b8883');
  B.gravel.fill(orient(yard, true), [], G + LAND + 0.04, true);
  B.sett.setColor('#ffffff');
  // light stone bands crossing the yard between the facing wings
  const c = yard.reduce((s, p) => [s[0] + p[0] / yard.length, s[1] + p[1] / yard.length], [0, 0]);
  B.sett.setColor('#e6e2d6');
  for (const [i, j] of [[24, 0], [22, 1], [21, 25]]) {
    const a = RING[i], b = RING[j], dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz), nx = -dz / L * 1.3, nz = dx / L * 1.3;
    const m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], k = 0.55, p = [a[0] * (1 - k) + c[0] * k, a[1] * (1 - k) + c[1] * k], q = [b[0] * (1 - k) + c[0] * k, b[1] * (1 - k) + c[1] * k];
    void m;
    B.sett.fill(orient([[p[0] + nx, p[1] + nz], [q[0] + nx, q[1] + nz], [q[0] - nx, q[1] - nz], [p[0] - nx, p[1] - nz]], true), [], G + LAND + 0.06, true);
  }
  // a paved way from the passage across the yard to the church's court side
  const pa = palace.passage, ax = pa.to[0] - pa.from[0], az = pa.to[1] - pa.from[1], al = Math.hypot(ax, az);
  void al;

  // trees: lindens and chestnuts round the yard, as in the 2025 photographs
  const inYard = (x, z) => { let o = false; for (let i = 0, j = yard.length - 1; i < yard.length; j = i++) { const [xi, zi] = yard[i], [xj, zj] = yard[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) o = !o; } return o; };
  const ring = [];
  // YARD = ring indices [0, 1, 20, 21, 22, 23, 24, 25]: edges 0 and 1 are the church side and its neighbour, which stay open
  // (the church is the yard's picture); the trees stand along the wings from 20 round to 25
  for (let k = 2; k < yard.length; k++) { // along the inner edge, 7.5 m inside it
    const a = yard[k], b = yard[(k + 1) % yard.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.floor(L / 13);
    for (let q = 0; q < n; q++) {
      const t = (q + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, dx = c[0] - x, dz = c[1] - z, dl = Math.hypot(dx, dz) || 1;
      ring.push([x + dx / dl * 7.5, z + dz / dl * 7.5]);
    }
  }
  for (const [x, z] of ring) {
    if (!inYard(x, z)) continue;
    // keep the way from the passage clear
    const t = ((x - pa.from[0]) * ax + (z - pa.from[1]) * az) / (al * al || 1), d = Math.hypot(pa.from[0] + ax * t - x, pa.from[1] + az * t - z);
    if (t > -0.2 && t < 3 && d < 5.5) continue;
    spots.push({ x, z, kind: 'park', variant: r() < 0.55 ? 'linden' : 'chestnut', sc: 0.7 + r() * 0.3 });
  }
  // lamps: on slim cast-iron posts round the yard
  for (let k = 0; k < yard.length; k++) {
    const a = yard[k], b = yard[(k + 1) % yard.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / 18));
    for (let q = 0; q < n; q++) {
      const t = (q + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, z = a[1] + (b[1] - a[1]) * t, dx = c[0] - x, dz = c[1] - z, dl = Math.hypot(dx, dz) || 1, lx = x + dx / dl * 2.2, lz = z + dz / dl * 2.2;
      if (Math.hypot(lx - pa.to[0], lz - pa.to[1]) < 5) continue;
      B.det.setColor('#2b2a28'); B.det.cyl(lx, G, lz, 0.1, 0.07, 3.6, 6, false); B.det.box(lx - 0.22, G + 3.6, lz - 0.22, lx + 0.22, G + 3.7, lz + 0.22);
      B.glow.setColor('#ffe2a0'); B.glow.box(lx - 0.15, G + 3.7, lz - 0.15, lx + 0.15, G + 4.1, lz + 0.15);
      B.det.setColor('#2b2a28'); B.det.box(lx - 0.22, G + 4.1, lz - 0.22, lx + 0.22, G + 4.18, lz + 0.22);
      lamps.push([lx, lz]);
    }
  }
  return { spots, lamps, yard };
}

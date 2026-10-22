// OWNER: oradea. The facade kit of the Calea Republicii site (not a site module): one lot of a street front from the atlas.
//   makeKit(atlas, pal) -> K { fac, bak, det, roof, uv }     the mesh builders (fac: atlas quads, material.js facadeMaterial;
//     bak: the tiled back-wall quads; det: city detail material, colour + DP part; roof: tile texture, uv in metres) and
//     the cell lookup K.uv(name)
//   dressLot(K, f, s0, s1, floorY, spec, rnd) -> { He, bays }   builds the front of one lot on the wall frame f (slabkit face,
//     s running to the viewer's right) between s0 and s1: ground floor, storeys, string courses, cornice, plinth,
//     balconies, bay windows; He is the wall top (the cornice's lower edge)
//   spec: { style, n (storeys incl. the ground floor), gh (ground floor height), sh, pal (palette id), trim '#hex', ground
//     ('A'..'D' timber shops | 'glass' | 'arch'), glass: 'A'|'B'|'C', gate: bay index | null, entry: bay index | null,
//     gcell / gpier (cells of a palace's own ground floor and pier), nb (bay count), piers (default true), balc: { j, bays: [..] | 'all' | 'mid', rail } (or a list of them), erker: { bays: [..], j0, j1 }, pil: bool }
import { MB } from '../../../../kit/mesh.js';
import { face, at, quad, box } from '../../../cherkasy/slabkit.js';
import { DP } from '../../../materials.js';
import { BAY } from './styles.js';

export function makeKit(atlas, pal) {
  return { fac: new MB(), bak: new MB(), det: new MB(), roof: new MB(), uv: atlas.uv, pal };
}

// an atlas quad on the wall plane (offset o), s0..s1 x y0..y1; the colour channel carries the night seed and the shade
export function aq(K, f, s0, s1, y0, y1, o, cell, seed, palId, shade = 1) {
  const c = typeof cell === 'string' ? K.uv(cell) : cell;
  K.fac.setPart(palId).setColor([seed, shade, 0]);
  quad(K.fac, at(f, s0, y0, o), at(f, s1, y0, o), at(f, s1, y1, o), at(f, s0, y1, o), f.N, [[c.u0, c.v0], [c.u1, c.v0], [c.u1, c.v1], [c.u0, c.v1]]);
}

const PART = { paint: DP.PAINT, conc: DP.CONC, steel: DP.STEEL, wood: DP.WOOD };
// a solid box on the wall frame into the detail builder, with its colour and part
export function dbox(K, f, s0, s1, y0, y1, o0, o1, sides, col, part = DP.PAINT) {
  K.det.setPart(part).setColor(col);
  box(K.det, f, s0, s1, y0, y1, o0, o1, sides);
}

export function dressLot(K, f, s0, s1, floorY, spec, rnd) {
  const { style, n, pal: palId, trim } = spec, gh = spec.gh ?? 4.6, sh = spec.sh ?? 3.95;
  const He = floorY + gh + (n - 1) * sh, L = s1 - s0;
  const piers = spec.piers !== false && L >= 7.2, pw = piers ? 1.2 : 0;
  const inner = L - 2 * pw, nb = spec.nb ?? Math.max(1, Math.round(inner / BAY)), bw = inner / nb;
  const segs = [];
  if (piers) segs.push({ a: s0, b: s0 + pw, pier: true });
  for (let i = 0; i < nb; i++) segs.push({ a: s0 + pw + i * bw, b: s0 + pw + (i + 1) * bw, i });
  if (piers) segs.push({ a: s1 - pw, b: s1, pier: true });
  const gk = spec.ground ?? 'A';

  // ---- ground floor and storeys: one quad per bay and storey
  for (const g of segs) {
    let cell;
    if (g.pier) cell = spec.gpier ?? 'g.pier';
    else if (spec.gcell) cell = spec.gcell;
    else if (g.i === spec.gate) cell = 'g.gate';
    else if (g.i === spec.entry) cell = 'g.entry';
    else if (gk === 'arch') cell = 'g.arch';
    else if (gk === 'glass') cell = `g.glass${spec.glass ?? 'A'}`;
    else cell = `g.shop${'ABCD'[(gk.charCodeAt(0) - 65 + (g.i ?? 0) * (spec.mixShops ? 1 : 0)) % 4]}`;
    aq(K, f, g.a, g.b, floorY, floorY + gh, 0, cell, rnd(), palId);
    for (let j = 1; j < n; j++) {
      const kind = g.pier ? 'pier' : n >= 3 && j === 1 ? 'nobile' : n >= 3 && j === n - 1 ? 'top' : (g.i + j) % 2 ? 'reg2' : 'reg';
      aq(K, f, g.a, g.b, floorY + gh + (j - 1) * sh, floorY + gh + j * sh, 0, `${style}.${kind}`, rnd(), palId);
    }
  }
  // ---- plinth skirt (hides the slope under the wall), string courses, cornice
  dbox(K, f, s0, s1, floorY - 1.1, floorY + 0.02, 0, 0.06, 'f', '#6a6764', DP.CONC);
  dbox(K, f, s0, s1, floorY + gh - 0.1, floorY + gh + 0.22, 0, 0.14, 'ft', trim);
  for (let j = 2; j < n; j++) dbox(K, f, s0, s1, floorY + gh + (j - 1) * sh - 0.07, floorY + gh + (j - 1) * sh + 0.07, 0, 0.07, 'f', trim);
  dbox(K, f, s0, s1, He - 0.62, He - 0.34, 0, 0.14, 'f', trim);
  dbox(K, f, s0 - 0.02, s1 + 0.02, He - 0.34, He - 0.06, 0, 0.42, 'fu', trim);
  dbox(K, f, s0 - 0.04, s1 + 0.04, He - 0.06, He + 0.12, 0, 0.55, 'ftu', trim);

  // ---- balconies: a slab and an iron railing quad, per bay
  for (const bal of Array.isArray(spec.balc) ? spec.balc : spec.balc ? [spec.balc] : []) {
    const bays = segs.filter((g) => !g.pier), pick = bal.bays === 'all' ? bays : bal.bays === 'mid' ? [bays[Math.floor(bays.length / 2)]] : bal.bays.map((i) => bays[i]).filter(Boolean);
    for (const g of pick) {
      const y = floorY + gh + (bal.j - 1) * sh + 0.02, a = g.a + 0.3, b = g.b - 0.3, out = 0.72;
      dbox(K, f, a, b, y - 0.22, y + 0.02, 0, out, 'ftulr', trim);
      aq(K, f, a, b, y + 0.02, y + 0.98, out - 0.05, `rail.${bal.rail ?? 'B'}`, 0.9, palId, 1);
      for (const e of [a, b]) { // the two returns
        const s = e === a ? a : b - 0.001;
        K.fac.setPart(palId).setColor([0.9, 1, 0]); const cc = K.uv(`rail.${bal.rail ?? 'B'}`);
        const p0 = at(f, s, y + 0.02, 0.0), p1 = at(f, s, y + 0.02, out - 0.05), p2 = at(f, s, y + 0.98, out - 0.05), p3 = at(f, s, y + 0.98, 0.0);
        quad(K.fac, p0, p1, p2, p3, [f.U[0] * (e === a ? -1 : 1), 0, f.U[2] * (e === a ? -1 : 1)], [[cc.u0, cc.v0], [cc.u0 + (cc.u1 - cc.u0) * 0.2, cc.v0], [cc.u0 + (cc.u1 - cc.u0) * 0.2, cc.v1], [cc.u0, cc.v1]]);
      }
    }
  }
  return { He, segs, nb, bw };
}

// the front quad of a bare wall piece (the plain back and side walls): one quad per piece with tiled uv (metres), tinted by pal
export function plainWall(K, f, s0, s1, y0, y1, palId, seed = 0.5, tileW = 3.6, tileH = 3.95) {
  K.bak.setPart(palId).setColor([seed, 1, 0]);
  const L = s1 - s0, u1 = L / tileW, v1 = (y1 - y0) / tileH;
  quad(K.bak, at(f, s0, y0, 0), at(f, s1, y0, 0), at(f, s1, y1, 0), at(f, s0, y1, 0), f.N, [[0, 0], [u1, 0], [u1, v1], [0, v1]]);
}
export { face, at };

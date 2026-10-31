// OWNER: oradea. The facade atlas of the Art Nouveau corners round Piața Ferdinand and in Olosig (not a site module): one sheet at
// 52 px per metre (Atlas of ../republicii/paint.js, the tint-role shader of the Calea Republicii site, every cell painted in fixed
// colours so one palette entry serves all), packed with a guillotine allocator because the cells differ a lot in size (a 5 x 5.6 m
// shopfront bay next to a 0.4 m pilaster strip). Same packer as ../unirii-est/atlas.js, which does not export it.
//   buildAtlas(r, W = 2048, H = 2048, scale = 1) -> { A, textures: { map, mask }, uv(name), used }   scale < 1: the GPU copy is smaller
//   (the phone tier); used = the share of the sheet taken
import { Atlas, Cx, S } from '../republicii/paint.js';
import { poynarCells } from './cells-poynar.js';
import { fuchslCells } from './cells-fuchsl.js';
import { transilvaniaCells } from './cells-transilvania.js';
import { adorjanCells } from './cells-adorjan.js';
import { rimanoczyCells } from './cells-rimanoczy.js';

const G = 3;
class PackedAtlas extends Atlas {
  constructor(W, H) { super(W, H); this.free = [{ x: 0, y: 0, w: W, h: H }]; this.taken = 0; }
  cell(name, wM, hM) {
    const w = Math.round(wM * S), h = Math.round(hM * S), w2 = w + 2 * G, h2 = h + 2 * G;
    let best = -1, score = Infinity;
    this.free.forEach((f, i) => { if (f.w >= w2 && f.h >= h2) { const s = Math.min(f.w - w2, f.h - h2); if (s < score) { score = s; best = i; } } });
    if (best < 0) throw new Error(`atlas full at ${name} (${this.W}x${this.H})`);
    const f = this.free.splice(best, 1)[0];
    if (f.w - w2 < f.h - h2) { this.free.push({ x: f.x + w2, y: f.y, w: f.w - w2, h: h2 }, { x: f.x, y: f.y + h2, w: f.w, h: f.h - h2 }); }
    else { this.free.push({ x: f.x + w2, y: f.y, w: f.w - w2, h: f.h }, { x: f.x, y: f.y + h2, w: w2, h: f.h - h2 }); }
    this.free = this.free.filter((q) => q.w > 0 && q.h > 0);
    const c = new Cx(this, f.x + G, f.y + G, w, h);
    this.cells[name] = c; this.taken += w2 * h2;
    return c;
  }
}

export function buildAtlas(r, W = 2048, H = 2048, scale = 1) {
  const A = new PackedAtlas(W, H);
  poynarCells(A, r); transilvaniaCells(A, r); fuchslCells(A, r); adorjanCells(A, r); rimanoczyCells(A, r);
  return { A, textures: A.textures(scale), uv: (n) => A.uv(n), used: A.taken / (W * H) };
}

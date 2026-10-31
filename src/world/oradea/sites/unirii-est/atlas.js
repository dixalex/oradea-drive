// OWNER: oradea. The facade atlas of the Piața Unirii east side (not a site module): one sheet at 52 px per metre (Atlas of
// republicii/paint.js, the same tint-role shader as the Calea Republicii site, but every cell here is painted in fixed colours, so one
// palette entry serves all). The cells are very different in size (a 17 x 11 m facade next to 1 m piers), so the sheet is packed with a
// guillotine allocator instead of paint.js's shelves.
//   buildAtlas(r) -> { A, textures: { map, mask }, uv(name), used }   cell names: see cells-*.js;  used = the share of the sheet taken
import { Atlas, Cx, S } from '../republicii/paint.js';
import { adolfCells } from './cells-adolf.js';
import { deutschCells } from './cells-deutsch.js';
import { kovatsCells } from './cells-kovats.js';
import { lyceumCells } from './cells-lyceum.js';
import { rowCells } from './cells-row.js';

const G = 3;
class PackedAtlas extends Atlas {
  constructor(W, H) { super(W, H); this.free = [{ x: 0, y: 0, w: W, h: H }]; this.taken = 0; }
  cell(name, wM, hM) {
    const w = Math.round(wM * S), h = Math.round(hM * S), w2 = w + 2 * G, h2 = h + 2 * G;
    let best = -1, score = Infinity;
    this.free.forEach((f, i) => { if (f.w >= w2 && f.h >= h2) { const s = Math.min(f.w - w2, f.h - h2); if (s < score) { score = s; best = i; } } });
    if (best < 0) throw new Error(`atlas full at ${name} (${this.W}x${this.H})`);
    const f = this.free.splice(best, 1)[0];
    // guillotine: split the leftover along the shorter leftover side
    if (f.w - w2 < f.h - h2) { this.free.push({ x: f.x + w2, y: f.y, w: f.w - w2, h: h2 }, { x: f.x, y: f.y + h2, w: f.w, h: f.h - h2 }); }
    else { this.free.push({ x: f.x + w2, y: f.y, w: f.w - w2, h: f.h }, { x: f.x, y: f.y + h2, w: w2, h: f.h - h2 }); }
    this.free = this.free.filter((q) => q.w > 0 && q.h > 0);
    const c = new Cx(this, f.x + G, f.y + G, w, h);
    this.cells[name] = c; this.taken += w2 * h2;
    return c;
  }
}

export function buildAtlas(r, W = 2048, H = 2048, scale = 1) { // scale: the GPU copy's size (republicii/paint.js textures)
  const A = new PackedAtlas(W, H);
  deutschCells(A, r); adolfCells(A, r); lyceumCells(A, r); kovatsCells(A, r); rowCells(A, r);   // the biggest first
  return { A, textures: A.textures(scale), uv: (n) => A.uv(n), used: A.taken / (W * H) };
}

// OWNER: oradea. Atlas cells of the Greek Catholic lyceum «Iuliu Maniu» (1925, Anton Szallerbeck, neo-Romanian), not a site module:
// cream render, ochre archivolts and bands, round-arched windows, dark-brown woodwork, orange-brown doors, a crest of ogee arches along
// the eaves (painted with transparency, so the quad is the crest's silhouette), the bishop's shield on the round corner tower.
// Colours from the Commons photographs (2013).
//   lyceumCells(A, r)   adds ly.g (ground window), ly.gd (ground door), ly.f (first floor), ly.t (top floor), ly.crest, ly.tw0..3 (tower facets)
import { render, gwin } from './paintkit.js';

export const LY = { wall: '#eee3c9', ochre: '#e0c690', ochreD: '#c4a574', trim: '#f6efdc', brown: '#5c4130', door: '#a65a2c', plinth: '#b3a98f', roof: '#8a4a36', cap: '#5b4333' };

export function lyceumCells(A, r) {
  const AX = 4.4, { wall, ochre, ochreD, trim, brown, door, plinth } = LY;
  const arch = (c, x, y, w, h, frame = brown) => { // an arched window with an ochre archivolt
    c.fix(ochre).opening(x, y, w, h, 'arch', 0.17); gwin(c, x, y, w, h, { head: 'arch', cols: 2, trans: 0.28, frame, sill: 0.08, sillCol: trim });
  };
  const base = (c, col = wall) => { render(c, col, r); };
  let c = A.cell('ly.g', AX, 4.4); base(c);
  c.fix(plinth).rect(0, 0, AX, 0.85); c.dif('rgba(0,0,0,0.1)'); for (let y = 0.28; y < 0.85; y += 0.28) c.rect(0, y, AX, 0.025);
  arch(c, (AX - 1.3) / 2, 1.25, 1.3, 1.5); c.fix(ochre).rect(0, 4.1, AX, 0.12); c.end();
  c = A.cell('ly.gd', AX, 4.4); base(c);
  c.fix(plinth).rect(0, 0, AX, 0.5); c.fix(ochre).opening((AX - 1.5) / 2, 0.5, 1.5, 2.0, 'arch', 0.17);
  c.fix(door).opening((AX - 1.5) / 2, 0.5, 1.5, 2.0, 'arch', 0); c.fix('#23282e').opening((AX - 1.3) / 2, 2.0, 1.3, 0.5, 'arch', 0); c.glass((AX - 1.3) / 2, 2.0, 1.3, 0.5, 'arch', 1, 0);
  c.dif('rgba(0,0,0,0.25)').rect(AX / 2 - 0.02, 0.5, 0.04, 1.5).rect((AX - 1.3) / 2, 1.05, 1.3, 0.03); c.fix(ochre).rect(0, 4.1, AX, 0.12); c.end();
  c = A.cell('ly.f', AX, 3.9); base(c); // first floor: a pair of small arched lights on a colonnette, under an ochre band
  c.fix(ochre).rect(0, 0, AX, 0.12);
  for (const x of [AX / 2 - 0.85, AX / 2 + 0.05]) arch(c, x, 1.0, 0.8, 1.45);
  c.fix(trim).rect(AX / 2 - 0.04, 1.0, 0.08, 1.4); c.end();
  c = A.cell('ly.t', AX, 3.9); base(c); // top floor: a single arched window, ochre lozenges
  c.fix(ochre).rect(0, 0, AX, 0.1); arch(c, (AX - 1.0) / 2, 0.95, 1.0, 1.6); c.fix(ochreD).poly([[0.5, 3.1], [0.75, 3.35], [0.5, 3.6], [0.25, 3.35]]).poly([[AX - 0.5, 3.1], [AX - 0.25, 3.35], [AX - 0.5, 3.6], [AX - 0.75, 3.35]]); c.end();
  // the crest of ogee arches along the eaves: transparent outside the shape
  c = A.cell('ly.crest', AX, 1.5);
  c.fix(wall).poly([[0, 0], [AX, 0], [AX, 0.45], [AX * 0.78, 0.7], [AX * 0.62, 1.1], [AX * 0.5, 1.45], [AX * 0.38, 1.1], [AX * 0.22, 0.7], [0, 0.45]]);
  c.fix(ochre).ln([[0, 0.45], [AX * 0.22, 0.7], [AX * 0.38, 1.1], [AX * 0.5, 1.45], [AX * 0.62, 1.1], [AX * 0.78, 0.7], [AX, 0.45]], 0.1);
  c.fix(ochreD).ell(AX / 2, 0.62, 0.22, 0.22); c.fix(wall).ell(AX / 2, 0.62, 0.12, 0.12); c.fix(ochre).rect(0, 0, AX, 0.12); c.end();
  // the corner tower, facets of 1.2 m
  c = A.cell('ly.tw0', 1.3, 4.4); base(c); c.fix(plinth).rect(0, 0, 1.3, 0.85); c.fix(ochre).rect(0, 4.1, 1.3, 0.12); arch(c, 0.2, 1.3, 0.9, 1.6); c.end();
  c = A.cell('ly.tw1', 1.3, 3.9); base(c); // the bishop's shield
  c.fix(ochre).rect(0, 0, 1.3, 0.12); c.fix(ochreD).poly([[0.25, 3.0], [1.05, 3.0], [1.05, 1.9], [0.65, 1.2], [0.25, 1.9]]); c.fix('#7a5a38').poly([[0.33, 2.92], [0.97, 2.92], [0.97, 1.95], [0.65, 1.4], [0.33, 1.95]]);
  c.fix(ochre).ln([[0.65, 2.7], [0.65, 1.6]], 0.05).ln([[0.4, 2.3], [0.9, 2.3]], 0.05).ln([[0.15, 1.6], [0.2, 1.1]], 0.03).ln([[1.15, 1.6], [1.1, 1.1]], 0.03); c.end();
  c = A.cell('ly.tw2', 1.3, 3.9); base(c); c.fix(ochre).rect(0, 0, 1.3, 0.1); arch(c, 0.45, 1.3, 0.4, 1.3); c.end(); // the corner is mostly solid: a slit light
  c = A.cell('ly.tw3', 1.3, 3.9); base(c); c.fix(ochre).rect(0, 0, 1.3, 0.1); c.fix(ochreD); for (let i = 0; i < 3; i++) c.poly([[0.1 + i * 0.4, 2.5], [0.3 + i * 0.4, 2.8], [0.5 + i * 0.4, 2.5]]); c.fix(ochre).rect(0, 3.55, 1.3, 0.35); c.end();
}

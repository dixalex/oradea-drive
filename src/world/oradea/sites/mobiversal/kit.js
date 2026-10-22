// OWNER: oradea. Canvas textures and small emitters of the Mobiversal site (../mobiversal.js). Not a site module.
//   plasterTex(r)   fine white render, one repeat a metre             concreteTex(r)  grey slab concrete, one repeat 4 m (a slab)
//   fenceAtlas()    512 x 256: left tile a 2.5 x 1.5 m welded-wire panel (alpha), right tile the green screening fabric
//   FENCE_UV        the two tiles' uv rectangles                       signAtlas()     the lettering atlas, SIGN holds its rectangles
//   cellDrape(D, gy, toW, poly, lift, cell)  a flat polygon of the local frame laid on the ground in `cell` m pieces
//   mat(o)          MeshStandardMaterial shorthand
import * as THREE from 'three';
import { canvasTex } from '../../../cherkasy/sculpt.js';

const speck = (g, r, w, h, n, a, hi, lo) => {
  for (let i = 0; i < n; i++) { g.fillStyle = r() < 0.5 ? `rgba(${hi},${a})` : `rgba(${lo},${a})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
};

// white render: a faint grain and a few soft stains, so the big walls are not flat
export const plasterTex = (r) => canvasTex(256, 256, (g, w, h) => {
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
  speck(g, r, w, h, 2200, 0.06, '255,255,255', '110,105,95');
  for (let i = 0; i < 18; i++) { g.fillStyle = `rgba(120,115,100,${0.02 + r() * 0.025})`; g.fillRect(r() * w, r() * h, 10 + r() * 40, 8 + r() * 26); }
});

// the car park's slabs: one repeat is one 4 x 4 m slab with its joints on the border, a broom finish and a few oil stains
export const concreteTex = (r) => {
  const t = canvasTex(256, 256, (g, w, h) => {
    g.fillStyle = '#c3c1bb'; g.fillRect(0, 0, w, h);
    speck(g, r, w, h, 5200, 0.12, '240,238,232', '105,102,96');
    for (let i = 0; i < 9; i++) { g.fillStyle = `rgba(70,66,60,${0.03 + r() * 0.04})`; g.fillRect(r() * w, r() * h, 14 + r() * 60, 8 + r() * 30); }
    g.fillStyle = 'rgba(70,68,64,0.38)'; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h); // the joints
    g.fillStyle = 'rgba(255,255,255,0.12)'; g.fillRect(0, 2.5, w, 1.5); g.fillRect(2.5, 0, 1.5, h);
  });
  t.repeat.set(0.25, 0.25); // uv is in metres
  return t;
};

// the fence atlas: no wrapping, each tile is used once per panel
export const FENCE_UV = { wire: [0.004, 0.004, 0.496, 0.996], green: [0.504, 0.004, 0.996, 0.996] };
export const fenceAtlas = () => canvasTex(512, 256, (g, w, h) => {
  g.clearRect(0, 0, w, h);
  // welded wire panel 2.5 m x 1.5 m on 256 x 256: horizontal wires every 5 cm (0.05 / 1.5 * 256 = 8.5 px), vertical every 20 cm (20 px)
  g.fillStyle = 'rgba(176,181,185,1)';
  for (let y = 4; y < h; y += 8.53) g.fillRect(0, y, 256, 2.2);
  for (let x = 4; x < 256; x += 20.5) g.fillRect(x, 0, 2.2, h);
  g.fillRect(0, 0, 256, 3.5); g.fillRect(0, h - 3.5, 256, 3.5); // the frame wires
  // green screening: woven fabric with a lighter hem and eyelets
  g.fillStyle = '#2d6a45'; g.fillRect(256, 0, 256, h);
  for (let i = 0; i < 2600; i++) { g.fillStyle = `rgba(${i % 3 ? '20,70,40' : '70,130,90'},0.22)`; g.fillRect(256 + (i * 37) % 256, (i * 91) % h, 3, 1.4); }
  g.fillStyle = '#3b7d55'; g.fillRect(256, 0, 256, 7); g.fillRect(256, h - 7, 256, 7);
  g.fillStyle = '#d6dbd9'; for (let x = 270; x < 512; x += 38) { g.beginPath(); g.arc(x, 3.5, 2, 0, 6.3); g.arc(x, h - 3.5, 2, 0, 6.3); g.fill(); }
}, { repeat: false });

// the mobiversal mark, the icon's two paths from mobiversal.com/images/mobiversal_logo.svg (24 x 24 units)
const MARK = [
  'M17.7659 0H5.55831C4.09305 0 2.68453 0.588 1.64237 1.658C0.6 2.728 0.0097 4.184 0 5.706V5.76C0.0017 6.861 0.4223 7.917 1.1706 8.698C1.4188 8.946 1.6953 9.163 1.994 9.342L11.662 15.379L21.331 9.341C21.629 9.162 21.906 8.947 22.154 8.699C22.903 7.918 23.324 6.862 23.3245 5.76V5.706C23.315 4.184 22.725 2.728 21.682 1.658C20.64 0.588 19.231 0 17.766 0Z',
  'M22.9318 12.607L11.6743 19.5841L0 12.2988V18.1739C0.0075 19.7265 0.6083 21.2124 1.6702 22.3049C2.7322 23.3975 4.1683 24.0072 5.6629 24H17.6607C19.1554 24.0072 20.5917 23.3973 21.6537 22.3046C22.7156 21.2119 23.3163 19.7257 23.3237 18.1729V12.2979L22.9318 12.607Z',
];
const PATHS = typeof Path2D === 'function' ? MARK.map((d) => new Path2D(d)) : null;

// the lettering atlas (1024 x 512, v down on the canvas): the dark mobiversal mark and name for the yellow band, the yellow Goldie
// script for the dark ground-floor panel, the house-number plate. Painted on a transparent ground; the quads are alpha-tested.
export const SIGN = {
  mob: { x: 0, y: 0, w: 768, h: 142 },     // 5.4 : 1
  goldie: { x: 0, y: 160, w: 462, h: 140 }, // 3.3 : 1
  plate: { x: 500, y: 160, w: 100, h: 125 },
};
export const signAtlas = () => canvasTex(1024, 512, (g) => {
  g.clearRect(0, 0, 1024, 512);
  const { mob, goldie, plate } = SIGN;
  // mobiversal: the icon left, the name right, in the charcoal the building wears
  g.fillStyle = '#2f343b';
  const ih = mob.h * 0.86, k = ih / 24;
  if (PATHS) { g.save(); g.translate(mob.x + 4, mob.y + (mob.h - ih) / 2); g.scale(k, k); for (const p of PATHS) g.fill(p); g.restore(); }
  else g.fillRect(mob.x + 4, mob.y + 10, ih, ih * 0.85);
  g.font = '700 108px "Nunito","Avenir Next Rounded","Arial Rounded MT Bold","Helvetica Neue",Arial,sans-serif';
  g.textAlign = 'left'; g.textBaseline = 'alphabetic';
  g.fillText('mobiversal', mob.x + ih * 1.2, mob.y + mob.h * 0.78, mob.w - ih * 1.25);
  // Goldie: yellow soft-serif italic
  g.fillStyle = '#f2b81c';
  g.font = 'italic 900 118px "Recoleta","Cooper Black","Georgia","Times New Roman",serif';
  g.fillText('Goldie', goldie.x + 6, goldie.y + goldie.h * 0.82, goldie.w - 12);
  // the number plate: black, white "40"
  g.fillStyle = '#1b1c1e'; g.fillRect(plate.x, plate.y, plate.w, plate.h);
  g.strokeStyle = '#d9d9d6'; g.lineWidth = 3; g.strokeRect(plate.x + 5, plate.y + 5, plate.w - 10, plate.h - 10);
  g.fillStyle = '#f1f1ee'; g.font = '700 74px Arial,Helvetica,sans-serif'; g.textAlign = 'center';
  g.fillText('40', plate.x + plate.w / 2, plate.y + plate.h * 0.7);
}, { repeat: false });
// the quad uv of an atlas rectangle (a canvas y runs down, the texture's v up)
export const uvOf = (q) => [[q.x / 1024, 1 - (q.y + q.h) / 512], [(q.x + q.w) / 1024, 1 - (q.y + q.h) / 512], [(q.x + q.w) / 1024, 1 - q.y / 512], [q.x / 1024, 1 - q.y / 512]];

// ------------------------------------------------------------------------------------------------ emitters
function clipRect(poly, x0, x1, z0, z1) {
  let out = poly;
  for (const [ax, sg, c] of [[0, 1, x0], [0, -1, x1], [1, 1, z0], [1, -1, z1]]) {
    const inp = out; out = [];
    inp.forEach((a, i) => {
      const b = inp[(i + 1) % inp.length], da = sg * (a[ax] - c), db = sg * (b[ax] - c);
      if (da >= 0) out.push(a);
      if ((da >= 0) !== (db >= 0)) { const t = da / (da - db); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    });
    if (!out.length) break;
  }
  return out;
}
// a flat polygon of the local frame laid on the ground in `cell` m pieces: gy(x, z) is the ground height under a WORLD point, toW(X, Z)
// the frame's map transform; the uv stays in local metres so slab joints and paving run along the building
export function cellDrape(D, gy, toW, poly, lift, cell = 2) {
  const xs = poly.map((p) => p[0]), zs = poly.map((p) => p[1]);
  for (let x0 = Math.floor(Math.min(...xs) / cell) * cell; x0 < Math.max(...xs); x0 += cell) {
    for (let z0 = Math.floor(Math.min(...zs) / cell) * cell; z0 < Math.max(...zs); z0 += cell) {
      const c = clipRect(poly, x0, x0 + cell, z0, z0 + cell);
      if (c.length < 3) continue;
      const first = D.v; D.fill(c, [], 0, true);
      for (let v = first; v < D.v; v++) {
        const o = v * 11, a = D.buf.a, [wx, wz] = toW(a[o], a[o + 2]);
        a[o] = wx; a[o + 2] = wz; a[o + 1] = gy(wx, wz) + lift;
      }
    }
  }
}
export const mat = (o) => new THREE.MeshStandardMaterial(o);

// OWNER: oradea. The painted facades of Palatul Vulturul Negru (eagle.js): one canvas atlas of the Secession elevations –
// cream-pink render, green beaded window frames and friezes, white roller blinds, shop glass at the foot – and a second
// canvas, the glow mask (white where a pane is lit, the stained glass and the passage mouths always).
// Panels (in metres, e along the panel, h up from the floor; PX pixels a metre):
//   A  the west elevation of the north-west body, developed along its round bays (36.9 m)
//   B  the west elevation of the south body with the tower bay (16.5 m)
//   N  two street bays (4.2 m) for the Strada Independenței front;  P  two plain bays;  C  two bays of the entrance court
//   BK the court's back wall with the big arched stained-glass window of the eagle (Neumann K., 1909) and the passage mouth
//   G  a shell gable;  TW  the tower's beaded drum, majolica band and the green spire scales
//   vnAtlas(r) -> { map, emissive, W, H, rect }    textures;  uvOf(name, e, h, k = 0) -> [u, v]   uv of a point of panel `name`
import { canvasTex } from '../../../cherkasy/sculpt.js';
import { rng } from '../../../cherkasy/geo.js';

export const PX = 26, W = 2048, H = 1344, WALL_H = 22.5;
// panels: [x, y, w, h] px, y from the top of the canvas
export const RECT = {
  A: [[0, 0, 960, 585]], B: [[964, 0, 430, 585]], N: [[1398, 0, 110, 585], [1512, 0, 110, 585]], P: [[1626, 0, 110, 585], [1740, 0, 110, 585]],
  C: [[0, 590, 116, 585], [120, 590, 116, 585], [240, 590, 116, 585], [360, 590, 116, 585]], BK: [[484, 590, 206, 730]], G: [[700, 590, 270, 220]],
  TW: [[980, 590, 640, 330]],
};
export const uvOf = (name, e, h, k = 0) => { const [x0, y0, w, hh] = RECT[name][k]; return [(x0 + e * PX) / W, 1 - (y0 + hh - h * PX) / H]; };

const WALL = '#eed0ac', WALL_D = '#e3bd96', GREEN = '#4b8c6a', GREEN_D = '#2f6a4e', TAN = '#cc9d70', TAN_L = '#e6c29a', FR = '#f7f1e2', GLASS = '#2e3b45', BLIND = '#eadfc4', SHOP = '#6f828d', DARK = '#3a2a22', PLINTH = '#a77f70';

function paint(g, mask, r) {
  const ra = rng(77);
  if (mask) { g.fillStyle = '#000'; g.fillRect(0, 0, W, H); } else { g.fillStyle = WALL; g.fillRect(0, 0, W, H); }
  const lit = (p) => r() < p;
  const P = (name, k = 0) => {
    const [x0, y0, w, hh] = RECT[name][k];
    const X = (e) => x0 + e * PX, Y = (h) => y0 + hh - h * PX;
    const fillR = (e0, h0, e1, h1, c) => { if (mask) return; g.fillStyle = c; g.fillRect(X(e0), Y(h1), (e1 - e0) * PX, (h1 - h0) * PX); };
    // a rectangle topped by a half ellipse of height `rise`
    const shape = (e0, h0, ww, hh2, rise, c, always = false) => {
      if (mask && !always) return;
      g.fillStyle = c; g.beginPath(); g.moveTo(X(e0), Y(h0)); g.lineTo(X(e0), Y(h0 + hh2));
      if (rise > 0) g.ellipse(X(e0 + ww / 2), Y(h0 + hh2), ww / 2 * PX, rise * PX, 0, Math.PI, 0, false); else g.lineTo(X(e0 + ww), Y(h0 + hh2));
      g.lineTo(X(e0 + ww), Y(h0)); g.closePath(); g.fill();
    };
    const line = (e0, h0, e1, h1, c, wd = 1) => { if (mask) return; g.strokeStyle = c; g.lineWidth = wd; g.beginPath(); g.moveTo(X(e0), Y(h0)); g.lineTo(X(e1), Y(h1)); g.stroke(); };
    // a window: green bead, cream frame, glass (dark, or half a roller blind), a transom; o.lit forces the pane's glow
    const win = (ec, h0, ww, hh2, o = {}) => {
      const rise = o.rise ?? 0, lt = o.lit ?? lit(0.3), e0 = ec - ww / 2;
      if (!mask) {
        if (o.bead !== false) shape(e0 - 0.2, h0 - 0.1, ww + 0.4, hh2 + 0.1, rise + 0.2 * (rise ? 1 : 0), GREEN);
        shape(e0 - 0.1, h0 - 0.04, ww + 0.2, hh2 + 0.04, rise + (rise ? 0.1 : 0), FR);
        if (o.sill !== false) fillR(e0 - 0.22, h0 - 0.18, e0 + ww + 0.22, h0 - 0.04, TAN);
      }
      shape(e0, h0, ww, hh2, rise, mask ? '#fff' : GLASS, false || (mask && lt));
      if (mask) { if (lt) { g.fillStyle = '#fff'; } return; }
      if (o.blind) { g.save(); shape(e0, h0 + hh2 * (1 - o.blind), ww, hh2 * o.blind, rise * (o.blind > 0.95 ? 1 : 0), BLIND); g.restore(); }
      line(ec, h0, ec, h0 + hh2 + rise * 0.9, FR, 1.5);
      line(e0, h0 + hh2 * 0.62, e0 + ww, h0 + hh2 * 0.62, FR, 1.5);
    };
    // the glass of a window drawn into the mask only when lit (the colour pass paints it dark)
    const frieze = (e0, e1, h0, h1) => {
      if (mask) return;
      fillR(e0, h0, e1, h1, TAN_L); fillR(e0, h1 - 0.12, e1, h1, GREEN); fillR(e0, h0, e1, h0 + 0.1, TAN);
      g.fillStyle = GREEN; for (let e = e0 + 0.2; e < e1; e += 0.5) { g.beginPath(); g.arc(X(e), Y((h0 + h1) / 2), 0.1 * PX, 0, Math.PI * 2); g.fill(); }
    };
    const shop = (e0, e1, h0, h1, n = 3) => {
      const on = lit(0.55);
      if (mask) { if (on) { g.fillStyle = '#fff'; g.fillRect(X(e0 + 0.1), Y(h1 - 0.1), (e1 - e0 - 0.2) * PX, (h1 - h0 - 0.5) * PX); } return; }
      fillR(e0, h0, e1, h1, DARK); fillR(e0 + 0.1, h0 + 0.1, e1 - 0.1, h1 - 0.1, SHOP);
      for (let i = 1; i < n; i++) fillR(e0 + (e1 - e0) * i / n - 0.04, h0 + 0.1, e0 + (e1 - e0) * i / n + 0.04, h1 - 0.1, DARK);
      fillR(e0, h1 - 0.5, e1, h1, DARK);
    };
    return { x0, y0, w, hh, X, Y, fillR, shape, line, win, frieze, shop, mask };
  };
  const band = (p, h0, h1, e1) => { p.fillR(0, h0, e1, h1, TAN_L); p.fillR(0, h0, e1, h0 + 0.08, TAN); p.fillR(0, h1 - 0.1, e1, h1, GREEN); };
  const plinthOf = (p, e1) => p.fillR(0, 0, e1, 0.55, PLINTH);
  const corners = (p, e1) => { p.fillR(0, 0.5, 0.18, WALL_H, GREEN_D); p.fillR(e1 - 0.18, 0.5, e1, WALL_H, GREEN_D); };

  // ---- N: the street bays of Strada Independenței
  for (let k = 0; k < 2; k++) {
    const p = P('N', k), E = 4.2;
    plinthOf(p, E); p.shop(0.35, E - 0.35, 0.6, 4.7, 2); band(p, 4.9, 5.7, E);
    for (let fl = 0; fl < 4; fl++) {
      const h0 = 6.3 + fl * 3.95, rise = (fl === 1 || fl === 3) && k === 0 ? 0.4 : 0;
      for (const ec of [1.1, 3.1]) p.win(ec, h0, 0.95, 1.9, { rise, blind: lit(0.45) ? 0.5 : 0 });
    }
    band(p, 17.2, 17.8, E); p.frieze(0, E, 21.2, 22.5);
  }
  // ---- P: plain bays
  for (let k = 0; k < 2; k++) {
    const p = P('P', k), E = 4.2;
    p.fillR(0, 0, E, WALL_H, '#ebcaa4'); plinthOf(p, E); p.win(2.1, 0.9, 1.3, 2.4, { bead: false, rise: 0 });
    for (let fl = 0; fl < 5; fl++) p.win(2.1, 5.3 + fl * 3.45, 1.15, 1.8, { bead: false, blind: lit(0.4) ? 0.6 : 0, sill: false });
    band(p, 21.6, 22.5, E);
  }
  // ---- C: the entrance court's bays: tall arched windows, small square lights, a shop at the foot
  for (let k = 0; k < 4; k++) {
    const p = P('C', k), E = 4.4;
    corners(p, E); plinthOf(p, E); p.shop(0.5, E - 0.5, 0.6, 4.6, 2); band(p, 4.8, 5.5, E);
    for (let fl = 0; fl < 4; fl++) {
      const h0 = 6.1 + fl * 4.0;
      if (k & 1) { p.win(1.2, h0, 0.85, 1.9, { rise: 0.4 }); p.win(3.2, h0, 0.85, 1.9, { rise: 0.4 }); }
      else p.win(2.2, h0, 1.3, 2.0, { rise: 0.65, blind: lit(0.4) ? 0.6 : 0 });
    }
    band(p, 17.4, 18.0, E); p.frieze(0, E, 21.4, 22.5);
  }
  // ---- A: the west elevation of the north-west body, developed along its round bays
  {
    const p = P('A'), E = 36.9;
    corners(p, E); plinthOf(p, E);
    p.shop(1.2, 15.8, 0.6, 4.6, 5); p.shop(17.6, 25.4, 0.6, 4.6, 3); p.shop(29.8, 36.3, 0.6, 4.6, 3);
    // the portal with its curly canopy, right of the bank
    p.shape(26.0, 0.0, 2.3, 3.4, 0.9, DARK); p.shape(26.2, 0.1, 1.9, 3.3, 0.8, '#6d4f3a'); p.fillR(25.6, 4.0, 28.7, 4.45, TAN);
    p.shape(25.4, 4.4, 3.3, 0.5, 0.9, TAN_L);
    band(p, 4.9, 5.7, E);
    // first floor: pairs of arched windows in the bays, two under the wavy canopy in the middle
    for (const ec of [2.6, 5.3, 8.0, 10.7, 13.4]) p.win(ec, 6.6, 0.9, 1.9, { rise: 0.45, blind: lit(0.5) ? 0.55 : 0 });
    for (const ec of [31.3, 34.2]) p.win(ec, 6.6, 0.9, 1.9, { rise: 0.45, blind: lit(0.5) ? 0.55 : 0 });
    p.fillR(18.0, 9.5, 28.6, 10.0, TAN_L); { let e = 18.0; const g2 = p.mask ? null : true; if (g2) for (; e < 28.6; e += 0.9) { g.fillStyle = TAN_L; g.beginPath(); g.arc(p.X(e + 0.45), p.Y(9.5), 0.45 * PX, 0, Math.PI); g.fill(); } }
    for (const ec of [21.2, 25.4]) p.win(ec, 6.3, 0.95, 2.1, { rise: 0.5 });
    // two tall arched windows with rope frames at the ends of the middle part
    for (const ec of [16.6, 30.0]) { p.win(ec, 6.4, 1.6, 4.9, { rise: 0.8, blind: 0.6 }); p.fillR(ec - 0.5, 7.5, ec + 0.5, 8.5, TAN); }
    // second floor: the shell niche with its two windows
    if (!mask) {
      const cx = p.X(23.3);
      for (let i = 6; i >= 1; i--) { g.fillStyle = i % 2 ? TAN_L : TAN; g.beginPath(); g.ellipse(cx, p.Y(10.9), i * 0.85 * PX, i * 0.66 * PX, 0, Math.PI, 0, false); g.closePath(); g.fill(); }
      g.strokeStyle = TAN; g.lineWidth = 1.5; for (let i = -5; i <= 5; i++) { const a = Math.PI / 2 + i * 0.26; g.beginPath(); g.moveTo(cx + Math.cos(a) * 1.0 * PX, p.Y(10.9) - Math.sin(a) * 0.8 * PX); g.lineTo(cx + Math.cos(a) * 5.0 * PX, p.Y(10.9) - Math.sin(a) * 3.8 * PX); g.stroke(); }
      p.fillR(17.0, 10.5, 29.6, 10.9, WALL);
    }
    for (const ec of [21.0, 25.6]) p.win(ec, 11.3, 1.0, 1.9, { rise: 0.5, bead: false });
    for (const ec of [2.8, 6.4, 10.0, 13.6]) p.win(ec, 11.0, 1.05, 2.0, { blind: lit(0.4) ? 0.6 : 0 });
    for (const ec of [31.0, 34.2]) p.win(ec, 11.0, 1.05, 2.0, { blind: lit(0.4) ? 0.6 : 0 });
    // third floor
    for (const ec of [3.2, 6.8, 10.4, 14.0, 19.0, 22.6, 26.2, 29.6, 32.4, 35.0]) p.win(ec, 15.1, 1.1, 1.9, { blind: lit(0.4) ? 0.6 : 0 });
    band(p, 17.2, 18.0, E);
    // fourth floor under the gables
    for (const ec of [3.0, 5.6, 8.2, 20.0, 23.3, 26.6, 32.0, 34.8]) p.win(ec, 19.0, 0.8, 1.4, { rise: 0.4, bead: false, sill: false });
    p.frieze(0, E, 21.4, 22.5);
  }
  // ---- B: the west elevation of the south body with the tower bay
  {
    const p = P('B'), E = 16.5;
    corners(p, E); plinthOf(p, E);
    p.shop(0.4, 7.8, 0.6, 4.6, 3); p.shop(8.4, 12.3, 0.6, 4.6, 2);
    p.shape(12.9, 0.0, 2.4, 3.4, 0.9, DARK); p.shape(13.1, 0.1, 2.0, 3.3, 0.8, '#6d4f3a'); p.fillR(12.5, 4.0, 15.6, 4.45, TAN);
    p.shape(12.3, 4.4, 3.4, 0.6, 1.0, TAN_L);
    if (!mask) { p.fillR(13.1, 5.8, 15.1, 7.6, FR); }
    band(p, 4.9, 5.7, E);
    for (const ec of [1.7, 4.4, 7.1]) p.win(ec, 6.5, 0.9, 2.2, { rise: 0.45, blind: 0.6 });
    p.win(10.2, 6.5, 1.1, 2.4, { rise: 0.6, blind: 0.5 }); p.win(14.3, 6.5, 1.0, 2.4, { rise: 0.5, blind: 0.5 });
    for (const ec of [1.7, 4.4, 7.1, 10.2, 14.3]) p.win(ec, 11.0, 0.95, 2.0, { blind: lit(0.4) ? 0.6 : 0 });
    for (const ec of [1.7, 4.4, 7.1, 10.2, 14.3]) p.win(ec, 15.0, 0.95, 1.9, { rise: 0.4 });
    band(p, 17.2, 18.0, E);
    for (const ec of [2.0, 5.0, 8.0, 11.0, 14.0]) p.win(ec, 19.0, 0.8, 1.4, { rise: 0.4, bead: false, sill: false });
    p.frieze(0, E, 21.4, 22.5);
  }
  // ---- BK: the back wall of the court: the passage mouth under the big arched stained-glass window
  {
    const p = P('BK'), E = 7.9, hh = 28;
    corners(p, E); plinthOf(p, E);
    // the mouth: a warm lit hall behind a tan portal
    p.shape(1.9, 0.0, 4.1, 4.3, 1.1, TAN); p.shape(2.15, 0.0, 3.6, 4.1, 1.0, '#33281f');
    if (mask) { g.fillStyle = '#fff'; p.shape(2.15, 0.0, 3.6, 4.1, 1.0, '#ffd9a0', true); }
    p.fillR(1.5, 5.0, E - 1.5, 5.7, TAN_L); p.fillR(1.5, 5.0, E - 1.5, 5.08, TAN);
    // the stained glass: sky, hills, fields, the black eagle, a leaded grid, a floral border
    const gx0 = 1.2, gx1 = 6.7, gy0 = 6.4, gy1 = 15.3, gr = 2.6;
    if (!mask) {
      p.shape(gx0 - 0.4, gy0 - 0.3, gx1 - gx0 + 0.8, gy1 - gy0 + 0.3, gr + 0.4, GREEN);
      g.save(); g.beginPath(); g.moveTo(p.X(gx0), p.Y(gy0)); g.lineTo(p.X(gx0), p.Y(gy1)); g.ellipse(p.X((gx0 + gx1) / 2), p.Y(gy1), (gx1 - gx0) / 2 * PX, gr * PX, 0, Math.PI, 0, false); g.lineTo(p.X(gx1), p.Y(gy0)); g.closePath(); g.clip();
      const sky = g.createLinearGradient(0, p.Y(gy1 + gr), 0, p.Y(gy0)); sky.addColorStop(0, '#3c58b8'); sky.addColorStop(0.45, '#b99ad8'); sky.addColorStop(0.62, '#e8b4c6'); sky.addColorStop(0.64, '#6a7fd0'); sky.addColorStop(0.72, '#5f9a5a'); sky.addColorStop(0.86, '#d6c25a'); sky.addColorStop(1, '#7ab255');
      g.fillStyle = sky; g.fillRect(p.X(gx0), p.Y(gy1 + gr), (gx1 - gx0) * PX, (gy1 + gr - gy0) * PX);
      const col = ['#68b05a', '#d8b84a', '#9c64b8', '#c8704a', '#4a88c8'];
      for (let i = 0; i < 26; i++) { g.fillStyle = col[i % 5]; g.globalAlpha = 0.65; g.beginPath(); const cx = p.X(gx0 + ra() * 5.5), cy = p.Y(gy0 + ra() * 3.4); g.ellipse(cx, cy, (0.5 + ra() * 1.2) * PX, (0.2 + ra() * 0.5) * PX, ra() * 0.6, 0, Math.PI * 2); g.fill(); }
      g.globalAlpha = 1;
      // the eagle, wings spread
      g.fillStyle = '#23252b'; g.beginPath(); const ex = p.X((gx0 + gx1) / 2), ey = p.Y(12.8);
      g.moveTo(ex - 2.4 * PX, ey - 0.3 * PX); g.quadraticCurveTo(ex - 1.1 * PX, ey - 1.0 * PX, ex, ey - 0.2 * PX); g.quadraticCurveTo(ex + 1.1 * PX, ey - 0.9 * PX, ex + 2.4 * PX, ey - 0.1 * PX);
      g.quadraticCurveTo(ex + 1.2 * PX, ey + 0.3 * PX, ex + 0.3 * PX, ey + 0.5 * PX); g.lineTo(ex + 0.2 * PX, ey + 1.0 * PX); g.lineTo(ex - 0.2 * PX, ey + 1.0 * PX); g.lineTo(ex - 0.3 * PX, ey + 0.5 * PX);
      g.quadraticCurveTo(ex - 1.3 * PX, ey + 0.3 * PX, ex - 2.4 * PX, ey - 0.3 * PX); g.fill();
      g.strokeStyle = 'rgba(30,32,40,0.85)'; g.lineWidth = 1.4;
      for (let e = gx0; e <= gx1; e += 0.45) { g.beginPath(); g.moveTo(p.X(e), p.Y(gy0)); g.lineTo(p.X(e), p.Y(gy1 + gr)); g.stroke(); }
      for (let h = gy0; h <= gy1 + gr; h += 0.45) { g.beginPath(); g.moveTo(p.X(gx0), p.Y(h)); g.lineTo(p.X(gx1), p.Y(h)); g.stroke(); }
      g.restore();
      g.strokeStyle = GREEN_D; g.lineWidth = 3; g.beginPath(); g.moveTo(p.X(gx0), p.Y(gy0)); g.lineTo(p.X(gx0), p.Y(gy1)); g.ellipse(p.X((gx0 + gx1) / 2), p.Y(gy1), (gx1 - gx0) / 2 * PX, gr * PX, 0, Math.PI, 0, false); g.lineTo(p.X(gx1), p.Y(gy0)); g.stroke();
    } else {
      g.fillStyle = 'rgba(255,255,255,0.78)'; g.beginPath(); g.moveTo(p.X(gx0), p.Y(gy0)); g.lineTo(p.X(gx0), p.Y(gy1)); g.ellipse(p.X((gx0 + gx1) / 2), p.Y(gy1), (gx1 - gx0) / 2 * PX, gr * PX, 0, Math.PI, 0, false); g.lineTo(p.X(gx1), p.Y(gy0)); g.closePath(); g.fill();
    }
    for (const ec of [0.55, 7.35]) p.win(ec, 7.0, 0.55, 1.8, { rise: 0.3, bead: false });
    band(p, 18.4, 19.0, E);
    for (const ec of [1.5, 6.4]) p.win(ec, 19.6, 0.8, 1.5, { rise: 0.4, bead: false });
    p.frieze(0, E, 21.4, 22.5);
    // the gable above the wall: an oculus in a scalloped field
    if (!mask) {
      p.fillR(0, 22.5, E, hh, WALL);
      for (let i = 4; i >= 1; i--) { g.fillStyle = i % 2 ? TAN_L : TAN; g.beginPath(); g.ellipse(p.X(E / 2), p.Y(22.5), i * 1.0 * PX, i * 1.1 * PX, 0, Math.PI, 0, false); g.closePath(); g.fill(); }
    }
    const lo = lit(0.8);
    if (mask) { g.fillStyle = lo ? '#fff' : '#000'; g.beginPath(); g.ellipse(p.X(E / 2), p.Y(24.3), 0.65 * PX, 0.45 * PX, 0, 0, Math.PI * 2); g.fill(); }
    else { g.fillStyle = FR; g.beginPath(); g.ellipse(p.X(E / 2), p.Y(24.3), 0.85 * PX, 0.62 * PX, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = GLASS; g.beginPath(); g.ellipse(p.X(E / 2), p.Y(24.3), 0.65 * PX, 0.45 * PX, 0, 0, Math.PI * 2); g.fill(); }
  }
  // ---- G: a shell gable: a fan of scallops round an oculus
  {
    const p = P('G'); const w = 10.4;
    if (!mask) {
      p.fillR(0, 0, w, 8.4, WALL);
      for (let i = 5; i >= 1; i--) { g.fillStyle = i % 2 ? TAN_L : TAN; g.beginPath(); g.ellipse(p.X(w / 2), p.Y(1.0), i * 1.0 * PX, i * 1.35 * PX, 0, Math.PI, 0, false); g.closePath(); g.fill(); }
      g.fillStyle = FR; g.beginPath(); g.ellipse(p.X(w / 2), p.Y(3.3), 1.1 * PX, 0.8 * PX, 0, 0, Math.PI * 2); g.fill(); g.fillStyle = GLASS; g.beginPath(); g.ellipse(p.X(w / 2), p.Y(3.3), 0.85 * PX, 0.6 * PX, 0, 0, Math.PI * 2); g.fill();
      g.strokeStyle = FR; g.lineWidth = 1.5; g.beginPath(); g.moveTo(p.X(w / 2), p.Y(2.7)); g.lineTo(p.X(w / 2), p.Y(3.9)); g.moveTo(p.X(w / 2 - 0.85), p.Y(3.3)); g.lineTo(p.X(w / 2 + 0.85), p.Y(3.3)); g.stroke();
    } else { g.fillStyle = '#fff'; g.beginPath(); g.ellipse(p.X(w / 2), p.Y(3.3), 0.85 * PX, 0.6 * PX, 0, 0, Math.PI * 2); g.fill(); }
  }
  // ---- TW: the tower: a drum of white render with green beads (u across 12.4 m), a majolica band, the green scales of the spire
  {
    const [x0, y0, w, hh] = RECT.TW[0];
    if (!mask) {
      g.fillStyle = '#f2e6cf'; g.fillRect(x0, y0, w, 150);
      g.fillStyle = GREEN; for (let j = 0; j < 9; j++) for (let i = 0; i < 40; i++) { g.beginPath(); g.arc(x0 + (i + (j & 1 ? 0.5 : 0)) * 16 + 8, y0 + 12 + j * 16, 3, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#d7ece4'; g.fillRect(x0, y0 + 150, w, 70);
      g.strokeStyle = GREEN; g.lineWidth = 3; for (let i = 0; i < 20; i++) { const cx = x0 + i * 32 + 16; g.beginPath(); g.moveTo(cx - 14, y0 + 205); g.bezierCurveTo(cx - 10, y0 + 160, cx + 10, y0 + 160, cx + 14, y0 + 205); g.stroke(); g.fillStyle = '#d29a4e'; g.beginPath(); g.arc(cx, y0 + 182, 4, 0, Math.PI * 2); g.fill(); }
      g.fillStyle = '#5f9577'; g.fillRect(x0, y0 + 225, w, 105);
      g.fillStyle = '#4a7c61'; for (let j = 0; j < 6; j++) for (let i = 0; i < 32; i++) { g.beginPath(); g.ellipse(x0 + (i + (j & 1 ? 0.5 : 0)) * 20 + 10, y0 + 238 + j * 17, 9, 8, 0, 0, Math.PI); g.fill(); }
    } else { g.fillStyle = '#000'; g.fillRect(x0, y0, w, hh); }
  }
}

export function vnAtlas(seed = 1909) {
  const make = (mask) => canvasTex(W, H, (g) => paint(g, mask, rng(seed)), { aniso: 8 });
  return { map: make(false), emissive: make(true), W, H };
}

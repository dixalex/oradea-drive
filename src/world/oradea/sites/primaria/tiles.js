// OWNER: oradea. The painted wall bays of Primăria Oradea: one bay (4.3 m wide, 15.1 m high, from the top of the 1.1 m
// plinth to the foot of the cornice) of the facade as it stands: a rusticated ground floor with a rectangular window and
// its lintel, a string course, the piano nobile with a flat window under a segmental pediment over a balustraded sill
// between two white pilasters, and above it two arched windows under a shared arch (one arched window on the plain walls), the Corinthian capitals at the top.
// Two styles (ornate, plain) x two night patterns, side by side in one atlas of 4 columns; the second atlas is the glow
// mask (white where a pane is lit).
//   bayAtlas(r) -> { map, emissive, cols: 4, WT, HT }       canvas textures
//   bayCol(style, variant) -> column index 0..3;  bayUV(col, u0, u1) -> [u0, u1] of the column's slice
import { canvasTex } from '../../../cherkasy/sculpt.js';

const PI = Math.PI;
export const WT = 4.3, HT = 15.1, COLS = 4;
const PX = 64;                       // pixels per metre
const CW = Math.round(WT * PX), CH = Math.round(HT * PX);
export const bayCol = (style, variant) => (style === 'plain' ? 2 : 0) + (variant & 1);
export const bayUV = (col, u0, u1) => [(col + u0) / COLS, (col + u1) / COLS];

// paint one bay into the canvas at column x0; `mask` draws the glow mask instead of the colours
function paintBay(g, x0, style, lit, mask, r) {
  const X = (m) => x0 + m * PX, Y = (m) => CH - m * PX, ornate = style === 'ornate';
  const rect = (xa, ya, xb, yb, col) => { g.fillStyle = col; g.fillRect(X(xa), Y(yb), (xb - xa) * PX, (yb - ya) * PX); };
  const glassCol = (on) => (mask ? (on ? '#ffffff' : '#000000') : '#2a3237');
  const arch = (cx, yS, hw, rise, col) => { g.fillStyle = col; g.beginPath(); g.moveTo(X(cx - hw), Y(yS)); g.ellipse(X(cx), Y(yS), hw * PX, rise * PX, 0, PI, 0, false); g.lineTo(X(cx + hw), Y(yS)); g.closePath(); g.fill(); };
  if (mask) { g.fillStyle = '#000'; g.fillRect(x0, 0, CW, CH); }
  else {
    // the wall: ground floor a shade deeper, rusticated; the rest cream
    rect(0, 0, WT, HT, '#ead9a8');
    rect(0, 0, WT, 4.4, '#e1cf98');
    for (let y = 0.55; y < 4.4; y += 0.55) { rect(0, y - 0.02, WT, y + 0.02, '#c9b57c'); rect(0, y - 0.0, WT, y + 0.015, '#f1e4b8'); }
    for (let row = 0; row < 8; row++) for (let k = 0; k < 4; k++) { const x = (row & 1 ? 0.55 : 0) + k * 1.1; rect(x, row * 0.55, x + 0.025, row * 0.55 + 0.55, '#c9b57c'); }
    // the string course between the floors
    rect(0, 4.4, WT, 4.8, '#f4ecd0'); rect(0, 4.4, WT, 4.46, '#bba66e'); rect(0, 4.74, WT, 4.8, '#a89560');
    // a faint grain on the render
    for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(110,90,50,0.07)'; g.fillRect(x0 + r() * CW, r() * CH, 1 + r() * 3, 1 + r() * 2); }
  }
  // ---- ground floor window
  const gw = ornate ? 1.3 : 1.2, gx0 = WT / 2 - gw / 2;
  if (!mask) {
    if (ornate) { rect(gx0 - 0.18, 1.0, gx0 + gw + 0.18, 3.55, '#d8c78e'); rect(gx0 - 0.22, 3.3, gx0 + gw + 0.22, 3.75, '#f4ecd0'); rect(WT / 2 - 0.16, 3.3, WT / 2 + 0.16, 3.85, '#e9dcae'); }
    rect(gx0, 1.1, gx0 + gw, 3.3, '#1d1f21');
    rect(gx0, 1.1, gx0 + gw, 1.18, '#847350');
  }
  rect(gx0 + 0.07, 1.18, gx0 + gw - 0.07, 3.22, glassCol(lit[0]));
  if (!mask) { rect(gx0 + gw / 2 - 0.025, 1.18, gx0 + gw / 2 + 0.025, 3.22, '#2a2118'); rect(gx0 + 0.07, 2.3, gx0 + gw - 0.07, 2.35, '#2a2118'); }
  // ---- piano nobile: window, hood, balustraded sill
  const nw = ornate ? 1.5 : 1.3, nx0 = WT / 2 - nw / 2;
  if (!mask) {
    if (ornate) {
      rect(nx0 - 0.22, 5.3, nx0 + nw + 0.22, 9.6, '#f2e9c9'); rect(nx0 - 0.22, 5.3, nx0 - 0.17, 9.6, '#bba66e'); rect(nx0 + nw + 0.17, 5.3, nx0 + nw + 0.22, 9.6, '#a89560');
      // segmental pediment: a lens over the window
      g.fillStyle = '#f4ecd0'; g.beginPath(); g.moveTo(X(nx0 - 0.4), Y(9.6)); g.quadraticCurveTo(X(WT / 2), Y(10.65), X(nx0 + nw + 0.4), Y(9.6)); g.lineTo(X(nx0 + nw + 0.4), Y(9.45)); g.lineTo(X(nx0 - 0.4), Y(9.45)); g.closePath(); g.fill();
      g.fillStyle = '#d6c58c'; g.beginPath(); g.moveTo(X(nx0 - 0.2), Y(9.6)); g.quadraticCurveTo(X(WT / 2), Y(10.3), X(nx0 + nw + 0.2), Y(9.6)); g.closePath(); g.fill();
      g.fillStyle = '#e8dcae'; g.beginPath(); g.arc(X(WT / 2), Y(9.95), 0.17 * PX, 0, PI * 2); g.fill();
      // the sill: a little balustrade
      rect(nx0 - 0.3, 5.3, nx0 + nw + 0.3, 6.35, '#f4ecd0'); rect(nx0 - 0.3, 6.28, nx0 + nw + 0.3, 6.38, '#cbb98a');
      for (let k = 0; k < 7; k++) { const bx = nx0 - 0.1 + k * ((nw + 0.2) / 6.0); rect(bx - 0.045, 5.45, bx + 0.045, 6.2, '#e0d3a4'); rect(bx - 0.085, 5.7, bx + 0.085, 5.82, '#e0d3a4'); }
    }
    rect(nx0, 6.35, nx0 + nw, 9.45, '#1d1f21');
  }
  rect(nx0 + 0.08, 6.43, nx0 + nw - 0.08, 9.37, glassCol(lit[1]));
  if (!mask) { rect(nx0 + nw / 2 - 0.03, 6.43, nx0 + nw / 2 + 0.03, 9.37, '#2a2118'); rect(nx0 + 0.08, 8.4, nx0 + nw - 0.08, 8.46, '#2a2118'); }
  // ---- upper floor: two arched windows under one arch
  // the plain walls (the river street's arm among them) have one arched window a bay, the ornate fronts two under a shared arch
  const aw = ornate ? 0.95 : 1.15, ax = ornate ? [WT / 2 - 0.55 - aw / 2 - 0.05, WT / 2 + 0.55 + 0.05 - aw / 2] : [WT / 2 - aw / 2], yS = 13.0;
  if (!mask && ornate) { arch(WT / 2, yS + 0.02, 1.62, 0.95, '#f2e9c9'); rect(WT / 2 - 1.62, 10.7, WT / 2 + 1.62, yS + 0.02, '#f2e9c9'); rect(WT / 2 - 0.11, 10.7, WT / 2 + 0.11, yS + 0.9, '#e0d3a4'); }
  ax.forEach((x, i) => {
    if (!mask) { rect(x - 0.05, 11.2, x + aw + 0.05, yS, '#1d1f21'); arch(x + aw / 2, yS, aw / 2 + 0.05, 0.55, '#1d1f21'); }
    rect(x + 0.03, 11.25, x + aw - 0.03, yS, glassCol(lit[2 + i]));
    g.fillStyle = glassCol(lit[2 + i]); g.beginPath(); g.moveTo(X(x + 0.03), Y(yS)); g.ellipse(X(x + aw / 2), Y(yS), (aw / 2 - 0.03) * PX, 0.5 * PX, 0, PI, 0, false); g.closePath(); g.fill();
    if (!mask) { rect(x + aw / 2 - 0.025, 11.25, x + aw / 2 + 0.025, yS + 0.5, '#2a2118'); rect(x + 0.03, 12.2, x + aw - 0.03, 12.25, '#2a2118'); }
  });
  if (!mask) {
    rect(0.0, 10.5, WT, 10.6, '#bba66e'); // a seam where the upper floor's shadow begins
    // the pilasters: half of one at each side, shafts with flutes and a Corinthian capital
    for (const [xa, xb] of [[0, 0.3], [WT - 0.3, WT]]) {
      rect(xa, 4.8, xb, 14.5, '#f6f0dc'); rect(xb === WT ? xa : xb - 0.03, 4.8, xb === WT ? xa + 0.03 : xb, 14.5, '#c8b98a');
      rect(xa, 14.5, xb, 15.1, '#eadfba'); rect(xa, 14.55, xb, 14.7, '#c3b383'); rect(xa, 14.85, xb, 14.9, '#c3b383');
      for (let k = 0; k < 3; k++) rect(xa + 0.07 + k * 0.07, 4.9, xa + 0.09 + k * 0.07, 14.4, 'rgba(160,145,100,0.45)');
    }
    rect(0, 14.9, WT, 15.1, '#efe5c0');
  }
}

export function bayAtlas(r) {
  const lits = (p) => Array.from({ length: 4 }, () => r() < p);
  const patterns = [[lits(0.3), lits(0.45)], [lits(0.45), lits(0.2)]];
  const make = (mask) => canvasTex(CW * COLS, CH, (g) => {
    // ornate: columns 0, 1; plain: columns 2, 3
    for (let c = 0; c < COLS; c++) paintBay(g, c * CW, c < 2 ? 'ornate' : 'plain', [patterns[c & 1][0][0], patterns[c & 1][0][1], patterns[c & 1][1][0], patterns[c & 1][1][1]], mask, r);
  }, { aniso: 8 });
  return { map: make(false), emissive: make(true), cols: COLS, WT, HT };
}

// Oradea's paint over the traffic's shared texture atlas (npc/vehicles.js makeVehicleAtlas calls it last, before the
// colour swatches): Romanian plates, the taxi roof sign, the bus route boards and operator band, the box-truck sides
// and the eight bus / van ad tiles. It covers every cell that carried Cherkasy text or the Cherkasy game's own
// "advertise in the bot" slots; the cell rectangles are the ones makeVehicleAtlas draws (2048 px frame).
//   vehicleAtlas({ g, box(x0, y0, x1, y1, paint), text(t, x, y, maxW, font, fill), SANS })
const ADS = [ // [board, letters, headline, line]: fictional local ads, Romanian like the street signs
  ['#b8281c', '#ffe08a', 'PIZZA CRIȘ', 'livrare în 30 de minute'], ['#1d3f8f', '#ffffff', 'BĂILE FELIX', 'la 10 minute de oraș'],
  ['#6a1420', '#f3dca0', 'TEATRUL REGINA MARIA', 'stagiune nouă'], ['#17488f', '#ffffff', 'ENERGIE', 'economisește curent'],
  ['#2b211b', '#e8c48a', 'CAFENEA PE CORSO', 'deschis non-stop'], ['#1f7a3e', '#ffffff', 'ENERGIE SOLARĂ', 'panouri pentru casă'],
  ['#1b2a5a', '#ffd24a', 'ASISTENȚĂ JURIDICĂ', '0800 000 000'], ['#e36a12', '#1d1d1d', 'MAGAZIN SPORT', 'aleargă prin oraș'],
];

export function vehicleAtlas({ g, box, text, SANS }) {
  // plates: white, black rim, the EU strip with RO
  const plate = (x0, y0, w, h, fs) => {
    box(x0, y0, x0 + w, y0 + h, '#f4f4f0'); g.strokeStyle = '#111'; g.lineWidth = 5; g.strokeRect(x0 + 4, y0 + 4, w - 8, h - 8);
    const sw = h * 0.5; box(x0 + 7, y0 + 7, x0 + 7 + sw, y0 + h - 7, '#1f47b0');
    g.fillStyle = '#ffd700';
    for (let k = 0; k < 12; k++) { const a = k * Math.PI / 6; g.beginPath(); g.arc(x0 + 7 + sw / 2 + Math.cos(a) * sw * 0.26, y0 + h * 0.32 + Math.sin(a) * sw * 0.26, sw * 0.045, 0, 7); g.fill(); }
    text('RO', x0 + 7 + sw / 2, y0 + h * 0.76, sw * 0.9, `bold ${Math.round(h * 0.26)}px ${SANS}`, '#fff');
    text('BH 12 ORD', x0 + sw + (w - sw) / 2 + 4, y0 + h / 2 + 2, (w - sw) * 0.86, `bold ${fs}px ${SANS}`, '#111');
  };
  plate(0, 1296, 512, 104, 92); plate(0, 1024, 256, 124, 70);
  // taxi roof sign
  box(512, 1316, 1000, 1404, '#f2c200'); text('TAXI', 756, 1362, 260, `bold 72px ${SANS}`, '#111');
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) for (const x0 of [520, 904]) box(x0 + i * 22, 1318 + j * 21, x0 + i * 22 + 21, 1338 + j * 21, '#111');
  // bus: the LED route board, the midibus badge and its cardboard route number, the operator band
  box(0, 1214, 512, 1280, '#0b0b0b'); text('12   CENTRU – NUFĂRUL', 256, 1248, 480, `bold 42px ${SANS}`, '#ffb020');
  box(0, 1416, 256, 1480, '#16171a'); g.strokeStyle = '#aeb3b9'; g.lineWidth = 6; g.strokeRect(5, 1421, 246, 54);
  text('CITY', 128, 1449, 220, `bold 44px ${SANS}`, '#dfe3e8');
  box(256, 1416, 512, 1576, '#f6f4ec'); g.strokeStyle = '#1d4fa8'; g.lineWidth = 10; g.strokeRect(263, 1423, 242, 146);
  text('12', 384, 1486, 200, `bold 112px ${SANS}`, '#141414'); text('CENTRU – NUFĂRUL', 384, 1550, 214, `bold 22px ${SANS}`, '#141414');
  box(512, 1236, 1024, 1312, '#f2f2ee'); text('TRANSPORT PUBLIC ORADEA', 768, 1274, 470, `bold 44px ${SANS}`, '#1d4fa8');
  // box-truck sides: a freight firm in blue, a white box with red rules
  box(1024, 1024, 2048, 1536, '#1d4f8f'); box(1024, 1024, 2048, 1040, '#163d70'); box(1024, 1520, 2048, 1536, '#163d70');
  text('TRANSPORT MARFĂ', 1536, 1170, 940, `bold 136px ${SANS}`, '#ffffff');
  text('Bihor · Cluj · Arad · Timișoara', 1536, 1330, 900, `bold 72px ${SANS}`, '#d8e4f5');
  const gr = g.createLinearGradient(0, 1536, 0, 2048); gr.addColorStop(0, '#ecece6'); gr.addColorStop(1, '#deded6');
  box(1024, 1536, 2048, 2048, gr); box(1024, 1548, 2048, 1566, '#c4201c'); box(1024, 2018, 2048, 2036, '#c4201c');
  text('LIVRĂRI RAPIDE', 1536, 1700, 940, `bold 136px ${SANS}`, '#c4201c');
  text('în toată Oradea, în aceeași zi', 1536, 1850, 900, `bold 72px ${SANS}`, '#8f1612');
  // the eight ad tiles (buses, vans, roof signs)
  ADS.forEach(([bg, fg, t1, t2], i) => {
    const x = 1024 + (i % 2) * 512, y = Math.floor(i / 2) * 170;
    box(x, y, x + 512, y + 170, bg);
    text(t1, x + 256, y + 70, 470, `bold 66px ${SANS}`, fg); text(t2, x + 256, y + 132, 440, `36px ${SANS}`, fg);
  });
}

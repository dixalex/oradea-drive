// Vite config for the fork's city builds. Without VITE_CITY it is Vite's defaults (the upstream Cherkasy game).
// With VITE_CITY=oradea:
//   - index.html gets the Oradea title, description and share card, and no Ukrainian loading text;
//   - a small stylesheet turns the bot chip and the big map's bot link into the WhatsApp feedback chat (config.feedback;
//     bot/ belongs to the Cherkasy game) and hides the other bot links, and an RO / EN switch (src/i18n.js reads the
//     choice) sits in the top-right corner;
//   - the game's Ukrainian UI strings are wrapped in __tr() as modules load (tools/oradea/strings.mjs; the
//     translations are src/world/oradea/ui.js), so upstream's files stay untouched;
//   - dist/ leaves out what only Cherkasy ships: its map data, its radio tracks (the author's own songs) and its
//     partners' logos, its Ukrainian voice lines; the web manifest gets the Oradea name.
import { defineConfig } from 'vite';
import { rmSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { wrapStrings, SKIP } from './tools/oradea/strings.mjs';

const CITY = process.env.VITE_CITY || '';

const ORADEA_HEAD = `<title>Oradea Drive</title>
  <meta name="google" content="notranslate">
  <meta name="description" content="Drive and fly through the real city of Oradea, in your browser. / Condu și zboară prin Oradea, direct în browser.">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="Oradea Drive">
  <meta property="og:title" content="Oradea Drive">
  <meta property="og:description" content="Drive and fly through the real city of Oradea, in your browser.">
  <style>.hud-help .bot { display: none !important; }
    .pc-own, .bm-ctx a { color: #7ee2a8 !important; }
    /* the news chip stays in the HUD's chip chain (hud.js places each after the previous) at zero width */
    .hud-newskey { visibility: hidden !important; width: 0 !important; padding: 0 !important; border: 0 !important; margin-left: -8px !important; overflow: hidden !important; }
    /* the bot chip and the big map's bot link open the WhatsApp feedback chat (config.feedback, ui/botlink.js) */
    .hud-botkey:not(.hud-newskey) i { background: #25d366 !important; font-size: 0 !important; }
    .hud-botkey:not(.hud-newskey) i::before { content: 'I'; font-size: 11px; font-weight: 700; color: #fff; }
    .hud-botkey:not(.hud-newskey):hover { border-color: rgba(37, 211, 102, .9) !important; }
    .bm-legend .bm-bot { background: rgba(26, 160, 80, .9) !important; } .bm-legend .bm-bot:hover { background: #25d366 !important; }
    #lang { position: fixed; top: 8px; right: 8px; z-index: 50; display: flex; border-radius: 6px; overflow: hidden; font: 600 11px system-ui, sans-serif; opacity: .8; }
    #lang button { border: 0; padding: 3px 7px; background: #0d1117cc; color: #9aa4b2; cursor: pointer; }
    #lang button.on { background: #f2c14e; color: #111; }</style>`;

// the language switch: the saved choice wins over the browser's language (src/i18n.js); a switch reloads the page
const LANG_SWITCH = `<div id="lang"><button data-l="ro">RO</button><button data-l="en">EN</button></div>
  <script>(() => {
    let l = 'en'; try { l = new URLSearchParams(location.search).get('lang') || localStorage.getItem('oradea.lang') || (/^ro/i.test(navigator.language) ? 'ro' : 'en'); } catch {}
    document.documentElement.lang = l;
    for (const b of document.querySelectorAll('#lang button')) {
      b.classList.toggle('on', b.dataset.l === l);
      b.onclick = (e) => { e.stopPropagation(); try { localStorage.setItem('oradea.lang', b.dataset.l); } catch {} const u = new URL(location.href); u.searchParams.delete('lang'); location.href = u.href; };
    }
  })();</script>`;

function oradeaPage() {
  let outDir = 'dist';
  return {
    name: 'oradea-page',
    configResolved(c) { outDir = resolve(c.root, c.build.outDir); },
    transformIndexHtml(html) {
      return html
        .replace('<html lang="uk">', '<html lang="ro" translate="no">') // the game has its own RO / EN: no browser auto-translate
        // the head from <title> to the share card's last line
        .replace(/<title>[\s\S]*?<meta name="twitter:card" content="summary_large_image">/, ORADEA_HEAD)
        .replace('<div class="title">Черкаси Драйв</div>', '<div class="title">Oradea Drive</div>')
        .replace('<div class="msg">Завантаження…</div>', '<div class="msg">…</div>')
        .replace('<div id="app"></div>', `<div id="app"></div>\n  ${LANG_SWITCH}`)
        .replace("'Не вдалося запустити гру: '", "(/^ro/i.test(navigator.language) ? 'Jocul nu a pornit: ' : 'The game failed to start: ')");
    },
    closeBundle() {
      for (const p of ['assets/cherkasy', 'assets/radio', 'assets/brand/tors.svg', 'assets/brand/urban.svg', 'assets/brand/uspace.svg',
        'assets/brand/everlabs.svg', 'og.jpg', 'assets/audio/vo', 'assets/audio/pax']) rmSync(resolve(outDir, p), { recursive: true, force: true });
      const mf = resolve(outDir, 'site.webmanifest'), m = JSON.parse(readFileSync(mf, 'utf8'));
      writeFileSync(mf, JSON.stringify({ ...m, name: 'Oradea Drive', short_name: 'Oradea Drive', description: 'Drive and fly through the real city of Oradea' }, null, 1));
    },
  };
}

// upstream's Ukrainian UI strings -> __tr("…") (src/world/oradea/tr.js), and the phone page's link to its own host
function oradeaStrings() {
  return {
    name: 'oradea-strings',
    enforce: 'pre',
    transform(code, id) {
      const f = id.split('?')[0];
      if (!f.endsWith('.js') || !/[\\/]src[\\/]/.test(f) || SKIP.test(f)) return null;
      if (f.endsWith('mapview.js')) code = code.replace('<b>driver.ck.ua</b>', '<b>${location.host}</b>'); // inside the CARD template
      const out = wrapStrings(code);
      return out ? { code: out, map: null } : null;
    },
  };
}

export default defineConfig({
  plugins: CITY === 'oradea' ? [oradeaPage(), oradeaStrings()] : [],
});

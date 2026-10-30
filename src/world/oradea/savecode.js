// The save code. The game keeps progress only in localStorage, which Safari deletes after 7 days without a visit (and a
// private window keeps none), so the controls card (H) gets a line to copy the progress as one text code and to paste a
// code back. The code holds every key of the game (cherkasy.*, cd.*, oradea.*): money, sights, quests, the car, the
// player's mark and the settings. A check at the end turns away a cut or mistyped code.
//   encode(storage) -> 'OD1.<base64url JSON>.<check>';  decode(code) -> { key: value } | null
//   restore(storage, data) -> keys written (the game's other keys are removed, so the state is the saved one)
//   installSaveCode({ storage?, doc? }) -> remove(): adds the line to the controls card once the HUD is up
import { t } from '../../i18n.js';

const GAME = /^(cherkasy|cd|oradea)\./, TAG = 'OD1';
const check = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return (h >>> 0).toString(36); };
const toB64 = (s) => {
  let bin = ''; for (const b of new TextEncoder().encode(s)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};
const fromB64 = (s) => {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};
const gameKeys = (storage) => {
  const out = [];
  for (let i = 0; i < (storage?.length ?? 0); i++) { const k = storage.key(i); if (k && GAME.test(k)) out.push(k); }
  return out;
};

export function encode(storage) {
  const data = {};
  for (const k of gameKeys(storage).sort()) data[k] = storage.getItem(k);
  const body = toB64(JSON.stringify(data));
  return `${TAG}.${body}.${check(body)}`;
}

export function decode(code) {
  const [tag, body, sum, rest] = String(code ?? '').replace(/\s+/g, '').split('.');
  if (tag !== TAG || !body || rest !== undefined || check(body) !== sum) return null;
  try {
    const data = JSON.parse(fromB64(body));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
    return Object.fromEntries(Object.entries(data).filter(([k, v]) => GAME.test(k) && typeof v === 'string'));
  } catch { return null; }
}

export function restore(storage, data) {
  for (const k of gameKeys(storage)) if (!(k in data)) storage.removeItem(k);
  for (const [k, v] of Object.entries(data)) storage.setItem(k, v);
  return Object.keys(data).length;
}

const CSS = `
.savecode-box { position: fixed; inset: 0; z-index: 60; display: grid; place-items: center; background: rgba(6, 9, 15, .55); font: 14px/1.4 system-ui, sans-serif; }
.savecode-box .in { width: min(520px, 92vw); padding: 16px 18px; border-radius: 10px; background: #121826; color: #dfe6f0; border: 1px solid rgba(255, 255, 255, .12); box-shadow: 0 10px 32px rgba(0, 0, 0, .5); }
.savecode-box h4 { margin: 0 0 8px; font-size: 15px; color: #f2c14e; }
.savecode-box p { margin: 0 0 10px; color: #c9d3e4; }
.savecode-box textarea { width: 100%; height: 96px; box-sizing: border-box; padding: 8px; border-radius: 6px; border: 1px solid #3a4660; background: #0b0f18; color: #fff; font: 12px/1.35 ui-monospace, monospace; word-break: break-all; resize: vertical; }
.savecode-box .row { display: flex; gap: 8px; justify-content: flex-end; margin-top: 10px; }
.savecode-box button { padding: 7px 14px; border-radius: 6px; border: 1px solid rgba(255, 255, 255, .2); background: #283247; color: #fff; font: 600 13px system-ui, sans-serif; cursor: pointer; }
.savecode-box button.go { background: #2f6f4e; }
.savecode-box .err { color: #ff8a7a; min-height: 1.4em; margin: 6px 0 0; }`;

export function installSaveCode({ storage = globalThis.localStorage, doc = globalThis.document } = {}) {
  if (!doc || !storage) return () => {};
  let box = null, line = null, tries = 0;
  const close = () => { box?.remove(); box = null; };
  // a small card over the game; keys typed in it stay in it (the game's own input already skips text fields)
  const open = (mode) => {
    close(); doc.exitPointerLock?.();
    box = Object.assign(doc.createElement('div'), { className: 'savecode-box' });
    const show = mode === 'show';
    box.innerHTML = `<div class="in"><h4>💾 ${show ? t('Codul tău de salvare', 'Your save code') : t('Introdu un cod de salvare', 'Enter a save code')}</h4>
      <p>${show ? t('Copiază-l și păstrează-l undeva (o notiță, un mesaj către tine). Cu el îți recuperezi progresul în orice browser.', 'Copy it and keep it somewhere (a note, a message to yourself). It brings your progress back in any browser.')
        : t('Lipește codul copiat mai devreme. Progresul de acum din acest browser va fi înlocuit.', 'Paste a code you copied earlier. The progress now in this browser will be replaced.')}</p>
      <textarea spellcheck="false" ${show ? 'readonly' : ''}></textarea><p class="err"></p>
      <div class="row">${show ? '' : `<button class="go" data-b="load">${t('Încarcă progresul', 'Load the progress')}</button>`}<button data-b="close">${show ? t('Gata', 'Done') : t('Renunță', 'Cancel')}</button></div></div>`;
    const ta = box.querySelector('textarea'), err = box.querySelector('.err');
    if (show) ta.value = encode(storage);
    box.addEventListener('keydown', (e) => { e.stopPropagation(); if (e.code === 'Escape') close(); });
    box.addEventListener('click', (e) => {
      const b = e.target.dataset?.b;
      if (e.target === box || b === 'close') return close();
      if (b !== 'load') return;
      const data = decode(ta.value);
      if (!data) { err.textContent = t('Codul nu e întreg sau nu e un cod Oradea Drive.', 'The code is cut off or not an Oradea Drive code.'); return; }
      restore(storage, data); globalThis.location?.reload();
    });
    doc.body.append(box);
    ta.focus(); if (show) ta.select();
  };
  const copy = async (a) => {
    try {
      await globalThis.navigator.clipboard.writeText(encode(storage));
      const was = a.textContent; a.textContent = t('✓ Copiat', '✓ Copied'); setTimeout(() => { a.textContent = was; }, 2000);
    } catch { open('show'); } // no clipboard: show the code to copy by hand
  };
  const add = () => {
    const help = doc.querySelector('.hud-help');
    if (!help) { if (++tries < 600) return; clearInterval(timer); return; } // the HUD never came up (a load error)
    clearInterval(timer);
    doc.head.append(Object.assign(doc.createElement('style'), { textContent: CSS }));
    line = Object.assign(doc.createElement('p'), { className: 'bot savecode' });
    line.innerHTML = `💾 ${t('Progresul tău stă doar în acest browser, iar Safari îl șterge după 7 zile fără vizită.', 'Your progress lives only in this browser, and Safari deletes it after 7 days without a visit.')}
      <a href="#" data-sc="copy">${t('Copiază codul de salvare', 'Copy the save code')}</a> · <a href="#" data-sc="paste">${t('Introdu un cod', 'Enter a code')}</a>`;
    line.addEventListener('click', (e) => {
      const sc = e.target.dataset?.sc; if (!sc) return;
      e.preventDefault();
      if (sc === 'copy') copy(e.target); else open('paste');
    });
    help.append(line);
  };
  const timer = setInterval(add, 500);
  return () => { clearInterval(timer); close(); line?.remove(); };
}

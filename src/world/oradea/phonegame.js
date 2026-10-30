// The phone tier on screen (?phone; main.js loads this module only then). The pure parts are in phone.js.
//
//   bootGuard({ levels, saved, storage = localStorage, now = Date.now() }) -> guard   the reload guard, before the city
//     loads: reads the last boot record (BOOT_KEY), picks the start level (phone.js guardDecision; a lowered one is saved
//     as the phone level), writes this boot's record. guard = { level, crashed, floor, setLevel(q), clean(), open(),
//     stable() }: setLevel keeps the record on the level in use, clean() marks a deliberate unload or a hidden tab (pagehide,
//     the tab in the background: a phone may discard it there, which is no crash), open() marks it live again (back in
//     front), stable() drops the record once the game has run STABLE_AFTER s
//   startPhone(ctx, { guard, ready }) -> { touch, pill(text, secs), dispose() }   ready: a promise (the consent card)
//   touchTips(text, kbd = false) -> text with the keyboard keys named as the touch buttons (kbd: a <kbd>'s own text)
//     - touch controls (ui/touch.js -> core/input.js input.touch): a stick, gas / brake pedals, handbrake, fly (hold: wings
//       and thrust; the Roadster's jump), horn, map, camera; a look drag on the rest of the screen; keys keep working
//     - no page zoom or scroll, the viewport fitted to the notch, a "turn the phone" card in portrait, fullscreen on
//       the first touch where the browser allows it (Android)
//     - the HUD trimmed for a small screen (body.phone): the minimap top right, money and counters under the chips,
//       the speed bottom centre; no photo or radio chips (their keys still work); a touch section on top of the controls
//       card (H), the save-code line above it stays tappable; a close button over the big map
//     - the centre's soft edge (phone.js boundary on the car each frame), the big map's teleport only inside it, the
//       car brought home when it starts outside (a desktop save, ?at=)
//     - the camera's far plane at FAR (past it everything is lost in the phone haze)
//     - while no shadow maps are drawn (the phone levels: render/shadows.js), a soft blob under the car; in the chase view
//       the Cybertruck's cabin and driver (behind its dark glass) leave the main camera's layer: ~10 draw calls
//     - the guard's pill when the last start crashed; the guard's record follows quality changes, is closed on pagehide
//       and while the tab is hidden, and dropped after a minute of play
import * as THREE from 'three';
import { createTouchControls, touchCss } from '../../ui/touch.js';
import { decalBias } from '../../render/renderer.js';
import { guardDecision, boundary, inDisc, NAMES, STABLE_AFTER } from './phone.js';
import { t } from '../../i18n.js';

// BOOT_KEY is this device's own: outside savecode.js's game keys, so a save code never carries it to another phone
const BOOT_KEY = 'odphone.boot', LEVEL_KEY = 'cd.quality.phone', FAR = 1800;
const CABIN = /^(CarInterior|CarSeat|CarDashTop|CarHeadliner|CarCarpet|Driver)/; // the Cybertruck's (model.js); the Roadster's white seats show

// a soft dark ellipse on the ground under the car (one draw call)
function createBlob(renderer) {
  const c = globalThis.document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 4, 32, 32, 32);
  gr.addColorStop(0, 'rgba(0,0,0,.62)'); gr.addColorStop(0.55, 'rgba(0,0,0,.4)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = decalBias(new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, toneMapped: false }), renderer, 2);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), mat);
  m.name = 'car-blob'; m.renderOrder = 2; m.frustumCulled = false;
  return m;
}

export function bootGuard({ levels, saved = null, storage = globalThis.localStorage, now = Date.now() } = {}) {
  let rec = null;
  try { rec = JSON.parse(storage?.getItem(BOOT_KEY) || 'null'); } catch { /* storage off or a bad record */ }
  const d = guardDecision(rec, now, levels, saved);
  let mine = { at: now, level: d.level, clean: false };
  const write = (r) => { try { if (r) storage?.setItem(BOOT_KEY, JSON.stringify(r)); else storage?.removeItem(BOOT_KEY); } catch { /* storage off */ } };
  write(mine);
  if (d.crashed) try { storage?.setItem(LEVEL_KEY, d.level); } catch { /* storage off */ }
  return {
    ...d,
    setLevel(q) { if (mine) { mine = { ...mine, level: q }; write(mine); } },
    clean() { if (mine) write({ ...mine, clean: true }); },
    open() { if (mine) write(mine); },
    stable() { mine = null; write(null); },
  };
}

const CSS = `
body.phone { touch-action: none; overscroll-behavior: none; -webkit-user-select: none; user-select: none; -webkit-touch-callout: none; }
body.phone #lang { display: none; }
body.phone .hud > button > kbd, body.phone .hud > a > kbd, body.phone .quest-chip kbd, body.phone .hud-mapkey, body.phone .hud-compass { display: none !important; }
/* chips the phone leaves out keep their place in hud.js's chip chain (each is placed after the previous) at zero width */
body.phone .hud-photokey, body.phone .hud-radiokey, body.phone .hud-radionext, body.phone .hud-carkey.locked { visibility: hidden !important; width: 0 !important; padding: 0 !important;
  border: 0 !important; margin-left: -8px !important; overflow: hidden !important; }
body.phone .hud-map { width: 132px !important; height: 82px !important; }
body.phone .hud-helpkey, body.phone .hud-botkey, body.phone .hud-homekey, body.phone .hud-carkey { top: max(6px, env(safe-area-inset-top));
  padding: 4px 9px; font-size: 11px; letter-spacing: .03em; border-radius: 7px; }
body.phone .hud-helpkey { left: calc(8px + env(safe-area-inset-left)); }
body.phone .hud-botkey i { width: 16px; height: 16px; }
body.phone .hud-nav { left: auto; right: calc(8px + env(safe-area-inset-right)); top: max(6px, env(safe-area-inset-top)); bottom: auto; gap: 0; }
body.phone .hud-money { left: calc(10px + env(safe-area-inset-left)); right: auto; top: 40px; bottom: auto; font-size: 17px; }
body.phone .hud-explore { left: calc(8px + env(safe-area-inset-left)); right: auto; top: 66px; bottom: auto; font-size: 11px; padding: 2px 7px; transform-origin: left center; }
body.phone .hud-explore b, body.phone .quest-chip b { font-size: 13px; }
body.phone .quest-chip { left: calc(8px + env(safe-area-inset-left)); right: auto; top: 90px; bottom: auto; font-size: 11px; padding: 2px 7px; }
body.phone .hud-speed { left: 50%; bottom: max(4px, env(safe-area-inset-bottom)); transform: translateX(-50%); text-align: center; }
body.phone .hud-speed .v { font-size: 28px; }
body.phone .hud-speed .u { font-size: 9px; letter-spacing: .1em; }
/* the mission panel between the chips and the minimap */
body.phone .hud-panel, body.phone .hud-panel.side { left: auto; right: calc(150px + env(safe-area-inset-right)); top: 4px; transform: none; min-width: 0;
  max-width: max(200px, calc(100vw - 460px)); padding: 5px 10px 7px; }
body.phone .hud-panel .ttl { font-size: 10px; } body.phone .hud-panel .obj { font-size: 13px; }
body.phone .hud-panel .row { margin-top: 3px; font-size: 12px; } body.phone .hud-panel .bl { min-width: 0; font-size: 11px; }
body.phone .hud-panel .bar { width: 90px; } body.phone .hud-panel .bar.dmg { width: 100px; }
body.phone .hud-banner { top: 22vh; font-size: 22px; } body.phone .hud-banner small { font-size: 13px; }
body.phone .hud-hint, body.phone .hud-fly { font-size: 12px; bottom: 30vh; padding: 5px 10px; }
body.phone .hud-gas { bottom: 34vh; grid-template-columns: auto 120px auto; font-size: 10px; }
body.phone .hud-perf { bottom: 46px; font-size: 12px; }
body.phone .hud-help { z-index: 3; pointer-events: none; visibility: hidden; top: 40px; left: calc(8px + env(safe-area-inset-left)); width: min(560px, calc(100vw - 16px));
  max-height: calc(100vh - 52px); font-size: 11.5px; -webkit-overflow-scrolling: touch; touch-action: pan-y; }
body.phone .hud-help.on { pointer-events: auto; visibility: visible; } /* closed, it must not catch the stick's finger */
body.phone .hud-help .cols { column-count: 1; }
body.phone .bigmap .bm-north { right: calc(70px + env(safe-area-inset-right)); }
body.phone .bigmap .bm-scale { bottom: auto; top: 70px; right: calc(16px + env(safe-area-inset-right)); }
body.phone .hud-help .r { grid-template-columns: 96px 1fr; }
body.phone .hud-help section:not(.ph-touch):not(:last-child) { display: none; } /* the keyboard's groups; the city's own (ideas) stays */
body.phone .quest-card, body.phone .partner-card { left: 50%; right: auto; top: max(6px, env(safe-area-inset-top)); width: min(380px, 52vw); max-height: 60vh;
  overflow: auto; padding: 10px 12px; border-radius: 12px; border-right: inherit; transform: translate(-50%, -115%); font-size: 12px; touch-action: pan-y; }
body.phone .quest-card.on, body.phone .partner-card.on { transform: translate(-50%, 0); }
body.phone .quest-card b, body.phone .partner-card b { font-size: 15px; }
body.phone .quest-card .qc-story { font-size: 12.5px; margin: 8px 0; }
.tc-b.gas { right: calc(12px + env(safe-area-inset-right)); bottom: max(14px, env(safe-area-inset-bottom)); width: 72px; height: 112px; border-radius: 22px; }
.tc-b.brake { right: calc(92px + env(safe-area-inset-right)); bottom: max(14px, env(safe-area-inset-bottom)); width: 66px; height: 78px; border-radius: 20px; }
.tc-b.hb { right: calc(98px + env(safe-area-inset-right)); bottom: 102px; width: 54px; height: 54px; }
.tc-b.fly { right: calc(18px + env(safe-area-inset-right)); bottom: 136px; width: 60px; height: 60px; }
.tc-b.horn { right: calc(168px + env(safe-area-inset-right)); bottom: max(18px, env(safe-area-inset-bottom)); width: 48px; height: 48px; }
.tc-b.map { right: calc(8px + env(safe-area-inset-right)); top: 92px; width: 44px; height: 44px; }
.tc-b.cam { right: calc(58px + env(safe-area-inset-right)); top: 92px; width: 44px; height: 44px; }
.tc-b.map b, .tc-b.cam b, .tc-b.horn b { font-size: 17px; }
.tc-zone { padding-left: env(safe-area-inset-left); top: 120px; height: auto; }
.ph-close { position: fixed; right: calc(10px + env(safe-area-inset-right)); top: max(10px, env(safe-area-inset-top)); z-index: 22; width: 46px; height: 46px;
  border-radius: 50%; border: 1px solid rgba(255, 255, 255, .3); background: rgba(14, 20, 32, .9); color: #fff; font: 600 20px system-ui, sans-serif;
  display: none; touch-action: manipulation; }
.ph-close.on { display: block; }
.ph-pill { position: fixed; left: 50%; top: 44px; z-index: 15; transform: translate(-50%, -6px); max-width: 80vw; padding: 7px 14px; border-radius: 999px;
  background: rgba(12, 16, 26, .85); border: 1px solid rgba(242, 193, 78, .6); color: #e8eef7; font: 600 12.5px system-ui, sans-serif; text-align: center;
  opacity: 0; transition: opacity .3s, transform .3s; pointer-events: none; }
.ph-pill.on { opacity: 1; transform: translate(-50%, 0); }
.ph-rotate { position: fixed; inset: 0; z-index: 30; display: none; place-content: center; gap: 10px; text-align: center; padding: 24px;
  background: rgba(8, 12, 20, .88); color: #e8eef7; font: 600 16px system-ui, sans-serif; }
.ph-rotate i { font-style: normal; font-size: 44px; }
.ph-rotate small { font-weight: 400; color: #9aa4b2; }
@media (orientation: portrait) { body.phone .ph-rotate:not(.gone) { display: grid; } }
`;

const TOUCH_HELP = () => [
  [t('Stânga', 'Left'), t('trage oriunde în jumătatea stângă: volan; în aer sus / jos – urcă / coboară', 'drag anywhere on the left half: steer; in the air up / down – climb / dive')],
  ['▲ / ▼', t('accelerație / frână, marșarier', 'gas / brake, reverse')],
  ['P', t('frâna de mână: derapaj', 'handbrake: drift')],
  ['✈', t('ține: aripi + tracțiune (Roadster: ține – presiune, eliberează – salt)', 'hold: wings + thrust (Roadster: hold – pressure, let go – jump)')],
  ['📯 · 🗺 · 🎥', t('claxon · harta · camera', 'horn · map · camera')],
  [t('Dreapta', 'Right'), t('trage pe ecran: privește în jur', 'drag on the screen: look around')],
  ['', t('Versiunea de telefon (beta) are doar centrul orașului, cu grafică simplă.', 'The phone beta has the city centre only, with simple graphics.')],
];

// the HUD's tips are written for a keyboard; on a phone the same actions sit on the touch buttons
const TOUCH_KEY = { Shift: '✈', W: '▲', S: '▼', Space: 'P' };
export function touchTips(text, kbd = false) {
  if (kbd) return TOUCH_KEY[text.trim()] ?? text;
  return text.replace(/\bShift\b/g, '✈').replace(/(^|[\s·(])(W|S|Space)(?=:| –| -)/g, (m, a, k) => a + TOUCH_KEY[k]);
}

export function startPhone(ctx, { guard = null, ready = Promise.resolve() } = {}) {
  const doc = globalThis.document, { input, hud, car, world, camera } = ctx;
  const style = doc.createElement('style');
  style.textContent = touchCss + CSS;
  doc.head.appendChild(style);
  doc.body.classList.add('phone');
  const vp = doc.querySelector('meta[name=viewport]');
  vp?.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
  // no pinch zoom, double-tap zoom or rubber-band scroll; the scrollable cards keep their own pan
  const scrolls = '.hud-help, .quest-book, .quest-card, .partner-card, .savecode-box, .bigmap';
  const noGesture = (e) => e.preventDefault();
  const noMove = (e) => { if (!e.target?.closest?.(scrolls)) e.preventDefault(); };
  doc.addEventListener('gesturestart', noGesture);
  doc.addEventListener('dblclick', noGesture);
  doc.addEventListener('touchmove', noMove, { passive: false });
  camera.far = Math.min(camera.far, FAR); camera.updateProjectionMatrix();

  // ---- touch controls
  const touch = createTouchControls({ input, container: doc.body, buttons: [
    { id: 'gas', action: 'gas', label: '▲', sub: t('Accel.', 'Gas'), cls: 'gas' },
    { id: 'brake', action: 'brake', label: '▼', sub: t('Frână', 'Brake'), cls: 'brake' },
    { id: 'hb', action: 'jump', label: 'P', sub: t('Drift', 'Drift'), cls: 'hb' },
    { id: 'fly', action: 'sprint', label: '✈', sub: t('Zbor', 'Fly'), cls: 'fly' },
    { id: 'horn', action: 'horn', label: '📯', cls: 'horn' },
    { id: 'map', action: 'map', label: '🗺', cls: 'map' },
    { id: 'cam', action: 'camera', label: '🎥', cls: 'cam' },
  ] });
  touch.onFirst = () => { // Android: the whole screen, held sideways (iPhones have no element fullscreen)
    const de = doc.documentElement;
    if (doc.fullscreenElement || !de.requestFullscreen) return;
    de.requestFullscreen({ navigationUI: 'hide' }).then(() => globalThis.screen?.orientation?.lock?.('landscape')).catch(() => {});
  };
  const close = Object.assign(doc.createElement('button'), { type: 'button', className: 'ph-close', textContent: '✕' });
  close.setAttribute('aria-label', t('Închide harta', 'Close the map'));
  close.addEventListener('click', (e) => { e.preventDefault(); hud.map.close(); });
  const pillEl = Object.assign(doc.createElement('div'), { className: 'ph-pill' });
  const rotate = Object.assign(doc.createElement('div'), { className: 'ph-rotate' });
  rotate.innerHTML = `<i>📱↻</i><div>${t('Întoarce telefonul orizontal', 'Turn your phone sideways')}</div><small>${t('Atinge pentru a juca așa', 'Tap to play like this')}</small>`;
  rotate.addEventListener('click', () => rotate.classList.add('gone'));
  doc.body.append(close, pillEl, rotate);
  let pillT = 0;
  const pill = (text, secs = 4) => { pillEl.textContent = text; pillEl.classList.add('on'); pillT = secs; };

  // the controls card: the touch section first (after the save-code line)
  const cols = hud.root.querySelector('.hud-help .cols');
  if (cols) {
    const sec = doc.createElement('section');
    sec.className = 'ph-touch';
    sec.innerHTML = `<h5>${t('Atingere', 'Touch')}</h5>` + TOUCH_HELP().map(([k, d]) =>
      `<div class="r"><span class="k">${k ? `<kbd>${k}</kbd>` : ''}</span><span class="t"></span></div>`).join('');
    sec.querySelectorAll('.t').forEach((e, i) => { e.textContent = TOUCH_HELP()[i][1]; });
    cols.prepend(sec);
  }
  globalThis.dispatchEvent?.(new Event('resize')); // the HUD re-measures its chips at their phone size

  // ---- the tips (flight, missions, the Roadster's jump, toasts) with the touch buttons' names, as they appear
  const tipFix = (n) => {
    const p = n.parentElement;
    if (!p || p.closest('.hud-help, textarea, input')) return;
    const v = n.nodeValue, w = touchTips(v, p.tagName === 'KBD');
    if (w !== v) n.nodeValue = w;
  };
  const tipWalk = (el) => { const it = doc.createTreeWalker(el, 4); for (let n; (n = it.nextNode());) tipFix(n); }; // 4: text nodes
  tipWalk(doc.body);
  const tips = new MutationObserver((ms) => {
    for (const m of ms) {
      if (m.type === 'characterData') tipFix(m.target);
      else for (const n of m.addedNodes) if (n.nodeType === 3) tipFix(n); else if (n.nodeType === 1) tipWalk(n);
    }
  });
  tips.observe(doc.body, { subtree: true, childList: true, characterData: true });

  // ---- the centre: the big map's teleport only inside it, the car home when it starts outside
  const C = world.phone;
  if (C) {
    const go = hud.onGo;
    hud.onGo = (p) => { if (inDisc(p.x, p.z, C)) go?.(p); else { hud.map.close(); pill(t('Pe telefon (beta) doar centrul orașului', 'Phone beta: the city centre only')); } };
    if (!inDisc(car.state.p.x, car.state.p.z, C)) car.home();
  }

  // ---- the car: a blob while there are no shadow maps, no cabin in the chase view
  const blob = createBlob(ctx.renderer);
  ctx.scene.add(blob);
  let cabin = [], cabinOf = null, cabinOn = true;
  const carLook = () => {
    const s = car.state, sun = ctx.shadows?.light;
    blob.visible = !!sun && !sun.castShadow;
    if (blob.visible) {
      const gy = s.grounded ? s.p.y : world.groundHeight(s.p.x, s.p.z, s.p.y + 0.5), h = Math.max(0, s.p.y - gy), k = Math.max(0, 1 - h / 12);
      blob.visible = k > 0.02;
      blob.position.set(s.p.x, gy + 0.03, s.p.z); blob.rotation.y = s.yaw;
      const L = car.kind === 'roadster' ? 5.4 : 6.6, W = car.kind === 'roadster' ? 2.8 : 3.2;
      blob.scale.set(W * (1 + h * 0.05), 1, L * (1 + h * 0.05)); blob.material.opacity = k;
    }
    if (cabinOf !== car.model) { // the model in use: its cabin meshes, once
      for (const m of cabin) m.layers.enable(0);
      cabinOf = car.model; cabin = []; cabinOn = true;
      car.model.object.traverse((o) => { if (o.isMesh && CABIN.test(o.material?.name ?? '')) cabin.push(o); });
    }
    const want = car.cam.mode === 'cockpit';
    if (want !== cabinOn) { cabinOn = want; for (const m of cabin) if (want) m.layers.enable(0); else m.layers.disable(0); }
  };

  // ---- per frame: the controls follow the overlays (always: the map pauses the game); the edge and the guard's clock
  let shown = false; // the consent card accepted
  ctx.addSystem((dt) => {
    const overlay = hud.map.isOpen || ctx.quests?.isOpen || ctx.photo?.isOpen;
    touch.show(shown && !overlay);
    close.classList.toggle('on', hud.map.isOpen);
    touch.setLabel('fly', car.kind === 'roadster' ? '⤒' : '✈', car.kind === 'roadster' ? t('Salt', 'Jump') : t('Zbor', 'Fly'));
    if (pillT > 0 && (pillT -= dt) <= 0) pillEl.classList.remove('on');
    carLook();
  }, 'phoneUi', { always: true });
  let edgeT = 0, run = 0;
  ctx.addSystem((dt) => {
    if (C) {
      const s = car.state, b = boundary(s.p.x, s.p.z, s.v.x, s.v.z, dt, C);
      if (b.over > 0) {
        s.v.x = b.vx; s.v.z = b.vz;
        if (b.px !== s.p.x || b.pz !== s.p.z) { s.p.x = b.px; s.p.z = b.pz; }
        if ((edgeT -= dt) <= 0) { edgeT = 8; pill(t('Pe telefon (beta) doar centrul orașului', 'Phone beta: the city centre only')); }
      }
    }
    if (guard && run < STABLE_AFTER && (run += dt) >= STABLE_AFTER) guard.stable();
  }, 'phoneEdge');

  // ---- the guard: the record follows the level, a deliberate unload is not a crash, the pill after a crash
  const onQuality = (q) => guard?.setLevel(q);
  ctx.events.on('quality', onQuality);
  const onHide = () => guard?.clean();
  const onVis = () => (doc.hidden ? guard?.clean() : guard?.open());
  globalThis.addEventListener?.('pagehide', onHide);
  doc.addEventListener('visibilitychange', onVis);
  ready.then(() => {
    shown = true;
    if (guard?.crashed) pill(guard.floor
      ? t('Jocul a repornit singur. Grafica e deja la minimum: închide alte file și aplicații.', 'The game restarted itself. Graphics are already at the lowest: close other tabs and apps.')
      : t(`Jocul a repornit singur: acum grafică ${NAMES[guard.level] ?? guard.level}.`, `The game restarted itself: graphics now ${NAMES[guard.level] ?? guard.level}.`), 9);
  });

  return {
    touch, pill,
    dispose() {
      touch.dispose(); tips.disconnect(); close.remove(); blob.removeFromParent(); for (const m of cabin) m.layers.enable(0); pillEl.remove(); rotate.remove(); style.remove(); doc.body.classList.remove('phone');
      doc.removeEventListener('gesturestart', noGesture); doc.removeEventListener('dblclick', noGesture); doc.removeEventListener('touchmove', noMove);
      globalThis.removeEventListener?.('pagehide', onHide); doc.removeEventListener('visibilitychange', onVis);
    },
  };
}

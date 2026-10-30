// On-screen controls for touch screens: a floating stick on the left, pedals and buttons on the right, a look drag on
// the rest of the screen. Everything goes through src/core/input.js (input.touch), so the game reads a finger like a key
// and the keys keep working. Pointer events, one per finger: any number of them at once.
//
//   createTouchControls({ input, container = document.body, buttons, stick? }) -> touch
//     buttons: [{ id, action, label, sub?, cls? }]  a finger on the button holds input action `action` (a quick tap still
//       counts as one press: input.js latches presses between frames); cls places it (the CSS in touchCss)
//     stick: { radius = 56 }  the left half's stick: x steers, finger up = nose up in the air (stickAxes)
//     touch.root, touch.show(on), touch.visible, touch.setLabel(id, label, sub?), touch.button(id) -> element,
//     touch.onFirst = fn (the first finger down: a page may ask for fullscreen then), touch.dispose()
//   stickAxes(dx, dy, radius, dead = 0.12) -> { x, y }   a finger's offset (CSS px, y down) from the stick's centre ->
//     -1..1 axes for input.touch.stick: x right +, y = +1 when the finger is below the centre (nose down) – drag up to
//     climb; a dead zone in the middle, clamped to the circle, rescaled past the dead zone
//   LOOK_K: look speed (mouse pixels per CSS pixel of drag)
//   touchCss: the stylesheet (a page injects it once; node tests import this module without a CSS loader)
export const LOOK_K = 2.2;

export function stickAxes(dx, dy, radius, dead = 0.12) {
  if (!(radius > 0)) return { x: 0, y: 0 };
  let x = dx / radius, y = dy / radius;
  const m = Math.hypot(x, y);
  if (m > 1) { x /= m; y /= m; }
  const n = Math.min(1, m);
  if (n <= dead) return { x: 0, y: 0 };
  const k = (n - dead) / (1 - dead) / n; // rescale so the edge of the dead zone is 0 and the rim 1
  const r = (v) => Math.round(v * k * 1000) / 1000 || 0;
  return { x: r(x), y: r(y) };
}

export const touchCss = `
.tc { position: fixed; inset: 0; z-index: 11; pointer-events: none; touch-action: none; user-select: none; -webkit-user-select: none;
  -webkit-touch-callout: none; font: 600 11px system-ui, -apple-system, sans-serif; color: #fff; }
.tc.off { display: none; }
.tc-look { position: absolute; inset: 0; pointer-events: auto; touch-action: none; }
.tc-zone { position: absolute; left: 0; bottom: 0; width: 42%; height: 72%; pointer-events: auto; touch-action: none; }
.tc-base { position: absolute; width: 120px; height: 120px; margin: -60px 0 0 -60px; border-radius: 50%; pointer-events: none;
  border: 2px solid rgba(255, 255, 255, .28); background: radial-gradient(circle, rgba(12, 16, 26, .18), rgba(12, 16, 26, .38)); transition: opacity .2s; }
.tc-knob { position: absolute; left: 50%; top: 50%; width: 52px; height: 52px; margin: -26px 0 0 -26px; border-radius: 50%;
  background: rgba(255, 255, 255, .55); box-shadow: 0 2px 10px rgba(0, 0, 0, .35); }
.tc-base.rest { opacity: .55; }
.tc-b { position: absolute; pointer-events: auto; touch-action: none; display: grid; place-content: center; text-align: center; gap: 1px;
  border-radius: 50%; border: 2px solid rgba(255, 255, 255, .3); background: rgba(12, 16, 26, .45); box-shadow: 0 2px 10px rgba(0, 0, 0, .3);
  -webkit-tap-highlight-color: transparent; transition: background .08s, transform .08s; box-sizing: border-box; }
.tc-b b { font-size: 20px; line-height: 1; font-weight: 700; }
.tc-b small { font-size: 9.5px; letter-spacing: .04em; opacity: .85; text-transform: uppercase; }
.tc-b.on { background: rgba(242, 193, 78, .55); border-color: rgba(242, 193, 78, .95); transform: scale(.95); }
`;

export function createTouchControls({ input, container = globalThis.document?.body, buttons = [], stick = {} }) {
  const doc = container.ownerDocument, R = stick.radius ?? 56;
  const root = doc.createElement('div');
  root.className = 'tc off';
  root.innerHTML = `<div class="tc-look"></div><div class="tc-zone"><div class="tc-base rest"><div class="tc-knob"></div></div></div>`;
  const look = root.querySelector('.tc-look'), zone = root.querySelector('.tc-zone'), base = root.querySelector('.tc-base'), knob = root.querySelector('.tc-knob');
  const els = new Map(), held = new Map(); // button id -> element; pointerId -> button id
  for (const b of buttons) {
    const e = doc.createElement('div');
    e.className = `tc-b ${b.cls ?? ''}`;
    e.dataset.id = b.id;
    e.innerHTML = `<b></b><small></small>`;
    root.appendChild(e); els.set(b.id, e);
    setLabel(b.id, b.label, b.sub);
  }
  container.appendChild(root);

  let first = true, visible = false;
  const api = { root, onFirst: null };
  const firstTouch = () => { if (first) { first = false; try { api.onFirst?.(); } catch { /* fullscreen refused */ } } };
  const cap = (e) => { try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* not a live pointer */ } };
  const stop = (e) => { e.preventDefault(); e.stopPropagation(); };

  // buttons: hold while a finger is on them (a finger that slides off keeps it until it lifts, like a pedal)
  for (const b of buttons) {
    const e = els.get(b.id);
    e.addEventListener('pointerdown', (ev) => {
      stop(ev); cap(ev); firstTouch();
      held.set(ev.pointerId, b.id); e.classList.add('on'); input.touch.hold(b.action);
    });
    const up = (ev) => {
      if (held.get(ev.pointerId) !== b.id) return;
      stop(ev); held.delete(ev.pointerId);
      if (![...held.values()].includes(b.id)) { e.classList.remove('on'); input.touch.release(b.action); }
    };
    e.addEventListener('pointerup', up); e.addEventListener('pointercancel', up); e.addEventListener('lostpointercapture', up);
    e.addEventListener('contextmenu', (ev) => ev.preventDefault());
  }

  // the stick: it centres where the finger lands in the zone; the knob follows within the radius
  let sp = null; // { id, cx, cy } (client px)
  const placeBase = (x, y) => { const r = zone.getBoundingClientRect(); base.style.left = `${x - r.left}px`; base.style.top = `${y - r.top}px`; };
  const restBase = () => { const r = zone.getBoundingClientRect(); placeBase(r.left + Math.max(78, r.width * 0.3), r.bottom - 84); knob.style.transform = ''; base.classList.add('rest'); };
  zone.addEventListener('pointerdown', (ev) => {
    stop(ev); firstTouch();
    if (sp) return; // one finger steers
    cap(ev); sp = { id: ev.pointerId, cx: ev.clientX, cy: ev.clientY };
    placeBase(sp.cx, sp.cy); base.classList.remove('rest');
  });
  zone.addEventListener('pointermove', (ev) => {
    if (!sp || ev.pointerId !== sp.id) return;
    stop(ev);
    const dx = ev.clientX - sp.cx, dy = ev.clientY - sp.cy, m = Math.hypot(dx, dy), k = m > R ? R / m : 1;
    knob.style.transform = `translate(${(dx * k).toFixed(1)}px, ${(dy * k).toFixed(1)}px)`;
    const a = stickAxes(dx, dy, R);
    input.touch.stick(a.x, -a.y); // finger up = nose up (input: +1 = nose down)
  });
  const stickUp = (ev) => { if (!sp || ev.pointerId !== sp.id) return; stop(ev); sp = null; input.touch.stick(0, 0); restBase(); };
  zone.addEventListener('pointerup', stickUp); zone.addEventListener('pointercancel', stickUp); zone.addEventListener('lostpointercapture', stickUp);

  // look: a drag on the rest of the screen turns the camera (it eases back on its own, car.js)
  const drags = new Map();
  look.addEventListener('pointerdown', (ev) => { stop(ev); cap(ev); firstTouch(); drags.set(ev.pointerId, [ev.clientX, ev.clientY]); });
  look.addEventListener('pointermove', (ev) => {
    const p = drags.get(ev.pointerId); if (!p) return;
    stop(ev);
    input.touch.look((ev.clientX - p[0]) * LOOK_K, (ev.clientY - p[1]) * LOOK_K);
    p[0] = ev.clientX; p[1] = ev.clientY;
  });
  const lookUp = (ev) => drags.delete(ev.pointerId);
  look.addEventListener('pointerup', lookUp); look.addEventListener('pointercancel', lookUp); look.addEventListener('lostpointercapture', lookUp);

  function releaseAll() {
    held.clear(); drags.clear(); sp = null;
    for (const e of els.values()) e.classList.remove('on');
    input.touch.clear(); restBase();
  }
  function setLabel(id, label, sub = '') {
    const e = els.get(id); if (!e) return;
    const b = e.querySelector('b'), s = e.querySelector('small');
    if (b.textContent !== label) b.textContent = label;
    if (s.textContent !== sub) s.textContent = sub;
  }
  const onResize = () => { if (!sp) restBase(); };
  globalThis.addEventListener?.('resize', onResize);
  const onBlur = () => releaseAll();
  globalThis.addEventListener?.('blur', onBlur);

  return Object.assign(api, {
    get visible() { return visible; },
    show(on) {
      on = !!on;
      if (on === visible) return;
      visible = on; root.classList.toggle('off', !on);
      if (on) restBase(); else releaseAll();
    },
    setLabel, button: (id) => els.get(id),
    releaseAll,
    dispose() { globalThis.removeEventListener?.('resize', onResize); globalThis.removeEventListener?.('blur', onBlur); releaseAll(); root.remove(); },
  });
}

// Google Analytics 4 (gtag.js). It loads only on the production host, so dev servers, demos, tests and previews never
// report; ?noga turns it off there too. Everything else calls track(), which stays a no-op until init has run.
// A city build with its own counter (CITY.events: { url, hosts }, Oradea) sends the same events there instead, and never
// loads GA: a small same-origin beacon with the event, its first two words and first number, the device kind (phone
// tier / touch / desktop), the page language and mode – no cookies, no ids, nothing stored in the browser. Skipped
// off its hosts, with ?noga, Do Not Track or Global Privacy Control; at most one of a name a second, 300 a page.
//   beaconBody(name, params, ctx) -> the JSON the counter gets (exported for tests)
//   initAnalytics({ mode: 'game' | 'map' }) -> bool (loaded)   once, from index.html; mode goes out as the page's `mode`
//   track(name, params?)                                          a GA4 event, e.g. track('mission_end', { mission_type, ok })
// Events sent today: game_ready (load_ms, quality), mission_start / mission_end (mission_type, ok), partner_open
// (partner, via: key | card | map), sight_visited (sight), adaptive_res (dpr, step, reason, quality: the adaptive
// resolution changed the render pixel ratio on a slow machine), teleport (place: the big map moved the car there), photo (action: capture | save | share: the photo mode, ui/photomode.js). Outbound link clicks (the Telegram bot) come from GA's own
// enhanced measurement.
import { CITY } from './city.js';

export const GA_ID = 'G-6DK19V1WXV';
const PROD = /(^|\.)driver\.ck\.ua$/;

let on = false, own = null;

export function beaconBody(name, params = {}, { mode = '', device = '', lang = '' } = {}) {
  const words = [], nums = [];
  for (const v of Object.values(params || {})) {
    if (typeof v === 'number' && Number.isFinite(v)) nums.push(v);
    else if (typeof v === 'string' || typeof v === 'boolean') words.push(String(v).slice(0, 48));
  }
  return JSON.stringify({ e: String(name).slice(0, 32), a: words[0] ?? '', b: words[1] ?? '', n: nums[0] ?? 0, m: mode, d: device, l: lang });
}

function initOwn(mode) {
  const ev = CITY.events, q = new URLSearchParams(location.search), nav = globalThis.navigator;
  if (!ev.hosts.test(location.hostname) || q.has('noga') || nav?.doNotTrack === '1' || nav?.globalPrivacyControl || !nav?.sendBeacon) return false;
  const device = q.has('phone') ? 'phone' : matchMedia('(pointer: coarse)').matches ? 'touch' : 'desktop';
  const last = new Map();
  let sent = 0;
  own = (name, params) => {
    const now = Date.now();
    if (sent >= 300 || now - (last.get(name) ?? -1e9) < 1000) return;
    last.set(name, now); sent++;
    try { nav.sendBeacon(ev.url, new Blob([beaconBody(name, params, { mode, device, lang: document.documentElement.lang || '' })], { type: 'application/json' })); } catch { /* never break the game */ }
  };
  own('page', { mode });
  return true;
}

export function initAnalytics({ mode = 'game' } = {}) {
  if (on || own || typeof document === 'undefined') return on || !!own;
  if (CITY?.events) return initOwn(mode); // a city's own counter: never GA
  if (!PROD.test(location.hostname) || new URLSearchParams(location.search).has('noga')) return false;
  window.dataLayer = window.dataLayer || [];
  // gtag reads the Arguments object itself, not an array: keep this a plain function
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { mode });
  const s = document.createElement('script');
  s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(s);
  return (on = true);
}

export function track(name, params) {
  if (own) return own(name, params);
  if (on) try { window.gtag('event', name, params); } catch { /* a blocked gtag must never break the game */ }
}

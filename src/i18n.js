// The player's language for the Oradea build: Romanian or English. Picked once per page load: ?lang=ro|en, then the
// saved choice (localStorage 'oradea.lang'), then the browser's language (ro* -> Romanian, anything else -> English).
//   LANG: 'ro' | 'en';  t(ro, en) -> the string for LANG;  setLang(l) saves the choice (reload the page to apply it)
//   RUN: the translatable runs of a UI string – text between markup (<, >, ") that holds Cyrillic or ₴; runKey(run) -> its
//     dictionary key (trimmed, inner whitespace collapsed). The Oradea build's string pass (vite.config.js) and its
//     extractor (tools/oradea/ui-strings.mjs) both cut upstream's Ukrainian strings with these.
const KEY = 'oradea.lang';
const pick = () => {
  try {
    const q = new URLSearchParams(globalThis.location?.search ?? '').get('lang');
    if (q === 'ro' || q === 'en') return q;
    const saved = globalThis.localStorage?.getItem(KEY);
    if (saved === 'ro' || saved === 'en') return saved;
  } catch { /* storage off */ }
  return /^ro\b/i.test(globalThis.navigator?.language ?? '') ? 'ro' : 'en';
};
export const LANG = pick();
export const t = (ro, en) => (LANG === 'ro' ? ro : en);
export function setLang(l) {
  try { globalThis.localStorage?.setItem(KEY, l); } catch { /* storage off */ }
}

export const RUN = /[^<>"]*[\u0400-\u04FF\u20B4][^<>"]*/g; // \u20B4: ₴
export const runKey = (run) => run.trim().replace(/\s+/g, ' ');

// __tr(s): upstream's Ukrainian UI string s in the player's language (src/i18n.js LANG). The Oradea build's string pass
// (vite.config.js) wraps every Ukrainian string literal and template text of the game's modules in a call to it, so
// upstream files stay as they are. Each Cyrillic run of s (i18n.js RUN) is looked up in UI (ui.js); a run with no
// entry stays Ukrainian and is reported once in the console (`npm run strings:oradea` lists them all).
import { LANG, RUN, runKey } from '../../i18n.js';
import { UI } from './ui.js';

const col = LANG === 'ro' ? 0 : 1, cache = new Map(), missed = new Set();
export function __tr(s) {
  let out = cache.get(s);
  if (out !== undefined) return out;
  out = s.replace(RUN, (run) => {
    const key = runKey(run), hit = UI[key]?.[col];
    if (hit == null) {
      if (!missed.has(key)) { missed.add(key); console.debug('[i18n] no translation:', key); }
      return run;
    }
    return run.match(/^\s*/)[0] + hit + run.match(/\s*$/)[0];
  });
  cache.set(s, out);
  return out;
}

// Key I opens the WhatsApp feedback chat (CITY.feedback via ui/botlink.js) in a new tab: the mouse is usually captured
// for steering, so the green chip alone is out of reach. Ignored with a modifier, on auto-repeat and before the start card
// is accepted (consent.js swallows keys until then).
//   installFeedbackKey() -> remove()
import { botLink } from '../../ui/botlink.js';

export function installFeedbackKey() {
  if (typeof window === 'undefined') return () => {};
  const onKey = (e) => {
    if (e.code !== 'KeyI' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
    document.exitPointerLock?.();
    window.open(botLink(), '_blank', 'noopener');
  };
  window.addEventListener('keydown', onKey);
  return () => window.removeEventListener('keydown', onKey);
}

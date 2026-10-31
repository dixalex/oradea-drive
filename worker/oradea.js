// The Oradea site's Worker: the static build (dist/, the ASSETS binding) and one endpoint, POST /e, the game's anonymous
// event counter (src/analytics.js beaconBody). A data point per event in Workers Analytics Engine (the EVENTS dataset):
// index and blob1 the event name, then its first two words, the device kind (phone / touch / desktop), the page
// language and mode, the visitor's country (Cloudflare's two letters); double1 its first number. No IP, user agent,
// cookie or id is kept. Static files never reach this code (assets are served first); tools/oradea/events.mjs reads the
// counts back.
const word = (v, n) => String(v ?? '').replace(/[^\p{L}\p{N}_.\-: ]/gu, '').slice(0, n);

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (url.pathname === '/e') {
      if (req.method !== 'POST') return new Response(null, { status: 405 });
      try {
        const b = await req.json(), e = word(b?.e, 32);
        if (/^[a-z0-9_]+$/.test(e)) env.EVENTS?.writeDataPoint({
          indexes: [e],
          blobs: [e, word(b.a, 48), word(b.b, 48), word(b.d, 8), word(b.l, 4), word(b.m, 8), word(req.cf?.country, 2)],
          doubles: [Number.isFinite(+b.n) ? +b.n : 0],
        });
      } catch { /* a bad body counts nothing */ }
      return new Response(null, { status: 204 });
    }
    return env.ASSETS.fetch(req);
  },
};

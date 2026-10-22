// Init script (tools/oradea/memory/profile.mjs --track): tracks every live ArrayBuffer by where it was made (typed-array constructors, ArrayBuffer, fetch
// arrayBuffer, worker messages). window.__ab.report() -> per-site live bytes after a GC.
(() => {
  const live = new Map(); // site -> [bytes, count]
  const reg = new FinalizationRegistry(({ site, n }) => { const v = live.get(site); if (v) { v[0] -= n; v[1]--; } });
  const seen = new WeakSet();
  const siteOf = (skip) => {
    const st = (new Error().stack || '').split('\n').slice(skip);
    const own = st.filter((l) => /\/src\//.test(l)).map((l) => { const m = /at (?:(\S+) )?\(?(?:.*\/src\/)([^?:]+)[^:]*:(\d+)/.exec(l); return m ? `${m[2]}:${m[3]} ${m[1] ?? ''}` : l.trim(); });
    if (own.length) return own.slice(0, 2).join(' < ');
    const m = /([^/]+\.js)[^:]*:(\d+)/.exec(st[0] || ''); return '(lib) ' + (m ? m[1] + ':' + m[2] : st[0]?.trim());
  };
  const add = (buf, site) => {
    if (!buf || seen.has(buf)) return; seen.add(buf);
    const n = buf.byteLength; if (!n) return;
    const s = n >= 4096 ? site() : 'small (<4 KB)';
    const v = live.get(s) ?? live.set(s, [0, 0]).get(s); v[0] += n; v[1]++;
    reg.register(buf, { site: s, n });
  };
  for (const name of ['Float32Array', 'Float64Array', 'Uint8Array', 'Uint16Array', 'Uint32Array', 'Int8Array', 'Int16Array', 'Int32Array', 'Uint8ClampedArray']) {
    const Base = globalThis[name];
    const P = { [name]: class extends Base { constructor(...a) { super(...a); if (!(a[0] instanceof ArrayBuffer) && !(globalThis.SharedArrayBuffer && a[0] instanceof SharedArrayBuffer)) add(this.buffer, () => siteOf(3)); } } }[name];
    Object.defineProperty(P, Symbol.hasInstance, { value: (x) => x instanceof Base }); // arrays from workers are plain
    // plain arrays (from workers) make their copies through P too: arr.constructor, slice / map / filter (species)
    Object.defineProperty(Base.prototype, 'constructor', { value: P, writable: true, configurable: true });
    Object.defineProperty(Base, Symbol.species, { get: () => P, configurable: true });
    globalThis[name] = P;
  }
  const AB = globalThis.ArrayBuffer;
  const PAB = class ArrayBuffer extends AB { constructor(...a) { super(...a); add(this, () => siteOf(3)); } };
  Object.defineProperty(PAB, Symbol.hasInstance, { value: (x) => x instanceof AB });
  globalThis.ArrayBuffer = PAB; PAB.isView = AB.isView;
  const rab = Response.prototype.arrayBuffer;
  Response.prototype.arrayBuffer = async function () { const b = await rab.call(this); add(b, () => 'fetch ' + (this.url || '').replace(/^.*\//, '')); return b; };
  const W = globalThis.Worker;
  globalThis.Worker = class extends W {
    constructor(url, o) {
      super(url, o);
      const tag = 'worker ' + String(url).replace(/^.*\//, '').replace(/\?.*$/, '');
      this.addEventListener('message', (e) => {
        const kind = e.data && typeof e.data === 'object' ? (e.data.type ?? e.data.kind ?? e.data.op ?? '') : '';
        const t2 = tag + (typeof kind === 'string' && kind ? ' ' + kind : '');
        const walk = (v, d) => { if (!v || d > 10 || typeof v !== 'object') return; if (v instanceof AB) add(v, () => t2); else if (ArrayBuffer.isView(v)) add(v.buffer, () => t2); else if (Array.isArray(v)) { if (typeof v[0] !== 'number') for (const x of v) walk(x, d + 1); } else for (const k in v) walk(v[k], d + 1); };
        walk(e.data, 0);
      });
    }
  };
  window.__ab = {
    report(min = 0.5e6) {
      let total = 0; const rows = [];
      for (const [s, [n, c]] of live) { total += n; if (n >= min) rows.push([n, c, s]); }
      rows.sort((a, b) => b[0] - a[0]);
      return { totalMB: Math.round(total / 1e6), rows: rows.map(([n, c, s]) => `${(n / 1e6).toFixed(1)} MB x${c}  ${s}`) };
    },
  };
})();

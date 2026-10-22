// Upstream's Ukrainian UI strings in a game module, for the Oradea build's languages (src/world/oradea/tr.js).
//   SKIP: module paths the pass leaves alone (Cherkasy's own sites and data, the Oradea modules, the i18n code, the test
//     world, and the traffic atlas – its Ukrainian cells are painted over by world/oradea/vehicles.js)
//   uiStrings(code) -> [{ start, end, text, tpl }]   every string literal and template text holding Cyrillic that is an
//     expression (not an object key, import source or directive); tpl: a template literal's text piece
//   wrapStrings(code) -> code with each of them as __tr("…") (a template piece as ${__tr("…")}) and the import added,
//     or null when there is nothing to wrap
import { parseAst } from 'vite';

const CY = /[\u0400-\u04FF\u20B4]/; // Cyrillic, and the hryvnia sign (a bare `₴` in the HUD)
export const SKIP = /[\\/]src[\\/](world[\\/]cherkasy[\\/]|world[\\/]oradea[\\/]|game[\\/]quests[\\/]secrets\.js|game[\\/]testworld\.js|npc[\\/]vehicles\.js|i18n\.js|city\.js)/;

function walk(node, parent, key, fn) {
  if (!node || typeof node.type !== 'string') return;
  if (fn(node, parent, key) === false) return;
  for (const k of Object.keys(node)) {
    const v = node[k];
    if (Array.isArray(v)) for (const c of v) walk(c, node, k, fn);
    else if (v && typeof v === 'object' && typeof v.type === 'string') walk(v, node, k, fn);
  }
}

export function uiStrings(code) {
  if (!CY.test(code)) return [];
  const ast = parseAst(code), out = [];
  walk(ast, null, null, (n, p, k) => {
    if (n.type === 'TaggedTemplateExpression') return false; // glsl`…`, String.raw`…`: code, not UI
    if (n.type === 'Literal' && typeof n.value === 'string' && CY.test(n.value)) {
      const keyLike = (p?.type === 'Property' || p?.type === 'MethodDefinition' || p?.type === 'PropertyDefinition') && k === 'key' && !p.computed;
      const source = /^(Import|Export(All|Named)?)Declaration$|^ImportExpression$/.test(p?.type ?? '') && k === 'source';
      const directive = p?.type === 'ExpressionStatement' && p.directive;
      if (!keyLike && !source && !directive) out.push({ start: n.start, end: n.end, text: n.value, tpl: false });
    } else if (n.type === 'TemplateElement' && n.value.cooked != null && CY.test(n.value.cooked)) {
      out.push({ start: n.start, end: n.end, text: n.value.cooked, tpl: true });
    }
  });
  return out;
}

export function wrapStrings(code) {
  const found = uiStrings(code);
  if (!found.length) return null;
  let s = code;
  for (const f of found.sort((a, b) => b.start - a.start)) {
    const call = `__tr(${JSON.stringify(f.text)})`;
    s = s.slice(0, f.start) + (f.tpl ? '${' + call + '}' : call) + s.slice(f.end);
  }
  return `import { __tr } from '/src/world/oradea/tr.js';\n${s}`;
}

// The Oradea dev server without live reload or file watching: stable pages for memory measurements while agents edit files.
import base from '../../../vite.config.js';
export default async (env) => {
  const c = typeof base === 'function' ? await base(env) : base;
  return { ...c, server: { ...(c.server ?? {}), hmr: false, watch: { ignored: ['**/*'] } } };
};

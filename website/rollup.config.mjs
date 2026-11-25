// Builds src/ into dist/: one classic script (so dist/index.html also works from file://), the page
// with its CSS inlined, and everything in public/ copied as-is.
//   SITE_URL=https://example.com/sale/ npm run build   makes the Open Graph URLs absolute (recommended)
import terser from '@rollup/plugin-terser';
import { readFileSync, readdirSync, statSync, rmSync } from 'node:fs';
import { join, relative } from 'node:path';
import { serve } from './scripts/serve.mjs';

const WATCH = !!process.env.ROLLUP_WATCH;
// on Vercel, the project's production domain unless SITE_URL says otherwise
const host = process.env.SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL && `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`);
const SITE = host ? host.replace(/\/?$/, '/') : '';
const DIST = 'dist';

// .glsl files import as strings, comments and indentation stripped (line breaks kept for the preprocessor)
const glsl = () => ({
  name: 'glsl',
  transform(code, id) {
    if (!id.endsWith('.glsl')) return null;
    const min = code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
      .split('\n').map((l) => l.trim().replace(/\s+/g, ' ')).filter(Boolean).join('\n');
    return { code: `export default ${JSON.stringify(min)};`, map: { mappings: '' } };
  },
});

// `import url from './x.png?inline'` gives a data: URL (WebGL textures must be same-origin, and file:// is not)
const inline = () => ({
  name: 'inline',
  resolveId(src, importer) { return src.endsWith('?inline') ? join(importer, '..', src) : null; },
  load(id) {
    if (!id.endsWith('?inline')) return null;
    const file = id.slice(0, -7), type = file.endsWith('.png') ? 'image/png' : 'application/octet-stream';
    this.addWatchFile(file);
    return `export default "data:${type};base64,${readFileSync(file).toString('base64')}";`;
  },
});

const minCss = (css) => css.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ')
  .replace(/\s*([{}:;,>])\s*/g, '$1').replace(/;}/g, '}').trim();

const walk = (dir) => readdirSync(dir).flatMap((f) => (statSync(join(dir, f)).isDirectory() ? walk(join(dir, f)) : [join(dir, f)]));

// the page: src/index.html with the CSS inlined and the script and site URL filled in; public/ copied
const page = () => ({
  name: 'page',
  buildStart() {
    rmSync(DIST, { recursive: true, force: true }); // no stale bundles, in watch mode too
    for (const f of ['src/index.html', 'src/style.css', ...walk('public')]) this.addWatchFile(f);
  },
  generateBundle(_, bundle) {
    const entry = Object.values(bundle).find((c) => c.type === 'chunk' && c.isEntry);
    const html = readFileSync('src/index.html', 'utf8')
      .replace('/*STYLE*/', () => minCss(readFileSync('src/style.css', 'utf8')))
      .replace('<!--SCRIPT-->', `<script defer src="${entry.fileName}"></script>`)
      .replace(/%SITE%/g, SITE)
      .replace(/\n\s*<meta property="og:url" content="">/, '') // no site URL given: leave og:url out
      .replace(/<!--[\s\S]*?-->\n?/g, '');
    this.emitFile({ type: 'asset', fileName: 'index.html', source: html });
    for (const f of walk('public')) this.emitFile({ type: 'asset', fileName: relative('public', f), source: readFileSync(f) });
  },
});

let served = false;
const dev = () => ({
  name: 'dev-serve',
  writeBundle() { if (WATCH && !served) { served = true; serve(DIST, 5173); } },
});

export default {
  input: 'src/main.js',
  output: { dir: DIST, format: 'iife', entryFileNames: 'assets/main-[hash].js', sourcemap: false },
  plugins: [glsl(), inline(), page(), !WATCH && terser({ format: { comments: false } }), dev()].filter(Boolean),
};

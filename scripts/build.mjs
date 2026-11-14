// esbuild pipeline with build-time rendering of two independent pages:
//   dist/ru/index.html  and  dist/bg/index.html   (+ dist/index.html = small redirect page)
//   node scripts/build.mjs            production build -> dist/
//   node scripts/build.mjs --serve    dev server with rebuild on change (http://localhost:5173)
//   node scripts/build.mjs --preview  serve the finished dist/
import * as esbuild from 'esbuild';
import { cpSync, rmSync, mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { createServer } from 'node:http';
import { join, extname } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const dev = args.includes('--serve');
const preview = args.includes('--preview');
const PORT = Number(process.env.PORT || 5173);
const OUT = 'dist';
const TMP = '.build';
const LANGS = ['ru', 'bg'];
const TS_KEY = JSON.stringify(process.env.TURNSTILE_SITE_KEY || '');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

let clientFiles = { js: 'app.js', css: 'app.css' };

const clientOptions = {
  entryPoints: ['src/main.tsx'], bundle: true, outdir: join(OUT, 'assets'),
  entryNames: dev ? 'app' : 'app-[hash]', format: 'iife', target: 'es2020', jsx: 'automatic',
  minify: !dev, sourcemap: dev, metafile: true, logLevel: 'warning',
  define: { 'process.env.NODE_ENV': dev ? '"development"' : '"production"', __TURNSTILE_SITE_KEY__: TS_KEY },
};
const serverOptions = {
  entryPoints: ['src/server.tsx'], bundle: true, outfile: join(TMP, 'server.mjs'), platform: 'node', format: 'esm',
  packages: 'external', jsx: 'automatic', logLevel: 'warning', define: { __TURNSTILE_SITE_KEY__: TS_KEY },
};

async function renderAll() {
  const mod = await import(pathToFileURL(join(process.cwd(), TMP, 'server.mjs')).href + '?t=' + Date.now());
  const tpl = readFileSync('index.html', 'utf8');
  for (const lang of LANGS) {
    const page = mod.renderPage(lang);
    const vars = { ...page, ...clientFiles };
    const html = tpl.replace(/\{\{(\w+)\}\}/g, (_, k) => (k === 'html' ? page.html : esc(vars[k] ?? '')));
    mkdirSync(join(OUT, lang), { recursive: true });
    writeFileSync(join(OUT, lang, 'index.html'), html);
  }
  console.log(`rendered: ${LANGS.map((l) => `${OUT}/${l}/index.html`).join(', ')}`);
}

const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.map': 'application/json', '.txt': 'text/plain' };
function serve() {
  createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]);
    if (p.endsWith('/')) p += 'index.html';
    let file = join(OUT, p);
    if (!existsSync(file) && existsSync(file + '/index.html')) { res.writeHead(301, { Location: p + '/' }); return res.end(); }
    if (!file.startsWith(OUT) || !existsSync(file)) { res.writeHead(404); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' });
    res.end(readFileSync(file));
  }).listen(PORT, () => console.log(`\n  http://localhost:${PORT}/ru/   http://localhost:${PORT}/bg/\n`));
}

function setClientFiles(result) {
  const outs = Object.keys(result.metafile.outputs).map((f) => f.split('/').pop());
  clientFiles = { js: outs.find((f) => f.endsWith('.js')), css: outs.find((f) => f.endsWith('.css')) };
}

if (preview) { serve(); }
else {
  rmSync(OUT, { recursive: true, force: true });
  rmSync(TMP, { recursive: true, force: true });
  cpSync('public', OUT, { recursive: true });
  if (dev) {
    const client = await esbuild.context({ ...clientOptions, plugins: [{ name: 'c', setup: (b) => b.onEnd(async (r) => { if (r.metafile) { setClientFiles(r); if (existsSync(join(TMP, 'server.mjs'))) await renderAll().catch(console.error); } }) }] });
    const server = await esbuild.context({ ...serverOptions, plugins: [{ name: 's', setup: (b) => b.onEnd(() => renderAll().catch(console.error)) }] });
    await client.watch(); await server.watch();
    serve();
  } else {
    const r = await esbuild.build(clientOptions);
    setClientFiles(r);
    await esbuild.build(serverOptions);
    await renderAll();
    rmSync(TMP, { recursive: true, force: true });
    console.log('build ok -> dist/');
  }
}

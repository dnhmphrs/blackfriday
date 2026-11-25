// A tiny static file server for dist/ (no dependencies).
//   node scripts/serve.mjs [dir] [port]
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { join, extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.woff2': 'font/woff2', '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.json': 'application/json',
};

export function serve(dir = 'dist', port = 5173, { quiet = false } = {}) {
  const root = resolve(dir);
  const server = createServer(async (req, res) => {
    try {
      let path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
      let file = resolve(join(root, path));
      if (file !== root && !file.startsWith(root + sep)) throw new Error('outside');
      if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
      const body = await readFile(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(body);
    } catch {
      res.writeHead(404, { 'content-type': 'text/plain' });
      res.end('not found');
    }
  });
  return new Promise((ok) => server.listen(port, '127.0.0.1', () => {
    const { port: p } = server.address();
    if (!quiet) console.log(`serving ${dir} at http://127.0.0.1:${p}/`);
    ok(Object.assign(server, { url: `http://127.0.0.1:${p}/` }));
  }));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) serve(process.argv[2] || 'dist', Number(process.argv[3] || 5173));

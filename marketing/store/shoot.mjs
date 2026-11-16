// Screenshots of the real extension running over the mock sites, one per design.
//   node store/shoot.mjs [design ...]     -> out/designs/<design>-<page>.png (1280x800)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launchWithExtension, makeTestCopy } from '../../test/helpers.mjs';
import { startServer } from '../tools/serve.mjs';

const root = new URL('..', import.meta.url).pathname;
const src = new URL('../../src', import.meta.url).pathname;
const designs = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.readdirSync(`${src}/designs`).filter((f) => f.endsWith('.js') && !f.endsWith('.art.js')).map((f) => f.slice(0, -3));
const pages = ['shop', 'news'];
const out = `${root}out/designs/`;
fs.mkdirSync(out, { recursive: true });
const { server, origin } = await startServer(root);
for (const design of designs) {
  // the real extension with this design, and a clock that says it is Black Friday (see test/helpers.mjs)
  const ext = makeTestCopy(src, { design });
  const { context } = await launchWithExtension(ext);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  for (const name of pages) {
    await page.goto(`${origin}/store/mock/${name}.html?fakeNow=${Date.parse('2026-11-27T12:00:00')}`);
    await page.waitForFunction(() => document.querySelector('thirty-off-overlay'), null, { timeout: 20000 }).catch(() => {});
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${out}${design}-${name}.png` });
  }
  console.log(design, errors.length ? 'ERRORS: ' + errors.join(' | ') : 'ok');
  await context.close();
}
server.close();

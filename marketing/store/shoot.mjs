// Screenshots of the real extension running over the mock sites, one per design.
//   node store/shoot.mjs [design ...]     -> out/designs/<design>-<page>.png (1280x800)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { launchWithExtension, clickAction } from '../../test/helpers.mjs';
import { startServer } from '../tools/serve.mjs';

const root = new URL('..', import.meta.url).pathname;
const src = new URL('../../src', import.meta.url).pathname;
const designs = process.argv.slice(2).length ? process.argv.slice(2) : ['classic', 'broadcast', 'receipt', 'grand'];
const pages = ['shop', 'news'];
const out = `${root}out/designs/`;
fs.mkdirSync(out, { recursive: true });
const { server, origin } = await startServer(root);
for (const design of designs) {
  const ext = fs.mkdtempSync(path.join(os.tmpdir(), 'bf-design-'));
  fs.cpSync(src, ext, { recursive: true, filter: (f) => !f.endsWith('.zip') });
  const mf = JSON.parse(fs.readFileSync(`${ext}/manifest.json`, 'utf8'));
  mf.content_scripts[0].js[0] = `designs/${design}.js`;
  fs.writeFileSync(`${ext}/manifest.json`, JSON.stringify(mf, null, 2));
  const { context, extensionId } = await launchWithExtension(ext);
  const page = await context.newPage();
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  for (const name of pages) {
    await page.goto(`${origin}/store/mock/${name}.html`);
    await clickAction(context, page, extensionId);
    await page.waitForTimeout(900);
    await page.screenshot({ path: `${out}${design}-${name}.png` });
  }
  console.log(design, errors.length ? 'ERRORS: ' + errors.join(' | ') : 'ok');
  await context.close();
}
server.close();

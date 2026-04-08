import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appDir = join(__dirname, '..');
const distDir = join(appDir, 'dist');

test('build output contains the landing page title, copy, and screenshot asset', () => {
  const htmlPath = join(distDir, 'index.html');
  const screenshotPath = join(distDir, 'browser-jumble-nip07.jpg');
  const assetsDir = join(distDir, 'assets');

  assert.equal(existsSync(htmlPath), true);
  assert.equal(existsSync(screenshotPath), true);
  assert.ok(statSync(screenshotPath).size > 100_000);

  const html = readFileSync(htmlPath, 'utf8');
  const jsBundle = readdirSync(assetsDir)
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) => readFileSync(join(assetsDir, fileName), 'utf8'))
    .join('\n');

  assert.match(html, /browser\.iris\.to \| Iris Browser/);
  assert.match(html, /href="\.\/iris-favicon\.png"/);
  assert.match(html, /src="\.\/assets\//);
  assert.doesNotMatch(html, /src="\/assets\//);
  assert.doesNotMatch(html, /modulepreload/);
  assert.doesNotMatch(html, /crossorigin/);
  assert.match(jsBundle, /The native browser for /);
  assert.match(jsBundle, /Nostr apps\./);
  assert.match(jsBundle, /browser-jumble-nip07\.jpg/);
  assert.match(jsBundle, /What it enables/);
});

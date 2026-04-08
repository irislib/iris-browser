import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appDir = join(__dirname, '..');
const distDir = join(appDir, 'dist');

test('build output contains the landing page title, copy, and screenshot assets', () => {
  const htmlPath = join(distDir, 'index.html');
  const homeScreenshotPath = join(distDir, 'browser-home.jpg');
  const jumbleScreenshotPath = join(distDir, 'browser-jumble.jpg');
  const permissionScreenshotPath = join(distDir, 'browser-permission.jpg');
  const assetsDir = join(distDir, 'assets');

  assert.equal(existsSync(htmlPath), true);
  assert.equal(existsSync(homeScreenshotPath), true);
  assert.equal(existsSync(jumbleScreenshotPath), true);
  assert.equal(existsSync(permissionScreenshotPath), true);
  assert.ok(statSync(homeScreenshotPath).size > 100_000);
  assert.ok(statSync(jumbleScreenshotPath).size > 100_000);
  assert.ok(statSync(permissionScreenshotPath).size > 100_000);

  const html = readFileSync(htmlPath, 'utf8');
  const jsBundle = readdirSync(assetsDir)
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) => readFileSync(join(assetsDir, fileName), 'utf8'))
    .join('\n');

  assert.match(html, /browser\.iris\.to \| Iris Browser/);
  assert.match(
    html,
    /Publish websites for free, keep them ready offline, share them nearby, and skip extra accounts\./,
  );
  assert.match(html, /href="\.\/iris-favicon\.png"/);
  assert.match(html, /src="\.\/assets\//);
  assert.doesNotMatch(html, /src="\/assets\//);
  assert.doesNotMatch(html, /modulepreload/);
  assert.doesNotMatch(html, /crossorigin/);
  assert.match(jsBundle, /Websites should work anywhere\./);
  assert.match(jsBundle, /Iris Browser makes websites easier to keep, share, and open/);
  assert.match(jsBundle, /Publish websites for free/);
  assert.match(jsBundle, /Keep websites ready offline/);
  assert.match(jsBundle, /Share to nearby devices over Wi-Fi/);
  assert.match(jsBundle, /Send files without the usual friction/);
  assert.match(jsBundle, /Skip email, phone, and extra accounts/);
  assert.match(jsBundle, /Download for Mac/);
  assert.match(jsBundle, /Mac download for now\./);
  assert.match(jsBundle, /upload\.iris\.to/);
  assert.match(jsBundle, /releases%2Firis-browser\/latest/);
  assert.match(jsBundle, /release\.json/);
  assert.match(jsBundle, /browser-home\.jpg/);
  assert.match(jsBundle, /browser-jumble\.jpg/);
  assert.match(jsBundle, /browser-permission\.jpg/);
});

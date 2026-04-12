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
  const homeScreenshotPath = join(distDir, 'browser-home.png');
  const jumbleScreenshotPath = join(distDir, 'browser-jumble.png');
  const permissionScreenshotPath = join(distDir, 'browser-permission.png');
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
    /Open websites and apps, keep them locally, share without extra accounts, and stay less dependent on any single platform\./,
  );
  assert.match(html, /href="\.\/iris-favicon\.png"/);
  assert.match(html, /src="\.\/assets\//);
  assert.doesNotMatch(html, /src="\/assets\//);
  assert.doesNotMatch(html, /modulepreload/);
  assert.doesNotMatch(html, /crossorigin/);
  assert.match(jsBundle, /Sites, files, and apps should stay yours\./);
  assert.match(jsBundle, /Open what matters, keep it locally, and share it without email, phone, or extra accounts\./);
  assert.match(jsBundle, /Own what you keep/);
  assert.match(jsBundle, /Keep important things locally/);
  assert.match(jsBundle, /Share to nearby devices over Wi-Fi/);
  assert.match(jsBundle, /Share without extra accounts/);
  assert.match(jsBundle, /Ask before using your account/);
  assert.match(jsBundle, /Download for Mac/);
  assert.match(jsBundle, /Other downloads/);
  assert.match(jsBundle, /upload\.iris\.to/);
  assert.match(jsBundle, /releases%2Firis-browser\/latest/);
  assert.match(jsBundle, /release\.json/);
  assert.match(jsBundle, /api\.github\.com/);
  assert.match(jsBundle, /irislib\/iris-browser/);
  assert.match(jsBundle, /releases\/tags/);
  assert.match(jsBundle, /browser-home\.png/);
  assert.match(jsBundle, /browser-jumble\.png/);
  assert.match(jsBundle, /browser-permission\.png/);
});

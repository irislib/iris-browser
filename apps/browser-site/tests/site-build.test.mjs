import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const appDir = join(__dirname, '..');
const distDir = join(appDir, 'dist');

test('build output contains the landing page shell and screenshot assets', () => {
  const htmlPath = join(distDir, 'index.html');
  const homeScreenshotPath = join(distDir, 'browser-home.png');
  const walletScreenshotPath = join(distDir, 'browser-wallet.png');
  const permissionScreenshotPath = join(distDir, 'browser-permission.png');
  const assetsDir = join(distDir, 'assets');

  assert.equal(existsSync(htmlPath), true);
  assert.equal(existsSync(homeScreenshotPath), true);
  assert.equal(existsSync(walletScreenshotPath), true);
  assert.equal(existsSync(permissionScreenshotPath), true);
  assert.ok(statSync(homeScreenshotPath).size > 55_000);
  assert.ok(statSync(walletScreenshotPath).size > 55_000);
  assert.ok(statSync(permissionScreenshotPath).size > 55_000);

  const html = readFileSync(htmlPath, 'utf8');
  const jsBundle = readdirSync(assetsDir)
    .filter((fileName) => fileName.endsWith('.js'))
    .map((fileName) => readFileSync(join(assetsDir, fileName), 'utf8'))
    .join('\n');
  const cssBundle = readdirSync(assetsDir)
    .filter((fileName) => fileName.endsWith('.css'))
    .map((fileName) => readFileSync(join(assetsDir, fileName), 'utf8'))
    .join('\n');

  assert.match(html, /browser\.iris\.to \| Iris Browser/);
  assert.match(html, /href="\.\/iris-favicon\.png"/);
  assert.match(html, /src="\.\/assets\//);
  assert.doesNotMatch(html, /src="\/assets\//);
  assert.doesNotMatch(html, /modulepreload/);
  assert.doesNotMatch(html, /crossorigin/);
  assert.match(jsBundle, /Iris/);
  assert.match(jsBundle, /iris/);
  assert.match(jsBundle, /browser/);
  assert.match(jsBundle, /hashtree\.cc\/#\/dev/);
  assert.match(jsBundle, /Browse the source/);
  assert.match(jsBundle, /iris-mark\.png/);
  assert.match(jsBundle, /Download for Mac/);
  assert.match(jsBundle, /Download Iris Browser/);
  assert.match(jsBundle, /upload\.iris\.to/);
  assert.match(jsBundle, /api\.github\.com\/repos\/irislib\/iris-browser\/releases\/latest/);
  assert.match(jsBundle, /browser_download_url/);
  assert.match(jsBundle, /releases%2Firis-chromium\/latest/);
  assert.match(jsBundle, /release\.json/);
  assert.match(jsBundle, /Iris-macos-arm64\.dmg/);
  assert.match(jsBundle, /iris-chromium/);
  assert.match(jsBundle, /browser-home\.png/);
  assert.match(jsBundle, /browser-wallet\.png/);
  assert.match(jsBundle, /browser-permission\.png/);
  assert.match(cssBundle, /align-items:start/);
  assert.match(cssBundle, /\.download-grid/);
  assert.match(cssBundle, /aspect-ratio:1400\s*\/\s*946/);
  assert.match(cssBundle, /min-height:5\.4rem/);
});

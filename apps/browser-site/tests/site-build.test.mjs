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
  const cssBundle = readdirSync(assetsDir)
    .filter((fileName) => fileName.endsWith('.css'))
    .map((fileName) => readFileSync(join(assetsDir, fileName), 'utf8'))
    .join('\n');

  assert.match(html, /browser\.iris\.to \| Iris Browser/);
  assert.match(
    html,
    /Open websites, apps, and files, keep working copies on your device, and share them without platform accounts getting in the way\./,
  );
  assert.match(html, /href="\.\/iris-favicon\.png"/);
  assert.match(html, /src="\.\/assets\//);
  assert.doesNotMatch(html, /src="\/assets\//);
  assert.doesNotMatch(html, /modulepreload/);
  assert.doesNotMatch(html, /crossorigin/);
  assert.match(jsBundle, /Sites, files, and apps should stay yours\./);
  assert.match(jsBundle, /Open websites, apps, and files, keep working copies on your device, and share them without platform accounts getting in the way\./);
  assert.match(
    jsBundle,
    /Iris turns links into portable things you can reopen,\s+move between\s+devices, and keep using when one platform disappears or changes the rules\./,
  );
  assert.match(jsBundle, /Keep a copy, not just a link/);
  assert.match(jsBundle, /Save what matters locally/);
  assert.match(jsBundle, /Reopen what people send/);
  assert.match(jsBundle, /Share over local Wi-Fi/);
  assert.match(jsBundle, /No platform account required/);
  assert.match(jsBundle, /One identity across apps/);
  assert.match(
    jsBundle,
    /Use the same profile, contacts, and follows across apps when you want to, without tying them to a single platform account\./,
  );
  assert.match(jsBundle, /Bring your network with you/);
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
  assert.match(cssBundle, /align-items:start/);
  assert.match(cssBundle, /aspect-ratio:1964\s*\/\s*1464/);
  assert.match(cssBundle, /min-height:5\.4rem/);
  assert.match(cssBundle, /min-height:6\.2rem/);
});

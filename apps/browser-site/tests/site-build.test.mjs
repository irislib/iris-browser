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
    /A simple browser for everyday websites, shared links that keep working longer, and clear account prompts\./,
  );
  assert.match(html, /href="\.\/iris-favicon\.png"/);
  assert.match(html, /src="\.\/assets\//);
  assert.doesNotMatch(html, /src="\/assets\//);
  assert.doesNotMatch(html, /modulepreload/);
  assert.doesNotMatch(html, /crossorigin/);
  assert.match(jsBundle, /Share a link\. Open it later\. Still get where you meant to go\./);
  assert.match(jsBundle, /Shared links stay useful/);
  assert.match(jsBundle, /Sharing should still work\./);
  assert.match(jsBundle, /browser-home\.jpg/);
  assert.match(jsBundle, /browser-jumble\.jpg/);
  assert.match(jsBundle, /browser-permission\.jpg/);
});

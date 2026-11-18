import test from 'node:test';
import assert from 'node:assert/strict';

import { createReleasePlan, parseArgs, runRelease } from '../scripts/release-site.mjs';

test('refuses live publication of the archived site', async () => {
  for (const args of [[], ['--skip-cloudflare'], ['--pages-only', '--pages-project', 'example']]) {
    await assert.rejects(runRelease(parseArgs(args, {})), /archived; site publishing is disabled/);
  }
});

test('uses the built-in Worker default with production route and domain', () => {
  const parsed = parseArgs([]);

  assert.equal(parsed.workerName, 'browser-iris-to');
  assert.equal(parsed.treeName, 'browser');
  assert.deepEqual(parsed.routes, ['browser.iris.to/*']);
  assert.deepEqual(parsed.domains, ['browser.iris.to']);
});

test('drops production route and domain when a custom Worker name is used', () => {
  const parsed = parseArgs(['--worker-name', 'browser-iris-to-preview']);

  assert.equal(parsed.workerName, 'browser-iris-to-preview');
  assert.deepEqual(parsed.routes, []);
  assert.deepEqual(parsed.domains, []);
});

test('supports switching to Pages explicitly', () => {
  const parsed = parseArgs(['--pages-only'], { CF_PAGES_PROJECT_BROWSER_IRIS_TO: 'browser-iris-to' });

  assert.equal(parsed.workerName, undefined);
  assert.equal(parsed.pagesProject, 'browser-iris-to');
  assert.deepEqual(parsed.routes, []);
  assert.deepEqual(parsed.domains, []);
});

test('builds a Worker release plan in build-test-publish-deploy order', () => {
  const plan = createReleasePlan({
    workerName: 'browser-iris-to',
    treeName: 'browser',
    routes: ['browser.iris.to/*'],
    domains: ['browser.iris.to'],
    skipCloudflare: false,
    workerCompatibilityDate: '2026-03-19',
  });

  assert.deepEqual(
    plan.steps.map((step) => step.id),
    ['build', 'test-1', 'publish', 'deploy'],
  );
  assert.deepEqual(plan.steps.at(-1)?.command, [
    'npx',
    'wrangler@4',
    'deploy',
    '--assets',
    'dist',
    '--name',
    'browser-iris-to',
    '--compatibility-date',
    '2026-03-19',
    '--keep-vars',
    '--route',
    'browser.iris.to/*',
    '--domain',
    'browser.iris.to',
  ]);
});

test('runs hashtree publish and Worker deploy in parallel after tests', async () => {
  let activeReleaseSteps = 0;
  let maxActiveReleaseSteps = 0;
  const calls = [];

  await runRelease(
    {
      workerName: 'browser-iris-to',
      treeName: 'browser',
      routes: ['browser.iris.to/*'],
      domains: ['browser.iris.to'],
      skipCloudflare: false,
      workerCompatibilityDate: '2026-03-19',
    },
    async (step) => {
      calls.push(step.id);
      if (step.id === 'publish' || step.id === 'deploy') {
        activeReleaseSteps += 1;
        maxActiveReleaseSteps = Math.max(maxActiveReleaseSteps, activeReleaseSteps);
        await new Promise((resolve) => setTimeout(resolve, 10));
        activeReleaseSteps -= 1;
        if (step.id === 'publish') {
          return {
            status: 0,
            stdout: 'published: npub1example/browser\nnhash1ace',
            stderr: '',
          };
        }
      }
      return { status: 0, stdout: '', stderr: '' };
    },
    { buildOutputExists: () => true },
  );

  assert.deepEqual(calls, ['build', 'test-1', 'publish', 'deploy']);
  assert.equal(maxActiveReleaseSteps, 2);
});

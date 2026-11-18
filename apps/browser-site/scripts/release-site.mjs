import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolveHtreeCommand } from './hashtreePaths.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const appDir = path.resolve(__dirname, '..');
const defaultWorkerCompatibilityDate = '2026-03-19';

export const releaseProfile = {
  appName: 'browser.iris.to',
  distDir: 'dist',
  treeName: 'browser',
  defaultWorkerName: 'browser-iris-to',
  defaultRoutes: ['browser.iris.to/*'],
  defaultDomains: ['browser.iris.to'],
  workerNameEnv: 'CF_WORKER_NAME_BROWSER_IRIS_TO',
  pagesProjectEnv: 'CF_PAGES_PROJECT_BROWSER_IRIS_TO',
  buildCommand: ['pnpm', 'run', 'build'],
  testCommands: [
    ['node', '--test', 'tests/site-build.test.mjs', 'tests/releaseSite.test.mjs'],
  ],
};

function cloneValues(values) {
  return values ? [...values] : [];
}

function usesBuiltInWorker(workerName) {
  return Boolean(releaseProfile.defaultWorkerName && workerName === releaseProfile.defaultWorkerName);
}

function wranglerPagesCommand(...args) {
  return ['npx', 'wrangler@4', ...args];
}

function wranglerWorkerAssetsCommand(...args) {
  return ['npx', 'wrangler@4', 'deploy', ...args];
}

export function parseArgs(argv, env = process.env) {
  const args = [...argv].filter((arg, index) => !(arg === '--' && index === 0));
  let pagesProject;
  let workerName;
  let treeName;
  let branch;
  let dryRun = false;
  let skipCloudflare = false;
  let pagesOnly = false;
  const routes = [];
  const domains = [];
  let workerCompatibilityDate;

  while (args.length > 0) {
    const arg = args.shift();
    if (arg === '-h' || arg === '--help') {
      return { help: true };
    }
    if (arg === '--') {
      continue;
    }
    if (arg === '--pages-project') {
      pagesProject = args.shift();
      continue;
    }
    if (arg === '--worker-name') {
      workerName = args.shift();
      continue;
    }
    if (arg === '--tree') {
      treeName = args.shift();
      continue;
    }
    if (arg === '--route') {
      routes.push(args.shift());
      continue;
    }
    if (arg === '--domain') {
      domains.push(args.shift());
      continue;
    }
    if (arg === '--branch') {
      branch = args.shift();
      continue;
    }
    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }
    if (arg === '--compatibility-date') {
      workerCompatibilityDate = args.shift();
      continue;
    }
    if (arg === '--skip-cloudflare' || arg === '--skip-pages') {
      skipCloudflare = true;
      continue;
    }
    if (arg === '--pages-only') {
      pagesOnly = true;
      continue;
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  if (pagesOnly && workerName) {
    throw new Error('--pages-only is not compatible with --worker-name');
  }
  if (pagesOnly && (routes.length > 0 || domains.length > 0)) {
    throw new Error('--pages-only is not compatible with --route/--domain');
  }

  const resolvedWorkerName = pagesOnly
    ? undefined
    : workerName ?? env[releaseProfile.workerNameEnv] ?? releaseProfile.defaultWorkerName;
  const defaultRoutes = usesBuiltInWorker(resolvedWorkerName)
    ? cloneValues(releaseProfile.defaultRoutes)
    : [];
  const defaultDomains = usesBuiltInWorker(resolvedWorkerName)
    ? cloneValues(releaseProfile.defaultDomains)
    : [];

  return {
    dryRun,
    skipCloudflare,
    pagesOnly,
    branch,
    treeName: treeName ?? releaseProfile.treeName,
    workerName: resolvedWorkerName,
    pagesProject: pagesProject ?? env[releaseProfile.pagesProjectEnv],
    routes: routes.length > 0 ? routes : defaultRoutes,
    domains: domains.length > 0 ? domains : defaultDomains,
    workerCompatibilityDate:
      workerCompatibilityDate ?? env.CF_WORKER_COMPATIBILITY_DATE ?? defaultWorkerCompatibilityDate,
  };
}

export function createReleasePlan(options) {
  if (options.workerName && options.branch) {
    throw new Error('--branch is only supported for Pages deployments');
  }
  if (!options.skipCloudflare && !options.workerName && !options.pagesProject) {
    throw new Error(
      `Missing Cloudflare target. Pass --worker-name, --pages-project, or set ${releaseProfile.workerNameEnv} / ${releaseProfile.pagesProjectEnv}.`,
    );
  }

  const distDir = path.join(appDir, releaseProfile.distDir);
  const steps = [
    {
      id: 'build',
      label: `Build ${releaseProfile.appName}`,
      command: releaseProfile.buildCommand,
      cwd: appDir,
    },
    ...releaseProfile.testCommands.map((command, index) => ({
      id: `test-${index + 1}`,
      label: `Test ${releaseProfile.appName} (${index + 1}/${releaseProfile.testCommands.length})`,
      command,
      cwd: appDir,
    })),
    {
      id: 'publish',
      label: `Publish ${releaseProfile.appName} to hashtree`,
      command: resolveHtreeCommand('add', '.', '--publish', options.treeName),
      cwd: distDir,
    },
  ];

  if (!options.skipCloudflare) {
    const deployCommand = options.workerName
      ? wranglerWorkerAssetsCommand(
          '--assets',
          releaseProfile.distDir,
          '--name',
          options.workerName,
          '--compatibility-date',
          options.workerCompatibilityDate,
          '--keep-vars',
        )
      : wranglerPagesCommand(
          'pages',
          'deploy',
          releaseProfile.distDir,
          '--project-name',
          options.pagesProject,
        );
    if (options.workerName) {
      for (const route of options.routes ?? []) {
        deployCommand.push('--route', route);
      }
      for (const domain of options.domains ?? []) {
        deployCommand.push('--domain', domain);
      }
    }
    if (options.pagesProject && options.branch) {
      deployCommand.push('--branch', options.branch);
    }
    steps.push({
      id: 'deploy',
      label: options.workerName
        ? `Deploy ${releaseProfile.appName} to Cloudflare Worker`
        : `Deploy ${releaseProfile.appName} to Cloudflare Pages`,
      command: deployCommand,
      cwd: appDir,
    });
  }

  return { profile: releaseProfile, distDir, steps };
}

function defaultRunner(step) {
  const [command, ...args] = step.command;
  console.log(`\n==> ${step.label}`);
  console.log(`$ ${[command, ...args].join(' ')}`);
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: step.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';

    child.stdout?.setEncoding('utf8');
    child.stdout?.on('data', (chunk) => {
      stdout += chunk;
      process.stdout.write(chunk);
    });

    child.stderr?.setEncoding('utf8');
    child.stderr?.on('data', (chunk) => {
      stderr += chunk;
      process.stderr.write(chunk);
    });

    child.on('error', reject);
    child.on('close', (code, signal) => {
      if (signal) {
        const signalMessage = `Process exited with signal ${signal}\n`;
        stderr += signalMessage;
        process.stderr.write(signalMessage);
      }
      resolve({
        status: code ?? 1,
        stdout,
        stderr,
      });
    });
  });
}

function ensureDistExists(distDir, buildOutputExists = existsSync) {
  if (!buildOutputExists(distDir)) {
    throw new Error(`Build output directory not found: ${distDir}`);
  }
}

export function parsePublishOutput(output) {
  const nhashMatch = output.match(/nhash1[ac-hj-np-z02-9]+/i);
  if (!nhashMatch) {
    throw new Error('Publish succeeded but no nhash was found in htree output');
  }

  const publishedMatch = output.match(/^\s*published:\s+(\S+)\s*$/im);
  if (!publishedMatch) {
    throw new Error('Publish succeeded but no mutable ref was found in htree output');
  }

  return {
    nhash: nhashMatch[0],
    publishedRef: publishedMatch[1],
  };
}

function parseDeployOutput(output) {
  const deployUrlMatch = output.match(/https:\/\/[^\s]+(?:\.pages\.dev|\.workers\.dev)(?:\/[^\s]*)?/i);
  return deployUrlMatch ? deployUrlMatch[0] : null;
}

function isReleaseStep(step) {
  return step.id === 'publish' || step.id === 'deploy';
}

function assertStepSucceeded(step, result) {
  if (result.status !== 0) {
    throw new Error(`${step.label} failed with exit code ${result.status}`);
  }
}

export async function runRelease(options, runner = defaultRunner, hooks = {}) {
  if (!options.dryRun && runner === defaultRunner) {
    throw new Error('browser.iris.to is archived; site publishing is disabled.');
  }
  const plan = createReleasePlan(options);
  const buildOutputExists = hooks.buildOutputExists ?? existsSync;

  if (options.dryRun) {
    return {
      dryRun: true,
      profile: plan.profile,
      steps: plan.steps,
    };
  }

  let publishOutput = '';
  let deployOutput = '';
  const prereleaseSteps = plan.steps.filter((step) => !isReleaseStep(step));
  const releaseSteps = plan.steps.filter(isReleaseStep);

  for (const step of prereleaseSteps) {
    const result = await runner(step);
    assertStepSucceeded(step, result);
    if (step.id === 'build') {
      ensureDistExists(plan.distDir, buildOutputExists);
    }
  }

  const releaseResults = await Promise.allSettled(
    releaseSteps.map((step) => Promise.resolve().then(() => runner(step))),
  );

  for (const [index, execution] of releaseResults.entries()) {
    const step = releaseSteps[index];
    if (execution.status === 'rejected') {
      throw execution.reason;
    }
    const result = execution.value;
    assertStepSucceeded(step, result);
    if (step.id === 'publish') {
      publishOutput = `${result.stdout}\n${result.stderr}`;
    }
    if (step.id === 'deploy') {
      deployOutput = `${result.stdout}\n${result.stderr}`;
    }
  }

  const publish = parsePublishOutput(publishOutput);
  return {
    profile: plan.profile,
    treeName: options.treeName,
    publish,
    pagesUrl: deployOutput ? parseDeployOutput(deployOutput) : null,
    pagesProject:
      options.skipCloudflare || options.workerName ? null : options.pagesProject ?? null,
    workerName: options.skipCloudflare ? null : options.workerName ?? null,
    routes: options.skipCloudflare || !options.workerName ? [] : options.routes ?? [],
    domains: options.skipCloudflare || !options.workerName ? [] : options.domains ?? [],
  };
}

export function usage() {
  return `Usage: node ./scripts/release-site.mjs [options]

Build once, test the built output, then publish to hashtree and deploy that same
directory to Cloudflare Workers Static Assets or Cloudflare Pages in parallel.

Options:
  --worker-name <name>    Cloudflare Worker service name for static assets
  --pages-project <name>  Cloudflare Pages project name
  --tree <name>           hashtree mutable tree name override
  --route <pattern>       Worker route, for example browser.iris.to/*
  --domain <hostname>     Worker custom domain
  --branch <name>         Pages branch/preview deployment target
  --pages-only            disable the built-in/default Worker target and use Pages
  --compatibility-date    Worker compatibility date override
  --skip-cloudflare       publish to hashtree only
  --skip-pages            alias for --skip-cloudflare
  --dry-run               print planned steps without running them

Environment:
  ${releaseProfile.workerNameEnv}   Default Worker name
  ${releaseProfile.pagesProjectEnv}   Default Pages project
  CF_WORKER_COMPATIBILITY_DATE   Default compatibility date for Worker deployments
  CLOUDFLARE_API_TOKEN   Wrangler token when using API-token auth
  CLOUDFLARE_ACCOUNT_ID   Cloudflare account id when required by your Wrangler setup
`;
}

function printSummary(result) {
  const { profile, publish, pagesProject, pagesUrl, workerName, routes, domains } = result;
  console.log(`\n${profile.appName} release complete.`);
  console.log(`Hashtree immutable URL: htree://${publish.nhash}/index.html`);
  console.log(`Hashtree mutable URL: htree://${publish.publishedRef}`);
  if (workerName) {
    console.log(`Worker service: ${workerName}`);
  }
  for (const route of routes ?? []) {
    console.log(`Worker route: ${route}`);
  }
  for (const domain of domains ?? []) {
    console.log(`Worker domain: ${domain}`);
  }
  if (pagesProject) {
    console.log(`Pages project: ${pagesProject}`);
  }
  if (pagesUrl) {
    console.log(`Deployment URL: ${pagesUrl}`);
  }
  console.log(`Tree name: ${result.treeName}`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2), process.env);
  if (options.help) {
    console.log(usage());
    return;
  }

  if (options.dryRun) {
    const result = await runRelease(options);
    console.log(usage());
    for (const step of result.steps) {
      console.log(`${step.label}: ${step.command.join(' ')} (cwd: ${step.cwd})`);
    }
    return;
  }

  const result = await runRelease(options);
  printSummary(result);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}

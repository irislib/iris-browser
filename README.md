# iris-browser

Standalone workspace for the Iris native browser shell.

Source: <https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/iris-browser>
Built on Hashtree: <https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/hashtree>

It contains the Iris Tauri app under `apps/iris`. The embedded daemon uses the
published Hashtree Rust crates through Cargo. The `browser.iris.to` landing site
lives in `apps/browser-site`.

For portable apps that should run both on the web and inside Iris Browser, use
[`@hashtree/worker`](https://www.npmjs.com/package/@hashtree/worker). Its source
lives in the Hashtree TypeScript workspace under
[`hashtree/ts/packages/hashtree-worker`](https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/hashtree/ts/packages/hashtree-worker).

For app/runtime compatibility details, including the `window.__HTREE_*` bridge
and portable `sites.iris.to` build rules, see the Iris app docs in
[`apps/iris/README.md`](/Users/sirius/src/iris-browser/apps/iris/README.md).

## Layout

- `apps/browser-site` - `browser.iris.to` landing site, screenshot asset, and release script
- `apps/iris` - Svelte frontend, Tauri shell, Playwright/e2e tests, and local release scripts

## Development

```bash
pnpm install
pnpm build
pnpm run build:site
pnpm test
pnpm run test:rust
```

Native smoke and release helpers run from this repo directly:

```bash
pnpm run test:native:docker
pnpm run release:native -- --dry-run --only linux
pnpm run release:site -- --dry-run --skip-cloudflare
```

Git remote setup for Hashtree-first development:

```bash
git remote add origin htree://self/iris-browser
```

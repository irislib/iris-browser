# iris-browser

**Archived November 18, 2026.** The `browser.iris.to` landing site is retired.
This repository preserves its source and history. Site publishing is disabled;
the separate Iris Chromium source and existing downloads are unaffected.

Source: <https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/iris-browser>
Browser source: <https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/iris-chromium>
Built on Hashtree: <https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/hashtree>

## Layout

- `apps/browser-site` - `browser.iris.to` landing site, screenshot assets, and release script

## Development

```bash
pnpm install
pnpm build
pnpm test
```

Inspect the historical release plan without publishing:

```bash
pnpm run release:site -- --dry-run --skip-cloudflare
```

Git remote setup for Hashtree-first development:

```bash
git remote add origin htree://self/iris-browser
```

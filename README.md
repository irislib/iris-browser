# iris-browser

Landing site source for `browser.iris.to`.

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

Publish the site from this repo directly:

```bash
pnpm run release:site -- --dry-run --skip-cloudflare
```

Git remote setup for Hashtree-first development:

```bash
git remote add origin htree://self/iris-browser
```

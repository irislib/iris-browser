# Iris

Native desktop shell for hashtree apps, built with [Tauri](https://tauri.app/).

Browser-like navigation with an address bar, back/forward history, and favorites. Loads web apps and `htree://` URLs in child webviews with NIP-07 signer injection. Embeds the htree daemon for local P2P connectivity.

## Origin Isolation

`htree://` apps must keep real browser origin boundaries. Different tree roots must not share `localStorage`, service workers, or other origin-scoped browser state just because Iris serves them from the same embedded daemon.

Iris keeps the canonical app identity as `htree://...`, but child webviews load through a per-root loopback host under `*.htree.localhost`. That means:

- `htree://npubA/app/...` and `htree://npubB/app/...` get different browser origins.
- `htree://npub/appA/...` and `htree://npub/appB/...` get different browser origins.
- Different `nhash` roots get different browser origins.
- Different paths inside the same tree root still share the same origin, so app state works normally within that app.

The `actual_url` transport detail is intentional: it keeps content on the local daemon backend while delegating storage isolation to the browser's own origin model instead of trying to emulate it in app code.

## App Compatibility

To keep one app working in Iris, on `browser.iris.to`, and under `sites.iris.to`, build it like a portable static site:

- Use relative asset URLs. Prefer `base: './'`, `./favicon.png`, and `fetch('./data.json')` over root-relative `/assets/...` or `/api/...`.
- Keep service workers relative to the current document path. Different htree roots intentionally get different origins and storage buckets.
- Avoid assuming a fixed localhost origin. Resolve same-app URLs from `window.location` unless you explicitly need the embedded daemon.
- For Vite apps that should also run from `sites.iris.to`, disable module preload and strip emitted `modulepreload` / `crossorigin` tags from `index.html`. See [`apps/browser-site/vite.config.ts`](/Users/sirius/src/iris-browser/apps/browser-site/vite.config.ts) for the portable pattern used by the landing page.

Iris exposes a small runtime bridge for apps that need htree context:

- `window.__HTREE_SERVER_URL__` points at the embedded htree daemon HTTP endpoint. Use it when you need daemon-backed APIs instead of hardcoding `127.0.0.1`.
- `window.__HTREE_CANONICAL_URL__` resolves to the canonical `htree://...` URL for the current document after bootstrap. It starts as `null`.
- `window.__HTREE_SESSION_TOKEN__` exists for Iris' internal bridge plumbing. Avoid depending on it in portable app code unless you are integrating with Iris-specific webview internals.

Iris currently passes `iris_htree_server`, `iris_htree_canonical`, `iris_htree_session`, and `iris_htree_root` through the initial launch URL, then strips them during bootstrap. Treat those query params as transport details, not a public app API.

## Development

```bash
pnpm install
pnpm run tauri:dev    # Dev mode
pnpm run tauri:build  # Build for distribution
pnpm run tauri:build:android
```

Requires [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/).

Android packaging is intentionally 64-bit only. Use `pnpm run tauri:build:android`; the raw `tauri android build` command defaults to multiple Android targets upstream. The checked-in Gradle project is also pinned to `aarch64` / `arm64-v8a`, and the test suite guards against reintroducing 32-bit Android targets.

## Testing

Use two layers on purpose:

- `pnpm run test:e2e` for fast shell/UI logic in a regular browser.
- `pnpm run test:native:linux` for real native desktop smoke tests on Linux with `tauri-driver`.
- `pnpm run test:native:docker` to run that same Linux native smoke in Docker from macOS or other non-Linux hosts.

Short rationale: WebDriver owns native clicks, text selection, and screenshots; the Iris automation bridge only exposes Iris-specific readiness and shell state. That keeps the bridge narrow instead of rebuilding a second UI driver.

The native smoke harness is Linux-only and expects a desktop-capable environment with a real window manager. Run it in a Linux VM or container with WebKitGTK, `WebKitWebDriver`, D-Bus, Xvfb, and a window manager such as `openbox`:

```bash
xvfb-run -a pnpm run test:native:linux
```

For a reproducible containerized run, use:

```bash
pnpm run test:native:docker
```

The Docker wrapper builds `scripts/Dockerfile.native-linux-smoke`, mounts the repo into `/workspace`, keeps Linux-only `node_modules` and Rust target artifacts in Docker volumes, and then runs the same `tauri-driver` smoke suite under `dbus-run-session`, Xvfb, and `openbox`.

If you need multiple Iris instances on one host, set `IRIS_DAEMON_PORT` (or `IRIS_DAEMON_BIND`) so each app uses its own embedded htree daemon socket.

By default, Iris shares the same hashtree identity and alias config as the CLI from `~/.hashtree` (or `HTREE_CONFIG_DIR` when set). That keeps `htree://self/...` and alias resolution consistent with `htree user`, `git-remote-htree`, and the CLI. Iris keeps only shell-local state such as browser history under its app data directory. `HTREE_DATA_DIR` can still override the daemon storage location for smoke tests or isolated runs.

Windows packaging stays app-first: ship the NSIS installer, let Iris manage its own embedded daemon, and use tray/autostart if users want it running in the background. Unlike `nostr-vpn`, Iris does not need a separate Windows service for normal use.

## Automation

Iris can expose a localhost automation API for agents and smoke tests.

```bash
IRIS_AUTOMATION=1 pnpm run tauri:dev
```

When enabled, the app logs the chosen port and serves:

- `GET /automation/health`
- `GET /automation/state`
- `POST /automation/command`

Example command payload:

```json
{ "action": "open_url", "url": "htree://npub1.../public/index.html" }
```

Supported actions are `open_url`, `back`, `forward`, `reload`, `home`, `settings`, and `shutdown`.

The automation bridge is intentionally semantic. Use it for readiness checks, current shell state, and app-aware commands; use Linux WebDriver for generic UI actions like clicking arbitrary elements, text selection, and taking screenshots.

## License

MIT

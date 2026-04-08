<script lang="ts">
  import { onMount } from 'svelte';

  const baseUrl = import.meta.env.BASE_URL;
  const sourceUrl =
    'https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/iris-browser';
  const releaseBaseUrl =
    'https://upload.iris.to/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/releases%2Firis-browser/latest';
  const releaseManifestUrl = `${releaseBaseUrl}/release.json`;

  type DownloadAsset = {
    name: string;
    href: string;
    label: string;
    ctaLabel: string;
    size: number;
    sizeLabel: string;
    platform: 'mac' | 'windows' | 'linux' | 'unknown';
    arch: 'arm64' | 'x64' | 'unknown';
    priority: number;
  };

  type Screenshot = {
    src: string;
    alt: string;
    title: string;
    body: string;
  };

  const fallbackAsset: DownloadAsset = {
    name: 'iris-v0.1.4-macos-arm64.zip',
    href: `${releaseBaseUrl}/assets/iris-v0.1.4-macos-arm64.zip`,
    label: 'Mac (Apple Silicon)',
    ctaLabel: 'Download for Mac',
    size: 20_744_558,
    sizeLabel: '19.8 MB',
    platform: 'mac',
    arch: 'arm64',
    priority: 50,
  };

  const screenshots: Screenshot[] = [
    {
      src: `${baseUrl}browser-home.jpg`,
      alt: 'Iris Browser home screen with favorites and suggestions',
      title: 'A calm place to start',
      body: 'Favorites, recent places, and useful suggestions stay close at hand.',
    },
    {
      src: `${baseUrl}browser-jumble.jpg`,
      alt: 'Iris Browser opening a shared website',
      title: 'Shared websites feel like real places',
      body: 'A site someone sends you can stay useful instead of disappearing into chat history.',
    },
    {
      src: `${baseUrl}browser-permission.jpg`,
      alt: 'Iris Browser asking before a website uses your account',
      title: 'You stay in control',
      body: 'If a website wants your account, Iris asks first instead of assuming yes.',
    },
  ];

  const checklist = [
    'Publish websites for free',
    'Keep websites ready offline',
    'Share to nearby devices over Wi-Fi',
    'Send files without the usual friction',
    'Skip email, phone, and extra accounts',
  ];

  let current = $state(0);
  let releaseAssets = $state<DownloadAsset[]>([fallbackAsset]);
  let primaryDownload = $state<DownloadAsset>(fallbackAsset);
  let showAllDownloads = $state(false);

  function go(index: number) {
    current = (index + screenshots.length) % screenshots.length;
  }

  function prev() {
    go(current - 1);
  }

  function next() {
    go(current + 1);
  }

  function formatSize(size: number): string {
    if (!Number.isFinite(size) || size <= 0) {
      return '';
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function describeAsset(name: string): Omit<DownloadAsset, 'name' | 'href' | 'size' | 'sizeLabel'> {
    if (/macos-arm64\.zip$/i.test(name)) {
      return {
        label: 'Mac (Apple Silicon)',
        ctaLabel: 'Download for Mac',
        platform: 'mac',
        arch: 'arm64',
        priority: 50,
      };
    }

    if (/windows-x64-setup\.exe$/i.test(name)) {
      return {
        label: 'Windows',
        ctaLabel: 'Download for Windows',
        platform: 'windows',
        arch: 'x64',
        priority: 40,
      };
    }

    if (/windows-arm64-setup\.exe$/i.test(name)) {
      return {
        label: 'Windows (ARM)',
        ctaLabel: 'Download for Windows',
        platform: 'windows',
        arch: 'arm64',
        priority: 39,
      };
    }

    if (/linux-x86_64\.AppImage$/i.test(name)) {
      return {
        label: 'Linux AppImage',
        ctaLabel: 'Download for Linux',
        platform: 'linux',
        arch: 'x64',
        priority: 35,
      };
    }

    if (/linux-x86_64\.deb$/i.test(name)) {
      return {
        label: 'Linux .deb',
        ctaLabel: 'Download for Linux',
        platform: 'linux',
        arch: 'x64',
        priority: 34,
      };
    }

    return {
      label: name,
      ctaLabel: 'Download',
      platform: 'unknown',
      arch: 'unknown',
      priority: 0,
    };
  }

  function detectPlatform() {
    if (typeof navigator === 'undefined') {
      return { platform: 'unknown', arch: 'unknown' } as const;
    }

    const navigatorWithData = navigator as Navigator & {
      userAgentData?: {
        platform?: string;
        architecture?: string;
      };
    };

    const platformSource =
      `${navigatorWithData.userAgentData?.platform ?? ''} ${navigator.platform ?? ''} ${navigator.userAgent}`.toLowerCase();
    const archSource =
      `${navigatorWithData.userAgentData?.architecture ?? ''} ${navigator.userAgent}`.toLowerCase();

    const platform = platformSource.includes('mac')
      ? 'mac'
      : platformSource.includes('win')
        ? 'windows'
        : platformSource.includes('linux')
          ? 'linux'
          : 'unknown';

    const arch = archSource.includes('arm') || archSource.includes('aarch64')
      ? 'arm64'
      : archSource.includes('x86_64') ||
          archSource.includes('win64') ||
          archSource.includes('x64') ||
          archSource.includes('amd64') ||
          archSource.includes('intel')
        ? 'x64'
        : 'unknown';

    return { platform, arch } as const;
  }

  function scoreAsset(asset: DownloadAsset) {
    const detected = detectPlatform();
    let score = asset.priority;

    if (asset.platform === detected.platform) {
      score += 100;
    }

    if (asset.arch === detected.arch && asset.arch !== 'unknown') {
      score += 20;
    }

    return score;
  }

  function sortAssets(assets: DownloadAsset[]) {
    return [...assets].sort((left, right) => scoreAsset(right) - scoreAsset(left));
  }

  function syncPrimaryDownload(assets: DownloadAsset[]) {
    const sorted = sortAssets(assets);
    primaryDownload = sorted[0] ?? fallbackAsset;
  }

  function downloadNote() {
    if (releaseAssets.length > 1) {
      return 'The main button picks the best match for this device.';
    }

    return 'Mac download for now. More options can appear here later.';
  }

  onMount(async () => {
    try {
      const response = await fetch(releaseManifestUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`Release manifest request failed with ${response.status}`);
      }

      const manifest = await response.json() as {
        assets?: Array<{ name: string; path: string; size: number }>;
      };

      const assets = (manifest.assets ?? []).map((asset) => {
        const described = describeAsset(asset.name);
        return {
          name: asset.name,
          href: `${releaseBaseUrl}/${asset.path}`,
          size: asset.size,
          sizeLabel: formatSize(asset.size),
          ...described,
        } satisfies DownloadAsset;
      });

      if (assets.length > 0) {
        releaseAssets = assets;
        syncPrimaryDownload(assets);
      }
    } catch (error) {
      console.warn('[browser-site] failed to load release manifest', error);
    }
  });
</script>

<svelte:head>
  <title>browser.iris.to | Iris Browser</title>
  <meta
    name="description"
    content="Publish websites for free, keep them ready offline, share them nearby, and skip extra accounts."
  />
</svelte:head>

<div class="site-shell">
  <main class="content">
    <section class="hero">
      <div class="copy">
        <h1>Websites should work anywhere.</h1>
        <p class="lede">
          Iris Browser makes websites easier to keep, share, and open, even when the connection
          is weak or the usual platforms get in the way.
        </p>

        <div class="actions">
          <a class="button primary" href={primaryDownload.href}>
            {primaryDownload.ctaLabel}
          </a>
          {#if releaseAssets.length > 1}
            <button
              type="button"
              class="button secondary"
              aria-expanded={showAllDownloads}
              onclick={() => (showAllDownloads = !showAllDownloads)}
            >
              {showAllDownloads ? 'Hide downloads' : 'All downloads'}
            </button>
          {/if}
        </div>

        <p class="download-note">{downloadNote()}</p>

        {#if showAllDownloads && releaseAssets.length > 1}
          <div class="download-list">
            {#each sortAssets(releaseAssets) as asset}
              <a class="download-item" href={asset.href}>
                <span class="download-label">{asset.label}</span>
                <span class="download-size">{asset.sizeLabel || 'Download'}</span>
              </a>
            {/each}
          </div>
        {/if}

      </div>

      <section class="gallery" aria-label="Screenshots">
        <div class="stage">
          <img
            class="hero-shot"
            src={screenshots[current].src}
            alt={screenshots[current].alt}
            loading="eager"
          />

          <div class="gallery-nav">
            <button type="button" class="nav-button" onclick={prev} aria-label="Previous screenshot">
              Prev
            </button>
            <button type="button" class="nav-button" onclick={next} aria-label="Next screenshot">
              Next
            </button>
          </div>
        </div>

        <div class="caption">
          <h2>{screenshots[current].title}</h2>
          <p>{screenshots[current].body}</p>
        </div>

        <div class="thumbnails" aria-label="Choose screenshot">
          {#each screenshots as screenshot, index}
            <button
              type="button"
              class:active={index === current}
              class="thumb"
              aria-label={`Show screenshot ${index + 1}: ${screenshot.title}`}
              aria-pressed={index === current}
              onclick={() => go(index)}
            >
              <img src={screenshot.src} alt="" loading="lazy" />
            </button>
          {/each}
        </div>
      </section>

      <ul class="checklist">
        {#each checklist as item}
          <li>{item}</li>
        {/each}
      </ul>
    </section>
  </main>

  <footer class="footer">
    <a href={sourceUrl}>Source</a>
  </footer>
</div>

<style>
  :global(:root) {
    color-scheme: light dark;
    --page-bg: #f5f7f8;
    --page-glow: rgba(56, 110, 191, 0.12);
    --surface: rgba(255, 255, 255, 0.88);
    --surface-strong: #ffffff;
    --border: rgba(22, 38, 54, 0.12);
    --text-1: #102033;
    --text-2: #587083;
    --accent: #1f78f0;
    --accent-strong: #155fc4;
    --accent-soft: rgba(31, 120, 240, 0.12);
    --shadow: 0 24px 60px rgba(16, 32, 51, 0.08);
  }

  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --page-bg: #0b1116;
      --page-glow: rgba(94, 165, 255, 0.14);
      --surface: rgba(18, 27, 35, 0.84);
      --surface-strong: #121b23;
      --border: rgba(191, 214, 235, 0.14);
      --text-1: #edf4fb;
      --text-2: #9db0c2;
      --accent: #77b0ff;
      --accent-strong: #9cc7ff;
      --accent-soft: rgba(119, 176, 255, 0.18);
      --shadow: 0 28px 70px rgba(0, 0, 0, 0.28);
    }
  }

  :global(html, body, #app) {
    min-height: 100%;
  }

  :global(body) {
    margin: 0;
    background:
      radial-gradient(circle at top center, var(--page-glow), transparent 34%),
      var(--page-bg);
    color: var(--text-1);
    font-family:
      ui-sans-serif,
      system-ui,
      -apple-system,
      BlinkMacSystemFont,
      'Segoe UI',
      sans-serif;
  }

  :global(a) {
    color: inherit;
  }

  .site-shell {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
  }

  .content,
  .footer {
    width: min(1120px, calc(100vw - 2rem));
    margin: 0 auto;
  }

  .content {
    flex: 1;
    display: flex;
    align-items: center;
    padding: 1.4rem 0 2.5rem;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(320px, 0.95fr);
    grid-template-areas:
      'copy gallery'
      'checklist gallery';
    gap: 2rem;
    width: 100%;
    align-items: center;
  }

  .copy {
    grid-area: copy;
    max-width: 34rem;
  }

  h1 {
    margin: 0;
    font-size: clamp(3.1rem, 6vw, 5.3rem);
    line-height: 0.93;
    letter-spacing: -0.05em;
    text-wrap: balance;
  }

  .lede {
    margin: 1.2rem 0 0;
    max-width: 32rem;
    color: var(--text-2);
    font-size: 1.1rem;
    line-height: 1.65;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.85rem;
    margin: 1.8rem 0 0;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 3.25rem;
    padding: 0.85rem 1.15rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    font-size: 0.98rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition:
      transform 140ms ease,
      border-color 140ms ease,
      background-color 140ms ease;
  }

  .button:hover {
    transform: translateY(-1px);
  }

  .button.primary {
    border-color: transparent;
    background: var(--accent);
    color: #fff;
  }

  .button.primary:hover {
    background: var(--accent-strong);
  }

  .button.secondary {
    background: var(--surface);
    color: var(--text-1);
    box-shadow: var(--shadow);
  }

  .download-note {
    margin: 0.85rem 0 0;
    color: var(--text-2);
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .download-list {
    display: grid;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 1.4rem;
    background: var(--surface);
    box-shadow: var(--shadow);
  }

  .download-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.85rem 1rem;
    border-radius: 1rem;
    background: var(--surface-strong);
    text-decoration: none;
  }

  .download-label {
    font-weight: 600;
  }

  .download-size {
    color: var(--text-2);
    font-size: 0.9rem;
    white-space: nowrap;
  }

  .checklist {
    grid-area: checklist;
    align-self: start;
    list-style: none;
    padding: 0;
    margin: 0.25rem 0 0;
    border-top: 1px solid var(--border);
  }

  .checklist li {
    display: flex;
    align-items: center;
    gap: 0.9rem;
    padding: 0.95rem 0;
    border-bottom: 1px solid var(--border);
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.4;
  }

  .checklist li::before {
    content: '';
    width: 0.72rem;
    height: 0.72rem;
    border-radius: 999px;
    background: var(--accent);
    box-shadow: 0 0 0 0.28rem var(--accent-soft);
    flex: none;
  }

  .gallery {
    grid-area: gallery;
    padding: 1rem;
    border: 1px solid var(--border);
    border-radius: 2rem;
    background: var(--surface);
    box-shadow: var(--shadow);
    backdrop-filter: blur(18px);
  }

  .stage {
    position: relative;
  }

  .hero-shot {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: 1.45rem;
    background: var(--surface-strong);
  }

  .gallery-nav {
    position: absolute;
    inset: auto 0 1rem 0;
    display: flex;
    justify-content: space-between;
    padding: 0 1rem;
    pointer-events: none;
  }

  .nav-button {
    pointer-events: auto;
    min-height: 2.4rem;
    padding: 0.55rem 0.9rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--surface-strong) 82%, transparent);
    color: var(--text-1);
    font-size: 0.84rem;
    font-weight: 700;
    cursor: pointer;
    backdrop-filter: blur(12px);
  }

  .caption {
    padding: 1.15rem 0.35rem 0;
  }

  .caption h2 {
    margin: 0;
    font-size: 1.35rem;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .caption p {
    margin: 0.55rem 0 0;
    color: var(--text-2);
    font-size: 0.98rem;
    line-height: 1.6;
  }

  .thumbnails {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.75rem;
    margin-top: 1rem;
  }

  .thumb {
    padding: 0.3rem;
    border: 1px solid transparent;
    border-radius: 1rem;
    background: transparent;
    cursor: pointer;
    transition:
      transform 140ms ease,
      border-color 140ms ease,
      background-color 140ms ease;
  }

  .thumb:hover {
    transform: translateY(-1px);
  }

  .thumb.active {
    border-color: var(--accent);
    background: var(--accent-soft);
  }

  .thumb img {
    display: block;
    width: 100%;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    border-radius: 0.8rem;
  }

  .footer {
    display: flex;
    justify-content: flex-end;
    padding: 0 0 1.5rem;
  }

  .footer a {
    color: var(--text-2);
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .footer a:hover {
    color: var(--text-1);
  }

  @media (max-width: 940px) {
    .content {
      align-items: flex-start;
      padding-top: 1.4rem;
    }

    .hero {
      grid-template-columns: 1fr;
      grid-template-areas:
        'copy'
        'gallery'
        'checklist';
      gap: 1.5rem;
    }

    .copy {
      max-width: none;
    }
  }

  @media (max-width: 640px) {
    .content,
    .footer {
      width: min(100vw - 1.25rem, 1120px);
    }

    .content {
      padding-top: 0.9rem;
      padding-bottom: 1.5rem;
    }

    h1 {
      font-size: clamp(2.7rem, 14vw, 4rem);
    }

    .lede {
      font-size: 1rem;
    }

    .gallery {
      padding: 0.8rem;
      border-radius: 1.6rem;
    }

    .hero-shot {
      border-radius: 1.15rem;
    }

    .caption {
      padding-left: 0.15rem;
      padding-right: 0.15rem;
    }

    .caption h2 {
      font-size: 1.15rem;
    }

    .thumbnails {
      gap: 0.5rem;
    }

    .footer {
      justify-content: flex-start;
      padding-bottom: 1.2rem;
    }
  }
</style>

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

  let current = $state(0);
  let releaseAssets = $state<DownloadAsset[]>([fallbackAsset]);
  let primaryDownload = $state<DownloadAsset>(fallbackAsset);
  let showAllDownloads = $state(false);

  const sellingPoints = [
    'Publish websites for free',
    'Save websites to offline mode',
    'Share to nearby devices over Wi-Fi',
    'Send files without the usual friction',
    'Skip email, phone, and extra accounts',
  ];

  const benefits = [
    {
      title: 'Publish websites for free',
      body:
        'Publish a website without handing it over to a giant platform or paying for hosting just to get started.',
    },
    {
      title: 'Save websites to offline mode',
      body:
        'Keep a website ready to open even when your connection gets weak, slow, or disappears.',
    },
    {
      title: 'Share to nearby devices',
      body:
        'Send a website straight to phones and laptops around you over Wi-Fi, without bouncing through somebody else first.',
    },
    {
      title: 'Effortless file sharing',
      body:
        'Move files from one device to another without digging through links, inboxes, or cloud drives.',
    },
    {
      title: 'No extra accounts required',
      body:
        'People should not need a third-party email, phone number, or signup just to open and use a website.',
    },
  ];

  const gallery = [
    {
      src: `${baseUrl}browser-home.jpg`,
      alt: 'Iris Browser home screen with favorites and suggestions',
      title: 'Start from a calm home screen',
      body: 'Favorites, suggestions, and recent places stay close instead of getting lost.',
    },
    {
      src: `${baseUrl}browser-jumble.jpg`,
      alt: 'Iris Browser opening a shared website',
      title: 'Open shared websites like real apps',
      body: 'A link from someone else can open cleanly instead of feeling disposable.',
    },
    {
      src: `${baseUrl}browser-permission.jpg`,
      alt: 'Iris Browser showing an account access prompt',
      title: 'Account access stays explicit',
      body: 'If a website wants to use your account, Iris puts the choice in front of you.',
    },
  ];

  function go(index: number) {
    current = (index + gallery.length) % gallery.length;
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

    const platformSource = `${navigatorWithData.userAgentData?.platform ?? ''} ${navigator.platform ?? ''} ${navigator.userAgent}`.toLowerCase();
    const archSource = `${navigatorWithData.userAgentData?.architecture ?? ''} ${navigator.userAgent}`.toLowerCase();

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
      return 'The button above picks the best match we have for this device.';
    }

    return 'Apple Silicon Macs for now. More downloads can appear here later.';
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
    content="A better internet is here: publish websites for free, save them to offline mode, share nearby, and skip extra accounts."
  />
</svelte:head>

<div class="site-shell">
  <div class="backdrop backdrop-a"></div>
  <div class="backdrop backdrop-b"></div>

  <header class="topbar">
    <a class="brand" href={sourceUrl}>
      Iris Browser
    </a>
    <a class="toplink" href="#screenshots">Screenshots</a>
  </header>

  <main class="content">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">browser.iris.to</p>
        <h1>A better internet is here.</h1>
        <p class="lede">
          Publish websites for free, save them to offline mode, send them to nearby devices,
          share files easily, and skip the usual account maze.
        </p>

        <div class="actions">
          <a class="button button-primary" href={primaryDownload.href}>
            {primaryDownload.ctaLabel}
          </a>
          <a class="button button-secondary" href="#benefits">Why it matters</a>
        </div>

        <div class="download-meta">
          <p class="download-note">{downloadNote()}</p>
          {#if releaseAssets.length > 1}
            <button
              type="button"
              class="downloads-toggle"
              aria-expanded={showAllDownloads}
              onclick={() => (showAllDownloads = !showAllDownloads)}
            >
              {showAllDownloads ? 'Hide downloads' : 'All downloads'}
            </button>
          {/if}
        </div>

        {#if showAllDownloads && releaseAssets.length > 1}
          <div class="download-list">
            {#each releaseAssets as asset}
              <a class="download-item" href={asset.href}>
                <span class="download-item-name">{asset.label}</span>
                <span class="download-item-size">{asset.sizeLabel}</span>
              </a>
            {/each}
          </div>
        {/if}

        <div class="pill-row">
          {#each sellingPoints as point}
            <span class="pill">{point}</span>
          {/each}
        </div>
      </div>

      <div id="screenshots" class="hero-gallery">
        <div class="gallery-topline">
          <p class="section-label">Screenshots</p>
          <div class="gallery-controls">
            <button
              type="button"
              class="gallery-button"
              aria-label="Previous screenshot"
              onclick={() => go(current - 1)}
            >
              Prev
            </button>
            <button
              type="button"
              class="gallery-button"
              aria-label="Next screenshot"
              onclick={() => go(current + 1)}
            >
              Next
            </button>
          </div>
        </div>

        <div class="carousel-viewport">
          <div class="carousel-track" style={`transform: translateX(calc(-${current} * (100% + 1rem)));`}>
            {#each gallery as shot}
              <figure class="gallery-card">
                <div class="shot-frame">
                  <img src={shot.src} alt={shot.alt} />
                </div>
                <figcaption>
                  <h2>{shot.title}</h2>
                  <p>{shot.body}</p>
                </figcaption>
              </figure>
            {/each}
          </div>
        </div>

        <div class="thumb-row">
          {#each gallery as shot, index}
            <button
              type="button"
              class:thumb-active={index === current}
              class="thumb"
              aria-label={`Show ${shot.title}`}
              aria-pressed={index === current}
              onclick={() => go(index)}
            >
              <img src={shot.src} alt="" />
              <span>{shot.title}</span>
            </button>
          {/each}
        </div>
      </div>
    </section>

    <section id="benefits" class="benefit-section">
      <div class="section-copy">
        <p class="section-label">Why It Matters</p>
        <h3>Websites should stay useful when you are offline, nearby, and sharing.</h3>
      </div>

      <div class="benefit-grid">
        {#each benefits as benefit}
          <article class="benefit-card">
            <p class="card-kicker">{benefit.title}</p>
            <p>{benefit.body}</p>
          </article>
        {/each}
      </div>
    </section>

    <footer class="site-footer">
      <a href={sourceUrl}>Source</a>
    </footer>
  </main>
</div>

<style>
  :global(html) {
    scroll-behavior: smooth;
  }

  :global(body) {
    margin: 0;
    min-height: 100vh;
    background:
      radial-gradient(circle at top, rgba(255, 183, 77, 0.12), transparent 26%),
      linear-gradient(180deg, #f5ecdf 0%, #eadcc7 52%, #f4ece0 100%);
    color: #24180f;
    font-family: 'Avenir Next', 'Segoe UI', 'Helvetica Neue', sans-serif;
  }

  :global(a) {
    color: inherit;
    text-decoration: none;
  }

  :global(img) {
    display: block;
    max-width: 100%;
  }

  .site-shell {
    position: relative;
    overflow: hidden;
    min-height: 100vh;
  }

  .backdrop {
    position: absolute;
    inset: auto auto 0 0;
    border-radius: 999px;
    filter: blur(18px);
    opacity: 0.42;
    pointer-events: none;
  }

  .backdrop-a {
    width: 22rem;
    height: 22rem;
    right: -6rem;
    top: 6rem;
    background: radial-gradient(circle, rgba(255, 126, 95, 0.32), transparent 68%);
    animation: drift 14s ease-in-out infinite;
  }

  .backdrop-b {
    width: 28rem;
    height: 28rem;
    left: -10rem;
    bottom: -9rem;
    background: radial-gradient(circle, rgba(255, 205, 116, 0.28), transparent 72%);
    animation: drift 18s ease-in-out infinite reverse;
  }

  .topbar,
  .content {
    position: relative;
    z-index: 1;
    width: min(1180px, calc(100% - 2rem));
    margin: 0 auto;
  }

  .topbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 1.25rem 0 0;
  }

  .brand,
  .toplink {
    font-size: 0.95rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .brand {
    color: #5a3618;
  }

  .toplink {
    color: rgba(36, 24, 15, 0.74);
  }

  .content {
    padding: 3rem 0 4rem;
  }

  .hero-copy,
  .hero-gallery,
  .section-copy,
  .benefit-card {
    animation: rise 0.7s ease-out both;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 0.86fr) minmax(0, 1.14fr);
    gap: 1.35rem;
    align-items: start;
  }

  .eyebrow,
  .section-label,
  .card-kicker {
    margin: 0 0 0.75rem;
    color: #8d451c;
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  h1,
  h2,
  h3,
  p {
    margin: 0;
  }

  h1 {
    max-width: 10ch;
    color: #23170f;
    font-size: clamp(3rem, 6.5vw, 5rem);
    line-height: 0.94;
    letter-spacing: -0.06em;
  }

  h2 {
    font-size: 1.18rem;
    line-height: 1.1;
    letter-spacing: -0.03em;
  }

  h3 {
    max-width: 18ch;
    font-size: clamp(2rem, 4vw, 3rem);
    line-height: 1;
    letter-spacing: -0.05em;
  }

  .lede {
    max-width: 34rem;
    margin-top: 1.15rem;
    color: rgba(36, 24, 15, 0.78);
    font-size: 1.08rem;
    line-height: 1.6;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.9rem;
    margin-top: 1.65rem;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 3rem;
    padding: 0 1.15rem;
    border-radius: 999px;
    border: 1px solid transparent;
    font-size: 0.98rem;
    font-weight: 700;
    transition:
      transform 160ms ease,
      background 160ms ease,
      border-color 160ms ease;
  }

  .button:hover {
    transform: translateY(-1px);
  }

  .button-primary {
    background: #16110b;
    color: #fff5eb;
    box-shadow: 0 14px 30px rgba(22, 17, 11, 0.16);
  }

  .button-secondary {
    border-color: rgba(36, 24, 15, 0.14);
    background: rgba(255, 255, 255, 0.6);
    color: #24180f;
  }

  .pill-row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.7rem;
    margin-top: 1.5rem;
  }

  .download-note {
    color: rgba(36, 24, 15, 0.64);
    font-size: 0.92rem;
  }

  .download-meta {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 0.85rem;
    margin-top: 0.85rem;
  }

  .downloads-toggle {
    padding: 0;
    border: 0;
    background: transparent;
    color: #8d451c;
    font: inherit;
    font-size: 0.92rem;
    font-weight: 700;
    cursor: pointer;
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }

  .download-list {
    display: grid;
    gap: 0.6rem;
    margin-top: 0.9rem;
  }

  .download-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.9rem 1rem;
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.56);
    border: 1px solid rgba(36, 24, 15, 0.08);
  }

  .download-item-name {
    font-weight: 700;
  }

  .download-item-size {
    color: rgba(36, 24, 15, 0.6);
    font-size: 0.9rem;
  }

  .pill {
    display: inline-flex;
    align-items: center;
    min-height: 2rem;
    padding: 0 0.85rem;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.68);
    border: 1px solid rgba(36, 24, 15, 0.08);
    color: rgba(36, 24, 15, 0.72);
    font-size: 0.88rem;
  }

  .hero-gallery {
    min-width: 0;
    padding: 0.95rem;
    border-radius: 1.8rem;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(36, 24, 15, 0.08);
    box-shadow: 0 18px 40px rgba(98, 64, 21, 0.08);
  }

  .gallery-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
  }

  .gallery-topline .section-label {
    margin-bottom: 0;
  }

  .gallery-controls {
    display: flex;
    gap: 0.55rem;
  }

  .gallery-button {
    min-height: 2.4rem;
    padding: 0 0.95rem;
    border: 1px solid rgba(36, 24, 15, 0.1);
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.7);
    color: #24180f;
    font: inherit;
    font-size: 0.88rem;
    font-weight: 700;
    cursor: pointer;
  }

  .carousel-viewport {
    overflow: hidden;
    margin-top: 0.9rem;
  }

  .carousel-track {
    display: flex;
    gap: 1rem;
    transition: transform 220ms ease;
    will-change: transform;
  }

  .gallery-card {
    min-width: 100%;
    margin: 0;
  }

  .shot-frame {
    position: relative;
    overflow: hidden;
    border-radius: 1.3rem;
    background: rgba(15, 10, 7, 0.92);
    padding: 0.65rem;
    box-shadow:
      0 24px 70px rgba(53, 31, 8, 0.16),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .shot-frame::before {
    content: '';
    position: absolute;
    inset: 0.65rem;
    border-radius: 0.95rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    pointer-events: none;
  }

  .shot-frame img {
    width: 100%;
    border-radius: 0.95rem;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.34);
  }

  figcaption {
    margin-top: 0.9rem;
  }

  figcaption p {
    margin-top: 0.55rem;
    color: rgba(36, 24, 15, 0.76);
    line-height: 1.55;
  }

  .thumb-row {
    display: grid;
    gap: 0.8rem;
    margin-top: 0.9rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .thumb {
    display: grid;
    gap: 0.55rem;
    padding: 0.45rem;
    border: 1px solid rgba(36, 24, 15, 0.08);
    border-radius: 1rem;
    background: rgba(255, 255, 255, 0.55);
    color: #24180f;
    text-align: left;
    font: inherit;
    cursor: pointer;
    transition:
      transform 160ms ease,
      border-color 160ms ease,
      background 160ms ease;
  }

  .thumb:hover {
    transform: translateY(-1px);
  }

  .thumb img {
    width: 100%;
    border-radius: 0.75rem;
  }

  .thumb span {
    padding: 0 0.2rem 0.15rem;
    font-size: 0.86rem;
    font-weight: 700;
    line-height: 1.25;
  }

  .thumb-active {
    border-color: rgba(141, 69, 28, 0.32);
    background: rgba(255, 255, 255, 0.86);
    box-shadow: 0 12px 30px rgba(98, 64, 21, 0.08);
  }

  .benefit-section {
    margin-top: 3rem;
  }

  .site-footer {
    margin-top: 2rem;
    padding-top: 1rem;
    color: rgba(36, 24, 15, 0.68);
    font-size: 0.95rem;
  }

  .site-footer a {
    text-decoration: underline;
    text-underline-offset: 0.18em;
  }

  .section-copy p:last-child {
    max-width: 40rem;
    margin-top: 1rem;
  }

  .benefit-grid {
    display: grid;
    gap: 1rem;
    margin-top: 1.35rem;
    grid-template-columns: repeat(5, minmax(0, 1fr));
  }

  .benefit-card {
    padding: 1.25rem;
    border-radius: 1.4rem;
    background: rgba(255, 255, 255, 0.74);
    border: 1px solid rgba(36, 24, 15, 0.08);
    box-shadow: 0 18px 40px rgba(98, 64, 21, 0.08);
  }

  .benefit-card p:last-child {
    color: rgba(36, 24, 15, 0.76);
    line-height: 1.6;
  }

  @keyframes rise {
    from {
      opacity: 0;
      transform: translateY(18px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes drift {
    0%,
    100% {
      transform: translate3d(0, 0, 0);
    }
    50% {
      transform: translate3d(0, -14px, 0);
    }
  }

  @media (max-width: 1100px) {
    .hero,
    .benefit-grid {
      grid-template-columns: 1fr;
    }

    h1,
    h3 {
      max-width: none;
    }
  }

  @media (max-width: 720px) {
    .topbar {
      padding-top: 1rem;
    }

    .content {
      padding-top: 2.4rem;
    }

    h1 {
      font-size: clamp(2.6rem, 12vw, 4rem);
    }

    .hero-gallery,
    .benefit-grid {
      grid-template-columns: 1fr;
    }

    .thumb-row {
      grid-template-columns: 1fr;
    }

    .hero-gallery,
    .benefit-card {
      border-radius: 1.3rem;
    }

    .shot-frame {
      border-radius: 1.1rem;
      padding: 0.55rem;
    }

    .shot-frame::before {
      inset: 0.55rem;
      border-radius: 0.8rem;
    }

    .shot-frame img {
      border-radius: 0.8rem;
    }
  }
</style>

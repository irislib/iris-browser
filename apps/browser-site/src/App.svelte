<script lang="ts">
  import { onMount } from 'svelte';

  const baseUrl = import.meta.env.BASE_URL;
  const sourceUrl =
    'https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/iris-chromium';
  const hashtreeDevUrl = 'https://hashtree.cc/#/dev';
  const releaseBaseUrl =
    'https://upload.iris.to/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/releases%2Firis-chromium/latest';
  const releaseManifestUrl = `${releaseBaseUrl}/release.json`;

  type DownloadAsset = {
    name: string;
    href: string;
    label: string;
    ctaLabel: string;
    size: number;
    sizeLabel: string;
    platform: 'mac' | 'windows' | 'linux' | 'android' | 'unknown';
    arch: 'arm64' | 'x64' | 'unknown';
    priority: number;
    variantKey: string;
  };

  type ReleaseManifestAsset = {
    name: string;
    path: string;
    size?: number;
    size_bytes?: number;
  };

  type Screenshot = {
    src: string;
    alt: string;
    title: string;
    body: string;
  };

  type Benefit = {
    title: string;
    body: string;
    icon: 'globe' | 'download' | 'bookmark' | 'wifi' | 'shield' | 'wallet';
    tone: 'blue' | 'green' | 'teal' | 'amber' | 'violet' | 'rose';
  };

  const fallbackAsset: DownloadAsset = {
    name: 'iris-v149.0.7789.0-9cc924193f63-component-dirty-macos-arm64-app.zip',
    href:
      `${releaseBaseUrl}/assets/` +
      'iris-v149.0.7789.0-9cc924193f63-component-dirty-macos-arm64-app.zip',
    label: 'Mac (Apple Silicon)',
    ctaLabel: 'Download for Mac',
    size: 50_046_349,
    sizeLabel: '47.7 MB',
    platform: 'mac',
    arch: 'arm64',
    priority: 50,
    variantKey: 'mac-arm64-zip',
  };

  const screenshots: Screenshot[] = [
    {
      src: `${baseUrl}browser-home.png`,
      alt: 'Iris Browser home screen with built-in apps and saved places',
      title: 'Keep the useful things close',
      body: 'Open saved sites, built-in tools, and everyday places from one calm home screen.',
    },
    {
      src: `${baseUrl}browser-wallet.png`,
      alt: 'Iris Browser wallet page open in a tab',
      title: 'A wallet in the browser',
      body: 'Open your wallet in a tab to receive, pay, and manage digital cash without leaving Iris.',
    },
    {
      src: `${baseUrl}browser-permission.png`,
      alt: 'Iris Browser asking before a site checks wallet balance',
      title: 'Sites ask first',
      body: 'Iris asks whether a site can check your balance or request a payment before it touches your wallet.',
    },
  ];

  const benefits: Benefit[] = [
    {
      title: 'Keep a copy, not just a link',
      body: 'Sites and files stay with you instead of being trapped behind one host, app, or login.',
      icon: 'globe',
      tone: 'blue',
    },
    {
      title: 'Works offline',
      body: 'Keep using saved sites, apps, and files when the connection is slow, spotty, or missing.',
      icon: 'download',
      tone: 'green',
    },
    {
      title: 'Share nearby',
      body: 'Pass a site or file straight to people around you instead of sending everything the long way around.',
      icon: 'wifi',
      tone: 'teal',
    },
    {
      title: 'No platform account required',
      body: 'People can open what you share without needing an email address, phone number, or third-party sign-in.',
      icon: 'bookmark',
      tone: 'amber',
    },
    {
      title: 'Blocks ads and trackers',
      body: 'Spend less time closing junk and more time on what you actually opened.',
      icon: 'shield',
      tone: 'violet',
    },
    {
      title: 'Built for digital cash',
      body: 'Send money as easily as sending a message, without asking anyone for permission first.',
      icon: 'wallet',
      tone: 'rose',
    },
  ];

  let current = $state(0);
  let dragOffset = $state(0);
  let isDragging = $state(false);
  let releaseAssets = $state<DownloadAsset[]>([fallbackAsset]);
  let primaryDownload = $state<DownloadAsset>(fallbackAsset);
  let showAllDownloads = $state(false);
  let autoInterval: ReturnType<typeof setInterval> | undefined;
  let isHovered = $state(false);
  let hasFocusWithin = $state(false);
  let viewportEl: HTMLDivElement | null = null;

  const axisLockThresholdPx = 8;
  const swipeThresholdRatio = 0.25;
  const minSwipeDistancePx = 24;
  const velocityThresholdPxPerMs = 0.35;

  let dragStartX = 0;
  let dragStartY = 0;
  let dragLastX = 0;
  let dragLastAt = 0;
  let velocityX = 0;
  let dragAxis: 'unknown' | 'horizontal' | 'vertical' = 'unknown';

  function go(index: number) {
    current = (index + screenshots.length) % screenshots.length;
    startAuto();
  }

  function prev() {
    go(current - 1);
  }

  function next() {
    go(current + 1);
  }

  function startAuto() {
    stopAuto();
    if (screenshots.length < 2 || isHovered || hasFocusWithin) return;
    autoInterval = setInterval(() => {
      current = (current + 1) % screenshots.length;
    }, 5000);
  }

  function stopAuto() {
    if (autoInterval) clearInterval(autoInterval);
    autoInterval = undefined;
  }

  function clearDragState() {
    dragStartX = 0;
    dragStartY = 0;
    dragLastX = 0;
    dragLastAt = 0;
    velocityX = 0;
    dragAxis = 'unknown';
  }

  function beginDrag(x: number, y: number) {
    isDragging = true;
    dragOffset = 0;
    clearDragState();
    dragStartX = x;
    dragStartY = y;
    dragLastX = x;
    dragLastAt = performance.now();
    stopAuto();
  }

  function finishDrag() {
    if (!isDragging) return;

    isDragging = false;

    const absDistance = Math.abs(dragOffset);
    const contentWidth = viewportEl?.clientWidth ?? 1;
    const swipeThreshold = Math.max(minSwipeDistancePx, contentWidth * swipeThresholdRatio);
    const isQuickSwipe = Math.abs(velocityX) > velocityThresholdPxPerMs && absDistance > minSwipeDistancePx;
    const shouldNavigate = dragAxis === 'horizontal' && (absDistance > swipeThreshold || isQuickSwipe);

    let direction: 'prev' | 'next' = dragOffset > 0 ? 'prev' : 'next';
    if (isQuickSwipe) {
      direction = velocityX > 0 ? 'prev' : 'next';
    }

    dragOffset = 0;
    clearDragState();

    if (shouldNavigate) {
      if (direction === 'prev') {
        prev();
      } else {
        next();
      }
      return;
    }

    startAuto();
  }

  function onPointerDown(event: PointerEvent) {
    if (screenshots.length < 2) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    viewportEl?.setPointerCapture(event.pointerId);
    beginDrag(event.clientX, event.clientY);
  }

  function onPointerMove(event: PointerEvent) {
    if (!isDragging) return;

    const deltaX = event.clientX - dragStartX;
    const deltaY = event.clientY - dragStartY;

    if (
      dragAxis === 'unknown' &&
      (Math.abs(deltaX) > axisLockThresholdPx || Math.abs(deltaY) > axisLockThresholdPx)
    ) {
      dragAxis = Math.abs(deltaX) > Math.abs(deltaY) ? 'horizontal' : 'vertical';
    }

    if (dragAxis !== 'horizontal') return;

    event.preventDefault();
    dragOffset = deltaX;

    const now = performance.now();
    const dt = now - dragLastAt;
    if (dt > 0) {
      velocityX = (event.clientX - dragLastX) / dt;
    }
    dragLastX = event.clientX;
    dragLastAt = now;
  }

  function onPointerUp(event: PointerEvent) {
    if (viewportEl?.hasPointerCapture(event.pointerId)) {
      viewportEl.releasePointerCapture(event.pointerId);
    }
    finishDrag();
  }

  function onPointerCancel(event: PointerEvent) {
    if (viewportEl?.hasPointerCapture(event.pointerId)) {
      viewportEl.releasePointerCapture(event.pointerId);
    }
    finishDrag();
  }

  function onGalleryMouseEnter() {
    isHovered = true;
    stopAuto();
  }

  function onGalleryMouseLeave() {
    isHovered = false;
    startAuto();
  }

  function onGalleryFocusIn() {
    hasFocusWithin = true;
    stopAuto();
  }

  function onGalleryFocusOut(event: FocusEvent) {
    const currentTarget = event.currentTarget;
    const relatedTarget = event.relatedTarget;
    if (
      currentTarget instanceof HTMLElement &&
      relatedTarget instanceof Node &&
      currentTarget.contains(relatedTarget)
    ) {
      return;
    }
    hasFocusWithin = false;
    startAuto();
  }

  function formatSize(size: number): string {
    if (!Number.isFinite(size) || size <= 0) {
      return '';
    }

    return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  }

  function isDownloadableReleaseAsset(name: string): boolean {
    return (
      /macos-arm64(?:-app)?\.zip$/i.test(name) ||
      /windows-(x64|arm64)-setup\.exe$/i.test(name) ||
      /linux-(x86_64|aarch64|arm64)\.(AppImage|deb)$/i.test(name) ||
      /android-arm64\.apk$/i.test(name)
    );
  }

  function describeAsset(name: string): Omit<DownloadAsset, 'name' | 'href' | 'size' | 'sizeLabel'> {
    if (/macos-arm64(?:-app)?\.zip$/i.test(name)) {
      return {
        label: 'Mac (Apple Silicon)',
        ctaLabel: 'Download for Mac',
        platform: 'mac',
        arch: 'arm64',
        priority: 50,
        variantKey: 'mac-arm64-zip',
      };
    }

    if (/windows-x64-setup\.exe$/i.test(name)) {
      return {
        label: 'Windows',
        ctaLabel: 'Download for Windows',
        platform: 'windows',
        arch: 'x64',
        priority: 40,
        variantKey: 'windows-x64-exe',
      };
    }

    if (/windows-arm64-setup\.exe$/i.test(name)) {
      return {
        label: 'Windows (ARM)',
        ctaLabel: 'Download for Windows',
        platform: 'windows',
        arch: 'arm64',
        priority: 39,
        variantKey: 'windows-arm64-exe',
      };
    }

    if (/android-arm64\.apk$/i.test(name)) {
      return {
        label: 'Android',
        ctaLabel: 'Download for Android',
        platform: 'android',
        arch: 'arm64',
        priority: 45,
        variantKey: 'android-arm64-apk',
      };
    }

    if (/linux-x86_64\.AppImage$/i.test(name)) {
      return {
        label: 'Linux (portable AppImage)',
        ctaLabel: 'Download for Linux',
        platform: 'linux',
        arch: 'x64',
        priority: 35,
        variantKey: 'linux-x64-appimage',
      };
    }

    if (/(linux-aarch64|linux-arm64)\.AppImage$/i.test(name)) {
      return {
        label: 'Linux (portable AppImage, ARM)',
        ctaLabel: 'Download for Linux',
        platform: 'linux',
        arch: 'arm64',
        priority: 34,
        variantKey: 'linux-arm64-appimage',
      };
    }

    if (/linux-x86_64\.deb$/i.test(name)) {
      return {
        label: 'Linux (Debian/Ubuntu)',
        ctaLabel: 'Download for Linux',
        platform: 'linux',
        arch: 'x64',
        priority: 33,
        variantKey: 'linux-x64-deb',
      };
    }

    if (/(linux-aarch64|linux-arm64)\.deb$/i.test(name)) {
      return {
        label: 'Linux (Debian/Ubuntu, ARM)',
        ctaLabel: 'Download for Linux',
        platform: 'linux',
        arch: 'arm64',
        priority: 32,
        variantKey: 'linux-arm64-deb',
      };
    }

    return {
      label: name,
      ctaLabel: 'Download',
      platform: 'unknown',
      arch: 'unknown',
      priority: 0,
      variantKey: `name:${name.toLowerCase()}`,
    };
  }

  function buildDownloadAsset(name: string, href: string, size: number): DownloadAsset {
    const described = describeAsset(name);
    return {
      name,
      href,
      size,
      sizeLabel: formatSize(size),
      ...described,
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
        : platformSource.includes('android')
          ? 'android'
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

  function dedupeAssets(assets: DownloadAsset[]) {
    const deduped = new Map<string, DownloadAsset>();
    for (const asset of assets) {
      if (!deduped.has(asset.variantKey)) {
        deduped.set(asset.variantKey, asset);
      }
    }
    return [...deduped.values()];
  }

  function syncPrimaryDownload(assets: DownloadAsset[]) {
    const sorted = sortAssets(assets);
    primaryDownload = sorted[0] ?? fallbackAsset;
  }

  onMount(() => {
    let cancelled = false;

    async function loadReleaseAssets() {
      try {
        const response = await fetch(releaseManifestUrl, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Release manifest request failed with ${response.status}`);
        }

        const manifest = await response.json() as {
          assets?: ReleaseManifestAsset[];
        };

        const manifestAssets = (manifest.assets ?? [])
          .filter((asset) => isDownloadableReleaseAsset(asset.name))
          .map((asset) =>
            buildDownloadAsset(
              asset.name,
              `${releaseBaseUrl}/${asset.path}`,
              asset.size ?? asset.size_bytes ?? 0,
            ));

        const assets = dedupeAssets(manifestAssets);
        if (!cancelled && assets.length > 0) {
          releaseAssets = assets;
          syncPrimaryDownload(assets);
        }
      } catch (error) {
        console.warn('[browser-site] failed to load htree release manifest', error);
      }
    }

    void loadReleaseAssets();

    return () => {
      cancelled = true;
    };
  });

  $effect(() => {
    startAuto();
    return () => {
      stopAuto();
    };
  });
</script>

<div class="site-shell">
  <main class="content">
    <section class="hero">
      <div class="copy">
        <p class="brand">
          <img class="brand-mark" src={`${baseUrl}iris-mark.png`} alt="" width="18" height="18" />
          <span class="brand-text">
            <span class="brand-name">iris</span>
            <span class="brand-product">browser</span>
          </span>
        </p>
        <h1>A better browser for websites, apps, and files.</h1>
        <p class="lede">
          Iris keeps useful things working offline, helps you share directly with people nearby,
          blocks ads and trackers, and is built for simple digital cash. One browser can do more
          than open tabs.
        </p>

        <div class="actions">
          <a class="button primary" href={primaryDownload.href}>
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M12 4v10m0 0 4-4m-4 4-4-4M5 18h14"
                fill="none"
                stroke="currentColor"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
              />
            </svg>
            <span>{primaryDownload.ctaLabel}</span>
          </a>
          {#if releaseAssets.length > 1}
            <button
              type="button"
              class="button secondary"
              aria-expanded={showAllDownloads}
              onclick={() => (showAllDownloads = !showAllDownloads)}
            >
              {showAllDownloads ? 'Hide downloads' : 'Other downloads'}
            </button>
          {/if}
        </div>

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

      <!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions -->
      <div
        class="gallery"
        role="region"
        aria-label="Screenshots"
        tabindex="0"
        onmouseenter={onGalleryMouseEnter}
        onmouseleave={onGalleryMouseLeave}
        onfocusin={onGalleryFocusIn}
        onfocusout={onGalleryFocusOut}
        onkeydown={(event) => {
          if (event.key === 'ArrowLeft') {
            prev();
            event.preventDefault();
          } else if (event.key === 'ArrowRight') {
            next();
            event.preventDefault();
          }
        }}
      >
        <div class="stage">
          <div
            bind:this={viewportEl}
            class="viewport"
            role="group"
            aria-label="Screenshot slides"
            style="touch-action: pan-y pinch-zoom;"
            onpointerdown={onPointerDown}
            onpointermove={onPointerMove}
            onpointerup={onPointerUp}
            onpointercancel={onPointerCancel}
          >
            <div
              class="track"
              style={`transform: translateX(calc(-${current * 100}% + ${dragOffset}px)); transition: ${isDragging ? 'none' : 'transform 400ms ease-in-out'};`}
            >
              {#each screenshots as screenshot, index}
                <div class="slide">
                  <img
                    class="hero-shot"
                    src={screenshot.src}
                    alt={screenshot.alt}
                    width="2800"
                    height="1892"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    draggable="false"
                  />
                </div>
              {/each}
            </div>
          </div>

          <div class="gallery-nav">
            <button type="button" class="nav-button" onclick={prev} aria-label="Previous screenshot">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M14.5 5.5 8 12l6.5 6.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
            </button>
            <button type="button" class="nav-button" onclick={next} aria-label="Next screenshot">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M9.5 5.5 16 12l-6.5 6.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                />
              </svg>
            </button>
          </div>
        </div>

        <div class="caption">
          <p class="caption-title">{screenshots[current].title}</p>
          <p class="caption-body">{screenshots[current].body}</p>
        </div>

        <div class="dots" aria-label="Choose screenshot">
          {#each screenshots as _, index}
            <button
              type="button"
              class:active={index === current}
              class="dot"
              aria-label={`Show screenshot ${index + 1}`}
              aria-pressed={index === current}
              onclick={() => go(index)}
            ></button>
          {/each}
        </div>
      </div>
    </section>

    <section class="benefits" aria-label="What Iris Browser helps with">
      {#each benefits as item}
        <article class="benefit">
          <div class="benefit-head">
            <span class={`benefit-icon ${item.tone}`} aria-hidden="true">
              {#if item.icon === 'globe'}
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 0c2.6 2.3 4 5.7 4 10s-1.4 7.7-4 10c-2.6-2.3-4-5.7-4-10s1.4-7.7 4-10Zm-8 10h16M12 2v20"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                  />
                </svg>
              {:else if item.icon === 'download'}
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 4v9m0 0 3.5-3.5M12 13 8.5 9.5M5 18h14"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                  />
                </svg>
              {:else if item.icon === 'bookmark'}
                <svg viewBox="0 0 24 24">
                  <path
                    d="M7 4.5A1.5 1.5 0 0 1 8.5 3h7A1.5 1.5 0 0 1 17 4.5V20l-5-3-5 3V4.5Z"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                  />
                </svg>
              {:else if item.icon === 'wifi'}
                <svg viewBox="0 0 24 24">
                  <path
                    d="M3.5 9.5a13 13 0 0 1 17 0M6.5 12.5a8.6 8.6 0 0 1 11 0M9.8 15.8a4 4 0 0 1 4.4 0M12 19h.01"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                  />
                </svg>
              {:else if item.icon === 'shield'}
                <svg viewBox="0 0 24 24">
                  <path
                    d="M12 3.5 18 6v5.2c0 4.1-2.5 7.3-6 9.3-3.5-2-6-5.2-6-9.3V6l6-2.5Zm-2.2 8.2 1.6 1.6 3.3-3.6"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                  />
                </svg>
              {:else}
                <svg viewBox="0 0 24 24">
                  <path
                    d="M7 7.5h10a1.5 1.5 0 0 1 1.5 1.5v7A1.5 1.5 0 0 1 17 17.5H7A1.5 1.5 0 0 1 5.5 16V9A1.5 1.5 0 0 1 7 7.5Zm2-2.5V4.5A1.5 1.5 0 0 1 10.5 3h3A1.5 1.5 0 0 1 15 4.5V5"
                    fill="none"
                    stroke="currentColor"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="1.8"
                  />
                </svg>
              {/if}
            </span>
            <h2>{item.title}</h2>
          </div>
          <p>{item.body}</p>
        </article>
      {/each}
    </section>

    <section class="portable-apps" aria-labelledby="portable-apps-title">
      <div class="portable-apps-copy">
        <h2 id="portable-apps-title">One place for sites, apps, and files</h2>
        <p>
          Iris is meant to handle the everyday mix of reading, watching, chatting, saving, paying,
          and sharing without scattering your stuff across app stores and locked-down services.
        </p>
      </div>

      <div class="portable-app-grid">
        <article class="portable-app-item">
          <div class="portable-app-head">
            <span class="portable-app-icon blue" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M9 10V7.8A4.8 4.8 0 0 1 18.4 6M7.5 10h8a2 2 0 0 1 2 2v5.5a2 2 0 0 1-2 2h-8a2 2 0 0 1-2-2V12a2 2 0 0 1 2-2Zm9-6 2 2"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                />
              </svg>
            </span>
            <h3>Less lock-in</h3>
          </div>
          <p>
            Your stuff should not live or die inside one company's account system.
          </p>
        </article>

        <article class="portable-app-item">
          <div class="portable-app-head">
            <span class="portable-app-icon green" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M7 4.5h7l3 3V19a1.5 1.5 0 0 1-1.5 1.5h-8A1.5 1.5 0 0 1 6 19V6A1.5 1.5 0 0 1 7.5 4.5H7Zm5 0V8h4M9 13l2 2 4-4"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                />
              </svg>
            </span>
            <h3>Still there tomorrow</h3>
          </div>
          <p>
            What you save can keep opening even when a service changes, breaks, or disappears.
          </p>
        </article>

        <article class="portable-app-item">
          <div class="portable-app-head">
            <span class="portable-app-icon violet" aria-hidden="true">
              <svg viewBox="0 0 24 24">
                <path
                  d="M15 5h4v4M9 15l10-10M5 8.5V18a1 1 0 0 0 1 1h9.5"
                  fill="none"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.8"
                />
              </svg>
            </span>
            <h3>Share without the maze</h3>
          </div>
          <p>
            You can pass things around more directly, without approval gates or mandatory platform
            logins.
          </p>
        </article>
      </div>
    </section>
  </main>

  <footer class="footer">
    <div class="footer-copy">
      <p class="footer-kicker">Free software</p>
      <p class="footer-body">
        Iris is open source under the MIT license and built to serve its users, not monetize them.
      </p>
      <p class="footer-meta">
        <a href={hashtreeDevUrl}>Built on Hashtree</a>
      </p>
    </div>
    <a class="footer-link" href={sourceUrl}>Browse the source</a>
  </footer>
</div>

<style>
  :global(:root) {
    color-scheme: light dark;
    --page-bg: #f5f5f5;
    --surface: rgba(255, 255, 255, 0.72);
    --surface-strong: rgba(255, 255, 255, 0.96);
    --surface-soft: rgba(255, 255, 255, 0.54);
    --border: rgba(26, 26, 26, 0.09);
    --text-1: #1a1a1a;
    --text-2: #555555;
    --text-3: #888888;
    --brand-accent: #916dfe;
    --accent: var(--brand-accent);
    --accent-strong: #7647fe;
    --accent-soft: rgba(145, 109, 254, 0.18);
    --page-glow: rgba(145, 109, 254, 0.1);
    --shadow: 0 18px 48px rgba(15, 15, 15, 0.08);
  }

  @media (prefers-color-scheme: dark) {
    :global(:root) {
      --page-bg: #0f0f0f;
      --surface: rgba(24, 24, 24, 0.74);
      --surface-strong: rgba(24, 24, 24, 0.96);
      --surface-soft: rgba(24, 24, 24, 0.54);
      --border: rgba(255, 255, 255, 0.09);
      --text-1: #ffffff;
      --text-2: #aaaaaa;
      --text-3: #7f7f7f;
      --brand-accent: #916dfe;
      --accent: var(--brand-accent);
      --accent-strong: #a788ff;
      --accent-soft: rgba(145, 109, 254, 0.24);
      --page-glow: rgba(145, 109, 254, 0.12);
      --shadow: 0 24px 60px rgba(0, 0, 0, 0.2);
    }
  }

  :global(html, body, #app) {
    min-height: 100%;
  }

  :global(body) {
    margin: 0;
    background:
      radial-gradient(circle at top center, var(--page-glow), transparent 38%),
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
    padding: 2rem 0 2.6rem;
  }

  .hero {
    display: grid;
    grid-template-columns: minmax(0, 0.88fr) minmax(360px, 1.12fr);
    gap: 2rem;
    align-items: start;
  }

  .copy {
    max-width: 32rem;
  }

  h1 {
    margin: 0;
    font-size: clamp(3.1rem, 6vw, 5.3rem);
    line-height: 0.93;
    letter-spacing: -0.05em;
    text-wrap: balance;
  }

  .brand {
    display: inline-flex;
    align-items: center;
    gap: 0.56rem;
    margin: 0 0 1.22rem;
    color: var(--text-1);
    font-size: 1.72rem;
    font-weight: 700;
    letter-spacing: -0.02em;
    line-height: 1.1;
  }

  .brand-text {
    display: inline-flex;
    align-items: baseline;
    gap: 0.3rem;
  }

  .brand-name {
    font-weight: inherit;
  }

  .brand-product {
    color: var(--brand-accent);
    font-size: 1em;
    font-weight: inherit;
    letter-spacing: inherit;
  }

  .brand-mark {
    width: 2rem;
    height: 2rem;
    border-radius: 0.5rem;
    flex: none;
  }

  .lede {
    margin: 1.15rem 0 0;
    max-width: 31rem;
    color: var(--text-2);
    font-size: 1.08rem;
    line-height: 1.62;
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin: 1.65rem 0 0;
  }

  .button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.45rem;
    min-height: 2.35rem;
    padding: 0.5rem 0.82rem;
    border-radius: 999px;
    border: 1px solid var(--border);
    font-size: 0.9rem;
    font-weight: 600;
    letter-spacing: 0.01em;
    text-decoration: none;
    cursor: pointer;
    transition:
      transform 140ms ease,
      border-color 140ms ease,
      background-color 140ms ease,
      color 140ms ease;
  }

  .button:hover {
    transform: translateY(-1px);
  }

  .button svg {
    width: 1rem;
    height: 1rem;
    flex: none;
  }

  .button.primary {
    border-color: transparent;
    background: var(--accent);
    color: #fff;
    box-shadow: 0 10px 28px rgba(145, 109, 254, 0.24);
  }

  .button.primary:hover {
    background: var(--accent-strong);
  }

  .button.secondary {
    background: transparent;
    color: var(--text-1);
  }

  .download-list {
    display: grid;
    gap: 0.75rem;
    margin-top: 1rem;
    padding: 0.95rem;
    border: 1px solid var(--border);
    border-radius: 1.2rem;
    background: var(--surface);
    backdrop-filter: blur(14px);
  }

  .download-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.82rem 0.95rem;
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

  .gallery {
    padding: 0;
    outline: none;
  }

  .gallery:focus-visible {
    box-shadow: 0 0 0 2px var(--accent-soft);
  }

  .stage {
    position: relative;
    user-select: none;
  }

  .viewport {
    overflow: hidden;
    border-radius: 1.45rem;
    aspect-ratio: 1400 / 946;
  }

  .track {
    display: flex;
    will-change: transform;
  }

  .slide {
    width: 100%;
    flex: 0 0 100%;
    aspect-ratio: 1400 / 946;
  }

  .hero-shot {
    display: block;
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: transparent;
  }

  .gallery-nav {
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0 0.8rem;
    pointer-events: none;
  }

  .nav-button {
    pointer-events: auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.6rem;
    height: 2.6rem;
    border: 1px solid var(--border);
    border-radius: 999px;
    background: color-mix(in srgb, var(--surface-strong) 82%, transparent);
    color: var(--text-1);
    cursor: pointer;
    backdrop-filter: blur(12px);
    box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
    transition:
      transform 140ms ease,
      background-color 140ms ease,
      border-color 140ms ease;
  }

  .nav-button:hover {
    transform: translateY(-1px);
    background: color-mix(in srgb, var(--surface-strong) 92%, transparent);
  }

  .nav-button svg {
    width: 1.2rem;
    height: 1.2rem;
  }

  .caption {
    padding: 0.95rem 0.1rem 0;
    min-height: 5.4rem;
  }

  .caption-title {
    margin: 0;
    font-size: 1.2rem;
    font-weight: 700;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  .caption-body {
    margin: 0.42rem 0 0;
    color: var(--text-2);
    font-size: 0.96rem;
    line-height: 1.55;
  }

  .dots {
    display: flex;
    justify-content: center;
    gap: 0.55rem;
    margin-top: 1rem;
  }

  .dot {
    width: 0.62rem;
    height: 0.62rem;
    padding: 0;
    border: 1px solid transparent;
    border-radius: 999px;
    background: color-mix(in srgb, var(--text-2) 24%, transparent);
    cursor: pointer;
    transition:
      border-color 140ms ease,
      background-color 140ms ease;
  }

  .dot:hover {
    background: color-mix(in srgb, var(--text-2) 42%, transparent);
  }

  .dot.active {
    border-color: var(--accent);
    background: var(--accent);
  }

  .benefits {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.95rem;
    margin-top: 2.35rem;
  }

  .benefit {
    padding: 1.18rem 1.16rem 1.14rem;
    border-radius: 1.2rem;
    background: color-mix(in srgb, var(--surface-strong) 90%, transparent);
  }

  .benefit-head {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.82rem;
  }

  .benefit-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 0.88rem;
    flex: none;
  }

  .benefit-icon svg {
    width: 1.16rem;
    height: 1.16rem;
  }

  .benefit-icon.blue {
    color: #2d6df6;
    background: rgba(45, 109, 246, 0.14);
  }

  .benefit-icon.green {
    color: #1d9159;
    background: rgba(29, 145, 89, 0.14);
  }

  .benefit-icon.teal {
    color: #0d8c9f;
    background: rgba(13, 140, 159, 0.14);
  }

  .benefit-icon.amber {
    color: #b06a00;
    background: rgba(225, 151, 33, 0.16);
  }

  .benefit-icon.violet {
    color: #7052d7;
    background: rgba(112, 82, 215, 0.14);
  }

  .benefit-icon.rose {
    color: #c64a6d;
    background: rgba(198, 74, 109, 0.14);
  }

  @media (prefers-color-scheme: dark) {
    .benefit-icon.blue {
      color: #8bb3ff;
      background: rgba(119, 170, 255, 0.16);
    }

    .benefit-icon.green {
      color: #73d29c;
      background: rgba(67, 177, 117, 0.18);
    }

    .benefit-icon.teal {
      color: #78d7e3;
      background: rgba(74, 181, 195, 0.18);
    }

    .benefit-icon.amber {
      color: #f0bb61;
      background: rgba(240, 187, 97, 0.16);
    }

    .benefit-icon.violet {
      color: #b79dff;
      background: rgba(183, 157, 255, 0.16);
    }

    .benefit-icon.rose {
      color: #ff97b2;
      background: rgba(255, 151, 178, 0.16);
    }
  }

  .benefit h2 {
    margin: 0;
    font-size: 1.02rem;
    line-height: 1.32;
    letter-spacing: -0.02em;
  }

  .benefit p {
    margin: 0.62rem 0 0;
    color: var(--text-2);
    font-size: 0.94rem;
    line-height: 1.55;
  }

  @media (max-width: 1080px) {
    .benefits {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }

  .footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 1.25rem;
    padding: 0 0 1.5rem;
  }

  .portable-apps {
    margin-top: 2.4rem;
    padding: 1.35rem 1.25rem;
    border-radius: 1.45rem;
    background:
      radial-gradient(circle at top right, color-mix(in srgb, var(--accent-soft) 68%, transparent), transparent 42%),
      color-mix(in srgb, var(--surface) 92%, transparent);
    backdrop-filter: blur(16px);
  }

  .portable-apps-copy {
    max-width: 44rem;
  }

  .portable-apps-copy h2 {
    margin: 0;
    font-size: clamp(1.5rem, 3vw, 2rem);
    line-height: 1.05;
    letter-spacing: -0.03em;
  }

  .portable-apps-copy p {
    margin: 0.65rem 0 0;
    color: var(--text-2);
    font-size: 1rem;
    line-height: 1.6;
  }

  .portable-app-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 0.85rem;
    margin-top: 1.2rem;
  }

  .portable-app-item {
    padding: 1rem;
    border-radius: 1.05rem;
    background: color-mix(in srgb, var(--surface-strong) 90%, transparent);
  }

  .portable-app-head {
    display: flex;
    align-items: center;
    gap: 0.72rem;
  }

  .portable-app-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 2.2rem;
    height: 2.2rem;
    border-radius: 0.82rem;
    flex: none;
  }

  .portable-app-icon svg {
    width: 1.1rem;
    height: 1.1rem;
  }

  .portable-app-icon.blue {
    color: #2d6df6;
    background: rgba(45, 109, 246, 0.14);
  }

  .portable-app-icon.green {
    color: #1d9159;
    background: rgba(29, 145, 89, 0.14);
  }

  .portable-app-icon.violet {
    color: #7052d7;
    background: rgba(112, 82, 215, 0.14);
  }

  .portable-app-item h3 {
    margin: 0;
    font-size: 0.98rem;
    line-height: 1.35;
    letter-spacing: -0.02em;
  }

  .portable-app-item p {
    margin: 0.45rem 0 0;
    color: var(--text-2);
    font-size: 0.93rem;
    line-height: 1.55;
  }

  @media (prefers-color-scheme: dark) {
    .portable-app-icon.blue {
      color: #8bb3ff;
      background: rgba(119, 170, 255, 0.16);
    }

    .portable-app-icon.green {
      color: #73d29c;
      background: rgba(67, 177, 117, 0.18);
    }

    .portable-app-icon.violet {
      color: #b79dff;
      background: rgba(183, 157, 255, 0.16);
    }
  }

  .footer-copy {
    max-width: 33rem;
  }

  .footer-kicker {
    margin: 0;
    color: var(--text-3);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.11em;
    text-transform: uppercase;
  }

  .footer-body {
    margin: 0.4rem 0 0;
    color: var(--text-2);
    font-size: 0.95rem;
    line-height: 1.55;
  }

  .footer-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin: 0.55rem 0 0;
    color: var(--text-3);
    font-size: 0.84rem;
    line-height: 1.45;
  }

  .footer-meta a {
    color: inherit;
    text-decoration: none;
  }

  .footer-meta a:hover {
    color: var(--text-1);
  }

  .footer-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    justify-self: end;
    min-height: 2.25rem;
    padding: 0.5rem 0.82rem;
    border-radius: 999px;
    background: color-mix(in srgb, var(--surface) 88%, transparent);
    color: var(--text-2);
    text-decoration: none;
    font-size: 0.95rem;
    font-weight: 500;
  }

  .footer-link:hover {
    color: var(--text-1);
  }

  @media (max-width: 940px) {
    .content {
      padding-top: 1.2rem;
    }

    .hero {
      grid-template-columns: 1fr;
      gap: 1.5rem;
    }

    .copy {
      max-width: none;
    }

    .benefits {
      grid-template-columns: 1fr;
      margin-top: 1.9rem;
    }

    .portable-app-grid {
      grid-template-columns: 1fr;
    }

    .footer {
      grid-template-columns: 1fr;
      gap: 0.85rem;
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

    .gallery-nav {
      padding: 0 0.45rem;
    }

    .nav-button {
      width: 2.35rem;
      height: 2.35rem;
    }

    .caption {
      padding-top: 0.8rem;
      min-height: 6.2rem;
    }

    .caption-title {
      font-size: 1.08rem;
    }

    .benefit {
      padding: 0.95rem 1rem;
    }

    .portable-apps {
      margin-top: 2rem;
      padding: 1.1rem 1rem;
    }

    .footer {
      justify-content: flex-start;
      padding-bottom: 1.2rem;
    }
  }
</style>

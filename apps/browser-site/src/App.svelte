<script lang="ts">
  const capabilities = [
    {
      title: 'Open distributed apps',
      body:
        'Load htree:// trees with real per-root browser origins instead of flattening every app onto one localhost bucket.',
    },
    {
      title: 'Permissioned NIP-07',
      body:
        'Sites can ask for your pubkey or signatures and Iris keeps the decision explicit: allow this session, always allow, deny, or block.',
    },
    {
      title: 'Install the web you want',
      body:
        'Regular HTTPS PWAs and distributed apps can live in the same shell, with an address bar, favorites, history, and install flows.',
    },
    {
      title: 'Local daemon included',
      body:
        'The browser ships with its own hashtree daemon so transport, caching, and mesh-friendly paths stay close to the app instead of a remote service.',
    },
  ];

  const examples = [
    'Jumble asking Iris for NIP-07 access with a visible permission prompt',
    'Iris Files, Docs, Maps, Video, and Git loaded over htree://',
    'Normal web apps installed beside distributed apps in one launcher',
  ];
</script>

<svelte:head>
  <title>browser.iris.to | Iris Browser</title>
  <meta
    name="description"
    content="A native browser shell for htree apps, installed PWAs, and explicit NIP-07 permissions."
  />
</svelte:head>

<div class="site-shell">
  <div class="backdrop backdrop-a"></div>
  <div class="backdrop backdrop-b"></div>

  <header class="topbar">
    <a class="brand" href="https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/iris-browser">
      Iris Browser
    </a>
    <a class="toplink" href="#capabilities">What it enables</a>
  </header>

  <main class="content">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">browser.iris.to</p>
        <h1>
          The native browser for <span>htree</span> and Nostr apps.
        </h1>
        <p class="lede">
          Open ordinary web apps and distributed trees in one place, keep origin boundaries intact,
          and let sites request NIP-07 access with explicit permissions.
        </p>

        <div class="actions">
          <a
            class="button button-primary"
            href="https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/iris-browser"
          >
            Source
          </a>
          <a class="button button-secondary" href="#capabilities">
            What it enables
          </a>
        </div>

        <div class="pill-row">
          <span class="pill">htree:// origins</span>
          <span class="pill">NIP-07 permissions</span>
          <span class="pill">Installed PWAs</span>
          <span class="pill">Embedded daemon</span>
        </div>
      </div>

      <figure class="hero-shot">
        <div class="shot-frame">
          <img
            src="/browser-jumble-nip07.jpg"
            alt="Iris Browser showing the Jumble app with a NIP-07 permission prompt"
          />
        </div>
        <figcaption>
          Latest desktop build browsing Jumble with Iris handling a NIP-07 permission prompt.
        </figcaption>
      </figure>
    </section>

    <section id="capabilities" class="capability-grid">
      {#each capabilities as capability}
        <article class="capability-card">
          <p class="card-kicker">{capability.title}</p>
          <p>{capability.body}</p>
        </article>
      {/each}
    </section>

    <section class="examples-panel">
      <div class="examples-copy">
        <p class="section-label">What it enables</p>
        <h2>One shell for the web you use and the web you publish.</h2>
        <p>
          Iris is meant for distributed apps that still deserve normal browser ergonomics:
          navigation, history, installs, permissions, and proper storage boundaries.
        </p>
      </div>

      <div class="example-list">
        {#each examples as example}
          <div class="example-item">
            <span class="example-dot"></span>
            <span>{example}</span>
          </div>
        {/each}
      </div>
    </section>
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
    width: min(1080px, calc(100% - 2rem));
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
    padding: 3.5rem 0 4rem;
  }

  .hero {
    display: grid;
    gap: 2.5rem;
    align-items: start;
    grid-template-columns: minmax(0, 0.84fr) minmax(440px, 1.16fr);
  }

  .hero-copy,
  .hero-shot {
    min-width: 0;
  }

  .hero-copy,
  .hero-shot,
  .capability-card,
  .examples-panel {
    animation: rise 0.7s ease-out both;
  }

  .hero-shot {
    animation-delay: 0.12s;
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
  p {
    margin: 0;
  }

  h1 {
    max-width: 12ch;
    color: #23170f;
    font-size: clamp(2.9rem, 6.4vw, 4.85rem);
    line-height: 0.94;
    letter-spacing: -0.055em;
  }

  h1 span {
    color: #8d451c;
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

  .hero-shot {
    margin: 0;
    justify-self: end;
    width: min(100%, 42rem);
  }

  .shot-frame {
    position: relative;
    overflow: hidden;
    border-radius: 1.8rem;
    background: rgba(15, 10, 7, 0.92);
    padding: 0.85rem;
    box-shadow:
      0 24px 70px rgba(53, 31, 8, 0.24),
      inset 0 0 0 1px rgba(255, 255, 255, 0.08);
  }

  .shot-frame::before {
    content: '';
    position: absolute;
    inset: 0.85rem;
    border-radius: 1.2rem;
    border: 1px solid rgba(255, 255, 255, 0.08);
    pointer-events: none;
  }

  .shot-frame img {
    width: 100%;
    border-radius: 1.2rem;
    box-shadow: 0 12px 36px rgba(0, 0, 0, 0.34);
  }

  figcaption {
    margin-top: 0.9rem;
    color: rgba(36, 24, 15, 0.7);
    font-size: 0.92rem;
    line-height: 1.5;
  }

  .capability-grid {
    display: grid;
    gap: 1rem;
    margin-top: 3rem;
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }

  .capability-card {
    padding: 1.35rem;
    border-radius: 1.4rem;
    background: rgba(255, 255, 255, 0.74);
    border: 1px solid rgba(36, 24, 15, 0.08);
    box-shadow: 0 18px 40px rgba(98, 64, 21, 0.08);
  }

  .capability-card p:last-child {
    color: rgba(36, 24, 15, 0.76);
    line-height: 1.6;
  }

  .examples-panel {
    display: grid;
    gap: 2rem;
    align-items: start;
    margin-top: 1.2rem;
    padding: 1.5rem;
    border-radius: 1.8rem;
    background: rgba(22, 17, 11, 0.96);
    color: #f8efe2;
    grid-template-columns: minmax(0, 1fr) minmax(0, 0.9fr);
  }

  .examples-copy .section-label {
    color: #ffbe7a;
  }

  .examples-copy h2 {
    max-width: 14ch;
    font-size: clamp(2rem, 4vw, 3.15rem);
    line-height: 1;
    letter-spacing: -0.05em;
  }

  .examples-copy p:last-child {
    max-width: 34rem;
    margin-top: 1rem;
    color: rgba(248, 239, 226, 0.76);
    line-height: 1.65;
  }

  .example-list {
    display: grid;
    gap: 0.9rem;
  }

  .example-item {
    display: flex;
    align-items: flex-start;
    gap: 0.8rem;
    padding: 1rem 1.05rem;
    border-radius: 1.1rem;
    background: rgba(255, 255, 255, 0.06);
    color: rgba(248, 239, 226, 0.88);
    line-height: 1.55;
  }

  .example-dot {
    width: 0.65rem;
    height: 0.65rem;
    margin-top: 0.45rem;
    border-radius: 999px;
    background: linear-gradient(135deg, #ff9c63, #ffd17d);
    flex: 0 0 auto;
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

  @media (max-width: 980px) {
    .hero,
    .examples-panel,
    .capability-grid {
      grid-template-columns: 1fr;
    }

    h1,
    .examples-copy h2 {
      max-width: none;
    }

    .hero-shot {
      justify-self: stretch;
      width: 100%;
    }
  }

  @media (max-width: 720px) {
    .topbar {
      padding-top: 1rem;
    }

    .content {
      padding-top: 2.6rem;
    }

    .hero {
      gap: 1.8rem;
    }

    h1 {
      font-size: clamp(2.55rem, 13vw, 4rem);
    }

    .examples-panel,
    .capability-card {
      border-radius: 1.3rem;
    }

    .shot-frame {
      padding: 0.65rem;
      border-radius: 1.4rem;
    }
  }
</style>

<script lang="ts">
  const baseUrl = import.meta.env.BASE_URL;

  const benefits = [
    {
      title: 'Feels familiar',
      body:
        'Keep the basics you expect: an address bar, favorites, history, and a simple place to start.',
    },
    {
      title: 'Shared links stay useful',
      body:
        'Open something a friend sends without feeling like you are one refresh away from a missing page.',
    },
    {
      title: 'Your account stays yours',
      body:
        'If a site wants to use your account, Iris asks first so nothing happens quietly.',
    },
  ];

  const gallery = [
    {
      src: `${baseUrl}browser-home.jpg`,
      alt: 'Iris Browser home screen with favorites and suggestions',
      kicker: 'Start from home',
      title: 'Keep the things you use close',
      body: 'Favorites, suggestions, and recent places stay in one calm starting point.',
    },
    {
      src: `${baseUrl}browser-jumble.jpg`,
      alt: 'Iris Browser opening the Jumble app',
      kicker: 'Open what people share',
      title: 'A shared link can feel like a real app',
      body: 'Move from a message to a working app without the usual dead-end feeling.',
    },
    {
      src: `${baseUrl}browser-permission.jpg`,
      alt: 'Iris Browser showing an account access prompt',
      kicker: 'Stay in charge',
      title: 'Account access is always explicit',
      body: 'When a site wants to use your account, Iris puts the choice in front of you.',
    },
  ];

  const promises = [
    'Use ordinary websites and web apps',
    'Keep shared links easier to reopen later',
    'See clear account prompts before anything happens',
  ];
</script>

<svelte:head>
  <title>browser.iris.to | Iris Browser</title>
  <meta
    name="description"
    content="A simple browser for everyday websites, shared links that keep working longer, and clear account prompts."
  />
</svelte:head>

<div class="site-shell">
  <div class="backdrop backdrop-a"></div>
  <div class="backdrop backdrop-b"></div>

  <header class="topbar">
    <a class="brand" href="https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/iris-browser">
      Iris Browser
    </a>
    <a class="toplink" href="#gallery">Screenshots</a>
  </header>

  <main class="content">
    <section class="hero">
      <div class="hero-copy">
        <p class="eyebrow">browser.iris.to</p>
        <h1>Share a link. Open it later. Still get where you meant to go.</h1>
        <p class="lede">
          Iris Browser feels familiar on purpose. Use everyday websites, keep your favorites
          close, and open what people share without running into so many dead ends.
        </p>

        <div class="actions">
          <a
            class="button button-primary"
            href="https://git.iris.to/#/npub1xdhnr9mrv47kkrn95k6cwecearydeh8e895990n3acntwvmgk2dsdeeycm/iris-browser"
          >
            Source
          </a>
          <a class="button button-secondary" href="#gallery">See screenshots</a>
        </div>

        <div class="pill-row">
          {#each promises as promise}
            <span class="pill">{promise}</span>
          {/each}
        </div>
      </div>
    </section>

    <section class="capability-grid">
      {#each benefits as benefit}
        <article class="capability-card">
          <p class="card-kicker">{benefit.title}</p>
          <p>{benefit.body}</p>
        </article>
      {/each}
    </section>

    <section id="gallery" class="gallery-section">
      <div class="gallery-copy">
        <p class="section-label">In practice</p>
        <h2>Sharing should still work.</h2>
        <p>
          Open the web you know, keep your usual places close, and make a link from someone else
          less likely to turn into a dead end.
        </p>
      </div>

      <div class="gallery-grid">
        {#each gallery as shot}
          <figure class="gallery-card">
            <div class="shot-frame">
              <img src={shot.src} alt={shot.alt} />
            </div>
            <figcaption>
              <p class="card-kicker">{shot.kicker}</p>
              <h3>{shot.title}</h3>
              <p>{shot.body}</p>
            </figcaption>
          </figure>
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

  .hero-copy,
  .capability-card,
  .gallery-copy,
  .gallery-card {
    animation: rise 0.7s ease-out both;
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
    max-width: 13ch;
    color: #23170f;
    font-size: clamp(2.9rem, 6.4vw, 4.85rem);
    line-height: 0.94;
    letter-spacing: -0.055em;
  }

  h2 {
    max-width: 11ch;
    font-size: clamp(2rem, 4vw, 3.15rem);
    line-height: 1;
    letter-spacing: -0.05em;
  }

  h3 {
    font-size: 1.32rem;
    line-height: 1.15;
    letter-spacing: -0.03em;
  }

  .lede {
    max-width: 40rem;
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

  .capability-grid {
    display: grid;
    gap: 1rem;
    margin-top: 2.4rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .capability-card {
    padding: 1.35rem;
    border-radius: 1.4rem;
    background: rgba(255, 255, 255, 0.74);
    border: 1px solid rgba(36, 24, 15, 0.08);
    box-shadow: 0 18px 40px rgba(98, 64, 21, 0.08);
  }

  .capability-card p:last-child,
  .gallery-copy p:last-child,
  figcaption p:last-child {
    color: rgba(36, 24, 15, 0.76);
    line-height: 1.6;
  }

  .gallery-section {
    margin-top: 3.2rem;
  }

  .gallery-copy p:last-child {
    max-width: 38rem;
    margin-top: 1rem;
  }

  .gallery-grid {
    display: grid;
    gap: 1rem;
    margin-top: 1.6rem;
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .gallery-card {
    margin: 0;
    padding: 0.9rem;
    border-radius: 1.6rem;
    background: rgba(255, 255, 255, 0.72);
    border: 1px solid rgba(36, 24, 15, 0.08);
    box-shadow: 0 18px 40px rgba(98, 64, 21, 0.08);
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
    margin-top: 1rem;
  }

  figcaption h3 {
    max-width: 14ch;
  }

  figcaption p:last-child {
    margin-top: 0.7rem;
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
    .capability-grid,
    .gallery-grid {
      grid-template-columns: 1fr;
    }

    h1,
    h2,
    figcaption h3 {
      max-width: none;
    }
  }

  @media (max-width: 720px) {
    .topbar {
      padding-top: 1rem;
    }

    .content {
      padding-top: 2.6rem;
    }

    h1 {
      font-size: clamp(2.55rem, 13vw, 4rem);
    }

    .capability-card,
    .gallery-card {
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

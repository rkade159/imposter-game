<script>
  // Root component. For now it just renders the placeholder home screen
  // so we can verify the toolchain end-to-end. Once the screen-state
  // machine lands, this will switch on a store value from src/lib/game-state.js
  // and render one of the screens under src/screens/.
</script>

<main class="app-shell">
  <header class="header">
    <h1>Imposter Game</h1>
    <p class="tagline">Pass-and-play party game.</p>
  </header>

  <section class="placeholder">
    <p>Scaffold ready.</p>
    <p class="muted">
      Setup, reveal, pass, discussion and results screens will be wired up in
      upcoming briefs.
    </p>
  </section>
</main>

<style>
  /* Component-scoped layout for the placeholder home screen.
     Uses the design-system tokens defined in app.css. */
  .app-shell {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .header h1 {
    margin: 0 0 8px;
    font-size: clamp(2rem, 5vw, 2.75rem);
  }

  .tagline {
    margin: 0;
    color: var(--text-muted);
  }

  .placeholder {
    background-color: var(--bg-surface);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .placeholder p {
    margin: 0;
  }

  .muted {
    color: var(--text-muted);
  }
</style>

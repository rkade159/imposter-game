<script>
  // Root component. Mounts the global header and the active screen.
  // For now there's only one screen (setup), so we render it directly.
  // When more screens land, this is where a {#if}/switch on a `screen`
  // field added to gameState will pick between SetupScreen, RevealScreen,
  // PassScreen, DiscussionScreen, and ResultsScreen.
  import SetupScreen from './screens/SetupScreen.svelte';
</script>

<main class="app-shell">
  <header class="header">
    <h1>Imposter Game</h1>
    <p class="tagline">Pass-and-play party game.</p>
  </header>

  <SetupScreen />
</main>

<style>
  /* App shell — caps content width, centres on desktop, keeps mobile padding. */
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
</style>

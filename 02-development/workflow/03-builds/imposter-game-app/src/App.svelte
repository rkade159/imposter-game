<script>
  // Root component. Renders the global header and the active screen.
  // Which screen shows is driven by gameState.screen — the app is a small
  // screen-based state machine: setup → reveal ⇄ pass → discussion → results.
  import { gameState } from './lib/game-state.js';
  import SetupScreen from './screens/SetupScreen.svelte';
  import RevealScreen from './screens/RevealScreen.svelte';
  import PassScreen from './screens/PassScreen.svelte';
  import DiscussionScreen from './screens/DiscussionScreen.svelte';
  import ResultsScreen from './screens/ResultsScreen.svelte';
</script>

<main class="app-shell">
  <header class="header">
    <h1>Imposter Game</h1>
    <p class="tagline">Pass-and-play party game.</p>
  </header>

  <!-- One screen at a time, selected by the current game phase. -->
  {#if $gameState.screen === 'setup'}
    <SetupScreen />
  {:else if $gameState.screen === 'reveal'}
    <RevealScreen />
  {:else if $gameState.screen === 'pass'}
    <PassScreen />
  {:else if $gameState.screen === 'discussion'}
    <DiscussionScreen />
  {:else if $gameState.screen === 'results'}
    <ResultsScreen />
  {/if}
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

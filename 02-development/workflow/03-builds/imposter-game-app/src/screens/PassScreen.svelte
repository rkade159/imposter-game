<script>
  // Pass screen: the privacy buffer between two players' reveals. It shows no
  // role information — only a prompt to hand the device to the next player. The
  // NEXT player is the one who taps "ready", so a role only ever appears after
  // that player's own deliberate action.
  import { gameState, nextPlayer } from '../lib/game-state.js';

  // The player about to reveal next is revealIndex + 1 (0-based), shown 1-based.
  $: nextPlayerNumber = $gameState.revealIndex + 2;
</script>

<section class="screen">
  <p class="prompt">Pass to Player {nextPlayerNumber}</p>
  <p class="sub">Don't peek — hand the device over first.</p>
  <button type="button" class="ready-btn" on:click={nextPlayer}>
    I'm Player {nextPlayerNumber} — tap when ready
  </button>
</section>

<style>
  /* Centred hand-off layout — uses the dark-theme tokens from app.css. */
  .screen {
    background-color: var(--bg-surface);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    text-align: center;
  }

  .prompt {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .sub {
    margin: 0;
    color: var(--text-muted);
  }

  .ready-btn {
    width: 100%;
    min-height: 48px;
    border-radius: 8px;
    border: none;
    background-color: var(--accent);
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }
</style>

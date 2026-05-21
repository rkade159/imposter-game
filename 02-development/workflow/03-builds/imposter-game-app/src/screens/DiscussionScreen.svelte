<script>
  // Discussion screen — still a placeholder until the discussion feature is
  // built (real implementation: a timer + voting affordance). It already
  // carries the "Play again" button, which the full screen will keep, so a
  // finished round can return to setup without a page refresh.
  import { resetGame } from '../lib/game-state.js';
</script>

<section class="screen">
  <p class="title">Discussion</p>
  <p class="sub">Everyone has seen their role — discuss and find the impostor!</p>
  <p class="placeholder">(Discussion timer &amp; voting coming soon.)</p>
  <button type="button" class="play-again-btn" on:click={resetGame}>
    Play again
  </button>
</section>

<style>
  /* Centred layout — uses the dark-theme tokens from app.css. */
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

  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  .sub {
    margin: 0;
    color: var(--text);
  }

  .placeholder {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  .play-again-btn {
    min-height: 48px;
    padding: 0 24px;
    border-radius: 8px;
    border: none;
    background-color: var(--accent);
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }
</style>

<script>
  // Reveal screen: shows one player their role for the round. The device is
  // passed around, so this screen starts FACE-DOWN — the role only appears once
  // the current player taps to reveal. The advance button hides the card and
  // moves on (pass to the next player, or straight to discussion for the last
  // player). Because the router recreates this component for each player, the
  // `revealed` flip resets to face-down every turn.
  import { gameState, revealDone } from '../lib/game-state.js';

  // Face-down until this player taps to reveal. Local to this mount.
  let revealed = false;

  // The current player's role and their 1-based position in the round.
  $: role = $gameState.roles[$gameState.revealIndex];
  $: isImpostor = role?.isImpostor === true;
  $: playerNumber = $gameState.revealIndex + 1;
  $: isLastPlayer = $gameState.revealIndex === $gameState.playerCount - 1;
  // Last player has no one to pass to — they continue to discussion instead.
  $: advanceLabel = isLastPlayer
    ? 'Hide & continue to discussion'
    : 'Hide & pass to next player';
</script>

<section class="screen">
  <p class="player-tag">Player {playerNumber} of {$gameState.playerCount}</p>

  {#if !revealed}
    <!-- Face-down: nothing about the role is shown until this player taps. -->
    <button type="button" class="reveal-btn" on:click={() => (revealed = true)}>
      Tap to reveal your role
    </button>
  {:else if isImpostor}
    <!-- Impostor: never shown the secret word. -->
    <div class="card card-impostor">
      <p class="card-title">🎭 YOU ARE THE IMPOSTER!</p>
      <p class="card-sub">
        You don't know the word. Try to blend in during discussion!
      </p>
    </div>
    <button type="button" class="advance-btn" on:click={revealDone}>
      {advanceLabel}
    </button>
  {:else}
    <!-- Crewmate: shown the secret word. -->
    <div class="card card-crewmate">
      <p class="card-title">📝 THE WORD IS:</p>
      <p class="card-word">"{$gameState.word}"</p>
      <p class="card-sub">You know the word. Help identify the imposters!</p>
    </div>
    <button type="button" class="advance-btn" on:click={revealDone}>
      {advanceLabel}
    </button>
  {/if}
</section>

<style>
  /* Centred card layout — uses the dark-theme tokens from app.css. */
  .screen {
    background-color: var(--bg-surface);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    align-items: center;
    text-align: center;
  }

  .player-tag {
    margin: 0;
    color: var(--text-muted);
    font-weight: 600;
  }

  /* Face-down prompt — a large tap target so it's hard to miss on hand-off. */
  .reveal-btn {
    width: 100%;
    min-height: 120px;
    border-radius: 12px;
    border: 2px dashed var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-size: 1.1rem;
    font-weight: 600;
    cursor: pointer;
  }

  /* Revealed role card. Colour distinguishes the two outcomes using existing
     tokens — accent for the crewmate, error red for the impostor. */
  .card {
    width: 100%;
    border-radius: 12px;
    padding: 24px;
    background-color: var(--bg);
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .card-crewmate {
    border: 2px solid var(--accent);
  }

  .card-crewmate .card-title,
  .card-crewmate .card-word {
    color: var(--accent);
  }

  .card-impostor {
    border: 2px solid var(--error);
  }

  .card-impostor .card-title {
    color: var(--error);
  }

  .card-title {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
  }

  .card-word {
    margin: 0;
    font-size: 1.8rem;
    font-weight: 700;
  }

  .card-sub {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  /* Advance to the pass screen (or discussion for the last player). */
  .advance-btn {
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

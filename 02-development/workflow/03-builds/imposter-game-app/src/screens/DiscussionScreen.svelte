<script>
  // Discussion screen — the table talks it out, then reveals the answer. Tapping
  // "Reveal the imposter(s)" does NOT jump straight to the results: it asks for a
  // confirmation first, so an accidental tap can't spoil the round for everyone.
  // (A future Settings menu will let players turn that confirmation off, which is
  // why it's kept to a single, easily-gated `confirming` flag.)
  import { gameState, showResults } from '../lib/game-state.js';

  // false = the discuss view with the reveal button; true = the "are you sure?"
  // confirmation. Confirm → results; cancel → back to the discuss view.
  let confirming = false;

  // Pluralise the reveal button to match this round's imposter count.
  $: revealLabel =
    $gameState.impostorCount > 1 ? 'Reveal the imposters' : 'Reveal the imposter';
</script>

<section class="screen">
  {#if !confirming}
    <!-- Discuss view: no role or word info — just the prompt and the reveal trigger. -->
    <p class="title">Discussion</p>
    <p class="sub">Everyone has seen their role — discuss and find the imposter!</p>
    <button type="button" class="reveal-btn" on:click={() => (confirming = true)}>
      {revealLabel}
    </button>
  {:else}
    <!-- Confirmation guard before the answer is shown. -->
    <p class="title">Reveal the answer?</p>
    <p class="sub">This ends the round and shows who the imposter was.</p>
    <button type="button" class="reveal-btn" on:click={showResults}>
      Yes, reveal
    </button>
    <button type="button" class="cancel-btn" on:click={() => (confirming = false)}>
      Cancel
    </button>
  {/if}
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

  /* Primary action — reveal / confirm. */
  .reveal-btn {
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

  /* Secondary action — back out of the confirmation. */
  .cancel-btn {
    min-height: 48px;
    padding: 0 24px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: transparent;
    color: var(--text);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }
</style>

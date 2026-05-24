<script>
  // Results screen — the payoff. Reveals who the imposter(s) were (by player
  // number, matching the reveal/pass numbering) and what the secret word was,
  // then offers a settings-preserving "Play again".
  import { gameState, playAgain } from '../lib/game-state.js';

  // Join names readably: "Player 3" / "Player 2 and Player 5" /
  // "Player 1, Player 4 and Player 6".
  function formatList(items) {
    if (items.length <= 1) return items[0] ?? '';
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }

  // roles[i] belongs to player i (0-based); players are shown 1-based. Collect
  // the player numbers of everyone who was an imposter this round.
  $: impostorNumbers = $gameState.roles
    .map((role, i) => ({ isImpostor: role.isImpostor, number: i + 1 }))
    .filter((entry) => entry.isImpostor)
    .map((entry) => entry.number);

  // Pluralise the reveal line to match the count.
  $: impostorList = formatList(impostorNumbers.map((n) => `Player ${n}`));
  $: heading =
    impostorNumbers.length > 1
      ? `The imposters were ${impostorList}`
      : `The imposter was ${impostorList}`;

  // The hint the imposter(s) saw this round, surfaced for everyone. Trimmed to a
  // string; an empty result (null / blank / non-string) falls back to an error
  // message instead of a hint.
  $: hint = typeof $gameState.hint === 'string' ? $gameState.hint.trim() : '';
</script>

<section class="screen">
  <p class="title">Results</p>
  <p class="impostors">{heading}</p>
  <p class="word">The word was "{$gameState.word}"</p>
  {#if hint}
    <p class="hint">The imposter's hint was "{hint}"</p>
  {:else}
    <p class="hint">An error occurred.</p>
  {/if}
  <button type="button" class="play-again-btn" on:click={playAgain}>
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

  /* The reveal line — emphasised with the error token, echoing the imposter
     card on the reveal screen. */
  .impostors {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--error);
  }

  .word {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text);
  }

  /* The imposter's hint (or the error fallback), shown to everyone at the end. */
  .hint {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-muted);
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

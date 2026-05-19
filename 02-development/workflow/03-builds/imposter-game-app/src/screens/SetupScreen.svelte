<script>
  // Setup screen: the user picks how many people are playing, then presses
  // Start. Two modes driven by $gameState.playerCount:
  //   - editing (playerCount === null): input + stepper + Start button
  //   - ready   (playerCount !== null): confirmation + Change settings
  import { gameState, resetGame } from '../lib/game-state.js';
  import { MIN_PLAYERS, MAX_PLAYERS, DEFAULT_PLAYERS } from '../lib/config.js';

  // The in-flight value the user is editing, before it's committed to
  // gameState. Number when valid; null when the input is empty so Start
  // can be disabled in that case.
  let working = DEFAULT_PLAYERS;

  // Derived validity — enables Start only when the value is a whole number
  // inside the allowed range. Out-of-range typed values disable Start as
  // feedback, rather than silently clamping what the user typed.
  $: isValid = typeof working === 'number'
    && Number.isInteger(working)
    && working >= MIN_PLAYERS
    && working <= MAX_PLAYERS;

  // Input handler — empty field becomes null, otherwise parse to int.
  function onInput(event) {
    const raw = event.target.value;
    if (raw === '') {
      working = null;
      return;
    }
    const n = Number(raw);
    working = Number.isFinite(n) ? Math.trunc(n) : null;
  }

  function decrement() {
    if (typeof working !== 'number' || working <= MIN_PLAYERS) return;
    working -= 1;
  }

  function increment() {
    if (typeof working !== 'number' || working >= MAX_PLAYERS) return;
    working += 1;
  }

  // Commit the validated count into the global store.
  function start() {
    if (!isValid) return;
    gameState.set({ playerCount: working });
  }

  // Reset the game and restore the default working value so the input
  // doesn't reappear blank on the next visit.
  function changeSettings() {
    resetGame();
    working = DEFAULT_PLAYERS;
  }
</script>

{#if $gameState.playerCount === null}
  <!-- Editing mode: pick player count, then press Start. -->
  <section class="screen">
    <label class="field-label" for="player-count">Total Players:</label>

    <div class="stepper">
      <button
        type="button"
        class="step-btn"
        aria-label="Decrease player count"
        on:click={decrement}
        disabled={typeof working !== 'number' || working <= MIN_PLAYERS}
      >−</button>
      <input
        id="player-count"
        class="count-input"
        type="number"
        inputmode="numeric"
        min={MIN_PLAYERS}
        max={MAX_PLAYERS}
        value={working ?? ''}
        on:input={onInput}
      />
      <button
        type="button"
        class="step-btn"
        aria-label="Increase player count"
        on:click={increment}
        disabled={typeof working !== 'number' || working >= MAX_PLAYERS}
      >+</button>
    </div>

    <button
      type="button"
      class="start-btn"
      on:click={start}
      disabled={!isValid}
    >Start Game</button>
  </section>
{:else}
  <!-- Ready mode: state committed; waiting for the reveal-screen feature. -->
  <section class="screen ready">
    <p class="confirmation">
      Game ready for {$gameState.playerCount} players — reveal screen coming soon.
    </p>
    <button
      type="button"
      class="secondary-btn"
      on:click={changeSettings}
    >Change settings</button>
  </section>
{/if}

<style>
  /* Setup screen layout — uses the dark-theme tokens from app.css. */
  .screen {
    background-color: var(--bg-surface);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .field-label {
    font-weight: 600;
    font-size: 1rem;
  }

  /* Row of: −  [input]  + */
  .stepper {
    display: flex;
    align-items: stretch;
    gap: 8px;
  }

  .step-btn {
    flex: 0 0 auto;
    min-width: 48px;
    min-height: 48px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-size: 1.5rem;
    line-height: 1;
    cursor: pointer;
  }

  .step-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .count-input {
    flex: 1 1 auto;
    min-width: 0;
    min-height: 48px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-size: 1.25rem;
    text-align: center;
    padding: 0 12px;
    /* Hide the browser's spinner — we provide our own stepper buttons. */
    -moz-appearance: textfield;
  }

  .count-input::-webkit-outer-spin-button,
  .count-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  /* Primary action — start the game. */
  .start-btn {
    min-height: 48px;
    border-radius: 8px;
    border: none;
    background-color: var(--accent);
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }

  .start-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .confirmation {
    margin: 0;
    color: var(--text);
    font-size: 1rem;
  }

  /* Secondary action — back to editing. */
  .secondary-btn {
    align-self: flex-start;
    min-height: 40px;
    padding: 0 16px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: transparent;
    color: var(--text);
    cursor: pointer;
  }
</style>

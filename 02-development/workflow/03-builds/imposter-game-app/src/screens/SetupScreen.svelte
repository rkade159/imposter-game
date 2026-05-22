<script>
  // Setup screen: the user picks player count, impostor count, and a word
  // source, then presses Start. Start picks the secret word and hands the full
  // config to startGame(), which generates the roles and routes to the reveal
  // loop — so this screen no longer has a "ready" mode of its own.
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { gameState, startGame } from '../lib/game-state.js';
  import {
    MIN_PLAYERS,
    MAX_PLAYERS,
    DEFAULT_PLAYERS,
    MIN_IMPOSTORS,
    DEFAULT_IMPOSTORS,
  } from '../lib/config.js';
  import {
    WORD_SOURCES,
    DEFAULT_WORD_SOURCE,
    loadWords,
    pickWord,
  } from '../lib/word-source.js';
  import Stepper from '../components/Stepper.svelte';

  // In-flight values the user is editing, before Start commits them. Each is a
  // number when valid, or null when its field is empty (which disables Start).
  //
  // Seed from gameState when it already holds a round's config: that's the
  // "Play again" case, where the same group's settings should come back
  // pre-filled. On a fresh load those fields are null, so fall back to the
  // defaults. Read once here — the routing ladder remounts this screen on every
  // return to setup, so a fresh read each time is correct.
  const saved = get(gameState);
  let players = saved.playerCount ?? DEFAULT_PLAYERS;
  let impostors = saved.impostorCount ?? DEFAULT_IMPOSTORS;
  let selectedSource = saved.wordSource ?? DEFAULT_WORD_SOURCE;

  // Word-loading state. `words` holds the loaded list; `loadStatus` drives the
  // confirmation / error message and gates Start.
  let words = [];
  let loadStatus = 'loading'; // 'loading' | 'loaded' | 'error'

  // Max impostors depends on the live player count — always leave at least one
  // crewmate. Falls back to MIN_IMPOSTORS while the player field is empty.
  $: maxImpostors = typeof players === 'number' ? players - 1 : MIN_IMPOSTORS;

  // Keep impostors in range when the player count drops. Guarded so it only
  // assigns when actually out of range — otherwise it would loop forever.
  $: if (typeof impostors === 'number' && impostors > maxImpostors) {
    impostors = maxImpostors;
  }

  // The selected source's metadata, for the "Loaded N <countNoun>" text.
  $: currentSource = WORD_SOURCES.find((source) => source.id === selectedSource);

  // Per-field validity plus the overall Start gate. Out-of-range typed values
  // disable Start as feedback rather than being silently clamped.
  $: playersValid =
    typeof players === 'number' &&
    Number.isInteger(players) &&
    players >= MIN_PLAYERS &&
    players <= MAX_PLAYERS;
  $: impostorsValid =
    typeof impostors === 'number' &&
    Number.isInteger(impostors) &&
    impostors >= MIN_IMPOSTORS &&
    impostors <= maxImpostors;
  $: canStart =
    playersValid && impostorsValid && loadStatus === 'loaded' && words.length > 0;

  // Fetch a source's word list, tracking status so the UI can react. A failed
  // fetch leaves loadStatus 'error' and words empty, which keeps Start disabled.
  async function load(sourceId) {
    loadStatus = 'loading';
    words = [];
    try {
      words = await loadWords(sourceId);
      loadStatus = 'loaded';
    } catch (error) {
      loadStatus = 'error';
    }
  }

  // Auto-load on first render — the source is labelled "Auto-loaded".
  onMount(() => load(selectedSource));

  // Start the round: pick the secret word now and hand the full config to
  // startGame(), which builds the roles and moves to the first reveal. Guarded
  // by canStart, so the committed state is always complete and in range.
  function start() {
    if (!canStart) return;
    startGame({
      playerCount: players,
      impostorCount: impostors,
      wordSource: selectedSource,
      word: pickWord(words),
    });
  }
</script>

<!-- Pick counts + word source, then press Start to begin the round. -->
<section class="screen">
  <Stepper
    label="Total Players:"
    id="player-count"
    bind:value={players}
    min={MIN_PLAYERS}
    max={MAX_PLAYERS}
  />

  <Stepper
    label="Number of Imposters:"
    id="impostor-count"
    bind:value={impostors}
    min={MIN_IMPOSTORS}
    max={maxImpostors}
  />

  <div class="source-field">
    <label class="field-label" for="word-source">Word Source:</label>
    <select
      id="word-source"
      class="source-select"
      bind:value={selectedSource}
      on:change={() => load(selectedSource)}
    >
      {#each WORD_SOURCES as source}
        <option value={source.id}>{source.label}</option>
      {/each}
    </select>
  </div>

  <!-- Word-load feedback: confirmation, an interim note, or an error. -->
  {#if loadStatus === 'loaded'}
    <p class="load-chip">✓ Loaded {words.length} {currentSource.countNoun}</p>
  {:else if loadStatus === 'loading'}
    <p class="load-status">Loading {currentSource.countNoun}…</p>
  {:else}
    <p class="load-error">
      Couldn't load {currentSource.countNoun}. Check your connection and try again.
    </p>
  {/if}

  <button type="button" class="start-btn" on:click={start} disabled={!canStart}>
    Start Game
  </button>
</section>

<style>
  /* Setup screen layout — uses the dark-theme tokens from app.css.
     Stepper styles live in components/Stepper.svelte. */
  .screen {
    background-color: var(--bg-surface);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Label for the word-source dropdown (matches the steppers' label style). */
  .field-label {
    font-weight: 600;
    font-size: 1rem;
  }

  .source-field {
    display: flex;
    flex-direction: column;
  }

  .source-select {
    margin-top: 8px;
    min-height: 48px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-size: 1rem;
    padding: 0 12px;
  }

  /* Word-load feedback messages. */
  .load-chip,
  .load-status,
  .load-error {
    margin: 0;
    font-size: 0.95rem;
  }

  .load-chip {
    color: var(--success);
  }

  .load-status {
    color: var(--text-muted);
  }

  .load-error {
    color: var(--error);
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
</style>

<script>
  // Custom List builder: lets the user hand-pick which words from the Common
  // Nouns deck are eligible for this round. Rendered in place of the setup form
  // (the same in-place-panel pattern SettingsScreen uses), so SetupScreen stays
  // mounted underneath and its in-flight form state survives the round trip.
  //
  // IMPORTANT: only each entry's `word` is ever shown here — never its `hint`.
  // The hint is the imposter's clue; showing it in the picker would spoil the
  // game. The selection is round-scoped: it lives only in this component and the
  // subset handed back via onConfirm, never in gameState or localStorage.
  import { onMount } from 'svelte';
  import { loadWords } from '../lib/word-source.js';

  // Words the user already chose (their `word` strings), so re-opening the
  // builder within the same setup session pre-highlights them.
  export let initialSelection = [];
  // Called with the chosen { word, hint }[] subset when the user confirms.
  export let onConfirm;
  // Called when the user leaves without confirming (Back/Exit).
  export let onExit;

  // The full Common Nouns deck ({ word, hint }[]) and its load state. The custom
  // source has no file of its own, so we load the real Common Nouns deck and let
  // the user carve a subset out of it.
  let all = [];
  let status = 'loading'; // 'loading' | 'loaded' | 'error'

  // Live search text and the set of selected words. A Set of `word` strings keeps
  // membership checks cheap; selection is independent of the search filter.
  let query = '';
  let selected = new Set(initialSelection);

  onMount(async () => {
    try {
      all = await loadWords('common-nouns');
      status = 'loaded';
    } catch (error) {
      status = 'error';
    }
  });

  // Case-insensitive substring filter on the word. Empty query shows everything.
  $: q = query.trim().toLowerCase();
  $: filtered = q ? all.filter((e) => e.word.toLowerCase().includes(q)) : all;

  // Drives the Confirm label/gate. Reassigning `selected` on toggle (below) makes
  // this — and the per-chip highlight — recompute.
  $: count = selected.size;

  // Toggle a word in/out of the selection. Reassigning `selected` to itself is
  // what tells Svelte the Set changed (it doesn't track in-place mutation).
  function toggle(word) {
    if (selected.has(word)) {
      selected.delete(word);
    } else {
      selected.add(word);
    }
    selected = selected;
  }

  // Build the chosen subset (keeping each entry's hint so the round still has one)
  // and hand it back. Guarded by the disabled Confirm button, so count is ≥ 1.
  function confirm() {
    if (count === 0) return;
    onConfirm(all.filter((e) => selected.has(e.word)));
  }
</script>

<section class="screen">
  <h2 class="title">Custom Word List</h2>
  <p class="subtitle">
    Tap words to add them to this round's list, then Confirm. Only the words you
    pick can be the secret word.
  </p>

  <!-- Search filters the list live; it never changes what's selected. -->
  <input
    class="search"
    type="text"
    autocomplete="off"
    placeholder="Search words…"
    aria-label="Search words"
    bind:value={query}
  />

  <!-- Scrollable word area. Shows the full deck once loaded; the inline
       "Word not available." message replaces the chips when a search matches
       nothing (it is NOT a popup). -->
  <div class="word-area">
    {#if status === 'loading'}
      <p class="state-msg muted">Loading words…</p>
    {:else if status === 'error'}
      <p class="state-msg error">
        Couldn't load the words. Check your connection and try again.
      </p>
    {:else if filtered.length === 0}
      <p class="state-msg muted">Word not available.</p>
    {:else}
      <div class="chips">
        {#each filtered as entry (entry.word)}
          <!-- Only entry.word is rendered — never entry.hint. -->
          <button
            type="button"
            class="chip"
            class:selected={selected.has(entry.word)}
            aria-pressed={selected.has(entry.word)}
            on:click={() => toggle(entry.word)}
          >
            {entry.word}
          </button>
        {/each}
      </div>
    {/if}
  </div>

  <!-- Always-visible action bar: Back/Exit (never commits) on the left, Confirm
       (disabled until ≥1 word selected) anchored bottom-right. -->
  <div class="actions">
    <button type="button" class="back-btn" on:click={onExit}>
      ← Back
    </button>
    <button
      type="button"
      class="confirm-btn"
      on:click={confirm}
      disabled={count === 0}
    >
      Confirm{count > 0 ? ` (${count})` : ''}
    </button>
  </div>
</section>

<style>
  /* Matches the setup/settings card look — dark surface, rounded, stacked. */
  .screen {
    background-color: var(--bg-surface);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
  }

  .subtitle {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  /* Search field — matches the setup screen's input look. */
  .search {
    min-height: 48px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-size: 1rem;
    padding: 0 12px;
  }

  /* Scrollable word area: the long list scrolls VERTICALLY so the page never
     grows a horizontal scrollbar and the action bar stays reachable. */
  .word-area {
    max-height: 50vh;
    overflow-y: auto;
    border-radius: 8px;
  }

  .state-msg {
    margin: 0;
    padding: 16px 4px;
    font-size: 0.95rem;
  }

  .muted {
    color: var(--text-muted);
  }

  .error {
    color: var(--error);
  }

  /* Tappable word chips: wrap to fill the width. */
  .chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .chip {
    min-height: 44px;
    padding: 0 14px;
    border-radius: 999px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-size: 0.95rem;
    cursor: pointer;
  }

  /* Selected = included in the round. Uses the existing accent token (no role
     info on this screen, so the highlight is not a tell, and it stays correct
     under Grayscale mode). */
  .chip.selected {
    background-color: var(--accent);
    border-color: var(--accent);
    color: white;
    font-weight: 600;
  }

  /* Always-visible action bar: Back left, Confirm pinned bottom-right. */
  .actions {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
  }

  .back-btn {
    min-height: 48px;
    padding: 0 20px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }

  /* Primary action — confirm the subset. Mirrors the Start button styling. */
  .confirm-btn {
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

  .confirm-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>

<script>
  // Reusable labelled dropdown row: [ label + optional description ]  ( ▾ )
  //
  // Companion to Toggle.svelte — the parent owns the chosen value via `bind:value`
  // and passes an `options` list of { id, label }. Built so the Settings screen
  // (and any future setting that's a choice rather than on/off) can drop in a row
  // with one line. Uses a real <select> so it's keyboard- and screen-reader-
  // accessible; styling sits on top via existing tokens.
  export let label;
  export let value; // bound to the selected option's id
  export let options = []; // [{ id, label }]
  export let description = '';
  export let id = undefined;
</script>

<!-- Label/description on the left, dropdown on the right (stacks on narrow rows
     because the text block can wrap). -->
<div class="select-row">
  <span class="select-text">
    <label class="select-label" for={id}>{label}</label>
    {#if description}
      <span class="select-desc">{description}</span>
    {/if}
  </span>

  <select {id} class="select-control" bind:value>
    {#each options as option}
      <option value={option.id}>{option.label}</option>
    {/each}
  </select>
</div>

<style>
  /* One row: text block + dropdown, vertically centred. Uses the dark-theme
     tokens from app.css. */
  .select-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  .select-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .select-label {
    font-weight: 600;
    font-size: 1rem;
  }

  .select-desc {
    color: var(--text-muted);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  /* Matches the word-source dropdown on the setup screen so controls read as one
     set. ≥44px tall for a comfortable tap target. */
  .select-control {
    flex: 0 0 auto;
    max-width: 55%;
    min-height: 44px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-size: 1rem;
    padding: 0 12px;
    cursor: pointer;
  }

  .select-control:focus-visible {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>

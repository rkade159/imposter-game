<script>
  // Reusable labelled number stepper: −  [input]  +
  //
  // Extracted from SetupScreen so both the player-count and impostor-count
  // controls (and any future numeric setting) share one implementation. The
  // parent owns the value via `bind:value` and supplies the bounds; this
  // component only edits the value and disables its buttons at the bounds.
  export let label;
  export let value; // bound number, or null while the input is empty
  export let min;
  export let max;
  export let id = undefined;

  // Empty field → null so the parent can treat it as invalid; otherwise parse
  // to a whole number. Out-of-range typed values are left as-is (the parent
  // disables Start) rather than silently clamping what the user typed.
  function onInput(event) {
    const raw = event.target.value;
    if (raw === '') {
      value = null;
      return;
    }
    const n = Number(raw);
    value = Number.isFinite(n) ? Math.trunc(n) : null;
  }

  function decrement() {
    if (typeof value !== 'number' || value <= min) return;
    value -= 1;
  }

  function increment() {
    if (typeof value !== 'number' || value >= max) return;
    value += 1;
  }
</script>

<!-- One self-contained field: label above its −/input/+ row. -->
<div class="field">
  <label class="field-label" for={id}>{label}</label>

  <div class="stepper">
    <button
      type="button"
      class="step-btn"
      aria-label="Decrease {label}"
      on:click={decrement}
      disabled={typeof value !== 'number' || value <= min}
    >−</button>
    <input
      {id}
      class="count-input"
      type="number"
      inputmode="numeric"
      {min}
      {max}
      value={value ?? ''}
      on:input={onInput}
    />
    <button
      type="button"
      class="step-btn"
      aria-label="Increase {label}"
      on:click={increment}
      disabled={typeof value !== 'number' || value >= max}
    >+</button>
  </div>
</div>

<style>
  /* Shared stepper styles — uses the dark-theme tokens from app.css. */
  .field-label {
    font-weight: 600;
    font-size: 1rem;
  }

  /* Row of: −  [input]  + */
  .stepper {
    display: flex;
    align-items: stretch;
    gap: 8px;
    margin-top: 8px;
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
</style>

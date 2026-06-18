<script>
  // Reusable labelled on/off switch: [ label + optional description ]  ( ●—)
  //
  // Companion to Stepper.svelte — the parent owns the boolean via `bind:value`
  // and this component only flips it. Built so the Settings screen (and any
  // future setting) can drop in a row with one line. Uses a real checkbox with
  // role="switch" so it's keyboard- and screen-reader-accessible; the slider is
  // pure CSS on top.
  export let label;
  export let value = false; // bound boolean
  export let description = '';
  export let id = undefined;
  // When true, the row is greyed out and the switch can't be flipped. Default
  // false so every existing <Toggle> is unaffected. Used for settings that only
  // apply in some configurations (e.g. "Reveal fellow imposters" needs 2+ imposters).
  export let disabled = false;
</script>

<!-- Label/description on the left, switch on the right. `disabled` greys the row
     (see .toggle.is-disabled) and blocks the input. -->
<label class="toggle" class:is-disabled={disabled} for={id}>
  <span class="toggle-text">
    <span class="toggle-label">{label}</span>
    {#if description}
      <span class="toggle-desc">{description}</span>
    {/if}
  </span>

  <span class="switch">
    <input
      {id}
      class="switch-input"
      type="checkbox"
      role="switch"
      bind:checked={value}
      {disabled}
    />
    <span class="switch-track"></span>
    <span class="switch-thumb"></span>
  </span>
</label>

<style>
  /* One row: text block + switch, vertically centred. Uses the dark-theme
     tokens from app.css. */
  .toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    cursor: pointer;
  }

  /* Disabled row: dimmed and non-interactive. The input is also `disabled`, so
     this is purely the visual cue. */
  .toggle.is-disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
  .toggle.is-disabled .switch-input {
    cursor: not-allowed;
  }

  .toggle-text {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .toggle-label {
    font-weight: 600;
    font-size: 1rem;
  }

  .toggle-desc {
    color: var(--text-muted);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  /* Switch: a fixed-size box holding the hidden input, the track, and the thumb
     that slides across it. */
  .switch {
    position: relative;
    flex: 0 0 auto;
    width: 52px;
    height: 30px;
  }

  /* The real control sits on top, invisible but full-size, so taps/clicks and
     focus land on it. */
  .switch-input {
    position: absolute;
    inset: 0;
    margin: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .switch-track {
    position: absolute;
    inset: 0;
    border-radius: 999px;
    background-color: var(--bg);
    border: 1px solid var(--text-muted);
    transition: background-color 0.15s ease, border-color 0.15s ease;
  }

  .switch-thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background-color: var(--text-muted);
    transition: transform 0.15s ease, background-color 0.15s ease;
  }

  /* On state — accent track, white thumb slid to the right. --accent desaturates
     automatically in grayscale mode. */
  .switch-input:checked ~ .switch-track {
    background-color: var(--accent);
    border-color: var(--accent);
  }

  .switch-input:checked ~ .switch-thumb {
    background-color: white;
    transform: translateX(22px);
  }

  /* Keyboard focus ring on the visible track. */
  .switch-input:focus-visible ~ .switch-track {
    outline: 2px solid var(--accent);
    outline-offset: 2px;
  }
</style>

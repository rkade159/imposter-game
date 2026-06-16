<script>
  // Reusable popup dialog: a dim full-screen backdrop with a centred card, an OK
  // button, and its message passed in via the default slot. Drop-in companion to
  // Toggle.svelte / Stepper.svelte — `<Modal onClose={...}>message text</Modal>`.
  //
  // It renders itself into <body> via the `portal` action below. That matters
  // because grayscale mode puts a CSS `filter` on .app-shell, and a `filter` makes
  // its element the containing block for `position: fixed` descendants — so a popup
  // left inside .app-shell would be sized to the centred content column instead of
  // the viewport whenever grayscale was on. Living in <body> keeps it viewport-sized.
  import { onMount } from 'svelte';

  // Called when the dialog is dismissed (OK, backdrop click, or Escape).
  export let onClose;

  // The OK button — focused on open so the dialog is immediately keyboard-ready.
  let okButton;
  onMount(() => okButton?.focus());

  // Escape closes too, matching the backdrop and OK affordances.
  function onKeydown(event) {
    if (event.key === 'Escape') onClose();
  }

  // Move this node to <body> so its fixed backdrop is relative to the viewport and
  // escapes any ancestor `filter` (see the note above). Removed again on destroy.
  function portal(node) {
    document.body.appendChild(node);
    return {
      destroy() {
        if (node.parentNode) node.parentNode.removeChild(node);
      },
    };
  }
</script>

<!-- Escape-to-close works wherever focus currently is. -->
<svelte:window on:keydown={onKeydown} />

<div class="modal-root" use:portal>
  <!-- Backdrop: a real <button> so click-to-dismiss is accessible without a click
       handler on a static element. tabindex=-1 keeps it out of the tab order —
       Esc and the focused OK button are the keyboard dismiss paths. -->
  <button
    type="button"
    class="backdrop"
    aria-label="Close"
    tabindex="-1"
    on:click={onClose}
  ></button>

  <div class="card" role="dialog" aria-modal="true" aria-labelledby="modal-message">
    <p id="modal-message" class="message"><slot /></p>
    <button type="button" class="ok-btn" bind:this={okButton} on:click={onClose}>
      OK
    </button>
  </div>
</div>

<style>
  /* Fixed, viewport-filling layer that centres the card. High z-index so it sits
     above all app content (it's also appended last in <body>). */
  .modal-root {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  /* Dim scrim behind the card. A translucent black is an intentional overlay, not
     a theme colour, so it isn't drawn from a palette token. */
  .backdrop {
    position: absolute;
    inset: 0;
    border: none;
    padding: 0;
    background-color: rgba(0, 0, 0, 0.6);
    cursor: pointer;
  }

  /* The dialog card — same dark surface / rounding as the app's other screens,
     drawn from tokens so it themes consistently. Sits above the backdrop. */
  .card {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 360px;
    background-color: var(--bg-surface);
    color: var(--text);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
    text-align: center;
  }

  .message {
    margin: 0;
    font-size: 1.1rem;
    font-weight: 600;
    line-height: 1.4;
  }

  /* Primary dismiss — matches the app's accent buttons (≥48px tap target). */
  .ok-btn {
    align-self: center;
    min-width: 120px;
    min-height: 48px;
    border-radius: 8px;
    border: none;
    background-color: var(--accent);
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }

  /* The popup lives in <body>, OUTSIDE .app-shell, so the shell's grayscale filter
     doesn't reach it — re-apply the same desaturate here so a popup shown in
     grayscale mode matches the rest of the app (its --bg-surface card would
     otherwise stay navy). The token overrides on :root.grayscale already cover the
     accent button + scrim. */
  :global(:root.grayscale) .modal-root {
    filter: grayscale(1);
  }
</style>

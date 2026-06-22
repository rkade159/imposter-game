<script>
  // Reveal screen: shows one player their role for the round. The device is
  // passed around, so a role only ever appears after the current player's own
  // deliberate action. There are TWO reveal styles, chosen by the persisted
  // "Envelope reveal" setting:
  //
  //   • Original (default): tap a face-down panel to flip it and see the role —
  //     short and snappy.
  //   • Envelope: a closed letter you PRESS AND HOLD to break the seal; the flap
  //     swings open and a note slides out. More suspenseful and tactile.
  //
  // Either way the role content is the same — only the entrance differs. Both use
  // the --accent / --error tokens for the role colours, so Grayscale mode keeps
  // the two roles indistinguishable. Because the router recreates this component
  // for each player, the local state below resets to face-down every turn.
  import { onDestroy } from 'svelte';
  import { gameState, revealDone, displayName } from '../lib/game-state.js';
  import { settings } from '../lib/settings.js';
  import WheelReveal from '../components/WheelReveal.svelte';

  // Which reveal style to use, from the persisted Settings store. Anything other
  // than a style we recognise falls back to the original tap-to-reveal, so an
  // unknown/legacy stored value can never leave the screen blank.
  $: revealStyle = $settings.revealStyle;
  $: useEnvelope = revealStyle === 'envelope';

  // --- Original tap-to-reveal: face-down until this player taps. ---
  let revealed = false;

  // --- Envelope press-and-hold ---
  // How long the player must hold to open the letter. A tunable constant — longer
  // is more suspenseful, shorter is more impatient-friendly.
  const HOLD_MS = 1200;

  // The envelope reveal state machine for this player's turn:
  //   'sealed'  — closed envelope, nothing about the role shown.
  //   'opening' — finger is down; the flap lifts across HOLD_MS as a progress cue.
  //   'opened'  — hold completed; note is out and the advance button appears.
  let phase = 'sealed';
  let holdTimer = null;

  // Begin a hold. Ignored once opened (the reveal is sticky). Captures the pointer
  // so we reliably get the matching release even if the finger drifts a little.
  function startHold(event) {
    if (phase === 'opened') return;
    if (event.pointerId !== undefined && event.currentTarget.setPointerCapture) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (_) {
        // Capture is best-effort; release handlers still fire without it.
      }
    }
    phase = 'opening';
    clearTimeout(holdTimer);
    holdTimer = setTimeout(complete, HOLD_MS);
  }

  // Hold completed: lock the envelope open and show the note + advance button.
  function complete() {
    holdTimer = null;
    phase = 'opened';
  }

  // Finger lifted / pointer left or was cancelled before completion → re-seal and
  // reset the timer, so the next press starts a fresh hold from zero. A no-op once
  // opened, so releasing after the reveal does nothing.
  function cancelHold() {
    if (phase !== 'opening') return;
    clearTimeout(holdTimer);
    holdTimer = null;
    phase = 'sealed';
  }

  // Keyboard parity: holding Space/Enter opens the letter the same way. `repeat`
  // is ignored so the auto-repeat keydown stream doesn't restart the hold, and the
  // page-scroll on Space is suppressed.
  function onKeydown(event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (event.repeat) return;
    event.preventDefault();
    startHold(event);
  }

  function onKeyup(event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    cancelHold();
  }

  // Clear any in-flight hold when the component is torn down (e.g. the player
  // advances mid-hold), so a stray timer can't fire a reveal on the next mount.
  onDestroy(() => clearTimeout(holdTimer));

  // The current player's role and their 1-based position in the round.
  $: role = $gameState.roles[$gameState.revealIndex];
  $: isImpostor = role?.isImpostor === true;
  // The Jester (an optional role): reads the real word like a crewmate but reveals
  // as its own role. isImpostor is false for the jester, so every reveal style must
  // check isJester BEFORE the imposter/crewmate split or it renders as a crewmate.
  $: isJester = role?.isJester === true;
  $: playerNumber = $gameState.revealIndex + 1;
  // The current player's name (or "Player N" fallback) for the progress tag.
  $: playerName = displayName($gameState.names, $gameState.revealIndex);
  $: isLastPlayer = $gameState.revealIndex === $gameState.playerCount - 1;
  // The imposter's hint for the round. Normally the shared round hint, but on a
  // Troll Mode round each player carries their OWN hint on their role (so every
  // player sees a different clue) — prefer that when present. Trimmed to a string;
  // an empty result (null / blank / non-string) means no usable hint, so the card
  // falls back to an error message instead of blocking the game.
  $: hint = (
    typeof role?.hint === 'string'
      ? role.hint
      : typeof $gameState.hint === 'string'
        ? $gameState.hint
        : ''
  ).trim();
  // Whether to show the imposter their hint at all. When the "Imposter hints"
  // setting is off, the imposter sees only "YOU ARE THE IMPOSTER" with no clue —
  // a harder round. Gated here at reveal time (not at hint build), so it covers
  // every style and Troll Mode rounds too. Distinct from a missing hint: with
  // the setting on, a blank hint still falls back to the error message below.
  $: showHint = $settings.enableImpostorHint;
  // The OTHER imposters' names, shown to an imposter when the "Reveal fellow
  // imposters" setting is on and there are 2+ imposters. Built from the roles
  // array (same approach as the results screen) but excluding this player, so an
  // imposter never sees themselves in the list. Empty in every other case
  // (crewmate, setting off, single-imposter round), so the three reveal styles can
  // simply render it when non-empty. This is the single source of truth for the
  // feature — the styles don't re-derive it.
  //
  // Suppressed on a Troll Mode round (!isTroll): there every player is an imposter,
  // so listing "fellow imposters" would expose everyone and blow the whole "I'm the
  // lone imposter" illusion the mode depends on.
  $: fellowImposters =
    $settings.showFellowImposters &&
    isImpostor &&
    !$gameState.isTroll &&
    $gameState.impostorCount >= 2
      ? $gameState.roles
          .map((r, i) => ({ isImpostor: r.isImpostor, i }))
          .filter((e) => e.isImpostor && e.i !== $gameState.revealIndex)
          .map((e) => displayName($gameState.names, e.i))
      : [];
  // Last player has no one to pass to — they continue to discussion instead.
  $: advanceLabel = isLastPlayer
    ? 'Hide & continue to discussion'
    : 'Hide & pass to next player';
</script>

<section class="screen">
  <!-- Jester announcement: when a jester is in play this round, everyone is told so
       they play more cautiously (the jester wants to be mistaken for the imposter). -->
  {#if $gameState.hasJester}
    <p class="jester-banner">🃏 A JESTER is among you this round</p>
  {/if}

  <p class="player-tag">{playerName} — {playerNumber} of {$gameState.playerCount}</p>

  {#if useEnvelope}
    <!-- ============ Envelope reveal (press and hold) ============ -->
    <!-- The same envelope for everyone; only the note inside differs. --hold-ms
         drives both the gradual flap lift and the progress bar so they always
         match HOLD_MS. -->
    <div
      class="letter"
      class:opening={phase === 'opening'}
      class:opened={phase === 'opened'}
      style="--hold-ms: {HOLD_MS}ms"
    >
      <!-- Press-and-hold target. A real <button> for built-in focus + keyboard
           semantics; touch-action/user-select are handled in CSS so the hold
           gesture doesn't scroll, select text, or pop the long-press menu. -->
      <button
        type="button"
        class="envelope"
        aria-label="Press and hold to open your letter"
        on:pointerdown={startHold}
        on:pointerup={cancelHold}
        on:pointerleave={cancelHold}
        on:pointercancel={cancelHold}
        on:keydown={onKeydown}
        on:keyup={onKeyup}
        on:contextmenu|preventDefault
      >
        <!-- Envelope body (the pocket the note sits in). Neutral tokens only, so
             it is identical for both roles. -->
        <span class="pocket"></span>

        <!-- The note. Hidden (opacity 0) and tucked down while sealed, so the
             closed envelope gives nothing away; it rises and fades in once
             opened. Its border/title colour come from --accent / --error, so
             Grayscale mode collapses the two roles to the same gray. -->
        <span
          class="note"
          class:note-impostor={isImpostor}
          class:note-jester={isJester}
          class:note-crewmate={!isImpostor && !isJester}
        >
          {#if isJester}
            <!-- Jester: knows the word like a crewmate, but a different goal. -->
            <span class="note-title">🃏 YOU ARE THE JESTER!</span>
            <span class="note-word">"{$gameState.word}"</span>
            <span class="note-sub">
              You know the word — but you WIN by getting voted out. Act like the imposter!
            </span>
          {:else if isImpostor}
            <span class="note-title">🎭 YOU ARE THE IMPOSTER!</span>
            {#if showHint}
              {#if hint}
                <span class="note-hint">Your hint: "{hint}"</span>
              {:else}
                <span class="note-hint">An error occurred.</span>
              {/if}
            {/if}
            {#if fellowImposters.length}
              <span class="note-sub">Your fellow imposters: {fellowImposters.join(', ')}</span>
            {/if}
            {#if showHint}
              <span class="note-sub">
                You don't know the word — use your hint to blend in during discussion!
              </span>
            {/if}
          {:else}
            <span class="note-title">📝 THE WORD IS:</span>
            <span class="note-word">"{$gameState.word}"</span>
            <span class="note-sub">You know the word. Help identify the imposters!</span>
          {/if}
        </span>

        <!-- The flap, hinged at the top. Closed while sealed (with a wax seal),
             lifts gradually across the hold, and stays open once revealed. -->
        <span class="flap">
          <span class="seal"></span>
        </span>
      </button>

      <!-- Progress + prompt below the envelope. The bar fills across the hold as
           a clear "keep holding" cue; both disappear once opened. -->
      {#if phase !== 'opened'}
        <div class="progress"><span class="progress-fill"></span></div>
        <p class="prompt">Press and hold to open your letter</p>
      {/if}
    </div>

    {#if phase === 'opened'}
      <button type="button" class="advance-btn" on:click={revealDone}>
        {advanceLabel}
      </button>
    {/if}
  {:else if revealStyle === 'wheel'}
    <!-- ============ Wheel of Fate (hold to spin & stop) ============ -->
    <WheelReveal
      {isImpostor}
      {isJester}
      hasJester={$gameState.hasJester}
      word={$gameState.word}
      {hint}
      {showHint}
      {fellowImposters}
      {advanceLabel}
      onDone={revealDone}
    />
  {:else}
    <!-- ============ Original reveal (tap to flip) ============ -->
    {#if !revealed}
      <!-- Face-down: nothing about the role is shown until this player taps. -->
      <button type="button" class="reveal-btn" on:click={() => (revealed = true)}>
        Tap to reveal your role
      </button>
    {:else if isJester}
      <!-- Jester: shown the secret word (like a crewmate) but with the get-voted-out goal. -->
      <div class="card card-jester">
        <p class="card-title">🃏 YOU ARE THE JESTER!</p>
        <p class="card-word">"{$gameState.word}"</p>
        <p class="card-sub">
          You know the word — but you WIN by getting voted out. Act like the imposter!
        </p>
      </div>
      <button type="button" class="advance-btn" on:click={revealDone}>
        {advanceLabel}
      </button>
    {:else if isImpostor}
      <!-- Impostor: never shown the secret word, but given a vague hint to blend
           in. A missing/blank hint degrades to an error message (game continues). -->
      <div class="card card-impostor">
        <p class="card-title">🎭 YOU ARE THE IMPOSTER!</p>
        {#if showHint}
          {#if hint}
            <p class="card-hint">Your hint: "{hint}"</p>
          {:else}
            <p class="card-hint">An error occurred.</p>
          {/if}
        {/if}
        {#if fellowImposters.length}
          <p class="card-sub">Your fellow imposters: {fellowImposters.join(', ')}</p>
        {/if}
        {#if showHint}
          <p class="card-sub">
            You don't know the word — use your hint to blend in during discussion!
          </p>
        {/if}
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

  /* "A jester is among you" banner — light pink, neutralises in Grayscale. */
  .jester-banner {
    margin: 0;
    width: 100%;
    padding: 8px 12px;
    border: 1px solid var(--jester);
    border-radius: 8px;
    color: var(--jester);
    font-weight: 700;
    font-size: 0.95rem;
  }

  /* ============ Original reveal styles ============ */

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
  /* Jester card — light pink, parallel to the crewmate/imposter cards. */
  .card-jester {
    border: 2px solid var(--jester);
  }
  .card-jester .card-title,
  .card-jester .card-word {
    color: var(--jester);
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
  /* The imposter's hint (or the error fallback) — the key info on this card, so
     it's emphasised like the crewmate's word but kept readable on the red card. */
  .card-hint {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text);
  }
  .card-sub {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  /* ============ Envelope reveal styles ============ */

  /* The letter wrapper. `perspective` gives the flap a real 3D hinge as it
     swings open. */
  .letter {
    width: 100%;
    perspective: 1200px;
  }

  /* Press-and-hold target. Transparent button that just frames the envelope;
     touch-action/user-select keep the hold gesture from scrolling or selecting. */
  .envelope {
    position: relative;
    display: block;
    width: 100%;
    min-height: 260px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .envelope:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 4px;
    border-radius: 14px;
  }

  /* Envelope body — neutral so it's role-identical. Sits behind the note. */
  .pocket {
    position: absolute;
    inset: 0;
    z-index: 1;
    background-color: var(--bg-surface);
    border: 2px solid var(--text-muted);
    border-radius: 12px;
  }

  /* The role note. Sealed: hidden and tucked down. Opened: risen and faded in.
     Shorter than the envelope so the pocket lip shows below it (reads as "the
     note coming out of the envelope"). */
  .note {
    position: absolute;
    left: 10px;
    right: 10px;
    top: 10px;
    bottom: 28px;
    z-index: 2;
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 8px;
    padding: 16px;
    border-radius: 10px;
    background-color: var(--bg);
    /* neutral border by default; the role modifiers below recolour it */
    border: 2px solid var(--text-muted);
    opacity: 0;
    transform: translateY(28px);
    transition: opacity 200ms ease, transform 200ms ease;
  }

  /* Revealed note slides up and fades in, just after the flap has lifted. */
  .opened .note {
    opacity: 1;
    transform: translateY(-6px);
    transition: opacity 360ms ease 140ms, transform 420ms cubic-bezier(0.2, 0.8, 0.2, 1) 140ms;
  }

  /* Role colours come from existing tokens only (Grayscale-safe). */
  .note-crewmate {
    border-color: var(--accent);
  }
  .note-crewmate .note-title,
  .note-crewmate .note-word {
    color: var(--accent);
  }
  .note-impostor {
    border-color: var(--error);
  }
  .note-impostor .note-title {
    color: var(--error);
  }
  /* Jester note — light pink, parallel to the crewmate/imposter notes. */
  .note-jester {
    border-color: var(--jester);
  }
  .note-jester .note-title,
  .note-jester .note-word {
    color: var(--jester);
  }

  .note-title {
    font-size: 1.3rem;
    font-weight: 700;
  }
  .note-word {
    font-size: 1.7rem;
    font-weight: 700;
  }
  /* The imposter's hint (or the error fallback) — emphasised like the crewmate's
     word but kept readable. */
  .note-hint {
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text);
  }
  .note-sub {
    color: var(--text-muted);
    font-size: 0.95rem;
  }

  /* The flap, hinged on its top edge. Closed by default; the `.opening` lift is
     driven over the hold duration, and `.opened` keeps it open. */
  .flap {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 118px;
    z-index: 3;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: var(--bg-surface);
    border: 2px solid var(--text-muted);
    border-radius: 12px 12px 6px 6px;
    transform-origin: top center;
    transform: rotateX(0deg);
    backface-visibility: hidden;
    /* snap shut quickly on re-seal */
    transition: transform 250ms ease;
  }

  /* While holding, the flap lifts gradually across the whole hold so the player
     can see their progress. */
  .opening .flap {
    transform: rotateX(-168deg);
    transition: transform var(--hold-ms) linear;
  }

  /* Once opened, keep the flap swung up out of the way. */
  .opened .flap {
    transform: rotateX(-168deg);
    transition: transform 250ms ease;
  }

  /* A small wax seal on the closed flap — same for everyone (uses --accent,
     which both roles share and Grayscale neutralises). Fades out as it opens. */
  .seal {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background-color: var(--accent);
    box-shadow: inset 0 0 0 3px rgba(255, 255, 255, 0.25);
    transition: opacity 150ms ease;
  }
  .opening .seal,
  .opened .seal {
    opacity: 0;
  }

  /* Hold-progress bar under the envelope: empty when sealed, fills across the
     hold, snaps back to empty on re-seal. */
  .progress {
    width: 100%;
    height: 6px;
    margin-top: 16px;
    border-radius: 999px;
    background-color: var(--bg);
    overflow: hidden;
  }
  .progress-fill {
    display: block;
    width: 0;
    height: 100%;
    border-radius: 999px;
    background-color: var(--accent);
    transition: width 200ms ease;
  }
  .opening .progress-fill {
    width: 100%;
    transition: width var(--hold-ms) linear;
  }

  .prompt {
    margin: 12px 0 0;
    color: var(--text-muted);
    font-weight: 600;
  }

  /* ============ Shared ============ */

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

  /* Reduced motion: keep the hold-to-open gameplay, but drop the animation. The
     flap stays closed during the hold and everything snaps at completion, so
     there's no motion — and still no role leak (the note only appears once
     opened). */
  @media (prefers-reduced-motion: reduce) {
    .note,
    .opened .note,
    .flap,
    .opening .flap,
    .opened .flap,
    .seal,
    .progress-fill,
    .opening .progress-fill {
      transition: none;
    }
    .opening .flap {
      transform: rotateX(0deg);
    }
    .opening .progress-fill {
      width: 0;
    }
  }
</style>

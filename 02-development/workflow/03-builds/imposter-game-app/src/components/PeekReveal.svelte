<script>
  // "Peek under" reveal: a plain rectangular COVER sits over the player's role and
  // hides it completely. The player presses the cover and SWIPES UP while holding —
  // the cover lifts with their finger (proportional to the drag), exposing a minimal
  // role line underneath. Letting go drops the cover straight back down, hiding the
  // role again. Like the other styles it is pure theatre over a role decided at round
  // setup; nothing here changes game logic.
  //
  // Two safety properties shared with the other reveal styles:
  //   • No pre-peek leak — at rest the cover fully hides the role layer, so a stray
  //     tap on hand-off (one that doesn't drag past the threshold) reveals nothing.
  //   • Grayscale-safe — role colours come from --accent / --error / --jester only, so
  //     Grayscale mode collapses the roles to one gray.
  //
  // Once the player has peeked at least once, the FULL role detail (word / hint /
  // fellow imposters / goal) and the advance button appear below and stay, so they can
  // read everything without holding. The detail markup mirrors CardGridReveal's
  // `.result` block so the wording stays identical across every style.
  import { onDestroy } from 'svelte';

  // Round data + how to advance, supplied by RevealScreen — the SAME prop contract as
  // CardGridReveal / WheelReveal, so RevealScreen wires this in identically.
  export let isImpostor;
  // The optional Jester role: reads the real word like a crewmate but reveals as its
  // own role. isImpostor is false for the jester, so both the peek line and the detail
  // card key off `kind` (below), checking jester BEFORE the imposter/crewmate split.
  export let isJester = false;
  // NB: unlike WheelReveal / CardGridReveal this style has no decoys, so it takes no
  // `hasJester` prop — there's nothing to gate. Everything else matches their contract.
  export let word;
  export let hint = '';
  // Whether to show the imposter's hint. Gated by RevealScreen on the "Imposter hints"
  // setting; when false the imposter sees the role only, no clue.
  export let showHint = true;
  // Names of the OTHER imposters, already gated by RevealScreen (empty unless the
  // "Reveal fellow imposters" setting is on, this player is an imposter, and there are
  // 2+ imposters). Rendered in the detail card when non-empty.
  export let fellowImposters = [];
  export let advanceLabel;
  export let onDone; // called when the player taps to pass / continue

  // The player's real role as a single tag the peek line and detail card both match on.
  // The jester is checked first (it has isImpostor false but is its own kind).
  $: kind = isJester ? 'jester' : isImpostor ? 'impostor' : 'crewmate';

  // The imposter's hint, trimmed; empty means no usable hint → error fallback.
  $: cleanHint = typeof hint === 'string' ? hint.trim() : '';

  // How far (px) the cover must be lifted before it counts as a deliberate "peek" and
  // latches `hasPeeked`. Small enough to feel responsive, large enough that an accidental
  // brush on hand-off doesn't reveal anything.
  const PEEK_THRESHOLD = 24;

  let winH = 0;         // the window's measured height = the maximum lift (bound below)
  let lift = 0;         // current cover lift in px (0 = fully closed)
  let dragging = false; // finger is down and tracking — disables the snap-back transition
  let startY = 0;       // pointer Y at press, so lift = how far up we've dragged since
  let hasPeeked = false; // latches on the first real peek → shows detail card + advance

  // The most the cover can lift: the window height, so a full drag exposes everything.
  // Falls back to a sane default before the window has been measured.
  function maxLift() {
    return winH || 240;
  }

  // Press down on the cover: capture the pointer (so we keep getting moves/up even if the
  // finger drifts off the cover) and start tracking the drag from this Y.
  function startDrag(event) {
    if (event.pointerId !== undefined && event.currentTarget.setPointerCapture) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (_) {
        // Capture is best-effort; release handlers still fire without it.
      }
    }
    dragging = true;
    startY = event.clientY;
  }

  // Finger moves while held: lift the cover by how far we've dragged UP from the press
  // point, clamped to [0, maxLift]. The first time we cross the threshold, latch the peek.
  function moveDrag(event) {
    if (!dragging) return;
    lift = Math.max(0, Math.min(startY - event.clientY, maxLift()));
    if (lift >= PEEK_THRESHOLD) hasPeeked = true;
  }

  // Finger lifted / pointer left or cancelled: stop tracking and let the cover snap back
  // down (the CSS transition handles the animation; reduced motion makes it instant).
  function endDrag() {
    if (!dragging) return;
    dragging = false;
    lift = 0;
  }

  // Keyboard parity: a drag isn't keyboard-reachable, so holding Space/Enter lifts the
  // cover fully open (animated via the transition, since we're not `dragging`) and
  // releasing drops it. `repeat` is ignored so the auto-repeat keydown stream doesn't
  // re-open mid-hold, and Space's page-scroll is suppressed.
  function onKeydown(event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (event.repeat) return;
    event.preventDefault();
    lift = maxLift();
    hasPeeked = true;
  }

  function onKeyup(event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    lift = 0;
  }
</script>

<div class="peek-area">
  {#if !hasPeeked}
    <p class="prompt">Press &amp; swipe up to peek at your role</p>
  {/if}

  <!-- The window clips the cover, so when it lifts it slides up and out of view,
       exposing the role layer beneath only as far as it's lifted. -->
  <div class="window" bind:clientHeight={winH}>
    <!-- Role layer (underneath): the MINIMAL role line, anchored to the bottom so even a
         small peek surfaces the key word/role first. Colours use the shared tokens. -->
    <div class="role-layer">
      <div class="peek-line peek-{kind}">
        {#if kind === 'jester'}
          <span class="peek-emoji">🃏</span>
          <span class="peek-key">"{word}"</span>
        {:else if kind === 'impostor'}
          <span class="peek-emoji">🎭</span>
          <span class="peek-role">IMPOSTER</span>
          {#if showHint}
            <span class="peek-key">{cleanHint ? `"${cleanHint}"` : 'An error occurred.'}</span>
          {/if}
        {:else}
          <span class="peek-emoji">📝</span>
          <span class="peek-key">"{word}"</span>
        {/if}
      </div>
    </div>

    <!-- The cover (on top): a neutral rectangle that fully hides the role at rest. A real
         <button> for focus + keyboard semantics; touch-action/user-select keep the drag
         from scrolling, selecting text, or popping the long-press menu. It translates up
         by `lift`; the transition (disabled while dragging) gives the snap-back. -->
    <button
      type="button"
      class="cover"
      class:dragging
      style={`transform: translateY(${-lift}px)`}
      aria-label="Press and swipe up to peek at your role"
      on:pointerdown={startDrag}
      on:pointermove={moveDrag}
      on:pointerup={endDrag}
      on:pointerleave={endDrag}
      on:pointercancel={endDrag}
      on:keydown={onKeydown}
      on:keyup={onKeyup}
      on:contextmenu|preventDefault
    >
      <span class="cover-handle"></span>
      <span class="cover-chevron" aria-hidden="true">⌃</span>
      <span class="cover-label">Hold &amp; swipe up</span>
    </button>
  </div>

  {#if hasPeeked}
    <!-- Detail card: the full role info, shown once the player has peeked and kept on
         screen so they can read it without holding. Same content/wording as the other
         reveal styles; colours from --accent / --error / --jester (Grayscale-safe). -->
    <div
      class="result"
      class:result-impostor={isImpostor}
      class:result-jester={isJester}
      class:result-crewmate={!isImpostor && !isJester}
    >
      {#if isJester}
        <p class="result-title">🃏 You're the JESTER!</p>
        <p class="result-key">The word is "{word}"</p>
        <p class="result-sub">You win by getting voted out — act like the imposter!</p>
      {:else if isImpostor}
        <p class="result-title">🎭 You're the IMPOSTER!</p>
        {#if showHint}
          {#if cleanHint}
            <p class="result-key">Your hint: "{cleanHint}"</p>
          {:else}
            <p class="result-key">An error occurred.</p>
          {/if}
        {/if}
        {#if fellowImposters.length}
          <p class="result-sub">Your fellow imposters: {fellowImposters.join(', ')}</p>
        {/if}
        {#if showHint}
          <p class="result-sub">
            You don't know the word — use your hint to blend in during discussion!
          </p>
        {/if}
      {:else}
        <p class="result-title">📝 You're a CREWMATE</p>
        <p class="result-key">The word is "{word}"</p>
        <p class="result-sub">You know the word. Help identify the imposters!</p>
      {/if}
    </div>

    <button type="button" class="advance-btn" on:click={onDone}>
      {advanceLabel}
    </button>
  {/if}
</div>

<style>
  /* Stacked, centred — sits inside RevealScreen's .screen card. */
  .peek-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
  }

  .prompt {
    margin: 0;
    color: var(--text-muted);
    font-weight: 600;
  }

  /* The window: fixed height, clips the cover as it slides up. */
  .window {
    position: relative;
    width: 100%;
    height: 240px;
    border-radius: 12px;
    overflow: hidden;
  }

  /* Role layer underneath the cover. Content sits at the BOTTOM so even a small lift
     reveals the key line first. Neutral background; the line itself carries the colour. */
  .role-layer {
    position: absolute;
    inset: 0;
    z-index: 1;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    padding: 24px;
    background-color: var(--bg);
    border-radius: 12px;
  }

  .peek-line {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    text-align: center;
  }
  .peek-emoji {
    font-size: 2rem;
    line-height: 1;
  }
  .peek-role {
    font-size: 1.3rem;
    font-weight: 700;
  }
  /* The key line (the word, or the imposter's hint) — the thing they're peeking for. */
  .peek-key {
    font-size: 1.7rem;
    font-weight: 700;
    color: var(--text);
  }
  /* Role colours from existing tokens only (Grayscale-safe). */
  .peek-crewmate .peek-emoji,
  .peek-crewmate .peek-key {
    color: var(--accent);
  }
  .peek-impostor .peek-emoji,
  .peek-impostor .peek-role {
    color: var(--error);
  }
  .peek-jester .peek-emoji,
  .peek-jester .peek-key {
    color: var(--jester);
  }

  /* The cover: a neutral rectangle hiding the role at rest. Full-size button on top of
     the role layer; translateY lifts it. The transition gives the snap-back on release
     and the animated keyboard open; it's removed while dragging for a 1:1 finger follow. */
  .cover {
    position: absolute;
    inset: 0;
    z-index: 2;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    padding: 24px;
    border-radius: 12px;
    border: 2px solid var(--text-muted);
    background-color: var(--bg-surface);
    color: var(--text-muted);
    cursor: grab;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
    transition: transform 250ms ease;
  }
  .cover.dragging {
    cursor: grabbing;
    transition: none;
  }
  .cover:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 4px;
  }

  /* A short pill "grip" at the top of the cover, hinting it can be pulled up. */
  .cover-handle {
    width: 48px;
    height: 6px;
    border-radius: 999px;
    background-color: var(--text-muted);
    opacity: 0.6;
  }
  .cover-chevron {
    font-size: 2rem;
    line-height: 0.6;
    font-weight: 800;
  }
  .cover-label {
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  /* Detail card — same token-driven colour scheme as the other reveal styles. */
  .result {
    width: 100%;
    border-radius: 12px;
    padding: 24px;
    background-color: var(--bg);
    display: flex;
    flex-direction: column;
    gap: 8px;
    text-align: center;
  }
  .result-crewmate {
    border: 2px solid var(--accent);
  }
  .result-crewmate .result-title,
  .result-crewmate .result-key {
    color: var(--accent);
  }
  .result-impostor {
    border: 2px solid var(--error);
  }
  .result-impostor .result-title {
    color: var(--error);
  }
  .result-jester {
    border: 2px solid var(--jester);
  }
  .result-jester .result-title,
  .result-jester .result-key {
    color: var(--jester);
  }

  .result-title {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 700;
  }
  .result-key {
    margin: 0;
    font-size: 1.6rem;
    font-weight: 700;
    color: var(--text);
  }
  .result-sub {
    margin: 0;
    color: var(--text-muted);
    font-size: 0.95rem;
  }

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

  /* Reduced motion: keep the peek gameplay, but drop the animation. The snap-back and
     the keyboard auto-lift become instant (no transition); direct finger-drag tracking
     stays (it's manipulation, not animation) and there's still no pre-peek leak. */
  @media (prefers-reduced-motion: reduce) {
    .cover {
      transition: none;
    }
  }
</style>

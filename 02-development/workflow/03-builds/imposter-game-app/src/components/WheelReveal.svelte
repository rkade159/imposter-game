<script>
  // "Wheel of Fate" reveal: a constantly spinning wheel of role names that the
  // player PRESSES AND HOLDS to slow down until it eases to a stop on their role.
  // The wheel is RIGGED — the role is already decided (passed in as `isImpostor`)
  // — so the spin is pure theatre. Letting go before it stops speeds it back up,
  // so bringing it to rest takes one continuous hold (matching the envelope, and
  // stopping accidental reveals on hand-off). Once it lands, a detail card shows
  // the role plus the word (crewmate) or hint (imposter).
  //
  // Role-agnostic until it lands: the spin and the slow-down are identical for
  // both roles, and the only role-specific element (the detail card) appears only
  // after the wheel has stopped. Segment fills use --accent / --error, so
  // Grayscale mode collapses both roles to one gray exactly as elsewhere.
  import { onMount, onDestroy } from 'svelte';

  // Round data + how to advance, supplied by RevealScreen.
  export let isImpostor;
  export let word;
  export let hint = '';
  // Names of the OTHER imposters, supplied by RevealScreen (already gated: empty
  // unless the "Reveal fellow imposters" setting is on, this player is an imposter,
  // and there are 2+ imposters). Rendered in the detail card when non-empty.
  export let fellowImposters = [];
  export let advanceLabel;
  export let onDone; // called when the player taps to pass / continue

  // --- Wheel segments (first-cut, easily edited) ---------------------------
  // Alternating role so each role has several landing spots; the labels are just
  // for fun — the detail card below states the role unambiguously. `isImpostor`
  // is what the rig matches against.
  const SEGMENTS = [
    { label: 'CREWMATE', isImpostor: false },
    { label: 'IMPOSTER', isImpostor: true },
    { label: 'Innocent 😇', isImpostor: false },
    { label: 'Sneaky 🕵️', isImpostor: true },
    { label: 'Good Egg 🥚', isImpostor: false },
    { label: 'Sus 😈', isImpostor: true },
  ];

  // --- Geometry (SVG, 200×200 viewBox) -------------------------------------
  // Wedges and labels are precomputed once so the markup is plain. Angles are
  // measured from the top (the pointer) going clockwise.
  const CX = 100;
  const CY = 100;
  const R = 92;
  const LABEL_R = 60;
  const SEG = 360 / SEGMENTS.length;

  function pointAt(deg) {
    const a = (deg * Math.PI) / 180;
    return [CX + R * Math.sin(a), CY - R * Math.cos(a)];
  }

  const wedges = SEGMENTS.map((seg, i) => {
    const start = i * SEG;
    const end = (i + 1) * SEG;
    const [x1, y1] = pointAt(start);
    const [x2, y2] = pointAt(end);
    const large = SEG > 180 ? 1 : 0;
    const d = `M ${CX} ${CY} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${R} ${R} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z`;
    // center angle of this segment, used both to place its label and to work out
    // the wheel rotation that parks it under the pointer.
    const center = (i + 0.5) * SEG;
    return { ...seg, d, center };
  });

  // --- Spin state ----------------------------------------------------------
  // phase: 'spinning' (idle/role-agnostic) → 'settling' (held, slowing) →
  // 'landed'. Releasing during 'settling' returns to 'spinning'.
  let phase = 'spinning';
  let angle = 0; // current wheel rotation, degrees (driven each frame)
  let landed = false;

  // Tuning constants — safe to tweak after a playtest.
  const IDLE_SPEED = 0.5; // degrees per ms while spinning
  const SETTLE_MS = 3200; // how long a full hold takes to bring it to rest
  const MIN_SPINS = 3; // at least this many turns during the slow-down
  const REDUCED_HOLD_MS = 1200; // hold time when motion is reduced (no spin)

  let raf = null;
  let lastFrame = 0;
  let holdStart = 0;
  let holdStartAngle = 0;
  let target = 0;
  let reduced = false; // prefers-reduced-motion
  let holdTimer = null; // reduced-motion hold

  // Pick a wheel rotation (0–360) that parks a segment matching this player's
  // role under the top pointer. Random among the matching segments so the landing
  // spot isn't predictable.
  function chooseRestRotation() {
    const matches = wedges.filter((w) => w.isImpostor === isImpostor);
    const pick = matches[Math.floor(Math.random() * matches.length)];
    // bringing center → top means rotating by -center (mod 360)
    return ((-pick.center) % 360 + 360) % 360;
  }

  // The full target angle for the animated slow-down: several spins on from where
  // we are now, then aligned so a matching segment ends under the pointer.
  function chooseTarget(from) {
    const rest = chooseRestRotation();
    const min = from + MIN_SPINS * 360;
    const delta = (((rest - min) % 360) + 360) % 360;
    return min + delta;
  }

  const easeOut = (t) => 1 - Math.pow(1 - t, 3);

  // Animation loop (skipped entirely when motion is reduced). One continuous
  // `angle` is shared by spinning and settling, so cancelling a settle never
  // jumps the wheel — only its speed changes.
  function frame(now) {
    const dt = now - lastFrame;
    lastFrame = now;

    if (phase === 'spinning') {
      // mod keeps the value bounded; rotate() is unaffected by full turns.
      angle = (angle + IDLE_SPEED * dt) % 360;
    } else if (phase === 'settling') {
      const t = (now - holdStart) / SETTLE_MS;
      if (t >= 1) {
        angle = target;
        phase = 'landed';
        landed = true;
        raf = null;
        return; // stop the loop — we've come to rest
      }
      angle = holdStartAngle + (target - holdStartAngle) * easeOut(t);
    }

    raf = requestAnimationFrame(frame);
  }

  // Begin a hold. Captures the pointer so the matching release still reaches us
  // if the finger drifts off the wheel.
  function startHold(event) {
    if (phase === 'landed') return;
    if (event.pointerId !== undefined && event.currentTarget.setPointerCapture) {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch (_) {
        // best-effort; release handlers still fire without capture
      }
    }

    if (reduced) {
      // No spinning: hold for REDUCED_HOLD_MS, then snap a matching segment under
      // the pointer and land. (No motion, but the hold still gates the reveal.)
      phase = 'settling';
      clearTimeout(holdTimer);
      holdTimer = setTimeout(() => {
        angle = chooseRestRotation();
        phase = 'landed';
        landed = true;
      }, REDUCED_HOLD_MS);
      return;
    }

    holdStart = performance.now();
    holdStartAngle = angle;
    target = chooseTarget(angle);
    phase = 'settling';
  }

  // Released / pointer left or cancelled before it stopped → back to a full spin
  // (or, when reduced, just reset the hold). A no-op once landed.
  function releaseHold() {
    if (phase !== 'settling') return;
    clearTimeout(holdTimer);
    holdTimer = null;
    phase = 'spinning';
  }

  // Keyboard parity: hold Space/Enter to spin down. `repeat` is ignored so the
  // auto-repeat stream doesn't restart the hold, and Space's page-scroll is
  // suppressed.
  function onKeydown(event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    if (event.repeat) return;
    event.preventDefault();
    startHold(event);
  }
  function onKeyup(event) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    releaseHold();
  }

  onMount(() => {
    reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!reduced) {
      lastFrame = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });

  // Stop the loop / timer on teardown so advancing mid-spin can't leave a stray
  // frame loop running.
  onDestroy(() => {
    if (raf) cancelAnimationFrame(raf);
    clearTimeout(holdTimer);
  });

  // The imposter's hint, trimmed; empty means no usable hint → error fallback.
  $: cleanHint = typeof hint === 'string' ? hint.trim() : '';
</script>

<div class="wheel-area">
  <!-- Press-and-hold target. A real <button> for focus + keyboard; CSS stops the
       hold gesture from scrolling, selecting, or popping the long-press menu. -->
  <button
    type="button"
    class="wheel-btn"
    aria-label="Press and hold to spin the wheel and reveal your role"
    on:pointerdown={startHold}
    on:pointerup={releaseHold}
    on:pointerleave={releaseHold}
    on:pointercancel={releaseHold}
    on:keydown={onKeydown}
    on:keyup={onKeyup}
    on:contextmenu|preventDefault
  >
    <svg viewBox="0 0 200 200" role="img" aria-hidden="true">
      <!-- Rotating group: the wedges + labels spin together. -->
      <g transform={`rotate(${angle} ${CX} ${CY})`}>
        {#each wedges as w}
          <path
            class="wedge {w.isImpostor ? 'seg-impostor' : 'seg-crewmate'}"
            d={w.d}
          />
        {/each}
        {#each wedges as w}
          <text
            class="seg-label"
            x={CX}
            y={CY - LABEL_R}
            text-anchor="middle"
            dominant-baseline="central"
            transform={`rotate(${w.center} ${CX} ${CY})`}
          >{w.label}</text>
        {/each}
      </g>

      <!-- Hub + fixed pointer (outside the rotating group), neutral so they're
           role-agnostic. The pointer marks the winning segment at the top. -->
      <circle class="hub" cx={CX} cy={CY} r="14" />
      <polygon class="pointer" points="100,2 90,22 110,22" />
    </svg>
  </button>

  {#if !landed}
    <p class="prompt">Press and hold to spin — let go and it speeds back up!</p>
  {:else}
    <!-- Detail card: leads with the unambiguous role, then the info the player
         needs. Colours come from --accent / --error so Grayscale neutralises. -->
    <div class="result" class:result-impostor={isImpostor} class:result-crewmate={!isImpostor}>
      {#if isImpostor}
        <p class="result-title">🎭 You're the IMPOSTER!</p>
        {#if cleanHint}
          <p class="result-key">Your hint: "{cleanHint}"</p>
        {:else}
          <p class="result-key">An error occurred.</p>
        {/if}
        {#if fellowImposters.length}
          <p class="result-sub">Your fellow imposters: {fellowImposters.join(', ')}</p>
        {/if}
        <p class="result-sub">
          You don't know the word — use your hint to blend in during discussion!
        </p>
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
  .wheel-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 100%;
  }

  /* The wheel itself is the hold target. */
  .wheel-btn {
    display: block;
    width: 100%;
    max-width: 300px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    touch-action: none;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }

  .wheel-btn:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 4px;
    border-radius: 50%;
  }

  .wheel-btn svg {
    display: block;
    width: 100%;
    height: auto;
  }

  /* Wedges: role-coloured fills via tokens (Grayscale-safe), with a neutral
     divider stroke so the segments stay separable even when both fills collapse
     to the same gray. */
  .wedge {
    stroke: var(--bg);
    stroke-width: 1.5;
  }
  .seg-crewmate {
    fill: var(--accent);
  }
  .seg-impostor {
    fill: var(--error);
  }

  /* White labels read on both fills (and on gray). */
  .seg-label {
    fill: #fff;
    font-weight: 700;
    font-size: 8.5px;
  }

  .hub {
    fill: var(--bg-surface);
    stroke: var(--bg);
    stroke-width: 1.5;
  }
  .pointer {
    fill: var(--text);
  }

  .prompt {
    margin: 0;
    color: var(--text-muted);
    font-weight: 600;
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
</style>

<script>
  // "Choose a Card" reveal: a 3×3 grid of nine face-down cards under a "Choose a
  // card" prompt. The player TAPS any one card; it flips to reveal THEIR role,
  // while the other eight flip to random decoy roles for spectacle. Like the Wheel
  // of Fate it is RIGGED — whichever card is tapped flips to the real role (passed
  // in as isImpostor / isJester) — so the nine cards are pure theatre, no new game
  // logic. The grid shows nothing about any role until a tap, so a single tap is
  // safe on hand-off (nothing leaks before the deliberate pick).
  //
  // Role-agnostic until tapped: every card is identical face-down, and the only
  // role-specific element (the detail card) appears after the pick. Card colours
  // use --accent / --error / --jester, so Grayscale mode collapses the roles to one
  // gray exactly as the other reveal styles do.
  import { onMount, onDestroy } from 'svelte';

  // Round data + how to advance, supplied by RevealScreen — the SAME prop contract
  // as WheelReveal, so RevealScreen wires this in identically.
  export let isImpostor;
  // The optional Jester role: reads the real word like a crewmate but reveals as its
  // own role. isImpostor is false for the jester, so the rig and the detail card key
  // off `kind` (below), not isImpostor alone.
  export let isJester = false;
  // Whether a jester is in play THIS round. When true, jester decoys may appear on
  // the non-chosen cards (the jester is announced, so this is no leak); when false,
  // a jester card never appears (mirrors the wheel's segment gating).
  export let hasJester = false;
  // The optional Prosecutor role: an imposter (isImpostor true) with a secret target.
  // The landing theatre stays the imposter face (kind below is 'impostor' for them) —
  // only the detail card is prosecutor-specific. prosecutorTargetName is the player
  // they've been told to vote out, already resolved to a display name by RevealScreen.
  export let isProsecutor = false;
  export let prosecutorTargetName = '';
  export let word;
  export let hint = '';
  // Whether to show the imposter's hint. Gated by RevealScreen on the "Imposter
  // hints" setting; when false the detail card shows the role only, no clue.
  export let showHint = true;
  // Names of the OTHER imposters, already gated by RevealScreen (empty unless the
  // "Reveal fellow imposters" setting is on, this player is an imposter, and there
  // are 2+ imposters). Rendered in the detail card when non-empty.
  export let fellowImposters = [];
  export let advanceLabel;
  export let onDone; // called when the player taps to pass / continue

  // The player's real role as a single tag the rig and detail card both match on.
  // The jester is checked first (it has isImpostor false but is its own kind).
  $: kind = isJester ? 'jester' : isImpostor ? 'impostor' : 'crewmate';

  const GRID = 9; // fixed 3×3

  // Short face shown on a flipped card, per kind. The detail card below states the
  // role unambiguously — these are just the quick "what landed" labels.
  const FACE = {
    crewmate: { emoji: '📝', text: 'CREWMATE' },
    impostor: { emoji: '🎭', text: 'IMPOSTER' },
    jester: { emoji: '🃏', text: 'JESTER' },
  };

  // --- Pick state ----------------------------------------------------------
  // faces[i] is null until a card is picked; then every cell holds the kind it
  // flipped to (the chosen cell = the real role, the rest = random decoys) plus a
  // small stagger delay so they don't all flip at once.
  let faces = Array(GRID).fill(null);
  let chosenIndex = -1;
  let picked = false;
  let revealed = false; // detail card shown once the chosen card has flipped

  const FLIP_MS = 500; // chosen-card flip time; the detail card follows it
  let reduced = false; // prefers-reduced-motion
  let revealTimer = null;

  // A random decoy kind for a non-chosen card. Jester is only in the pool when a
  // jester is actually in play this round, so no jester card appears otherwise.
  function randomDecoy() {
    const pool = hasJester ? ['crewmate', 'impostor', 'jester'] : ['crewmate', 'impostor'];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Tap (or Enter/Space) on a card: rig the chosen cell to the real role, fill the
  // rest with decoys, and flip them in. Ignored once a pick has been made.
  function pick(i) {
    if (picked) return;
    picked = true;
    chosenIndex = i;

    let order = 0; // drives the decoy flip stagger
    faces = Array.from({ length: GRID }, (_, j) => {
      if (j === i) return { kind, delay: 0 };
      order += 1;
      return { kind: randomDecoy(), delay: reduced ? 0 : 90 + order * 45 };
    });

    // Show the detail card after the chosen card has flipped (immediately when
    // motion is reduced, since there's no flip to wait for).
    clearTimeout(revealTimer);
    revealTimer = setTimeout(() => (revealed = true), reduced ? 0 : FLIP_MS);
  }

  function onKeydown(event, i) {
    if (event.key !== ' ' && event.key !== 'Enter') return;
    event.preventDefault();
    pick(i);
  }

  onMount(() => {
    reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  onDestroy(() => clearTimeout(revealTimer));

  // The imposter's hint, trimmed; empty means no usable hint → error fallback.
  $: cleanHint = typeof hint === 'string' ? hint.trim() : '';
</script>

<div class="card-area">
  {#if !revealed}
    <p class="prompt">Choose a card</p>
  {/if}

  <!-- The 3×3 grid. `perspective` on the grid gives each card a real 3D flip. Cards
       are role-agnostic until tapped, so nothing leaks before the pick. -->
  <div class="grid" class:picked>
    {#each faces as face, i}
      <button
        type="button"
        class="card"
        class:flipped={face !== null}
        class:chosen={i === chosenIndex}
        style={`--flip-delay: ${face ? face.delay : 0}ms`}
        aria-label={picked ? 'Card revealed' : 'Choose this card to reveal your role'}
        disabled={picked && i !== chosenIndex}
        on:click={() => pick(i)}
        on:keydown={(e) => onKeydown(e, i)}
        on:contextmenu|preventDefault
      >
        <span class="card-inner">
          <!-- Face-down (identical for every card, no role tell). -->
          <span class="card-front"><span class="back-mark">?</span></span>
          <!-- Flipped face: the kind that landed (real role for the chosen card). -->
          <span class="card-back seg-{face ? face.kind : 'crewmate'}">
            {#if face}
              <span class="face-emoji">{FACE[face.kind].emoji}</span>
              <span class="face-text">{FACE[face.kind].text}</span>
            {/if}
          </span>
        </span>
      </button>
    {/each}
  </div>

  {#if revealed}
    <!-- Detail card: leads with the unambiguous role, then the info the player
         needs — same content/wording as the other reveal styles. Colours come from
         --accent / --error / --jester so Grayscale neutralises them together. -->
    <div
      class="result"
      class:result-impostor={isImpostor && !isProsecutor}
      class:result-prosecutor={isProsecutor}
      class:result-jester={isJester}
      class:result-crewmate={!isImpostor && !isJester}
    >
      {#if isJester}
        <p class="result-title">🃏 You're the JESTER!</p>
        <p class="result-key">The word is "{word}"</p>
        <p class="result-sub">You win by getting voted out — act like the imposter!</p>
      {:else if isProsecutor}
        <p class="result-title">🔨 You're the PROSECUTOR!</p>
        <p class="result-sub result-target">Get <strong>{prosecutorTargetName}</strong> voted out to win the round!</p>
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
  .card-area {
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

  /* 3×3 grid. `perspective` makes each card's rotateY a real 3D hinge. */
  .grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    width: 100%;
    max-width: 300px;
    perspective: 900px;
  }

  /* Each card is a square hold-target button; CSS stops the tap from selecting
     text or popping the long-press menu. min size keeps tap targets ≥ 44px. */
  .card {
    position: relative;
    aspect-ratio: 1;
    min-width: 44px;
    min-height: 44px;
    padding: 0;
    border: none;
    background: transparent;
    cursor: pointer;
    touch-action: manipulation;
    user-select: none;
    -webkit-user-select: none;
    -webkit-touch-callout: none;
  }
  .card[disabled] {
    cursor: default;
  }
  .card:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 3px;
    border-radius: 12px;
  }

  /* The flipping element: both faces are children, back is pre-rotated 180°. */
  .card-inner {
    position: absolute;
    inset: 0;
    transform-style: preserve-3d;
    transition: transform var(--flip-ms, 500ms) cubic-bezier(0.2, 0.8, 0.2, 1);
    transition-delay: var(--flip-delay, 0ms);
  }
  .flipped .card-inner {
    transform: rotateY(180deg);
  }

  /* Shared face styling. backface-visibility hides whichever face points away. */
  .card-front,
  .card-back {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 2px;
    border-radius: 12px;
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }

  /* Face-down: neutral, identical for every card so nothing leaks pre-tap. */
  .card-front {
    background-color: var(--bg-surface);
    border: 2px solid var(--text-muted);
  }
  .back-mark {
    font-size: 1.8rem;
    font-weight: 800;
    color: var(--text-muted);
  }

  /* Flipped face: starts rotated so it reads correctly once the card turns. The
     role colour comes from the seg-* tokens (Grayscale-safe). */
  .card-back {
    transform: rotateY(180deg);
    background-color: var(--bg);
    border: 2px solid var(--text-muted);
  }
  .seg-crewmate {
    border-color: var(--accent);
  }
  .seg-crewmate .face-emoji,
  .seg-crewmate .face-text {
    color: var(--accent);
  }
  .seg-impostor {
    border-color: var(--error);
  }
  .seg-impostor .face-emoji,
  .seg-impostor .face-text {
    color: var(--error);
  }
  .seg-jester {
    border-color: var(--jester);
  }
  .seg-jester .face-emoji,
  .seg-jester .face-text {
    color: var(--jester);
  }
  .face-emoji {
    font-size: 1.5rem;
    line-height: 1;
  }
  .face-text {
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  /* The player's own card gets a highlight ring so it's clear which one is theirs. */
  .chosen .card-back {
    box-shadow: 0 0 0 2px var(--bg-surface), 0 0 0 4px currentColor;
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
  /* Prosecutor detail card — gold, parallel to the other role cards. */
  .result-prosecutor {
    border: 2px solid var(--prosecutor);
  }
  .result-prosecutor .result-title {
    color: var(--prosecutor);
  }
  /* The target instruction — emphasised (the target name is bolded inline). */
  .result-target {
    color: var(--text);
    font-weight: 600;
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

  /* Reduced motion: drop the flip animation entirely. Cards snap to their face and
     the detail card appears (the reveal-timer above already fires immediately), so
     there's no motion — and still no pre-tap leak. */
  @media (prefers-reduced-motion: reduce) {
    .card-inner {
      transition: none;
    }
  }
</style>

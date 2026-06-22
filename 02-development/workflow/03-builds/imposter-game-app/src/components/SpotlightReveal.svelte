<script>
  // "Spotlight" imposter reveal: the end-of-round, whole-table payoff (NOT a per-player
  // role reveal). The stage goes black with every player's name scattered around it —
  // white = crewmate, red = imposter, pink = jester (colour is the only tell). A
  // spotlight roams a random-LOOKING but pre-decided path, lighting up crewmate names to
  // build tension and deliberately avoiding the red names, then STOPS on one imposter.
  // With 2+ imposters the rest then flare red together; the stage lights up and we hand
  // back to ResultsScreen (onDone) which shows the existing results text.
  //
  // One stage, two layers: all names render at full colour underneath; a dark overlay on
  // top carries a single transparent "hole" (a radial-gradient) that IS the beam, so
  // names show their colour only where the hole passes. The path is built from the known
  // roles, so the beam never rests on red early and always ends on a real imposter — true
  // even under Grayscale (where the colour tell is gone but the rig is data-driven).
  //
  // Driven entirely by props — it reads nothing from gameState. Tokens only for colour
  // (--text / --error / --jester) so Grayscale collapses the tell exactly as elsewhere.
  import { onMount, onDestroy } from 'svelte';
  import { shuffle } from '../lib/shuffle.js';

  // The full roster, built by ResultsScreen from roles + displayName. Each entry:
  // { name, isImpostor, isJester }. Order is the players' order; positions are scattered.
  export let players = [];
  // Called once when the lead-in finishes (or is skipped) — ResultsScreen then renders
  // its static results text.
  export let onDone;

  // --- Stage geometry ------------------------------------------------------
  // Measured so the beam radius can be a fraction of the stage's short side (a radial
  // gradient's `circle` radius needs a length, not a percentage). Positions stay in
  // percentages so they're resolution-independent.
  let stageW = 0;
  let stageH = 0;

  // Scatter the names on a jittered ring (a second, inner ring once it gets crowded) so
  // they spread out and never stack. Computed once — players is fixed for this screen.
  const center = { x: 50, y: 46 };
  function buildPositions(list) {
    const n = list.length;
    const jitter = () => (Math.random() - 0.5) * 4; // small organic offset (%)
    // One ring up to 8 names; beyond that, ~60% on an outer ring and the rest on an
    // inner one so the middle fills in without crowding the edge.
    const outerCount = n <= 8 ? n : Math.ceil(n * 0.6);
    return list.map((_, i) => {
      const onOuter = i < outerCount;
      const idx = onOuter ? i : i - outerCount;
      const count = onOuter ? outerCount : n - outerCount;
      const rx = onOuter ? 36 : 19;
      const ry = onOuter ? 32 : 17;
      // Offset the inner ring's phase so its names sit between the outer ones.
      const phase = onOuter ? -Math.PI / 2 : -Math.PI / 2 + Math.PI / Math.max(count, 1);
      const a = phase + (idx / Math.max(count, 1)) * Math.PI * 2;
      return {
        x: center.x + Math.cos(a) * rx + jitter(),
        y: center.y + Math.sin(a) * ry + jitter(),
      };
    });
  }
  const positions = buildPositions(players);

  // Role partitions used to build the rigged path. The jester is neither a decoy stop
  // nor a hunt target — it just reads pink when the stage lights up.
  const imposterIndices = players
    .map((p, i) => (p.isImpostor ? i : -1))
    .filter((i) => i >= 0);
  const crewmateIndices = players
    .map((p, i) => (!p.isImpostor && !p.isJester ? i : -1))
    .filter((i) => i >= 0);

  // The path: start near the top, wander through a few crewmate "decoy" stops, then end
  // on a randomly chosen imposter. No crewmates (Troll Mode) → a short decoy-free sweep.
  const start = { x: 50, y: 12 };
  const decoys = shuffle(crewmateIndices).slice(0, 3).map((i) => positions[i]);
  const finalIdx =
    imposterIndices[Math.floor(Math.random() * Math.max(imposterIndices.length, 1))] ?? 0;
  const path = [start, ...decoys, positions[finalIdx]];

  // --- Beam state ----------------------------------------------------------
  let beamX = start.x; // % across the stage
  let beamY = start.y; // % down the stage
  let radiusFactor = 0.3; // beam radius as a fraction of the stage's short side
  let lit = false; // climax done → overlay clears, all imposters flare red
  let done = false; // onDone fired (guard: fire exactly once)

  // Beam radius in px (fallback before the stage is measured). Reactive so the climax
  // "tighten" (lowering radiusFactor) animates via the CSS var.
  $: radiusPx = Math.min(stageW || 320, stageH || 320) * radiusFactor;

  let raf = null;
  let timers = [];
  let reduced = false;

  const easeInOut = (t) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  // Tween the beam between two points over travelMs, then continue.
  function tween(from, to, travelMs, onComplete) {
    const startT = performance.now();
    function step(now) {
      const t = Math.min((now - startT) / travelMs, 1);
      const e = easeInOut(t);
      beamX = from.x + (to.x - from.x) * e;
      beamY = from.y + (to.y - from.y) * e;
      if (t < 1) {
        raf = requestAnimationFrame(step);
      } else {
        raf = null;
        onComplete();
      }
    }
    raf = requestAnimationFrame(step);
  }

  // Travel time scaled a little by distance so long hops don't feel instant.
  function travelFor(a, b) {
    const d = Math.hypot(b.x - a.x, b.y - a.y);
    return 520 + d * 9;
  }

  // Walk the path: tween to the next point; pause on intermediate (decoy) stops; when the
  // next point is the final imposter, go to the climax instead of pausing.
  function runPath(i) {
    if (i >= path.length - 1) {
      climax();
      return;
    }
    const lastTarget = i + 1 === path.length - 1;
    tween(path[i], path[i + 1], travelFor(path[i], path[i + 1]), () => {
      if (lastTarget) {
        climax();
      } else {
        timers.push(setTimeout(() => runPath(i + 1), 300));
      }
    });
  }

  // Arrived on the imposter: tighten the beam, hold a beat, then light the whole stage so
  // every imposter name flares red together, then finish.
  function climax() {
    radiusFactor = 0.16;
    timers.push(
      setTimeout(() => {
        lit = true;
        timers.push(setTimeout(finish, 1400));
      }, 850)
    );
  }

  // Hand control back to ResultsScreen exactly once.
  function finish() {
    if (done) return;
    done = true;
    cleanup();
    if (typeof onDone === 'function') onDone();
  }

  // Jump straight to the lit stage (the answer) and finish shortly after — used by the
  // skip control and Enter/Space.
  function skip() {
    if (done || lit) return;
    cleanup();
    radiusFactor = 0.16;
    lit = true;
    timers.push(setTimeout(finish, 700));
  }

  function cleanup() {
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    timers.forEach(clearTimeout);
    timers = [];
  }

  // Enter/Space skips from anywhere (Space's default page-scroll is suppressed).
  function onKeydown(event) {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    skip();
  }

  onMount(() => {
    reduced =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) {
      // No roam: light the stage immediately, then finish after a short beat.
      lit = true;
      timers.push(setTimeout(finish, 1100));
    } else {
      beamX = start.x;
      beamY = start.y;
      runPath(0);
    }
  });

  onDestroy(cleanup);
</script>

<svelte:window on:keydown={onKeydown} />

<div class="spotlight">
  <!-- The stage: names underneath, dark beam overlay on top. bind the size so the beam
       radius can track the short side. -->
  <div
    class="stage"
    class:lit
    bind:clientWidth={stageW}
    bind:clientHeight={stageH}
  >
    {#each players as player, i}
      <span
        class="name"
        class:imposter={player.isImpostor}
        class:jester={player.isJester}
        class:crewmate={!player.isImpostor && !player.isJester}
        style="left: {positions[i].x}%; top: {positions[i].y}%"
      >{player.name}</span>
    {/each}

    <!-- The beam: a dark overlay with one transparent hole following (--x,--y) at radius
         (--r). When `lit`, it fades away so the whole stage — every imposter — shows. -->
    <div
      class="beam"
      style="--x: {beamX}%; --y: {beamY}%; --r: {radiusPx}px"
      aria-hidden="true"
    ></div>
  </div>

  <button type="button" class="skip-btn" on:click={skip}>Skip</button>
</div>

<style>
  /* Sits in place of ResultsScreen's static card while the lead-in plays. */
  .spotlight {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
    width: 100%;
  }

  /* The dark stage. overflow:hidden keeps scattered names + the beam from spilling out
     (so no horizontal scroll on narrow screens). */
  .stage {
    position: relative;
    width: 100%;
    aspect-ratio: 1 / 1;
    max-height: 72vh;
    border-radius: 12px;
    background-color: #000;
    overflow: hidden;
  }

  /* Player names scattered around the stage, centred on their point. Role colour via
     tokens only (Grayscale-safe). They're rendered at full colour but hidden under the
     dark beam overlay until the spotlight passes / the stage lights up. */
  .name {
    position: absolute;
    transform: translate(-50%, -50%);
    white-space: nowrap;
    font-size: clamp(1rem, 3.6vw, 1.4rem);
    font-weight: 700;
    text-align: center;
    pointer-events: none;
    /* A soft glow makes a lit name pop out of the dark. */
    text-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
  }
  .name.crewmate {
    color: var(--text);
  }
  .name.imposter {
    color: var(--error);
  }
  .name.jester {
    color: var(--jester);
  }

  /* The spotlight overlay: dark everywhere except a soft transparent circle at the beam
     position. Transitioning --r gives the climax "tighten"; opacity fades it on light-up. */
  .beam {
    position: absolute;
    inset: 0;
    background: radial-gradient(
      circle var(--r) at var(--x) var(--y),
      transparent 0%,
      transparent 55%,
      rgba(0, 0, 0, 0.97) 100%
    );
    transition: opacity 700ms ease;
  }

  /* Climax: the beam clears so the whole stage is visible and every imposter name flares
     red together. */
  .stage.lit .beam {
    opacity: 0;
  }
  .stage.lit .name.imposter {
    animation: flare 600ms ease;
  }
  @keyframes flare {
    0% {
      transform: translate(-50%, -50%) scale(1);
      text-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
    }
    45% {
      transform: translate(-50%, -50%) scale(1.18);
      text-shadow: 0 0 16px var(--error);
    }
    100% {
      transform: translate(-50%, -50%) scale(1);
      text-shadow: 0 0 6px rgba(0, 0, 0, 0.6);
    }
  }

  /* Skip / advance — a comfortable tap target. */
  .skip-btn {
    min-height: 48px;
    padding: 0 24px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }
  .skip-btn:focus-visible {
    outline: 3px solid var(--accent);
    outline-offset: 3px;
  }

  /* Reduced motion: no beam travel and no flare pulse. onMount lights the stage straight
     away; here we make sure nothing animates. */
  @media (prefers-reduced-motion: reduce) {
    .beam {
      transition: none;
    }
    .stage.lit .name.imposter {
      animation: none;
    }
  }
</style>

<script>
  // Results screen — the payoff. Reveals who the imposter(s) were (by name, or the
  // "Player N" fallback, matching the reveal/pass screens) and what the secret word
  // was, then offers a settings-preserving "Play again".
  import { gameState, playAgain, displayName } from '../lib/game-state.js';
  import { settings } from '../lib/settings.js';
  import SpotlightReveal from '../components/SpotlightReveal.svelte';

  // Optional "Spotlight" lead-in (the Imposter reveal setting). When on, the dramatic
  // hunt plays first and `revealed` flips when it finishes (or is skipped), after which
  // the same static results text below is shown. Default 'static' skips straight to it.
  let revealed = false;
  $: useSpotlight = $settings.resultsRevealStyle === 'spotlight';

  // The roster the Spotlight animation needs: each player's display name + role flags,
  // built from the SAME roles/displayName source the reveal lines below use.
  $: players = $gameState.roles.map((role, i) => ({
    name: displayName($gameState.names, i),
    isImpostor: role.isImpostor,
    isJester: !!role.isJester,
  }));

  // Join names readably: "Alice" / "Alice and Bob" / "Alice, Bob and Cleo".
  function formatList(items) {
    if (items.length <= 1) return items[0] ?? '';
    if (items.length === 2) return `${items[0]} and ${items[1]}`;
    return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`;
  }

  // roles[i] belongs to player i (0-based). Collect the names (or "Player N"
  // fallbacks) of everyone who was an imposter this round.
  $: impostorNames = $gameState.roles
    .map((role, i) => ({ isImpostor: role.isImpostor, index: i }))
    .filter((entry) => entry.isImpostor)
    .map((entry) => displayName($gameState.names, entry.index));

  // Pluralise the reveal line to match the count.
  $: impostorList = formatList(impostorNames);
  $: heading =
    impostorNames.length > 1
      ? `The imposters were ${impostorList}`
      : `The imposter was ${impostorList}`;

  // The jester (when one was in play this round): find the role flagged isJester
  // and surface that player's name. Verbal win — the app just names them; the
  // table already knows if they pulled off being voted out.
  $: jesterIndex = $gameState.hasJester
    ? $gameState.roles.findIndex((role) => role.isJester)
    : -1;
  $: jesterName =
    jesterIndex >= 0 ? displayName($gameState.names, jesterIndex) : '';

  // The prosecutor (when one was in play): find the isProsecutor role, name that player,
  // and name the player they were told to vote out (their targetIndex). Both are shown so
  // the table gets the full story — and can see whether the prosecutor pulled it off.
  $: prosecutorIndex = $gameState.hasProsecutor
    ? $gameState.roles.findIndex((role) => role.isProsecutor)
    : -1;
  $: prosecutorName =
    prosecutorIndex >= 0 ? displayName($gameState.names, prosecutorIndex) : '';
  $: prosecutorTargetName =
    prosecutorIndex >= 0 &&
    typeof $gameState.roles[prosecutorIndex].targetIndex === 'number'
      ? displayName($gameState.names, $gameState.roles[prosecutorIndex].targetIndex)
      : '';

  // The lawyer (when one was in play): find the isLawyer role, name that player, and name
  // their secret "client" (clientIndex). Mirror of the prosecutor reveal above — both are
  // shown so the table gets the full story. No win is computed (no voting screen); the
  // table resolves the lawyer's outcome verbally, like the jester/prosecutor.
  $: lawyerIndex = $gameState.hasLawyer
    ? $gameState.roles.findIndex((role) => role.isLawyer)
    : -1;
  $: lawyerName =
    lawyerIndex >= 0 ? displayName($gameState.names, lawyerIndex) : '';
  $: lawyerClientName =
    lawyerIndex >= 0 &&
    typeof $gameState.roles[lawyerIndex].clientIndex === 'number'
      ? displayName($gameState.names, $gameState.roles[lawyerIndex].clientIndex)
      : '';

  // The hint the imposter(s) saw this round, surfaced for everyone. Trimmed to a
  // string; an empty result (null / blank / non-string) falls back to an error
  // message instead of a hint.
  $: hint = typeof $gameState.hint === 'string' ? $gameState.hint.trim() : '';
</script>

{#if useSpotlight && !revealed}
  <!-- Dramatic lead-in: hunt for the imposter in the dark, then show the results below. -->
  <SpotlightReveal {players} onDone={() => (revealed = true)} />
{:else}
  <section class="screen">
    <p class="title">Results</p>
    <p class="impostors">{heading}</p>
    {#if jesterName}
      <p class="jester">The jester was {jesterName}</p>
    {/if}
    {#if prosecutorName}
      <p class="prosecutor">The prosecutor was {prosecutorName} — their target was {prosecutorTargetName}</p>
    {/if}
    {#if lawyerName}
      <p class="lawyer">The lawyer was {lawyerName} — their client was {lawyerClientName}</p>
    {/if}
    <p class="word">The word was "{$gameState.word}"</p>
    {#if hint}
      <p class="hint">The imposter's hint was "{hint}"</p>
    {:else}
      <p class="hint">An error occurred.</p>
    {/if}
    <button type="button" class="play-again-btn" on:click={playAgain}>
      Play again
    </button>
  </section>
{/if}

<style>
  /* Centred layout — uses the dark-theme tokens from app.css. */
  .screen {
    background-color: var(--bg-surface);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    align-items: center;
    text-align: center;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
  }

  /* The reveal line — emphasised with the error token, echoing the imposter
     card on the reveal screen. */
  .impostors {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--error);
  }

  /* The jester reveal (only shown on a jester round) — light pink, echoing the
     jester reveal card. */
  .jester {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--jester);
  }

  /* The prosecutor reveal (only shown on a prosecutor round) — gold, echoing the
     prosecutor reveal card. Names both the prosecutor and their target. */
  .prosecutor {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--prosecutor);
  }

  /* The lawyer reveal (only shown on a lawyer round) — teal, echoing the lawyer
     reveal note. Names both the lawyer and their client. */
  .lawyer {
    margin: 0;
    font-size: 1.25rem;
    font-weight: 700;
    color: var(--lawyer);
  }

  .word {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text);
  }

  /* The imposter's hint (or the error fallback), shown to everyone at the end. */
  .hint {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-muted);
  }

  .play-again-btn {
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
</style>

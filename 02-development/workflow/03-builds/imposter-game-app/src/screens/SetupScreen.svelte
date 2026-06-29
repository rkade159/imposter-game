<script>
  // Setup screen: the user picks player count, impostor count, and a word
  // source, then presses Start. Start picks the secret word and hands the full
  // config to startGame(), which generates the roles and routes to the reveal
  // loop — so this screen no longer has a "ready" mode of its own.
  import { onMount } from 'svelte';
  import { get } from 'svelte/store';
  import { gameState, startGame, displayName } from '../lib/game-state.js';
  import {
    MIN_PLAYERS,
    MAX_PLAYERS,
    DEFAULT_PLAYERS,
    MIN_IMPOSTORS,
    DEFAULT_IMPOSTORS,
    JESTER_MIN_PLAYERS,
    PROSECUTOR_MIN_PLAYERS,
  } from '../lib/config.js';
  import {
    WORD_SOURCES,
    DEFAULT_WORD_SOURCE,
    loadWords,
    pickWord,
    isCustomSource,
  } from '../lib/word-source.js';
  import Stepper from '../components/Stepper.svelte';
  import SettingsScreen from './SettingsScreen.svelte';
  import RolesScreen from './RolesScreen.svelte';
  import CustomListBuilder from './CustomListBuilder.svelte';
  import Modal from '../components/Modal.svelte';
  import { sessionSettings } from '../lib/session-settings.js';
  import { settings } from '../lib/settings.js';
  import { rolesConfig } from '../lib/roles-config.js';
  import { trollState } from '../lib/troll-state.js';
  import { rollTroll, buildTrollHints } from '../lib/troll-mode.js';

  // Whether the Settings screen is showing in place of the setup form. Kept as a
  // local flag (not a route) so this component stays mounted and the in-flight
  // form state below survives opening and closing Settings — see the note on
  // remount-on-return where `saved` is read.
  let showSettings = false;

  // Same in-place-panel pattern for the Roles screen (top-left button), where the
  // optional Jester role is toggled.
  let showRoles = false;

  // Whether the Custom List builder is showing in place of the setup form (same
  // in-place-panel pattern as Settings). `customSelection` holds the word strings
  // the user last confirmed, so re-opening the builder pre-highlights them.
  // `previousSource` is the source to fall back to if they leave via Back. All of
  // this is round-scoped local state — never persisted (see the remount guard
  // where `saved.wordSource` is read).
  let showBuilder = false;
  let customSelection = [];
  let previousSource = DEFAULT_WORD_SOURCE;

  // Anti-Yusuf popup state. While the feature is on, pressing Start opens this
  // dialog (see start()) instead of starting the round; blockedName holds the last
  // player's name shown in the message.
  let showBlock = false;
  let blockedName = '';

  // In-flight values the user is editing, before Start commits them. Each is a
  // number when valid, or null when its field is empty (which disables Start).
  //
  // Seed from gameState when it already holds a round's config: that's the
  // "Play again" case, where the same group's settings should come back
  // pre-filled. On a fresh load those fields are null, so fall back to the
  // defaults. Read once here — the routing ladder remounts this screen on every
  // return to setup, so a fresh read each time is correct.
  const saved = get(gameState);
  let players = saved.playerCount ?? DEFAULT_PLAYERS;
  let impostors = saved.impostorCount ?? DEFAULT_IMPOSTORS;
  // Non-persistence guard: a custom list is round-scoped, so it isn't carried
  // across rounds. playAgain() preserves wordSource, so a remount can arrive with
  // 'custom' but no subset behind it — fall back to the default source then.
  let selectedSource = isCustomSource(saved.wordSource)
    ? DEFAULT_WORD_SOURCE
    : (saved.wordSource ?? DEFAULT_WORD_SOURCE);

  // Custom player names, one entry per player ('' = use the "Player N" placeholder).
  // Seeded from gameState for the "Play again" case, then kept in sync with the
  // player count below.
  let names = saved.names?.length ? [...saved.names] : [];

  // Word-loading state. `words` holds the loaded list; `loadStatus` drives the
  // confirmation / error message and gates Start.
  let words = [];
  let loadStatus = 'loading'; // 'loading' | 'loaded' | 'error'

  // Whether the Jester role actually applies to this round: the toggle is on AND
  // there are enough players for it (1 jester + ≥1 imposter + ≥1 crewmate). Read
  // by the imposter-count cap below and passed to startGame().
  $: jesterActive =
    $rolesConfig.jesterEnabled &&
    typeof players === 'number' &&
    players >= JESTER_MIN_PLAYERS;

  // Auto-off guard: if the player count drops below the jester minimum while the
  // toggle is on, turn it off (it must be re-enabled deliberately). Guarded so it
  // only writes when needed. Inert while MIN_PLAYERS is 3, but correct/future-proof.
  $: if (
    typeof players === 'number' &&
    players < JESTER_MIN_PLAYERS &&
    $rolesConfig.jesterEnabled
  ) {
    $rolesConfig.jesterEnabled = false;
  }

  // Whether the Prosecutor role applies this round: the toggle is on AND there are
  // enough players. The Prosecutor occupies an existing imposter slot (it doesn't add
  // one), so — unlike the jester — it does NOT affect maxImpostors: today's cap already
  // leaves at least one crewmate-type for it to target. Passed to startGame() below.
  $: prosecutorActive =
    $rolesConfig.prosecutorEnabled &&
    typeof players === 'number' &&
    players >= PROSECUTOR_MIN_PLAYERS;

  // Auto-off guard mirroring the jester's: if the player count drops below the
  // prosecutor minimum while the toggle is on, turn it off. Guarded so it only writes
  // when needed. Inert while MIN_PLAYERS is 3, but correct/future-proof.
  $: if (
    typeof players === 'number' &&
    players < PROSECUTOR_MIN_PLAYERS &&
    $rolesConfig.prosecutorEnabled
  ) {
    $rolesConfig.prosecutorEnabled = false;
  }

  // Max impostors depends on the live player count — always leave at least one
  // crewmate, and one more slot for the jester when it's active. Falls back to
  // MIN_IMPOSTORS while the player field is empty.
  $: maxImpostors =
    typeof players === 'number' ? players - (jesterActive ? 2 : 1) : MIN_IMPOSTORS;

  // Keep impostors in range when the player count drops. Guarded so it only
  // assigns when actually out of range — otherwise it would loop forever.
  $: if (typeof impostors === 'number' && impostors > maxImpostors) {
    impostors = maxImpostors;
  }

  // Keep one name field per player as the count changes: append empty strings when
  // it grows, trim from the end when it shrinks. Preserves already-typed names, and
  // guarded so it only assigns when the length actually differs (avoids a loop).
  $: if (typeof players === 'number' && players > 0 && names.length !== players) {
    names =
      names.length < players
        ? [...names, ...Array(players - names.length).fill('')]
        : names.slice(0, players);
  }

  // The selected source's metadata, for the "Loaded N <countNoun>" text.
  $: currentSource = WORD_SOURCES.find((source) => source.id === selectedSource);

  // Per-field validity plus the overall Start gate. Out-of-range typed values
  // disable Start as feedback rather than being silently clamped.
  $: playersValid =
    typeof players === 'number' &&
    Number.isInteger(players) &&
    players >= MIN_PLAYERS &&
    players <= MAX_PLAYERS;
  $: impostorsValid =
    typeof impostors === 'number' &&
    Number.isInteger(impostors) &&
    impostors >= MIN_IMPOSTORS &&
    impostors <= maxImpostors;
  $: canStart =
    playersValid && impostorsValid && loadStatus === 'loaded' && words.length > 0;

  // Fetch a source's word list, tracking status so the UI can react. A failed
  // fetch leaves loadStatus 'error' and words empty, which keeps Start disabled.
  async function load(sourceId) {
    loadStatus = 'loading';
    words = [];
    try {
      words = await loadWords(sourceId);
      loadStatus = 'loaded';
    } catch (error) {
      loadStatus = 'error';
    }
  }

  // Auto-load on first render — the source is labelled "Auto-loaded".
  onMount(() => load(selectedSource));

  // Word Source changed. The custom list has no file to fetch — picking it opens
  // the builder instead of loading. Any other source loads as before, and we
  // record it as previousSource so Back from the builder can restore it (the
  // dropdown's bind already overwrote selectedSource by the time this fires, so
  // previousSource is the only handle on where we came from).
  function onSourceChange() {
    if (isCustomSource(selectedSource)) {
      showBuilder = true;
      return;
    }
    previousSource = selectedSource;
    load(selectedSource);
  }

  // The user confirmed a custom subset. Commit it as this round's word list:
  // treat it exactly like a loaded source so the existing canStart gate and
  // start() (pickWord) work unchanged. Remember the chosen words so re-opening
  // the builder pre-highlights them.
  function handleCustomConfirm(subset) {
    words = subset;
    loadStatus = 'loaded';
    customSelection = subset.map((entry) => entry.word);
    selectedSource = 'custom';
    showBuilder = false;
  }

  // The user left the builder without confirming: revert to the previous source
  // and load it so the dropdown and Start return to a valid state.
  function handleCustomExit() {
    showBuilder = false;
    selectedSource = previousSource;
    load(previousSource);
  }

  // Start the round: pick one entry now and hand the full config to startGame(),
  // which builds the roles and moves to the first reveal. Guarded by canStart, so
  // the committed state is always complete and in range.
  function start() {
    if (!canStart) return;
    // Anti-Yusuf: while the feature is on, refuse to start and call out the last
    // player to pass to (index playerCount-1). displayName() gives their typed name
    // or the "Player N" fallback. Turning the toggle off is the only way past this.
    if ($sessionSettings.antiYusuf) {
      blockedName = displayName(names, players - 1);
      showBlock = true;
      return;
    }
    // Read word/hint defensively. An entry is normally { word, hint }, but
    // `?? entry` lets an old-format bare string still yield a usable word, and a
    // missing hint becomes null — the reveal and results screens then show
    // "An error occurred." instead of a hint rather than blocking the game.
    const entry = pickWord(words);

    // Troll Mode: roll once for the round about to start (after the Anti-Yusuf
    // gate, so a blocked Start doesn't burn a roll). On a hit, EVERYONE becomes an
    // imposter and each gets their own random hint, so every player thinks they're
    // the lone imposter. The roll also advances the persisted cross-round state,
    // and Guaranteed asks us to turn the setting back off after firing once. A
    // real word/hint is still committed below — it's simply never shown when no
    // one is a crewmate.
    const { isTroll, nextState, disableMode } = rollTroll(
      $settings.trollMode,
      get(trollState)
    );
    trollState.set(nextState);
    if (disableMode) $settings.trollMode = 'off';

    startGame({
      playerCount: players,
      impostorCount: impostors,
      wordSource: selectedSource,
      word: entry.word ?? entry,
      hint: entry.hint ?? null,
      names,
      trollHints: isTroll ? buildTrollHints(words, players) : null,
      // Jester only applies when the toggle is on and the table is big enough;
      // startGame() drops it anyway on a troll round (troll wins).
      jesterEnabled: jesterActive,
      // Prosecutor: same gating; startGame() drops it on a troll round too.
      prosecutorEnabled: prosecutorActive,
    });
  }
</script>

<!-- The Custom List builder and Settings each open in place of the form; the
     form's local state is preserved because this component stays mounted
     underneath. -->
{#if showBuilder}
  <CustomListBuilder
    initialSelection={customSelection}
    onConfirm={handleCustomConfirm}
    onExit={handleCustomExit}
  />
{:else if showSettings}
  <!-- Pass the live imposter count so Settings can disable the "Reveal fellow
       imposters" toggle when there's only one imposter (no others to show). -->
  <SettingsScreen
    onClose={() => (showSettings = false)}
    impostorCount={impostors}
  />
{:else if showRoles}
  <!-- Pass the live player count so Roles can disable the Jester toggle below the
       minimum table size. -->
  <RolesScreen
    onClose={() => (showRoles = false)}
    playerCount={players}
  />
{:else}
<!-- Pick counts + word source, then press Start to begin the round. -->
<section class="screen">
  <!-- Header row: Roles entry on the left, Settings on the right. -->
  <div class="header-row">
    <button
      type="button"
      class="nav-btn"
      on:click={() => (showRoles = true)}
    >🃏 Roles</button>

    <button
      type="button"
      class="nav-btn"
      on:click={() => (showSettings = true)}
    >⚙ Settings</button>
  </div>

  <Stepper
    label="Total Players:"
    id="player-count"
    bind:value={players}
    min={MIN_PLAYERS}
    max={MAX_PLAYERS}
  />

  <Stepper
    label="Number of Imposters:"
    id="impostor-count"
    bind:value={impostors}
    min={MIN_IMPOSTORS}
    max={maxImpostors}
  />

  <!-- One name field per player. Optional: a blank field falls back to "Player N"
       (see displayName in game-state.js), so these never gate Start. The list
       grows/shrinks with the player count via the reactive sync above. -->
  <div class="names-field">
    <span class="field-label">Player Names:</span>
    {#each names as _name, i}
      <input
        class="name-input"
        type="text"
        autocomplete="off"
        maxlength="20"
        placeholder={`Player ${i + 1}`}
        aria-label={`Name for player ${i + 1}`}
        bind:value={names[i]}
      />
    {/each}
  </div>

  <div class="source-field">
    <label class="field-label" for="word-source">Word Source:</label>
    <select
      id="word-source"
      class="source-select"
      bind:value={selectedSource}
      on:change={onSourceChange}
    >
      {#each WORD_SOURCES as source}
        <option value={source.id}>{source.label}</option>
      {/each}
    </select>
  </div>

  <!-- Word-load feedback: confirmation, an interim note, or an error. -->
  {#if loadStatus === 'loaded'}
    <p class="load-chip">✓ Loaded {words.length} {currentSource.countNoun}</p>
  {:else if loadStatus === 'loading'}
    <p class="load-status">Loading {currentSource.countNoun}…</p>
  {:else}
    <p class="load-error">
      Couldn't load {currentSource.countNoun}. Check your connection and try again.
    </p>
  {/if}

  <button type="button" class="start-btn" on:click={start} disabled={!canStart}>
    Start Game
  </button>
</section>
{/if}

<!-- Anti-Yusuf block: shown when Start is pressed while the feature is on. The
     popup names the last player; dismissing it returns to setup without starting. -->
{#if showBlock}
  <Modal onClose={() => (showBlock = false)}>
    Ha ha nice try, I'm not going to let {blockedName} cheat by being last and seeing who the imposter is!
  </Modal>
{/if}

<style>
  /* Setup screen layout — uses the dark-theme tokens from app.css.
     Stepper styles live in components/Stepper.svelte. */
  .screen {
    background-color: var(--bg-surface);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Top navigation row: Roles (left) and Settings (right) across the form's top. */
  .header-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  /* Settings / Roles entries — small ghost buttons that bookend the header row. */
  .nav-btn {
    min-height: 40px;
    padding: 0 14px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-weight: 600;
    font-size: 0.95rem;
    cursor: pointer;
  }

  /* Label for the word-source dropdown (matches the steppers' label style). */
  .field-label {
    font-weight: 600;
    font-size: 1rem;
  }

  .source-field {
    display: flex;
    flex-direction: column;
  }

  /* Stacked list of name inputs — the gap separates the label from the first
     field and the fields from each other. */
  .names-field {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  /* Matches the .count-input / .source-select look so the name fields read as
     part of the same control set. */
  .name-input {
    min-height: 48px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-size: 1rem;
    padding: 0 12px;
  }

  .source-select {
    margin-top: 8px;
    min-height: 48px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-size: 1rem;
    padding: 0 12px;
  }

  /* Word-load feedback messages. */
  .load-chip,
  .load-status,
  .load-error {
    margin: 0;
    font-size: 0.95rem;
  }

  .load-chip {
    color: var(--success);
  }

  .load-status {
    color: var(--text-muted);
  }

  .load-error {
    color: var(--error);
  }

  /* Primary action — start the game. */
  .start-btn {
    min-height: 48px;
    border-radius: 8px;
    border: none;
    background-color: var(--accent);
    color: white;
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }

  .start-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>

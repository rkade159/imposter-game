<script>
  // Roles screen: the round's role roster, reached from the Setup screen's
  // top-left "Roles" button and rendered in place of the setup form (so it reads
  // as its own screen while SetupScreen stays mounted — the in-progress form state
  // survives the round trip, same pattern as SettingsScreen).
  //
  // Crewmate and Imposter are ALWAYS in play, so they're shown as static roster
  // entries, NOT toggles. Only the optional Jester is a toggle, backed by the
  // persisted `rolesConfig` store (kept separate from Settings on purpose).
  import { rolesConfig } from '../lib/roles-config.js';
  import { JESTER_MIN_PLAYERS, PROSECUTOR_MIN_PLAYERS } from '../lib/config.js';
  import Toggle from '../components/Toggle.svelte';

  // Called when the user is done — the parent (SetupScreen) hides this screen.
  export let onClose;

  // The round's currently-configured player count, from the setup form. The Jester
  // needs one jester + at least one imposter and one crewmate, so it's disabled
  // (with a note) below the minimum. (Inert while MIN_PLAYERS is 3, but correct.)
  export let playerCount = null;
  $: jesterDisabled = !(playerCount >= JESTER_MIN_PLAYERS);
  // The Prosecutor occupies one imposter slot and needs a crewmate-type to target,
  // so it's disabled (with a note) below its minimum, same as the Jester.
  $: prosecutorDisabled = !(playerCount >= PROSECUTOR_MIN_PLAYERS);
</script>

<section class="screen">
  <h2 class="title">Roles</h2>

  <div class="rows">
    <!-- Always-on roles: shown for context, deliberately NOT toggles. -->
    <div class="role-static">
      <span class="role-name role-crewmate">📝 Crewmate</span>
      <span class="role-desc">Knows the secret word. Help spot the imposter(s).</span>
    </div>

    <div class="role-static">
      <span class="role-name role-impostor">🎭 Imposter</span>
      <span class="role-desc">Doesn't know the word — gets a vague hint and must blend in.</span>
    </div>

    <!-- The one optional role. Light-pink accent matches the reveal/banner/wheel. -->
    <div class="role-toggle">
      <span class="role-name role-jester">🃏 Jester</span>
      <Toggle
        id="role-jester"
        label="Enable the Jester"
        description={jesterDisabled
          ? `Knows the word like a crewmate, but wins by getting voted out — act like the imposter! (Needs ${JESTER_MIN_PLAYERS}+ players.)`
          : 'Knows the word like a crewmate, but wins by getting voted out — act like the imposter!'}
        disabled={jesterDisabled}
        bind:value={$rolesConfig.jesterEnabled}
      />
    </div>

    <!-- The second optional role. Gold accent matches the reveal + results line. -->
    <div class="role-toggle">
      <span class="role-name role-prosecutor">🔨 Prosecutor</span>
      <Toggle
        id="role-prosecutor"
        label="Enable the Prosecutor"
        description={prosecutorDisabled
          ? `A secret imposter who's told one player to get voted out — do it and they win! (Needs ${PROSECUTOR_MIN_PLAYERS}+ players.)`
          : "A secret imposter who's told one player to get voted out — do it and they win the round!"}
        disabled={prosecutorDisabled}
        bind:value={$rolesConfig.prosecutorEnabled}
      />
    </div>
  </div>

  <button type="button" class="back-btn" on:click={onClose}>
    ← Back to setup
  </button>
</section>

<style>
  /* Matches the setup/settings card look — dark surface, rounded, stacked. */
  .screen {
    background-color: var(--bg-surface);
    border-radius: 12px;
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .title {
    margin: 0;
    font-size: 1.5rem;
  }

  /* Vertical list of role rows. */
  .rows {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  /* Static (always-on) role: a coloured name over a muted description. */
  .role-static {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  /* Optional role: the coloured name, then the toggle row beneath it. */
  .role-toggle {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .role-name {
    font-weight: 700;
    font-size: 1.05rem;
  }
  .role-desc {
    color: var(--text-muted);
    font-size: 0.9rem;
    line-height: 1.4;
  }

  /* Role colours via the shared tokens, so Grayscale neutralises them together. */
  .role-crewmate {
    color: var(--accent);
  }
  .role-impostor {
    color: var(--error);
  }
  .role-jester {
    color: var(--jester);
  }
  .role-prosecutor {
    color: var(--prosecutor);
  }

  /* Secondary action — outlined "go back", matching SettingsScreen. */
  .back-btn {
    align-self: flex-start;
    min-height: 48px;
    padding: 0 20px;
    border-radius: 8px;
    border: 1px solid var(--text-muted);
    background-color: var(--bg);
    color: var(--text);
    font-weight: 600;
    font-size: 1rem;
    cursor: pointer;
  }
</style>

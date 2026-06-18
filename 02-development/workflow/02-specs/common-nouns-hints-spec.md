# Spec — Common Nouns hint rewrite

## Source brief

[02-development/workflow/01-brief/common-nouns-hints-brief.md](../01-brief/common-nouns-hints-brief.md)

## Target file

`02-development/workflow/03-builds/imposter-game-app/public/data/common-nouns.json`
— an array of 517 `{ "word": string, "hint": string }` objects. Only `hint`
values change. `word` values and array order are **preserved exactly**.

## Acceptance criteria (the contract)

A hint is **valid** only if ALL of the following hold:

| # | Rule | Pass | Fail |
|---|---|---|---|
| 1 | **One word** — no whitespace, no articles | `Shade` | `a lamp shade` |
| 2 | **Not a category label** | `Cow` (for beef) | `food`, `furniture`, `a tool` |
| 3 | **Noun / proper name, not an adjective** | `Fridge` | `cozy`, `red`, `tall` |
| 4 | **Not a near-definition / give-away** | apple→`Eve` | apple→`fruit` |
| 5 | **Real, traceable connection** | necklace→`Locket` | random unrelated word |
| 6 | **Oblique** — needs a beat to connect | knife→`Edge` | knife→`blade` |
| 7 | **No duplicate hint** anywhere in the file (case-insensitive) | — | two words → `food` |
| 8 | **Hint ≠ any `word` in the list** | chain→`Gang` | necklace→`chain` |

Rare-adjective exception (rule 3): allowed only if it does **not** oversimplify
the word. Default to a noun whenever one exists.

## Connection levers (how to find a hint)

- **Origin / source:** what the word comes from or contains — egg→`Humpty`,
  wool→`Merino`, grape→`Wrath`.
- **Compound / wordplay:** a word it pairs into, or part of its own word —
  lamp→`Shade`, basket→`Picnic`, knee→`Jerk`, fruit→`Loom`.
- **Function / behaviour / setting:** what it does or where it lives —
  magnet→`Fridge`, umbrella→`Poppins`, library→`Shush`.
- **Synonym (oblique) / cultural:** a name, brand, or reference it evokes —
  apple→`Eve`, frog→`Kermit`, doctor→`Who`, bird→`Twitter`.

## Worked examples (target quality)

| Word | Old hint | New hint | Lever |
|---|---|---|---|
| apple | food | Eve | cultural |
| lamp | makes light | Shade | compound |
| knife | found in a kitchen | Edge | property |
| necklace | something you wear | Locket | associated object |
| cat | a living thing | Whiskers | part |
| salad | food | Leaves | content |
| slipper | something you wear | Fireside | setting (noun, not "cozy") |
| guitar | a musical instrument | Strings | part |
| clock | tells the time | Tick | sound |
| magnet | it sticks | Fridge | function |

## Verification

Automated lint (run from the `data/` folder), all must pass:

```js
const d = require("./common-nouns.json");
d.length === 517 && d.every(e => e.word && e.hint);          // shape
d.every(e => !/\s/.test(e.hint));                            // rule 1
new Set(d.map(e => e.hint.toLowerCase())).size === d.length; // rule 7
const words = new Set(d.map(e => e.word.toLowerCase()));
d.every(e => !words.has(e.hint.toLowerCase()));              // rule 8
```

Plus a manual read for rules 2–6 (these can't be fully automated) and an in-app
check: imposter sees a one-word oblique hint on the reveal screen across several
Common Nouns rounds.

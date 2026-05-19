<!--
============================================================================
TEACHING NOTE: This is LAYER 1 — THE MAP.

CLAUDE.md is auto-loaded into every conversation. It's always in context.
That makes it prime real estate. Use it for:

1. Folder structure (so the agent always knows where things live)
2. ID systems & naming conventions (so files land in the right place)
3. File placement rules (so nothing gets lost)
4. Quick navigation table (task → workspace)

Do NOT put:
  - Detailed instructions (those go in workspace CONTEXT.md files)
  - Voice/style guides (those go in docs/)
  - Pipeline details (those go in workflows/CONTEXT.md)

Keep it under 200 lines. Every line here costs tokens in EVERY conversation.
============================================================================
-->

## What This Is

A workspace system for Rehaan's development of a web application based off the game 'Imposter'. Planning, development and design are each in their own separate silo. An agent drops into a workspace, reads its CONTEXT.md, does its work, and exits.

**CONTEXT.md** (top-level) routes you to the right workspace. This file is the map.

## Folder Structure

This is rough outline of the folder structure of this project (beware that there may be some small changes in reality compared to the map).

```
imposter-game/
├── CLAUDE.md                         ← Always-loaded global context
├── CONTEXT.md                        ← Task router
├── CHECKLIST.md                      ← Project checklist
├── README.md                         ← Project overview
│
├── 01-plan/                          ← Planning documents, references, and examples
│   ├── CONTEXT.md
│   ├── Imposter-Game-Rules.docx      ← Main rules document
│   ├── REFERENCES.md                 ← Planning references
│   │
│   ├── plans/
│   │
│   └── references/
│       └── examples-of-good-work/
│           ├── crewmate-screen.png
│           ├── imposter-screen.png
│           └── main-screen.png
│
├── 02-development/                   ← Development workspace
│   ├── CONTEXT.md
│   │
│   ├── references/
│   │   └── technical-standards.md    ← Technical standards for development
│   │
│   └── workflow/
│       ├── CONTEXT.md                ← Development workflow routing
│       ├── 01-brief/                 ← What to build
│       ├── 02-specs/                 ← How to build it
│       └── 03-builds/                ← The actual implementation work
│
└── 03-design/                        ← Design workspace
    ├── CONTEXT.md
    │
    ├── references/
    │   └── design-system.md          ← Visual design rules and quality floor
    │
    └── workflow/
        ├── CONTEXT.md                ← Design workflow routing
        ├── 01-brief/                 ← Design brief
        ├── 02-specs/                 ← Design specifications
        └── 03-builds/                ← Design execution work

```

## Quick Navigation

| Want to... | Go here |
|------------|---------|
| **Brainstorm or make a rough plan** | `01-plan/CONTEXT.md` |
| **Build a feature from a plan** | `02-development/CONTEXT.md` |
| **See a full explanation of the basic game rules** | `01-plan/references/REFERENCES.md` |
| **Understand what principles to abide by when coding** | `02-development/references/technical-standards.md` |
| **Add design to the game/website** | `03-design/CONTEXT.md` |
| **Understand the design principles to abide by** | `03-design/references/design-system.md` |

---

## Cross-Workspace Flow

```
03-design (polishing plan + generating spec + building code for design)
     ↑
01-plan (brainstorming + thinking about best practises, to be turned into features)
     ↓
02-development (polishing plan + generating spec + building code for functionality)

```

<!--
TEACHING NOTE: Cross-workspace flow is ONE-WAY.
The output in 01-plan feeds into the inputs in 02-development
and 03-design. But neither feed back.

This is important because it means an agent in 01-plan
never needs to know about what's happening in the other stages
of the pipeline.
-->

---

## ID & Naming Conventions

<!--
TEACHING NOTE: Naming conventions belong in CLAUDE.md because
they apply EVERYWHERE. Any agent creating a file needs these rules,
regardless of which workspace it's in.
-->

| Content Type | Pattern | Example |
|---|---|---|
| Plans | `[slug]-plan-[status].md` | `imposter-role-plan-review.md` |
| Briefs | `[slug]-brief.md` | `custom-words-brief.md` |
| Specs | `[slug]-spec.md` | `ui-for-menu-spec.md` |
| Builds | `[slug].[ext]` | `crewmate.py` |

<!-- **Statuses:** `draft` → `review` → `final` -->

---

## File Placement Rules

### Plans

- **Plans:** `01-plan/plans/[slug]-plan-[status].md`
- **Ready for production:** Copy to `02-development/workflow/01-brief/` OR `03-design/workflow/01-brief/` depending on if the plan is for a new feature or new design

### Development 

- **Briefs:** `02-development/workflow/01-brief/[slug]-brief.md`
- **Specs:** `02-development/workflow/02-specs/[slug]-spec.md`
- **Builds:** `02-development/workflow/03-builds/[slug].[ext]/`

### Design

- **Briefs:** `03-design/workflow/01-brief/[slug]-brief.md`
- **Specs:** `03-design/workflow/02-specs/[slug]-spec.md`
- **Builds:** `03-design/workflow/03-builds/[slug].[ext]/`

---

## Token Management

<!--
TEACHING NOTE: This section is the #1 thing people miss.
It tells agents what NOT to load. Without this, agents will
try to read everything and blow their context window.
-->

**Each workspace is siloed.** Don't load everything.

- Brainstorming a plan? → Load `01-plan/CONTEXT.md` + `01-plan/references/REFERENCES.md`. Skip 02-development and 03-design entirely.
- Building a feature? → Load `02-development/references/technical-standards.md`. Skip 01-plan references.
- Adding design to the website? → You only need to Load `03-design/references/design-system.md`. Only pull from 01-plan if you need a full understanding or the game, or only pull from 02-development if you need to understand the coding style you need to adhere to when adding a feature.

The CONTEXT.md files tell you what to load for each task. Trust them.

---

## Skills & Tools Available (IGNORE FOR NOW)

<!--
TEACHING NOTE: This section maps which skills and MCPs are
available at the SYSTEM level. Individual workspaces and pipeline
stages reference specific tools in their own CONTEXT.md files.

Think of this as the "installed tools" list. The workspace CONTEXT
files are the "when to use them" instructions.

You can wire up to 15 skills per workspace. They don't all live here —
workspace CONTEXT.md files reference them at the point of use.
-->

<!-- | Tool | Type | Used In |
|---|---|---|
| `/humanizer` | Skill | writing-room (Stage: review), community (all posts) |
| `/doc-cowriting` | Skill | writing-room (long-form drafts) |
| `/frontend-design` | Skill | production (Stage 03: builds) |
| `/pdf` | Skill | production (Stage 04: output) |
| `pptx` | Skill | community (events), production |
| `/webapp-testing` | Skill | production (Stage 03: builds) |
| `Context7` | MCP | production (Stage 02: specs - fetch library docs) |
| Web Search | MCP | writing-room (research), community (trend checking) |

See each workspace's CONTEXT.md for when and how these tools get invoked. -->

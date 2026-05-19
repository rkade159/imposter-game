# Acme DevRel – Task Router

<!--
================================================================
TEACHING NOTE: This is LAYER 2 — THE ROUTER.

This file does ONE job: route agents to the right workspace.
It should be SHORT. 30-50 lines of actual content.

Rules for this file:
  - No detailed instructions (workspace CONTEXT.md handles that)
  - No file placement rules (CLAUDE.md handles that)
  - Just: "What's your task? → Go here. You'll also need X."

The "You'll Also Need" column is critical. It tells agents what
CROSS-WORKSPACE resources to pull. Without it, an agent building
a community post won't know to load the writing-room voice guide.
================================================================
-->

## What This Is

My (Rehaan's) workspace for creating the web application based off of the game 'Imposter'. Three siloed workspaces, each handling one part of the development cycle.

**CLAUDE.md** (always loaded) has the full folder map and naming rules. This file routes you to work.

---

## Task Routing

| Want to... | Go here | You'll Also Need |
|------------|---------|------------------|
| **Brainstorm or make a rough plan** | `01-plan/CONTEXT.md` | Load `01-plan/references/` |
| **Build a feature from a plan** | `02-development/CONTEXT.md` | Load `02-development/references/technical-standards.md` + Load `02-development/workflow/CONTEXT.md` + Specs from `02-development/workflow/02-specs/` |
| **See a full explanation of the basic game rules** | `01-plan/references/REFERENCES.md` |  |
| **Understand what principles to abide by when coding** | `02-development/references/technical-standards.md` |  |
| **Add design to the game/website** | `03-design/CONTEXT.md` | Load `03-design/references/` + Load `03-design/workflow/CONTEXT.md` + Specs from `03-design/workflow/02-specs/` |
| **Understand the design principles to abide by** | `03-design/references/design-system.md` |  |


---

## Workspace Summary

| Workspace | Purpose |
|-----------|---------|
| `01-plan/` | Ideas → polished drafts. We make a plan for a feature or design to be added |
| `02-development/` | Plans → built features. 3-stage pipeline. |
| `03-design/` | Plans → designs initiated. 3-stage pipeline. |

<!-- | Workspace | Purpose | Skills & Tools |
|-----------|---------|----------------|
| `writing-room/` | Ideas → polished drafts. Voice, research, editing. | `/humanizer`, `/doc-coauthoring`, Web Search MCP |
| `production/` | Drafts → built deliverables. 4-stage pipeline. | `/frontend-design`, `/webapp-testing`, Context7 MCP |
| `community/` | Content → distributed across platforms. | `/pptx`, `/humanizer`, platform-specific skills | -->

Each workspace has its own CONTEXT.md with full details. Read that when working in a workspace, not this file.

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
TEACHING NOTE: This diagram appears in both CLAUDE.md and CONTEXT.md.
That's intentional — CLAUDE.md shows it as part of the permanent map,
CONTEXT.md shows it as part of routing context. The duplication is
small (4 lines) and serves different readers (the always-loaded map
vs. the task-specific router).
-->

# Production

<!--
====================================================================
TEACHING NOTE: This workspace demonstrates the PIPELINE pattern.

Production has two levels of CONTEXT.md:
  1. This file (workspace entry point) — routes to docs or workflows
  2. workflows/CONTEXT.md (pipeline entry point) — routes to stages

This is the most complex workspace in the template. It shows:
  - Sub-routing (workspace CONTEXT → pipeline CONTEXT)
  - Reference docs separate from workflow
  - Stage-specific tool integration
  - Creative freedom within constraints (specs vs builds)
====================================================================
-->

## What This Workspace Is

The workflow pipeline for the development silo. Finalized plans from 01-plan
are sent into this workflow to become production ready deliverables/features
that can be used for the website application.

You will be **routed** to here from the `02-development/CONTEXT.md` file. So
the stages that will be taken to get into this workflow pipeline would be:

```
01-plan (planning/writing) → development (the place to be if you want to build) → workflow (building)

```

---

## Where to Go

| You Want To... | Go Here |
|---------------|---------|
| **Access/Create briefs from plans** | `01-brief/` |
| **Access/Create specs (contracts) from briefs** | `02-specs/` |
| **Access/Create features from specifications** | `03-builds/` |

**Don't read everything.** Identify your task, load only what you need.

---

## Verifying a build

When a brief, spec, or build includes a smoke-test / verification checklist for a
new feature, **write the checklist but do NOT run `npm run dev` (or otherwise
launch the app) yourself to verify it.** Rehaan runs `npm run dev` and walks the
checklist himself. Agents can't reliably drive the live browser app in this
environment, so attempting it just wastes time and energy — deliver a clear,
spec-mapped checklist and leave running it to Rehaan.

---

## Folder Structure

```
imposter-game                            ← Root folder
├── README.md                            ← The README.md file which contains what the project does, why the project is
|                                          useful, the specs/features/designs inside the project and how to use it.
└── 02-development/                      ← Development folder for where all the features are going to end up being
    ├── CONTEXT.md                       ← You are here
    |
    ├── references/                      ← Reference docs (load per-task)
    │   └── technical-standards.md       ← The standards that need to be instantiated at all times during development
    |
    └── workflow/                        ← The 3-stage pipeline
        ├── CONTEXT.md                   ← Pipeline routing (READ THIS for builds)
        ├── 01-brief/                    ← What to build (input from 01-plan)
        ├── 02-specs/                    ← Technical plan (contract for the build)
        └── 03-builds/                   ← Actual implementations of the contracts

```

<!-- ## What to Load

| Task | Load These | Skip These |
|------|------------|------------|
| Brief → Spec | The brief from `01-briefs/`, `docs/tech-standards.md` | design-system, component-library |
| Spec → Build | The spec from `02-specs/`, `docs/design-system.md`, `docs/component-library.md`, `docs/tech-standards.md` | writing-room docs |
| Review a build | The spec (as contract), the build output | docs/ (unless checking specific standards) | -->

---

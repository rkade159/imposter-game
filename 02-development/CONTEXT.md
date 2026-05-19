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

The development silo. Finalised plans from 01-plan become production-ready
scripts here.

This is **downstream** from planning:

```
01-plan (planning) → 02-development (building)
```

---

## Where to Go

| You Want To... | Go Here/What you'll need |
|---------------|---------|
| **Understand the pipeline** | `workflow/CONTEXT.md` |
| **Look up technical standards** | `references/technical-standards.md` |
| **Generate a specification from a brief** | `workflow/01-brief/` to retrieve a brief to be generated into a spec, then put the spec in `workflow/02-specs/` |
| **Build a feature from the specification** | `workflow/02-specs/` to retrieve a spec to be built into a feature, then put the code created in `workflow/03-builds/` |
| **Review a feature that was built** | `workflow/03-builds/` (for the build itself) + `workflow/02-specs/` (for the specs for said build) |


**Don't read everything.** Identify your task, load only what you need.

---

## Folder Structure

```
02-development/                       ← Development workspace for building the features of the project
├── CONTEXT.md                        ← You are here
│
├── references/                       ← Reference material used during development
│   └── technical-standards.md        ← Coding standards
│
└── workflow/                         ← Development workflow pipeline
    ├── CONTEXT.md                    ← Development workflow routing instructions
    ├── 01-brief/                     ← Initial development brief and requirements
    ├── 02-specs/                     ← Technical specifications and build plans
    └── 03-builds/                    ← Actual implementation work and build files
```

## What to Load

| Task | Load These | Skip These |
|------|------------|------------|
| Plan → Brief | Retrieve the specific plan needed from `01-plan/plans/`| technical-standards |
| Brief → Spec | The brief from `workflow/01-brief/` + technical standards from `02-development/references/technical-standards.md` | - |
| Spec → Build | The spec from `workflow/02-specs/` + technical standards from `02-development/references/technical-standards.md` | - |
| Review a build | The spec (as contract), the build output | references/ |

---

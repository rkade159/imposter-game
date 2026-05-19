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

The design silo. Finalised plans from 01-plan become designs here.

This is **downstream** from planning:

```
01-plan (planning) → 03-design (designing)
```

---

## Where to Go

| You Want To... | Go Here/What you'll need |
|---------------|---------|
| **Understand the pipeline** | `workflow/CONTEXT.md` |
| **Look up the design pattern for this project** | `references/design-system.md` |
| **Generate a specification from a brief** | `workflow/01-brief/` to retrieve a brief to be generated into a spec, then put the spec in `workflow/02-specs/` |
| **Develop a design from a specification** | `workflow/02-specs/` to retrieve a spec to be built into a design, then put the code created in `workflow/03-builds/` |
| **Review a design that was made** | `workflow/03-builds/` (for the design itself) + `workflow/02-specs/` (for the specs for the said design) |


**Don't read everything.** Identify your task, load only what you need.

---

## Folder Structure

```
03-design/                            ← Design workspace for creating the designs of the project
├── CONTEXT.md                        ← The .md file that routes to different places in this silo (You are here)
│
├── references/                       ← Reference material used during design
│   └── design-system.md              ← The system for how I want the designs to look like in this project
│
└── workflow/                         ← Design workflow pipeline
    ├── CONTEXT.md                    ← Design workflow routing instructions
    ├── 01-brief/                     ← Initial design brief and requirements
    ├── 02-specs/                     ← Technical specifications and build plans
    └── 03-builds/                    ← Actual implementation work and build files
```

## What to Load

| Task | Load These | Skip These |
|------|------------|------------|
| Plan → Brief | Retrieve the specific plan needed from `01-plan/plans/`| design-system |
| Brief → Spec | The brief from `workflow/01-brief/` + design system from `03-design/references/design-system.md` | - |
| Spec → Build | The spec from `workflow/02-specs/` + design system from `03-design/references/design-system.md` | - |
| Review a build | The spec (as contract), the build output | references/ |

---

# Writing Room

<!--
===============================================================================
TEACHING NOTE: This is LAYER 3 — A WORKSPACE CONTEXT.

This is where the real instructions live. Every workspace CONTEXT.md
needs these sections:

  1. What this workspace IS (1-2 sentences)
  2. What to load for each task type (the token budget table)
  3. Folder structure (so the agent knows where files go)
  4. The process (how work happens here)
  5. What NOT to do (anti-patterns and constraints)
  6. Where tools plug in (skills/MCPs for this workspace)

Keep it 25-80 lines of content. If it's past 100, you're probably
duplicating what's in your docs/ files.
===============================================================================
-->

## What This Workspace Is

Where ideas become plans (which are then later refined as built features or designs).
I start with something that I want to add to the website. The agent helps research,
outline, write, and refine it such that we both understand with clarity exactly what is
expected out of this new addition. Output goes to `plans/` and can feed into the
development pipeline.

---

## What to Load

<!--
TEACHING NOTE: This is the most important table in any CONTEXT.md.
It's the token budget. It tells the agent exactly what to read
for each task — and implicitly, what to SKIP.

Without this, agents either load everything (wasting tokens) or
guess wrong about what matters (producing off-voice content).
-->

| Task | Load These | Skip These |
|------|------------|------------|
| Brainstorm a plan | `references/` if you need more information/notes about the game + the web |
| Edit/review a draft plan | The draft itself | `references/` |
| (If need be) Send the plan | The draft itself | `references/` |
<!-- | Research only | Nothing from docs/ | Everything — just use Web Search MCP | -->

> ⚠️ **If you load the screenshots in `references/examples-of-good-work/`, read `CORRECTIONS.md` in that same folder first.** It records intentional deviations from the images (two-screen reveal/pass, tap-to-reveal, no "New Game" button, numbered players) and **overrides** the screenshots. This applies to anyone routed here to interpret the references — including a builder pulling them from `02-development`.

---

## Folder Structure

```
imposter-game/
└── 01-plan/                          ← The place where all the plans for all the features/design choices are made
    ├── CONTEXT.md                    ← You are here
    │
    ├── plans/                        ← Where all the plans are saved
    │
    └── references/                   ← Reference materials used during planning for more information
        ├── examples-of-good-work/    ← Example screenshots showing strong functionality
        │   └── CORRECTIONS.md        ← ⚠️ Intentional deviations from the screenshots; READ before building from the images — overrides them
        ├── Imposter-Game-Rules.docx      ← The basic rules document for the Imposter game
        └── REFERENCES.md                 ← Routes to everything within the references folder

```

---

## The Process

No rigid steps. The work flows like a conversation:

1. **Understand the feature/design** — what's the idea and why does it matter?
2. **Ask questions** — how does it exactly work, how would it be implemented? The agent asks as many questions to ensure it understands the new addition. It also references the references folder if need be.
3. **Write it** — Write a mockup of the plan after having researched and talked about it.
4. **Review it** — look over the plan for that specific idea and see if it needs to be decomposed or changed any more or if it is ready to be built. If it needs to be decomposed, move into separate plans. Each plan should be a single, identifiable feature/design pattern.
5. (If you need to) **Send it** — now that the plan is complete, it is now waiting to be fetched/retrieved by the 02-development pipeline to be turned into a brief, then a spec, then built to be a feature. If the need arises, you might need to send it from here to `02-development/workflow/01-brief/`.

A draft becomes `review` when it's structurally complete. It becomes
`final` when voice and quality pass.

---

## Skills & Tools for This Workspace (IGNORE for now)

<!--
TEACHING NOTE: This is where skills become CONTEXTUAL, not just listed.

In CLAUDE.md, we listed all available skills. Here, we say WHEN to use
them within this workspace's workflow. This is the difference between
"the humanizer skill exists" and "run /humanizer before moving any
draft to final/status.md."

You can have up to 15 skills per workspace. They aren't all markdown
files sitting in a folder — they're capabilities that activate at
specific points in your workflow. Some are:
  - STAGE TRIGGERS: "At review stage, run this skill"
  - ALWAYS-ON: "Every piece of content in this workspace uses this"
  - ON-DEMAND: "Use this when the writer asks for it"

The CONTEXT.md is what makes a skill useful by telling the agent
when and why to invoke it — not just that it's available.
-->

<!-- | Skill / Tool | When to Use | How |
|--------------|-------------|-----|
| `/humanizer` | **Before any draft moves to `final/`**. Non-negotiable. Catches AI-isms that voice.md might miss. | Run on the full draft. Apply suggestions. Re-check voice.md compliance after. |
| `/doc-coauthoring` | **Long-form pieces only** (2000+ words). Tutorials, technical guides, whitepapers. | Activates a structured co-writing workflow. Not needed for blog posts or short pieces. |
| Web Search MCP | **Research phase**. When the topic needs current data, competitor analysis, or technical accuracy verification. | Agent will search autonomously. Provide search terms or let it derive them from the topic. | -->

### Skills That Could Plug In Here (Not Configured)

<!--
TEACHING NOTE: This section shows learners that the skill slots
are EXTENSIBLE. You don't need all 15 filled on day one.
These are suggestions for what you might add as your workflow matures.
-->

<!-- - **SEO optimization skill** — could run at review stage to check keyword density, meta descriptions, heading structure
- **Plagiarism/originality check** — could validate before final
- **Translation skill** — if you produce content in multiple languages
- **Tone analysis skill** — quantitative voice consistency checking
- **Citation formatter** — for technical content with references -->

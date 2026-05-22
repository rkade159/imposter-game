# Technical Standards

<!--
TEACHING NOTE: A reference doc that gets loaded by spec and build agents.
Replace with your actual standards. This shows the structure.
-->

## Code Quality

- All code must be written as plainly and simply as possible. If there is an option to prioritise coding easily over being needlessly difficult, then do so. HOWEVER, ensure that the code is written in such a way such that it's easy to modify the existing codebase if need be, or to add more features to it.
- Prefer standard library solutions over third-party packages when equivalent.
- Add comments to the code whenever you are coding a new code block 

## Naming & Spelling

- **The role is spelled "imposter" (plural "imposters") in all user-facing text** — UI copy, button labels, headings, microcopy. **Never "impostor".** This is the game's spelling; apply it everywhere a player can read it.
- Some pre-existing internal identifiers use the older "impostor" spelling (e.g. `isImpostor`, `impostorCount`). Leave them as-is unless a task explicitly calls for a rename; for *new* identifiers, prefer the "imposter" spelling. The user-facing-text rule above is the hard rule — identifier spelling is a soft preference, kept separate to avoid churny renames.

<!-- ## Testing

- Every demo must have at least one "happy path" verification
- Interactive demos: test the primary user flow end-to-end
- API demos: test with real (or mocked) responses -->

## Deployment

- All web demos must work on modern browsers (Chrome, Firefox, Safari latest)
- Mobile-responsive unless explicitly scoped as desktop-only
<!-- - Static deployable preferred (Vercel, Netlify, GitHub Pages) -->

## Verification

- Every feature still needs a "happy path" verification checklist (a smoke test)
  written into its spec/build — that requirement stands.
- **The builder does NOT run `npm run dev` (or otherwise launch the app) to
  perform that verification.** Rehaan runs the app and walks the checklist
  himself. Agents can't reliably drive the live browser app in this environment,
  so attempting it just wastes time and energy — write a clear, spec-mapped
  checklist and leave running it to Rehaan.

## Skills & Tools for This Workspace (IGNORE for now)

<!--
TEACHING NOTE: Production is where tools get DENSE.
Different pipeline stages use different tools. This is the
workspace-level overview — workflows/CONTEXT.md has the
stage-by-stage specifics.

Notice the pattern: skills aren't listed generically.
Each one has a WHEN (which stage) and a WHY (what it does there).
-->

<!-- | Skill / Tool | Stage | Purpose |
|--------------|-------|---------|
| Context7 MCP | 02-specs | Fetch current library docs when speccing a demo. "What's the latest React Router API?" |
| /frontend-design | 03-builds | When building web-based demos or interactive tutorials |
| /webapp-testing | 03-builds | Verify built demos work — Playwright-based browser testing |
| /pdf | 04-output | Generate PDF versions of tutorials or guides |
| Web Search MCP | 02-specs | Research current best practices, check if approaches are still recommended |

---

### Skills You Might Add

- **Code review skill** — automated quality gate before anything moves to 04-output
- **Accessibility audit skill** — check WCAG compliance on web deliverables
- **Performance benchmark skill** — run Lighthouse or equivalent on built demos
- **Deployment skill** — auto-deploy demos to staging environment
- **Screenshot skill** — capture visual output of builds for documentation

--- -->

## Hard Rules

1. **Specs are contracts, not blueprints.** A spec says WHAT to build and the acceptance criteria. It does NOT dictate implementation details. The builder has creative freedom.
2. **Output must be tested.** Nothing moves to `04-output/` without verification — automated or manual.
3. **Don't build without a spec.** Even small projects get a lightweight spec. It prevents scope creep and gives reviewers something to check against.
4. **Don't load writing-room docs here.** Voice doesn't matter in production — technical quality does.

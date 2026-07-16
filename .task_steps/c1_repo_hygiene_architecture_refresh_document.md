# C1: Repo Hygiene And Architecture Refresh

# Pass A - Direction Brief

## Context

- Task: Plan a periodic cleanup and architecture refresh that uses current-model reasoning to find debt left by earlier implementation passes without destabilizing production CEP workflows.
- App or module: repo-wide across `symbol-cep`, `wedding-cep`, `toolkit-cep`, shared libraries, root tooling, and agent receipts.
- Trigger: the working tree has accumulated multiple generations of source, smoke tooling, generated output, operator files, compatibility paths, and governance artifacts.

## Normalized Request Receipt

- Intent: repo-wide maintenance refactor and technical-debt audit.
- Route: `/plan` (D1-3, cross-app); no runtime code changes in this pass.
- Goal: make the repository reproducible, easier to reason about, and safer for future agents while preserving all currently working operator behavior.
- Success Criteria:
  - a clean clone contains every source, config, and smoke dependency required to build and validate all three apps;
  - local caches, debug installs, runtime output, and operator documents cannot re-enter Git accidentally;
  - root verification runs every non-live unit suite, including Symbol;
  - dead-code and dependency findings are evidence-driven and app-aware rather than deleted automatically;
  - large or duplicated modules are refactored only behind characterization tests and app-local contracts;
  - maintenance can be repeated from one documented audit command and scorecard.
- Scope Guess: root Git hygiene and validation scripts first, then app-local cleanup waves; shared code only after a consumer sweep proves reuse.
- Constraints:
  - preserve the dirty worktree and all user changes;
  - no mass delete, reset, or blanket ignore for `.ai`, `.pdf`, or `.json` because some are real templates/config;
  - all `.jsx` remains ES3-compatible;
  - respect app boundaries and Toolkit frozen-shell policy;
  - no Illustrator 2025 smoke;
  - D1-3 and cross-app implementation requires C2 review and verification gates.
- Unknowns:
  - which untracked files are intentional source versus local-only operator artifacts;
  - which compatibility branches are still needed by persisted presets and installed wrappers;
  - whether near-duplicate Toolkit module families should share generated source, a private module utility, or remain isolated intentionally.
- Approval Needed: yes; approve the staged direction before Pass B locks files and implementation slices.

## Problem Restatement

- The main risk is not currently a failing build. The current machine passes validation, but the repository is not reproducible from Git.
- Audit snapshot on 2026-07-14:
  - Git reports `497` changed/untracked status entries and `746` untracked files.
  - Git tracks only `280` files in total.
  - `toolkit-cep` has `0` tracked files, `libs/shared` has `0`, and all three smoke harnesses have `0` tracked files.
  - `16` Nx cache/workspace-state files are tracked even though `.nx/` is now ignored.
  - a literal root folder named `%APPDATA%` contains a stale copied Toolkit runtime, including retired modules such as `selection_summary`.
  - root `test:ci` and `verify` omit the `159` passing Symbol unit tests.
  - `.gitignore` ignores smoke helpers that the local smoke runners require, so a clean clone cannot reproduce local validation.
  - local artifacts include `.bak`, runtime probe folders, and multiple `.ai/.pdf/.xlsx` files mixed with legitimate shipped templates.
  - large maintenance hotspots include Symbol smoke (`3966` lines), Toolkit smoke (`3057`), `wedding_suite_standard.jsx` (`2286`), Symbol CSS (`1151`), Wedding Suite panel (`879`), and config renderer (`798`). Size alone is not evidence that these should be split.

## Options

### Option 1

- Summary: perform one big-bang cleanup that deletes obvious artifacts, removes compatibility code, deduplicates modules, and restructures all apps in one branch.
- Tradeoffs: fastest visual cleanup, but unacceptable data-loss and regression risk in a dirty CEP workspace; failures would be hard to attribute or roll back.

### Option 2

- Summary: use a staged, evidence-first program: establish a reproducible baseline, enforce repository hygiene, repair verification coverage, then audit and refactor one bounded context at a time.
- Tradeoffs: takes more passes and temporarily leaves some known duplication in place, but every change is independently reviewable, reversible, and testable.

### Option 3

- Summary: add a dead-code scanner and formatting rules, then let tooling automatically remove or rewrite everything it flags.
- Tradeoffs: inexpensive to start, but CEP has dynamic entrypoints, generated registries, host includes, test APIs, and binary templates that generic tools cannot infer safely; false positives would be likely.

## Best Practices

- Make source control reproducibility the first gate. Git documents that ignore rules only apply to untracked files; already tracked cache files must be removed from the index deliberately, not hidden with local index flags. [Git ignore documentation](https://git-scm.com/docs/gitignore)
- Keep Nx cache and workspace state out of source control. Nx's own migration guidance explicitly places `.nx/cache` and `.nx/workspace-data` in `.gitignore`. [Nx manual migration](https://nx.dev/docs/guides/adopting-nx/manual)
- Configure dead-code analysis per workspace and declare real entrypoints. Knip supports monorepos, but its docs warn that incomplete entry configuration and dynamic loading produce false positives. It should begin in report-only mode here. [Knip workspaces](https://knip.dev/features/monorepos-and-workspaces), [Knip issue handling](https://knip.dev/guides/handling-issues)
- Turn architecture intent into executable rules where the module graph supports it. Dependency-cruiser rules can encode forbidden, allowed, and required dependency directions and document why each rule exists. [dependency-cruiser rules](https://github.com/sverweij/dependency-cruiser/blob/main/doc/rules-reference.md)
- Protect behavior before extraction. Add characterization tests around bridge payloads, saved preset hydration, dynamic host registrations, and smoke scenario registries before deleting compatibility paths or splitting ES3 host files.
- Separate four ownership classes explicitly: committed source/config, generated build output, local runtime/debug state, and operator/customer documents.
- Use small commits/slices with a clean validation receipt. Never combine repository cleanup with product feature changes.

## Anti-Patterns

- Do not run `git clean`, blanket-delete untracked files, or assume an old file is disposable because its name contains `temp`, `probe`, `legacy`, or `backup`.
- Do not blanket-ignore `.ai`, `.pdf`, or `.json`; shipped Illustrator templates and operator-editable JSON are valid source assets.
- Do not treat `npm run verify` passing as proof of reproducibility until the source manifest is tracked and Symbol tests are part of the command.
- Do not deduplicate Toolkit module islands into shell/runtime code merely to reduce line count; that would violate the frozen-shell and module-isolation contract.
- Do not split long `.jsx` files mechanically. ExtendScript include order, shared global namespaces, and ES3 constraints can make a cosmetically smaller design less reliable.
- Do not let Knip or another static analyzer delete code automatically. Dynamic CEP/JSX registration must be covered by explicit entrypoint and allowlist rules.
- Do not retain every C1/C2 receipt forever in one flat directory; historical evidence is useful, but an unbounded active surface makes future agents read stale contracts.

## Edge Cases

- The literal `%APPDATA%` tree may contain stale files that differ from live links; it must be quarantined and compared before deletion, not used as a source of truth.
- Some ignored smoke helpers are required source, while generated smoke artifacts are local-only. The ignore policy must operate from an explicit smoke manifest, not directory-wide rules.
- `presets.usage.json` and `.bak` files are mutable runtime state, while `presets.json` and `wedding_suite_paper_stocks.json` are product configuration. They need different ownership rules despite sharing extensions and directories.
- Vendor files such as `fuse.basic.min.js` and `CSInterface.js` are duplicated intentionally across extension packages for offline CEP deployment. Deduplication may occur only at build/vendor-source level, not by introducing a runtime cross-extension dependency.
- A compatibility branch can look unused statically but still serve old persisted presets, existing extension wrappers, or a host-version-specific path.
- A clean clone validation must account for binary templates that are genuine runtime dependencies and ensure Git LFS or normal Git ownership is intentional.

## Counterfactuals

- If all current runtime source were already committed and a clean clone passed, the first slice could be dead-code analysis. The audit proves that is not the current state.
- If this were a normal browser app, generic unused-export tooling could be stricter. CEP's dynamic bridge calls and ExtendScript loading require app-specific entrypoint declarations and manual confirmation.
- If the worktree were clean, a large-scale branch could be acceptable. With hundreds of pending files, big-bang cleanup would make user work indistinguishable from disposable artifacts.
- If duplicated vendor files were loaded from a shared runtime package, one copy would be preferable. CEP extensions must remain independently loadable, so build-time synchronization is safer than runtime sharing.

## Chosen Direction

- Choose Option 2: a staged hygiene and architecture-refresh program.
- Phase order after approval:
  1. Reproducibility checkpoint: classify and track all required source, configs, smoke dependencies, docs, and shipped templates before deleting anything.
  2. Repository hygiene: untrack Nx state, quarantine/delete confirmed local artifacts, remove literal `%APPDATA%`, define explicit asset/runtime-state policies, and add a source-manifest check.
  3. Verification repair: include Symbol unit tests in root CI/verify, verify smoke dependencies are tracked, and add clean-clone/static entrypoint checks without running 2025 smoke.
  4. Advisory debt inventory: configure workspace-aware dead-code/dependency reports and produce reviewed findings, with no automatic deletion.
  5. App-local refactor waves: address only proven hotspots or duplication, beginning with smoke harness composition and then bounded runtime contexts; preserve ES3 and frozen-shell boundaries.
  6. Recurring maintenance: run a lightweight hygiene scorecard after every 10-15 completed C2 tasks or before a release, and a deeper architecture audit only when thresholds regress.
- The first implementation pass should not alter product behavior. Any product-runtime refactor discovered later receives its own C1/C2 and focused smoke lane.

## Why Other Options Were Rejected

- Option 1 was rejected because the worktree is too valuable and too mixed for a safe big-bang cleanup.
- Option 3 was rejected because static analysis cannot model all CEP/ExtendScript dynamic entrypoints and would encourage false-positive deletion.

## Model Recommendation

- Recommended: current high-reasoning model for planning/review; use a faster coding model only for mechanically scoped hygiene slices after the file manifest is approved.
- Scores: `D1=5`, `D2=5`, `D3=5`, `D4=5`, `D5=2`, `D6=2`, `SUM=15`.
- Why: the task is cross-app, has a very large dirty context, and mistakes can delete source or break installed production panels.
- Tradeoff: deeper review is slower than bulk automated cleanup.
- Fallback: split execution into separate app-owned tasks with the same baseline manifest and one writer at a time.

## Community Research Receipt

- `C1-RESEARCH: DEFINE=make a dirty CEP monorepo reproducible before evidence-driven debt removal | SEARCH=6 | BEST=7 | ANTI=7 | EDGE=6 | COUNTER=4 | ALIGN=aligned`

## Approval Checkpoint

- Status: approved by the implementation request on 2026-07-14.
- Blocking decisions: none. Source/config/test files must not be staged or committed; only confirmed `.nx` cache paths may be removed from the Git index.

# Pass B - Implementation Plan

## Planned Execution Slices

1. Create and verify an external full-workspace backup plus Git bundle and SHA-256 manifest.
2. Quarantine local artifacts with a reversible move manifest, relocate the PDF fixture, and enforce explicit ignore ownership.
3. Add repo hygiene/audit tooling, include Symbol unit tests in root verification, and route all smoke commands to 2026-only gates.
4. Archive historical receipts with an index and keep only active planning/gate artifacts in the task root.
5. Modularize Symbol and Toolkit smoke harness composition without changing their CLI or production runtime contracts.
6. Run cross-app review, non-live verification, 2026-only smoke, and the C2 gate check.

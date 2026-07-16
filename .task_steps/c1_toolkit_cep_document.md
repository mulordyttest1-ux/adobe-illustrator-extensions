# C1 Template: Research, Direction Brief, and Implementation Plan

# Pass A - Direction Brief

## Context

- Task: Research a third CEP app for personal utilities made of small unrelated commands/buttons, with the first feature focused on bringing a larger personal hotkey system into Illustrator.
- App or module: Proposed `toolkit-cep` workspace at repo root level.
- Trigger: User wants community-informed direction before building.

## Normalized Request Receipt

- Intent: Validate the common community pattern for a personal Illustrator CEP toolkit made of many small utilities, starting from a keyboard-first command system that can exceed native action/hotkey limits.
- Route: `/plan`
- Goal: Pick an architecture direction for a third app that can hold unrelated small tools and a larger personal hotkey catalog without turning into an unmaintainable button dump.
- Success Criteria:
  - Direction fits the current monorepo boundaries.
  - Direction matches common community patterns for CEP utility launchers.
  - Direction stays compatible with CEP panel and JSX host constraints.
  - Direction gives a practical path around Illustrator's constrained native shortcut surface by routing many commands through one launcher entrypoint.
  - Direction leaves room for future growth without forcing shared-code work too early.
- Scope Guess: Research and architecture recommendation only; no runtime code in this step.
- Constraints:
  - Keep `wedding-cep` and `symbol-cep` isolated.
  - Avoid speculative `libs/shared` work before a real reuse signal appears.
  - Host-side `.jsx` must remain ES3-compatible.
  - The app is intentionally mixed-purpose rather than one tight domain.
- Unknowns:
  - Rough command count at launch.
  - Whether commands are mostly one-shot actions, multi-step workflows, or external script runners.
  - Whether the desired hotkey model is "one summon shortcut + type/search", "leader key then mnemonic", or "panel-focused single-key mode".
  - Whether the toolkit is only for one machine/user or may later be shared with a team.
  - Whether background or event-driven behavior is needed.
- Approval Needed: Yes. Direction must be approved before Pass B implementation slicing.

## Problem Restatement

- The repo already has two domain-specific CEP apps. The third app is different: it is a personal utility surface for unrelated small actions, and the first pain point is shortcut scarcity rather than UI scarcity.
- Native Illustrator shortcuts and action bindings are useful, but they do not scale well for a large personal command vocabulary.
- Community examples show that mixed-purpose utility surfaces usually evolve into a keyboard launcher: favorites for common actions, search for the long tail, and workflows for repeated chains.
- The design question is therefore not only "where do buttons go" but "how do many commands share one stable keyboard entrypoint without becoming a pile of inline `evalScript` calls."

## Options

### Option 1

- Summary: Build a simple flat button board inside one visible panel. Each button maps directly to a command handler.
- Tradeoffs:
  - Best for a very small tool count and very fast initial delivery.
  - Weak discoverability once the command set grows.
  - Does little to solve the hotkey-scaling problem.
  - Encourages click-handler sprawl and ad hoc command wiring.
  - Harder to add search, favorites, hide/reorder, or workflows later without reworking the core shape.

### Option 2

- Summary: Build a hybrid utility launcher with a small visible favorites/button area plus a searchable categorized command list backed by a command registry.
- Tradeoffs:
  - Slightly more upfront structure.
  - Scales better as unrelated utilities accumulate.
  - Best fit for a large personal hotkey catalog because one launcher can front many commands.
  - Matches community launcher patterns: search, watched scripts, workflows, hidden/revealed commands, query history, favorites.
  - Keeps UI simple for common actions while preserving a clean long-tail surface.

### Option 3

- Summary: Build a script-first launcher that mostly indexes folders/files and runs scripts dynamically, similar to a scripts browser.
- Tradeoffs:
  - Very flexible for personal use and rapid experimentation.
  - Fastest way to absorb miscellaneous scripts.
  - Can help with hotkey breadth only indirectly.
  - Lower governance, weaker metadata, and weaker validation/testing.
  - Higher risk of turning the app into a file-browser wrapper instead of a durable product surface.

## Best Practices

- Use one visible panel as the operator-facing home and keep the initial interaction model obvious.
- Treat the launcher itself as the real hotkey surface: one entry shortcut, many mapped commands behind it.
- Prefer a hybrid surface: visible shortcuts for frequent actions, search/filter for long-tail actions.
- Back the UI with a command registry instead of wiring business logic directly inside button click handlers.
- Store command metadata explicitly:
  - stable `id`
  - label
  - group/category
  - trigger type (`panel`, `host-jsx`, `node`, `workflow`, `external-link`)
  - confirmation / danger state
  - optional shortcut, icon, tags, and visibility
- Group results into understandable buckets instead of showing one undifferentiated action list.
- Support aliases, mnemonic labels, and tags so commands are easy to recall from memory.
- Support favorites, recent commands, and hidden commands once the command set becomes non-trivial.
- Keep panel-side orchestration separate from host-side Illustrator execution.
- Add invisible/headless panels only if a real background or event-driven need appears.

## Anti-Patterns

- Building a growing wall of unrelated buttons with no search, grouping, or metadata.
- Trying to mirror every desired shortcut as a native Illustrator shortcut instead of using a launcher layer.
- Letting the visible UI become the only source of truth for what commands exist.
- Calling `evalScript` inline from many unrelated UI handlers with no command boundary.
- Using folder-watching or free-form dynamic script loading as the only execution model from day one.
- Prematurely moving toolkit-specific abstractions into `libs/shared` before repeated cross-app reuse exists.
- Splitting the app into multiple hidden or secondary panels before a real runtime trigger exists.

## Edge Cases

- Some commands may need document selection or active-artboard context before they can run.
- Some commands may need different behavior depending on whether the launcher was invoked by keyboard or clicked from the panel.
- Some commands may be destructive and need a confirm step plus better feedback than a raw alert.
- Some commands may be long-running and need progress, cancellation, or post-run logs.
- Personal utilities often start unrelated, then clusters emerge; the information architecture should tolerate regrouping later.
- Some hotkey ideas may collide with Illustrator shortcuts or require the panel to be focused, so invocation design matters.
- Script-launcher style features can raise install/debug friction across machines, especially on unsigned CEP setups.

## Counterfactuals

- If the launch scope is only 5-8 stable commands, Option 1 is acceptable and probably faster.
- If the only goal is "I need dozens more direct shortcuts with zero search step," CEP may still hit host-focus and shortcut-routing constraints, so the summon-and-run launcher model remains the safer default.
- If the real need is "run arbitrary scripts from folders" more than "productize utilities," Option 3 is the fastest fit.
- If the toolkit later becomes team-shared or customer-facing, stricter command schemas, validation, and documentation become mandatory.
- If a cluster of utilities becomes domain-heavy, that cluster may deserve its own dedicated app later instead of staying inside the toolkit.

## Chosen Direction

- Choose Option 2.
- Proposed shape:
  - new standalone workspace: `toolkit-cep/cep`
  - one visible panel as the composition root
  - keyboard-first launcher as the primary interaction model
  - top section for favorite buttons / quick actions
  - secondary searchable command list with categories, tags, and recents
  - command registry as the source of truth
  - command aliases and mnemonic search terms for fast recall
  - handlers delegated by execution type
  - optional workflow/macro commands that chain multiple actions
  - optional invisible/headless companion panel only after a proven background need
- Recommended first feature:
  - one summon shortcut to open/focus the launcher
  - hotkey catalog backed by command ids
  - typed filtering plus favorites
  - optional quick-run aliases for very common commands
- This gives the "buttons" you want without locking the app into a rigid button wall, while also addressing the shortcut-limit pain directly.

## Why Other Options Were Rejected

- Option 1 was rejected because it optimizes only for the first few commands and does not solve the core hotkey-scaling problem.
- Option 3 was rejected as the default because it makes runtime flexibility too cheap and governance too weak; it is better treated as an extension capability layered on top of a real command model.

## Approval Checkpoint

- Status: pending approval
- Blocking decisions:
  - Confirm whether the default direction should be `toolkit-cep` as a standalone app instead of extending `symbol-cep` or `wedding-cep`.
  - Confirm whether the first release should be explicitly keyboard-first: summon shortcut + searchable launcher + favorites.
  - Confirm whether the first release should include recents/workflows from the start, or only the registry plus favorites and search.

## Community Notes

- Community examples strongly cluster around launcher patterns rather than raw button walls.
- `majman/adobe-scripts-panel` is a CEP panel explicitly built to load local and remote scripts for Illustrator/Photoshop/After Effects, which validates the "utility launcher" shape for mixed-purpose tooling.
- `AiCommandPalette` goes further and shows the mature end-state: searchable commands, tools, actions, scripts, workflows, and custom pickers all run from the keyboard through one palette surface.
- Adobe's own CEP samples include invisible extensions and multi-surface examples, which supports using hidden/background surfaces only as a secondary runtime tool.
- Adobe's UXP docs, while not CEP-specific, reinforce a stable plugin idea: one plugin can expose a panel plus headless/direct actions, which is a useful architectural analogy for future-proof command design.

## Sources

- UX Patterns, "Command Palette Pattern": https://uxpatterns.dev/patterns/advanced/command-palette
- GitHub, `majman/adobe-scripts-panel`: https://github.com/majman/adobe-scripts-panel
- GitHub, `joshbduncan/AiCommandPalette`: https://github.com/joshbduncan/AiCommandPalette
- GitHub, `hyperbrew/bolt-cep`: https://github.com/hyperbrew/bolt-cep
- GitHub, `Adobe-CEP/Samples`: https://github.com/Adobe-CEP/Samples
- Adobe Developer, "Code Samples" for UXP Photoshop: https://developer.adobe.com/photoshop/uxp/2021/code_samples/
- Adobe Community thread on a searchable/favoritable CEP script launcher in Illustrator, dated October 3, 2025: https://community.adobe.com/t5/illustrator-discussions/cep-mac-extensions-refuse-to-load-desperate-to-deploy-self-made-script-ecosystem-with-my-coworker/td-p/15531478

# Pass B - Implementation Plan

> Complete this pass only after the chosen direction has been approved.

## Planned Files Or Modules

- pending approval

## Consumers To Verify

- pending approval

## Execution Slices

### Slice 1

- Goal: pending approval
- Files: pending approval
- Validation: pending approval

### Slice 2

- Goal: pending approval
- Files: pending approval
- Validation: pending approval

### Slice 3

- Goal: pending approval
- Files: pending approval
- Validation: pending approval

## Validation Plan

- pending approval

## Open Risks

- The command count and command types are still unknown, so Pass B should avoid overbuilding until the initial command set is enumerated.
- The launcher invocation model must be validated early because CEP keyboard behavior and panel focus will shape the UX more than the button layout does.

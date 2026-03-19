# C1: Research — One-Time Run From Config Tab Without Saving New Preset
*App: `symbol-cep` | Date: 2026-03-19*

---

## Step 0: DEFINE
> Problem statement: In a preset-driven Illustrator CEP panel, users often load an existing preset, tweak a few values for a one-off job, and need to execute immediately without polluting the saved preset library with throwaway variants.

---

## Step 1: SEARCH — Queries Used

1. `one-time run without saving preset UX best practice settings screen presets apply custom run`
2. `preset vs custom one-off apply now best practice UX`
3. `temporary custom changes without saving preset run once UX pattern`
4. `when to include an apply button UX`
5. `Adobe presets apply then refine save preset optional`

---

## Step 2: EXTRACT — Community Best Practice

### 1. Presets are a reusable starting point, not a mandatory save boundary
- Adobe product guidance repeatedly treats presets as accelerators for repeat work, while allowing the current working state to be refined independently.
- In Photoshop, presets are used to "preview, apply, and refine" effects; after applying one, the user can continue editing the current settings.
- In Camera Raw, the current settings can later be saved as a preset, which means "use now" and "persist for reuse" are separate decisions.

### 2. A dedicated Apply/Run action is appropriate when the result has visible side effects and users need an evaluate-adjust-repeat loop
- Microsoft UX guidance says an Apply button is justified when users can apply a change, evaluate the visible result, and continue adjusting without closing the settings surface.
- UX Stack Exchange answers converge on the same idea: Apply is valuable when changes have side effects, users need closure that work is not lost, or they want to iterate while keeping the dialog open.

### 3. Anti-pattern: forcing users to save a new preset for one-off tweaks
- This mixes two intents that should stay separate:
  - `Persist this as a reusable asset`
  - `Run the current working copy once`
- Consequences:
  - Preset library pollution with throwaway variants
  - Extra naming friction
  - Increased risk of accidentally overwriting a reusable preset with temporary values

### 4. Labeling guidance: use an explicit action verb, not vague confirmation text
- Community and platform guidance favors clear action labels for buttons.
- For this case, labels like `Run Now`, `Apply & Run`, or `Chạy ngay` are clearer than `OK`.
- `Preview` would be misleading if the action really creates/modifies artwork in Illustrator.

---

## Step 3: ALIGN — Compare Community Practice vs Requested Direction

## Current codebase behavior
- `ConfigTab` is currently optimized for editing + saving presets.
- `ActionTab` is the only execution surface right now:
  - Search/select preset
  - `handleTrigger(id)` increments usage
  - Load preset object from store
  - Compile rules
  - Run preflight → engine → postflight
- Saving is wired through `ConfigPersistence.handleSave(form, true, tab)` and requires a preset name.

## Requested direction
- Add a button directly in `Config` tab to run the current form immediately.
- Do not force creation of a new preset for one-time tweaks.
- Typical scenario: load preset → adjust slightly for this job only → run once → discard changes or move on.

## Alignment verdict
### ✅ The intent is strongly aligned with community best practice
- Your request matches the common UX pattern of:
  - `Saved preset = reusable baseline`
  - `Current form = transient working copy`
  - `Run now = execute transient working copy without persistence`

### ✅ Placement in `Config` tab is also reasonable
- The user is already editing values there.
- For frequent adjustment workflows, keeping execution close to the editable controls reduces mode switching.

### ⚠️ Important caveat
- Best practice is not just "add one more button".
- The one-time run path must preserve a strict separation:
  - `Run Now` must NOT auto-save
  - `Run Now` must NOT require `preset_name`
  - `Run Now` should NOT bump `usageCount` for the saved preset unless product explicitly wants that
  - Saved preset data must remain unchanged until `Save` is clicked

---

## Step 4: Codebase Recon

### Relevant files
- `symbol-cep/cep/js/features/imposition/config_tab.js`
- `symbol-cep/cep/js/features/imposition/config_events.js`
- `symbol-cep/cep/js/features/imposition/config_persistence.js`
- `symbol-cep/cep/js/features/imposition/action_tab.js`

### Consumers / impact
- `ConfigTab` is instantiated in `symbol-cep/cep/js/app.js`
- `ActionTab` is instantiated in `symbol-cep/cep/js/app.js`
- `ConfigPersistence.handleSave()` is called from `config_events.js`
- `ActionTab.handleTrigger()` is currently ID-based and store-backed, so transient execution should reuse its engine path but bypass lookup/save/usage concerns

### Architectural reading
- Cleanest path is to extract a reusable "execute preset object" path from `ActionTab`, then let `Config` build a transient payload and call that path.
- Avoid calling `handleTrigger()` with fake IDs because it bundles lookup, usage increment, and execution into one method.

---

## Recommendation

### UX recommendation
- Add a secondary button in Config footer:
  - `Run Now` or `Chạy ngay`
- Keep `Save Preset` as the persistence action.
- Treat the current form as a draft working copy.
- If a preset was loaded and then edited, show a lightweight cue such as:
  - `Đang chỉnh từ preset X — chưa lưu`

### Product rule recommendation
- `Run Now`: execute current form state only
- `Save`: create/update reusable preset
- These two actions should remain independent

---

## Source Notes

- Microsoft Learn — Property Windows:
  - Frequent property changes fit a property inspector model.
  - Delayed commit / Apply is appropriate when users can evaluate visible changes and continue editing.
  - https://learn.microsoft.com/en-us/windows/win32/uxguide/win-property-win
- UX Stack Exchange — "When to include an Apply button?"
  - Apply is useful when changes have side effects or when users need to keep the dialog open while iterating.
  - https://ux.stackexchange.com/questions/27781/when-to-include-an-apply-button
- Adobe Photoshop — Adjustment presets overview:
  - Presets are for quickly previewing/applying a starting point, then refining further.
  - https://helpx.adobe.com/photoshop/desktop/create-manage-layers/color-adjustment-fill-layers/adjustment-presets-overview.html
- Adobe Camera Raw — Manage settings:
  - Current settings can be saved as a preset later; saving is separate from using current adjustments.
  - https://helpx.adobe.com/camera-raw/using/camera-raw-settings.html

---
*Tag: `c1_symbol_cep_document.md` | Signed: Antigravity Researcher — Community First Pipeline*

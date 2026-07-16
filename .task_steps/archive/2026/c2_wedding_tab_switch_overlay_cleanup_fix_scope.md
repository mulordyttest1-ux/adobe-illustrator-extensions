## Gate Policy

Workflow: fix
Task Tier: D1-1
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Close compact-form autocomplete overlays when `wedding-cep` switches tabs so stale dropdowns do not leak into `Schema` or other contexts.
- Execution mode: Focused app-local bug fix in tab lifecycle and overlay cleanup only.

## Files To Modify

- `wedding-cep/cep/js/components/TabbedPanel.js`
- `wedding-cep/cep/js/components/tabbedPanelSupport.js`
- `wedding-cep/cep/js/components/tabbedPanelSupport.test.js`

## Consumers Verified

- `wedding-cep/cep/js/bootstrap/tabBoot.js`
- `wedding-cep/cep/js/components/compact-form/AddressService.js`

## Cross-App Impact

- None. Scope is isolated to `wedding-cep` tab lifecycle cleanup.

## Validation Targets

- `npm run lint:wedding`
- `npm run test:wedding`
- `npm run test:smoke:wedding`
- `npm run verify`

## Notes Before Execution

- Symptom:
  - Address autocomplete popup from `Compact` can remain visible after switching to `Schema`, producing a stale overlay over a different tab context.
- Expected:
  - Switching tabs clears temporary autocomplete overlays and resets combobox state from the previous tab.
- Actual:
  - `TabbedPanel.switchTo()` only syncs tab/panel classes and loads content; it does not clear transient overlays appended to `document.body`.
- Hypotheses:
  1. The popup survives because it is not owned by tab panel DOM and no tab-change cleanup exists.
  2. Resetting combobox ARIA state on owner input is required in addition to removing the list node.
- Isolation:
  - Autocomplete DOM lives outside the tab panel subtree, so changing active panel classes alone cannot hide or remove it.

## Symptom

- Compact autocomplete list can leak visually into `Schema` tab after a tab switch.

## Hypotheses

1. `TabbedPanel` lacks a transient overlay cleanup step before state switches.
2. Removing only the list node is insufficient without resetting `aria-expanded` and `aria-activedescendant` on the owning combobox.

## Isolation

- The stale overlay is not part of tab panel DOM; autocomplete lists are appended to `document.body`, so panel class toggles alone cannot hide them.
- `AddressService` already owns open/close for input-level interactions, but tab switches bypass that path. The cleanup therefore belongs at the tab lifecycle seam, not in search/Fuse logic.

## Root Cause

- `TabbedPanel.switchTo()` switched visual tab state without clearing transient body-level overlays from the previous tab. Because compact-form autocomplete lists live outside the tab panel subtree, they could survive and render over `Schema`.
- The owner combobox also kept stale ARIA state until its own local close path ran, so removing only the panel visibility was insufficient.

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified:
Claims Verified: Tab switches now clear compact-form autocomplete overlays before changing active panel state; owner combobox inputs are reset to `aria-expanded="false"` and have stale `aria-activedescendant` removed; unit coverage now locks cleanup at the tabbed-panel seam; wedding smoke stays green after the lifecycle fix.
Evidence Run: `npm run lint:wedding`; `npm run test:wedding`; `npm run test:smoke:wedding`.
Remaining Limits: this fix targets autocomplete overlays specifically; other future body-level transient UI would need its own cleanup registration if added later.
Unverified But Suspected: none.

## Postmortem

- Root cause confirmed: overlay cleanup was missing at tab-switch lifecycle, so body-level autocomplete UI outlived the tab that created it.
- False signal or discarded hypothesis: the problem was not Fuse search or schema rendering; it was a lifecycle ownership gap between `Compact` autocomplete and `TabbedPanel`.
- Guardrail that should have existed earlier: tab-switch tests should have asserted removal of transient overlays, not only active-tab CSS state.
- Reusable lesson: any UI element appended outside a panel subtree needs an explicit owner lifecycle hook when tabs or routes change.

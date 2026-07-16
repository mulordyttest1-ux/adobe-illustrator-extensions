# C2 Scope Lock: `app.js` and `showToast`

## Problem Origin

`app.js` was carrying UI helpers such as `hideLoading()`, `showError()`, and `showToast()`, then exposing `showToast` globally and threading it through multiple actions.

## Consumers at Risk

If `showToast` is removed from `app.js` without coordination, the following areas can break:

1. `js/actions/ScanAction.js`
2. `js/actions/UpdateAction.js`
3. `js/actions/SwapAction.js`
4. `js/actions/InjectSchemaAction.js`
5. `js/actions/ManualInjectAction.js`
6. Builder paths that still probe `typeof showToast === 'function'`

## Scope Lock

- Remove duplicate UI helper logic from `app.js`.
- Stop passing toast handlers through broad action wiring.
- Move consumers toward a central UI feedback channel such as direct `UIFeedback` usage.

## Risk Summary

- Blind removal creates immediate runtime failures.
- The change must be coordinated across all current consumers.

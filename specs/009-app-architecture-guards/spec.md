# Final App Architecture Guards V1

## Goal

Lock the accepted dependency boundaries for Symbol and Toolkit with
developer-only static checks, then stop proactive refactoring unless a real
defect, feature requirement, or repeated cross-context coupling justifies it.

## Scope

- Symbol panel composition-root and feature-layer checks.
- Toolkit composition-root, shell, catalog, and module-boundary checks.
- Existing Wedding dependency checker remains the source of truth for Wedding.
- Root/workspace scripts, focused checker fixtures, architecture documentation,
  and ROI inventory updates.

## Non-goals

- No production JS, JSX, bridge, installer, business-rule, or UI behavior
  changes.
- No shared runtime library or cross-app layer.
- No Illustrator smoke run; the change is developer tooling only.
- No automatic source rewriting when a guard reports a violation.

## Guard Contracts

### Symbol

- `cep/js/app.js` imports only `features/runtime/appBoot.js`.
- `appBoot.js` is the composition layer that creates the app-owned runtime
  surface.
- Config and Wedding Suite policy/view files cannot access storage, bridge, or
  feedback infrastructure directly.
- App-global writes are explicit and allowlisted.

### Toolkit

- `cep/js/app.js` wires startup, test API, host facade, and shell only.
- Shell code cannot import CEP or infrastructure.
- Catalog code consumes generated artifacts and never scans `modules/**` at
  runtime.
- Module JSX cannot depend on panel shell or CEP infrastructure.
- App-global writes are explicit and allowlisted.

### ROI exit gate

After validation, remaining candidates are reviewed using audit evidence:

- Toolkit text-break extraction remains deferred because modules must load
  independently and no common defect is reproduced.
- Wedding domain export review remains deferred because the API is small and
  callers are clear.
- Shared UI expansion and JSX/bridge rewrites remain deferred because their
  risk is higher than the demonstrated benefit.

Proactive refactoring is paused when the audit finds no reproducible defect,
clear feature need, or repeated coupling across bounded contexts.

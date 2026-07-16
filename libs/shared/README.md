# Shared CEP UI

## Overview

- Shared surface: `libs/shared/`
- Current package: `@shared/cep-ui`
- Scoped instructions: `AGENTS.md`
- Public entrypoint: `cep-ui/src/index.js`

This surface holds shared CEP UI primitives that can be reused by both `symbol-cep` and `wedding-cep`.

## Navigation

- Scoped instructions: `AGENTS.md`
- Repo-wide governance: `../../AGENTS.md`
- Main package entry: `cep-ui/src/index.js`
- Main package implementation: `cep-ui/src/UIFeedback.js`

## Current Public API

```js
import { UIFeedback } from '@shared/cep-ui';

UIFeedback.showToast(message, type);
UIFeedback.showLoading(container, message);
UIFeedback.hideLoading();
UIFeedback.showError(container, message, onRetry);
```

## What Belongs Here

- shared CEP UI primitives that stay generic across apps
- feedback/loading/error helpers reused by multiple panels
- app-agnostic helpers that do not depend on `wedding-cep` or `symbol-cep`

## What Does Not Belong Here

- app-specific workflow logic
- direct imports from `wedding-cep/` or `symbol-cep/`
- controller-specific coupling or hardcoded callback ownership

## Validation

```powershell
npm run lint:all
npm run build:all
```

If a docs-only change updates routing or governance for this shared surface, `npm run check:encoding` is the minimum repo lane.

## Notes

- Treat this surface as elevated-risk because it is shared across apps.
- Prefer a callback-parameter pattern over hardcoding app/controller references.

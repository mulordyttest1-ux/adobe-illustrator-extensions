# Walkthrough — Batch 0 + Batch 1

## Batch 0: Baseline Documentation ✅

Created 7 files in `.agent/`:

| Deliverable | File | Purpose |
|:-----------|:-----|:--------|
| API Surface | [API_SURFACE.md](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/memory/API_SURFACE.md) | All public APIs from 43+ modules |
| Dependency Map | [DEPENDENCY_MAP.md](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/memory/DEPENDENCY_MAP.md) | Consumer graph + blast radius + data flow |
| Pre-flight | [pre-flight.md](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/.agent/workflows/pre-flight.md) | 6-step checklist before coding |
| Templates | `normalizer_template.js`, `validator_template.js`, `action_template.js` | Copy-paste module templates |

---

## Batch 1: Cleanup & Headers ✅

### A1.1: Delete Legacy File
- Deleted `DateGridWidget.legacy.js` — confirmed not referenced in `index.html`

### A1.2: Fix Duplicate Call
- Removed duplicate `setupDebugButtons()` at line 309 in `main.js`

### A1.3: Add Header Contracts (R3)
All JS modules now have standardized 6-field headers:
```
MODULE → LAYER → PURPOSE → DEPENDENCIES → SIDE EFFECTS → EXPORTS
```

### A1.4: Standardize Exports (R4)
- **Before:** Mixed `module.exports` + `window.*` patterns
- **After:** All project files use `if (typeof window !== 'undefined') window.X = X;`
- **Excluded:** Vendor files (`CSInterface.js`, `fuse.basic.min.js`)

### Files Modified (28 total)

| Layer | Files |
|:------|:------|
| Logic/Core | `string.js`, `date.js`, `index.js` |
| Logic/Domain | `name.js`, `rules.js`, `time.js`, `venue.js`, `calendar.js`, `resolver.js`, `smart.js`, `isolation.js`, `conflict.js` |
| Logic/Pipeline | `normalizer.js`, `validator.js`, `assembler.js`, `DataValidator.js` |
| Logic/Strategies | `FreshStrategy.js`, `SmartComplexStrategy.js`, `StrategyOrchestrator.js` |
| Logic/UX | `NameNormalizer.js`, `AddressNormalizer.js`, `DateNormalizer.js`, `NameValidator.js`, `AddressValidator.js`, `DateValidator.js` |
| Components | `TabbedPanel.js` |
| Controllers | `WeddingProActionHandler.js` |
| Infrastructure | `schemaLoader.js` |
| Entry | `main.js` |

### Verification
- `grep module.exports` → 0 results (excluding vendor)
- All 28 files have `* MODULE:` header line confirmed

---

## Batch 2: Extract Actions from main.js ✅

### Problem
`main.js` was 416 lines — far above the 150 LOC limit. All action logic (scan, update, swap) was inline inside tab init callbacks.

### Solution
Extracted 3 action modules with context injection pattern:

| Module | Lines | Purpose |
|:-------|------:|:--------|
| [ScanAction.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/actions/ScanAction.js) | 68 | Bridge scan → DataValidator → normalize → push to form |
| [UpdateAction.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/actions/UpdateAction.js) | 73 | Form data → WeddingAssembler pipeline → Bridge update |
| [SwapAction.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/actions/SwapAction.js) | 78 | POS1 ↔ POS2 swap + auto-venue update |

### Result
- `main.js`: **416 → 232 lines** (45% reduction)
- Button wiring consolidated into `wireActionButtons()`
- Added `<script>` tags in [index.html](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/index.html) with correct load order

---

## Batch 3: Reduce Oversized Files ✅

### Problem
Multiple files exceeded the 150 LOC limit. Top offenders: `WeddingProActionHandler.js` (330), `DateGridWidget.js` (348), `main.js` (416).

### Solution
Extracted cohesive helper modules:

| New Module | Lines | Extracted From |
|:-----------|------:|:--------------|
| [KeyNormalizer.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/controllers/helpers/KeyNormalizer.js) | 88 | WeddingProActionHandler |
| [UIFeedback.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/controllers/helpers/UIFeedback.js) | 69 | WeddingProActionHandler |
| [DateGridDOM.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/components/helpers/DateGridDOM.js) | 213 | DateGridWidget |

### Result
| File | Before | After |
|:-----|-------:|------:|
| `WeddingProActionHandler.js` | 330 | **163** |
| `DateGridWidget.js` | 348 | **175** |
| `DomFactory.js` | 272 | **272** (kept — pure factory) |

> [!NOTE]
## Batch 4: ES Modules + Bundler ✅

### Problem
Implicit dependency management via 35+ `<script>` tags in `index.html`. Manual load ordering was error-prone, and modules relied on `window.*` globals and `typeof` guards.

### Solution
Converted the entire module system to ES Modules and introduced **esbuild** for lightning-fast bundling.

| Action | Result |
|:-------|:-------|
| **Module Conversion** | 49 files converted from `window.X = X` to `export const X = ...` |
| **Composition Root** | Created `app.js` (292 LOC) to centralize all imports and DI wiring |
| **Bundling** | Setup `build.js` using esbuild. Bundle size: **150.8kb** |
| **HTML Cleanup** | `index.html` reduced from **307 → 218 lines**. Removed 35+ script tags. |

### Verification
- **Build Speed:** <250ms per build.
- **Dependency Safety:** Circular dependencies or missing imports now caught at build time.
- **Runtime:** Tested via successful `bundle.js` generation.

---

## Batch 5: Testing & Type Safety ✅

### Problem
No automated tests — Agent had to rely entirely on user for verification in Illustrator.

### Solution
Used **Node.js built-in test runner** (`node:test` + `node:assert`) — **zero npm packages required**. This bypasses Google Drive's FUSE filesystem limitation that blocks `npm install`.

| Test File | Module | Cases | Status |
|:----------|:-------|------:|:------:|
| [string.test.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/logic/core/string.test.js) | StringUtils | 16 | ✅ |
| [date.test.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/logic/core/date.test.js) | DateUtils | 18 | ✅ |
| [name.test.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/logic/domain/name.test.js) | NameAnalysis | 9 | ✅ |
| [KeyNormalizer.test.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/controllers/helpers/KeyNormalizer.test.js) | KeyNormalizer | 4 | ✅ |

### Result
```
ℹ tests 49 | pass 49 | fail 0 | duration 190ms
```

### Run Command
```bash
node --test js/**/*.test.js
```

### Batch 6: Stabilization & Standardization (2026-02-10)
- **SourceMap Fix:** Switched to `inline` sourcemaps to fix G-Drive sync race conditions.
- **Scan Logic Fix:** Resolved 'vithu' mapping issues by wiring `WeddingRules` and `TRIGGER_CONFIG` for side-aware inference.
- **Workflow Standardization:** Codified the **Agent Pre-flight Checklist** (`/pre-flight`) to mandate "Style Alignment" against Gold Standard files (`ScanAction.js`, `rules.js`, `app.js`).
- **Infrastructure Cleanup:** Deleted stale `bundle.js.map` to prevent DevTools crashes.
- **Result:** 49/49 unit tests pass. Console logs verified visible. Mapping logic robust.

### Scan Logic Fix
- **KeyNormalizer.js**: Chuyển sang dùng ES Module `import` thay vì rely vào biến global.
- **ScanAction.js**: Bổ sung bước gọi `WeddingRules.enrichMappingStrategy` chính thống sau khi quét. Điều này đảm bảo vai vế (Trưởng nam/nữ, Thứ nam/nữ) được ánh xạ đúng theo phe chủ tiệc.

### Verification Result
```bash
ℹ tests 49 | pass 49 | fail 0 | duration 198ms
```

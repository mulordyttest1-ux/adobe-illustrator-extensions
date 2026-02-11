# Fix Vithu Scan — Proper Architecture Fix

## Problem Statement

Scanning from Illustrator fails to populate the "Vị thứ" (vithu) radio buttons in the UI. Additionally, the console shows nothing (no logs visible), and the old `bundle.js.map` file still exists causing DevTools errors.

## Root Cause Analysis (4 Layers)

### Layer 1: Infrastructure — Stale SourceMap
The old `bundle.js.map` (312KB) still exists on disk even though we switched to inline sourcemaps. Chrome DevTools in CEP tries to parse this broken file, can crash the panel's JS context, and suppress all subsequent console output.

### Layer 2: DataValidator — Extraction works IF markers exist
`DataValidator._extractValues()` uses `\u200B...\u200B` markers correctly. If the text frame content is `\u200BTrưởng Nam\u200B`, it extracts `["Trưởng Nam"]` and maps it to `meta_keys: ["pos1.vithu"]`. **This layer is correct.**

### Layer 3: ScanAction — Inverse Mapping needs `TRIGGER_CONFIG`
The inverse mapping logic (pos1.vithu → ui.vithu_nam/nu) currently calls `WeddingRules.getSideState()` with an **empty** trigger config `{}`. Without `TRIGGER_CONFIG`, the side inference always returns `0` (Nhà Trai default), making the mapping incorrect for "Vu Quy" type events. The schema has `TRIGGER_CONFIG` built-in but it's never passed to ScanAction.

### Layer 4: CompactFormBuilder.setData() — Logic is correct
`setData()` at line 213-216 correctly sets radio buttons: `ref.elements.forEach(r => r.checked = r.value === val)`. The radio values match the scan values exactly (e.g., "Trưởng Nam"). **This layer is correct.**

## Proposed Changes

### Infrastructure Cleanup

#### [DELETE] [bundle.js.map](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/bundle.js.map)
Delete the stale sourcemap file. With inline sourcemaps, this file is no longer needed and actively causes DevTools errors that may suppress console output.

---

### Action Layer (L7)

#### [MODIFY] [ScanAction.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/actions/ScanAction.js)
- Import `SchemaLoader` and pass `TRIGGER_CONFIG` to the side inference logic
- Alternatively, hardcode the config inline since it's static business rules
- Use proper `WeddingRules.getSideState()` with real trigger config

```diff
- const sideState = WeddingRules.getSideState(normalized['info.ten_le'] || '', {});
+ const triggerConfig = builder?.schema?.TRIGGER_CONFIG || {"Vu Quy": 1, "Thành Hôn": 0, "Tân Hôn": 0, "Báo Hỷ": 0};
+ const sideState = WeddingRules.getSideState(normalized['info.ten_le'] || '', triggerConfig);
```

---

### Controller Layer (L6)

#### [MODIFY] [KeyNormalizer.js](file:///I:/My%20Drive/script%20ho%20tro%20adobe%20illustrator/cep/js/controllers/helpers/KeyNormalizer.js)
- Remove debug logs after verification (leave them for now during this fix cycle)
- No logic changes needed

---

## Verification Plan

### Automated
```bash
node --test js/**/*.test.js
```

### Manual (User in Illustrator)
1. Delete `bundle.js.map` → Reload panel → Check console shows logs
2. Scan a document with "Vu Quy" type → Verify vithu_nu radio selects correctly
3. Scan a document with "Tân Hôn" type → Verify vithu_nam radio selects correctly

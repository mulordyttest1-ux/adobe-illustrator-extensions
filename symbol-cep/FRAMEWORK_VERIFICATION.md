# Framework Verification & Agent Summary

## ✅ Verification Checklist (Hardened)

### 1. Structure
- [x] **Standard CEP Layout**: Adheres to `CSXS/manifest.xml`, `js/`, `jsx/` convention.
- [x] **Flat Hierarchy**: `js/app.js` and `js/bridge.js` at root reduces import complexity.
- [x] **Isolatable**: No feature code exists. Pure infrastructure.

### 2. Communication (The Bridge)
- [x] **Base64 Encoding**: `utils.jsx` implements standard Base64 to prevent escaping issues with complex JSON data.
- [x] **JSON Polyfill**: `utils.jsx` ensures `JSON` exists in the ES3 host environment.
- [x] **Asynchronous**: `bridge.js` uses callbacks wrapped in Promises for modern async/await usage in the panel.

### 3. Configuration (Single Source)
- [x] **Pattern**: "Generator Pattern" (Node script -> Static Configs).
- [x] **Benefit**: Eliminates "drift" between `manifest.xml` and debug ports.
- [x] **Validation**: Script fails if config is missing, preventing broken builds.

### 4. Community Alignment
- [x] **Libs**: Uses official `CSInterface.js`.
- [x] **Polyfills**: Uses battle-tested `json2.js` and `webtoolkit` patterns.
- [x] **Manifest**: Standard XML structure valid for ZXP packaging.

---

## 🤖 Agent-Ready Summary (Context < 150 Tokens)

**Identity**: Zero-Feature Adobe CEP Framework.
**Goal**: Execution Shell for Extensions.

**Key Files**:
1.  `cep.config.json`: **EDIT HERE**. All settings (ID, Version, Port).
2.  `scripts/configure.js`: **RUN THIS**. Generates manifest/debug.
3.  `cep/js/app.js`: **START HERE**. JS Entry.
4.  `cep/jsx/host.jsx`: **HOST HERE**. Adobe Script Entry.

**Workflow**:
1.  Read `cep.config.json`.
2.  Run `node scripts/configure.js [env]`.
3.  Implement features in `cep/js/features/` (convention).

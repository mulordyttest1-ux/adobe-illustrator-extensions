## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Chuẩn hóa copy user-facing của `symbol-cep` sang tiếng Việt có dấu nhất quán, loại bỏ ASCII thô trên các bề mặt khách nhìn thấy, và gom string chính về một copy registry nội bộ.
- Execution mode: Focused single-app refactor with smoke-backed regression checks.

## Files To Modify

- `symbol-cep/cep/js/features/imposition/imposition_copy.js`
- `symbol-cep/cep/js/features/imposition/action_tab.js`
- `symbol-cep/cep/js/features/imposition/config_tab.js`
- `symbol-cep/cep/js/features/imposition/config_persistence.js`
- `symbol-cep/cep/js/features/imposition/config_pane_renderer.js`
- `symbol-cep/cep/js/features/imposition/data_store.js`
- `symbol-cep/cep/js/features/imposition/preflight/rules/GroupCheckRule.js`
- `symbol-cep/cep/js/features/imposition/preflight/rules/GarbageRule.js`
- `symbol-cep/cep/index.html`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`

## Consumers Verified

- `symbol-cep/cep/js/app.js`
- `symbol-cep/cep/js/features/imposition/config_events.js`
- `symbol-cep/cep/js/features/imposition/confirm_service.js`
- `symbol-cep/cep/js/features/imposition/postflight/rules/PasteboardInfoRule.js`
- `symbol-cep/cep/js/features/imposition/processing_options.js`

## Cross-App Impact

- Không có. Scope chỉ nằm trong `symbol-cep/`.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`

## Notes Before Execution

- Các file nghi mojibake trên terminal (`action_tab.js`, `config_tab.js`, `config_pane_renderer.js`, `index.html`, `GarbageRule.js`) đã được xác minh decode UTF-8 sạch trên đĩa bằng byte/file inspection; vì vậy pass này chỉ chuẩn hóa copy user-facing, không mass-recode file.
- Không đổi tên preset do người dùng tự lưu trong `presets.json`.
- Internal ids/schema/module names giữ nguyên; chỉ sửa string hiển thị.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: `imposition_copy.js` registry, Action/Config visible shell, storage warnings, preflight copy, runtime/preflight toast paths, and smoke assertions for representative UI text.
Top Risks: stale CEP bundle/cache masking new copy, regressions on `Dry Run` naming, and false positives when checking mojibake markers against valid Vietnamese Unicode.
Required Fixes: rerun smoke sequentially after build to avoid stale bundle results; tighten mojibake smoke matcher to look for mojibake substrings instead of any accented character; relax one empty-state assertion to guard user-visible meaning instead of one exact token split.
No Blocking Findings: yes
Validation Rerun Needed: no

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: `symbol-cep` visible copy is standardized toward Vietnamese có dấu on the main Action/Config/runtime/preflight/storage surfaces; representative shell/action/config/runtime/preflight paths are free of mojibake regressions in smoke; copy is centralized in `imposition_copy.js` for the main app-owned surfaces touched in this pass.
Evidence Run: `npm run lint:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run build:symbol`; `npm run test:smoke:symbol`
Remaining Limits: `libs/shared/cep-ui` vẫn nằm ngoài scope nên không dọn copy shared/default ở pass này; không đổi tên preset người dùng đã lưu; một số file legacy/dead-path như `config_renderer.js` chưa được dọn copy vì không còn là runtime surface chính của `Config`.
Unverified But Suspected: nếu sau này khôi phục renderer cũ hoặc bật thêm flow legacy không đi qua `imposition_copy.js`, có thể còn copy ASCII cũ ở các đường đó.

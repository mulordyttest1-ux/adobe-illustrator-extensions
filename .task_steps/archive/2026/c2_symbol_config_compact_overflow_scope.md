## Gate Policy

Workflow: build
Task Tier: D1-2
Code Change: yes
Shared Change: no
Cross-App Impact: no

## Scope Lock

- Summary: Dọn phần UI/UX compact còn sót trong `Config` của `symbol-cep`, đặc biệt cụm `Xử lý` đang bị che/tràn text trong panel hẹp CEP.
- Execution mode: Focused symbol-only renderer/CSS cleanup with smoke-backed layout regression checks.

## Files To Modify

- `symbol-cep/cep/js/features/imposition/config_pane_renderer.js`
- `symbol-cep/cep/css/style.css`
- `symbol-cep/cep/debug_scripts/test_smoke.cjs`
- `.task_steps/c2_symbol_config_compact_overflow_scope.md`

## Consumers Verified

- `symbol-cep/cep/js/features/imposition/config_tab.js`
- `symbol-cep/cep/js/features/imposition/config_events.js`
- `symbol-cep/cep/js/features/imposition/config_persistence.js`

## Cross-App Impact

- Không có. Scope chỉ nằm trong `symbol-cep/`.

## Validation Targets

- `npm run lint:symbol`
- `npm run build:symbol`
- `npm --workspace imposition-panel-cep run test`
- `npm run test:smoke:symbol`

## Notes Before Execution

- Root cause hiện tại là phần `sec_options`/`sec_marks`/`sec_resize_mode` vẫn dựa nhiều vào layout mặc định của Tweakpane trong khi CSS đang ép label width hẹp và `nowrap`.
- Mục tiêu là giữ panel dense/compact cho dân kỹ thuật, nhưng text dài phải wrap có kiểm soát thay vì chui dưới control.
- Không đổi contract preset/runtime; chỉ dọn renderer và presentation layer.

## Review Gate

> Optional unless required by `Gate Policy`.

Scope Reviewed: renderer compact của `Config`, CSS responsive của panel hẹp, và smoke assertions cho cụm `Xử lý`/`Marks`/`Resize`.
Top Risks: label dài vẫn bị bó bởi responsive stacking cũ; control chui xuống dưới nhưng vẫn đè vào label; đổi renderer làm `submit` hoặc `readValues` drift khỏi state hiện tại.
Required Fixes: thay các section processing-related còn dùng default Tweakpane row bằng custom compact rows; bỏ rule responsive làm `pane-setting-row` stack quá sớm; thêm smoke kiểm tra label dài wrap đúng và không overlap control.
No Blocking Findings: yes
Validation Rerun Needed: no

## Verification Gate

> Optional unless required by `Gate Policy`.

Claims Verified: các section `Xử lý`, `Resize`, và `Marks` trong `Config` đã dùng compact rows riêng nên label dài không còn bị che/tràn trong panel hẹp; hack label kiểu `___` không còn leak ra UI; smoke khóa luôn contract “label dài wrap đúng và không overlap control”.
Evidence Run: `npm run lint:symbol`; `npm --workspace imposition-panel-cep run test`; `npm run build:symbol`; `npm run test:smoke:symbol`
Remaining Limits: chưa dọn các dead path/legacy renderer như `config_renderer.js` vì không còn là runtime surface chính; chưa redesign lại taxonomy section ngoài pass compact này.
Unverified But Suspected: nếu sau này tăng thêm field cực dài trong processing area, có thể vẫn cần tinh chỉnh width control hoặc wording để giữ mật độ quét tốt nhất.

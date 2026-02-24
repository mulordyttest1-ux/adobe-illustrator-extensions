---
description: Agent pre-flight checklist — PHẢI chạy trước KHI viết code
---

# Pre-Flight Checklist

> **Khi nào dùng:** Trước MỌI task sửa/thêm code.  
> **Bắt buộc:** Agent PHẢI trả lời TẤT CẢ các câu hỏi bên dưới trước khi bắt đầu code.

---

## Phase 1: Reconnaissance (Trinh sát)

Để viết code đúng "Form" và "Gu" của dự án, Agent phải đọc các file sau nếu chưa nhớ:

- [ ] **Type Definitions:** `cep/js/types.d.ts` (API khuôn đúc — NGUỒN SỰ THẬT DUY NHẤT cho tên hàm)
- [ ] **Kiến trúc & Tiêu chuẩn:** `.agent/memory/planning/agent_friendly_architecture.md`
- [ ] **Trạng thái & Rules nhanh:** `.agent/GOVERNANCE.md`
- [ ] **API Surface:** `API_SURFACE.md` (tra cứu nhanh hàm nào tồn tại)
- [ ] **Dependency Map:** `DEPENDENCY_MAP.md` (ai phụ thuộc ai)
- [ ] **Handoff Lock:** Nếu tôi là Executor, đã đọc `implementation_plan.md` và `task.md` chưa?
- [ ] **Security Lock:** Đã xác nhận task không vi phạm rules trong `AGENT_PREFERENCES.md`?
- [ ] **Mẫu chuẩn (Gold Standards):**
    - **Actions (L7):** `cep/js/actions/ScanAction.js`
    - **Logic (L1):** `cep/js/logic/domain/rules.js`
    - **Pipeline (L4):** `cep/js/logic/pipeline/DataValidator.js`
    - **Wiring:** `cep/js/app.js`

---

## Phase 2: Scope Lock (Khóa phạm vi)

- [ ] **Liệt kê chính xác file(s) sẽ sửa:** ______
- [ ] **Số file ≤ 3?** (nếu >3 → tách task)
- [ ] **Tôi KHÔNG sửa file nào ngoài danh sách trên**
- [ ] **Liệt kê consumer(s) của module tôi sửa:** ______ (tra `DEPENDENCY_MAP.md`)
- [ ] **Impact Analysis (Phân tích tác động):**
  - [ ] Đã `grep` tìm tất cả các nơi gọi hàm này chưa?
  - [ ] Nếu sửa logic chung (vd: Validator), có ảnh hưởng đến các consumer khác không?
  - [ ] Đã kiểm tra edge-case cho từng consumer?
- [ ] **Thay đổi KHÔNG break consumer nào**

---

## Phase 3: Contract Verification (Xác minh hợp đồng)

### API Verification
- [ ] **Mọi tên hàm gọi đến đều tồn tại trong `types.d.ts`?**
- [ ] **Tham số đúng kiểu?** (đã đọc signature trong types.d.ts)
- [ ] **Return type đúng?** (biết function trả về gì)
- [ ] **Tôi KHÔNG bịa tên hàm không tồn tại**

### Architecture Check
- [ ] **File thuộc Layer nào?** (đọc MODULE header 6 dòng)
- [ ] **Import direction đúng chiều?** (chỉ import XUỐNG hoặc NGANG, KHÔNG import NGƯỢC)
- [ ] **File .jsx → tôi chỉ dùng ES3?** (var, function, không const/let/arrow)

### Convention Check
- [ ] **Naming khớp convention?** (PascalCase.js cho class, camelCase.js cho util)
- [ ] **Không tạo abstraction mới khi chưa có precedent trong repo?**
- [ ] **File mới có header contract 6 dòng?**

---

## Phase 4: Validation (Kiểm chứng sau code)

> **⚠️ BẮT BUỘC:** Mọi bài Test tương tác UI phải tuân thủ đúng quy trình kết nối CDP tại `@[.agent/workflows/testing_guide.md]`. Tuyệt đối không tự bịa cách test gõ phím mù.

- [ ] **Build thành công:** `npm run build:wedding`
- [ ] **Unit Tests pass:** `node --test js/**/*.test.js`
- [ ] **Agentic E2E Generation:** Tôi (Agent) ĐÃ tự động dệt thêm kịch bản chống phá hoại (Edge Cases test) vào file `test_smoke.cjs` chưa? Vui lòng soát lại tính năng vừa làm.
- [ ] **E2E Smoke Test:** `npm run test:e2e` (Thực thi chuỗi kịch bản Cấp Tiến của Agent trên Port 9097)
- [ ] **Lint & Architecture:** `npm run lint:wedding` (Chạy workflow @[/lint])
- [ ] **Dead Code Sweep (Dọn rác):** Chạy test/radar tĩnh (như `knip` hoặc rà bằng IDE) để tìm và diệt mọi cành khô, file mồ côi non-imported.
- [ ] **Wiring Audit (Rà soát Dây điện):** Phân tích `nx graph` hoặc rà soát bằng tay để đảm bảo mạch nối chuẩn Linear Boot, không Circular Dependency.
- [ ] **Cập nhật `types.d.ts` nếu thêm/sửa public API**
- [ ] **Cập nhật `API_SURFACE.md` nếu thêm/sửa public API**

---

## Zone Check (Kiểm tra vùng an toàn)

| Zone | Agent được phép |
|:-----|:----------------|
| 🟢 Safe | Tự chủ sửa/thêm |
| 🟡 Caution | Sửa bug OK. Thêm feature/refactor → hỏi human |
| 🔴 Danger | Chỉ sửa khi được yêu cầu + human review |

- [ ] **File tôi sửa thuộc zone nào?** ______
- [ ] **Hành động tôi làm được phép trong zone đó?**

---

## Kết quả

**Tất cả ✅ → Bắt đầu code**  
**Bất kỳ ❌ → DỪNG. Xem lại hoặc hỏi human.**

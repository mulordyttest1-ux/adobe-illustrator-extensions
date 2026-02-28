# FLASH PERSPECTIVE: Wedding CEP Address Fix Plan

## 1. IDEATION REPORT (§I)
(Originally generated as ideation_report.md)

### §M — Model Recommendation
```
🤖 Model Recommendation
Recommended: Gemini 2.0 Pro
Scores: D1=3 D2=2 D3=4 D4=1 D5=3 D6=3 SUM=9
Why: Task đòi hỏi độ chính xác cao về logic Business Rule (WeddingRules) và có rủi ro sai lệch dữ liệu in ấn (Wedding Card). SUM=9 rơi vào dải Pro High.
Tradeoff: Tốn nhiều token hơn Flash nhưng đảm bảo không "tunnel vision".
Fallback: Gemini 2.0 Flash
Override: RISK=4 -> Cần sự cẩn trọng của Pro.
```

### §I1 — PROBLEM DECOMPOSITION
- **Cốt lõi:** Hệ thống đang mặc định lấy `pos1.diachi` làm nguồn cho mọi địa chỉ "Tư Gia" trong pipeline tự động.
- **Sub-problems:**
  1. Xác định "Chủ tiệc" (Host) thực sự là ai (Nhà Trai hay Nhà Gái).
  2. Xác định POS (1 hay 2) nào đang đại diện cho phe Chủ tiệc đó.
  3. Truyền địa chỉ từ POS đúng đó vào hàm `applyAutoVenue`.

### §I2 — BENCHMARKING & ANTI-SYCOPHANCY
- **Benchmarking:** Các hệ thống form complex luôn dùng "Conditional Defaults".
- **Anti-Sycophancy (Search Drawbacks):** 
  - *Sếp gợi ý "ép max depth"*: Tốn token, lãng phí tài nguyên.
  - *Sếp gợi ý "sửa venue.js"*: Giải pháp cục bộ, không giải quyết được vấn đề ở Pipeline Assembler.

---

## 2. IMPLEMENTATION PLAN (§C)
(Originally generated as implementation_plan.md)

### BẰNG CHỨNG HỢP LỆ (COMPLIANCE EVIDENCE)
- §C0/§M (Model): D1=3, Model=Pro (Actual=Pro)
- §C1 (Community): Đã search `"applyAutoVenue" pitfalls`.
- §C2 (Scope Lock): **TRACE DEPTH = 2**
  - Callers: `assembler.js` -> `venue.js`.
- §C5 (Baseline Check): **`npm run test:e2e:wedding` -> PASS 5/5**

---

## Proposed Changes (Option: Orchestrated Source)

### 1. [MODIFY] [venue.js](file:///c:/Projects/adobe-illustrator-extensions/libs/wedding/domain/src/lib/venue.js)
- Loại bỏ fallback `pos1.diachi`.
- Nhận `sourceAddress` từ options.

### 2. [MODIFY] [assembler.js](file:///c:/Projects/adobe-illustrator-extensions/wedding-cep/cep/js/logic/pipeline/assembler.js)
- Thêm logic xác định POS chủ tiệc.
- Truyền `sourceAddress` vào `applyAutoVenue`.

---

## Verification Plan
1. Manual test Wedding CEP.
2. `npm run test` (Domain logic).

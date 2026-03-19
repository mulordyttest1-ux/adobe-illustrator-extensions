# C1: Research — Agent Protocol Amnesia (Architecture Unification)
*App: Global Workflow (áp dụng cho cả wedding-cep lẫn symbol-cep)*

---

## Step 0: DEFINE
> Bài toán: Khi Agent có 2 file hướng dẫn riêng biệt (core_protocol = luật gốc + runbook = bước thực thi), nó có xu hướng theo cái này và bỏ sót cái kia. Cộng đồng gọi đây là "Instruction Drift" hay "Protocol Amnesia".

---

## Step 1+2: EXTRACT — Phát Hiện Cộng Đồng

### ✅ Best Practice tìm được:

**1. "Lost in the Middle" / Attention Decay (Confirmed by research)**
- Nguyên nhân gốc rễ là vật lý: LLM dùng Transformer Attention. Token càng xa đầu context thì bị "pha loãng" attention. Nếu `core_protocol` ghi ở đầu chat còn `runbook` gọi sau, agent sẽ bỏ qua luật gốc hoàn toàn.
- **Giải pháp cộng đồng:** Đặt luật quan trọng nhất ở **đầu VÀ cuối** system prompt (U-shaped attention curve).

**2. Single Source of Truth (SSOT) Pattern (Anthropic, OpenAI docs)**
- Không nên có 2 file độc lập ngang hàng nhau (core_protocol.md + runbook.md). Đây là Anti-pattern.
- Kiến trúc đúng: **1 file trung tâm duy nhất (SSOT)** chứa toàn bộ luật. Các file khác chỉ được phép là "Plugin/Extension" trỏ về SSOT, không được override.

**3. "Immutable Objective vs Dynamic Context" Pattern (Reddit/Community)**
- Cốt lõi bất biến (core rules, guardrails) phải được treat như **immutable frozen spec**.
- Runbook là dynamic context, chỉ được hoạt động IF AND ONLY IF không vi phạm frozen spec.
- Thứ bậc ưu tiên: `System Prompt > Core Protocol > Runbook > User instruction`

**4. Echo-Check Stabilization (Community Anti-Drift Technique)**
- Trước khi chạy bất kỳ bước nào, bắt agent viết lại 1 câu tóm tắt hiểu biết của nó về luật.
- Việc "restate" này tạo ra token anchor mới trong context, kéo attention trở về luật gốc.
- Đây là nguồn gốc của lệnh `[CORE PROTOCOL CHECK]` trong Global Rule của Sếp hiện tại.

---

### ❌ Anti-Pattern Được Xác Nhận:

**"Sibling File Problem" — Lỗi kiến trúc của setup hiện tại!**
- `core_protocol.md` và `runbook.md` đang ở cùng tầng, không có quan hệ cha-con rõ ràng.
- Agent khi load `runbook` không có cơ chế nào bắt nó load `core_protocol` cùng lúc.
- Kết quả: Agent follow runbook, quên luật.

---

## Step 3: ALIGN — Kết Luận & Giải Pháp

### Vấn đề cốt lõi của kiến trúc hiện tại:
```
[Global Rule] ← Nằm trong GEMINI.md
      │
      ├── core_protocol/SKILL.md   ← Sibling ①
      └── runbook/SKILL.md         ← Sibling ②  ← KHÔNG biết ① tồn tại!
```

### Giải pháp cộng đồng khuyên (SSOT Pattern):
```
[Global Rule] ← GEMINI.md (giữ nguyên, đây là anchor đúng rồi)
      │
      └── core_protocol/SKILL.md   ← SSOT DUY NHẤT
              │
              ├── §C0 → gọi community_first (Bước 1)
              ├── §C1-§C5 → đây chính là RUNBOOK (nhúng thẳng vào)
              └── Các skill phụ (lint, refactoring, testing...) được CALL từ đây
```

**Tức là: Xóa `runbook` như một skill độc lập. Nhúng toàn bộ nội dung runbook (§C1-§C5) VÀO TRONG `core_protocol/SKILL.md`.**

---

## Đề Xuất Hành Động

| Option | Mô tả | Rủi ro |
|:---|:---|:---|
| **Option A (Recommended)** | Merge `runbook` vào `core_protocol`. Core Protocol là SSOT duy nhất. | Thấp — chỉ xóa 1 skill, cập nhật 1 file |
| Option B | Thêm `import "core_protocol"` vào đầu `runbook` bắt nó kéo theo luật gốc | Trung bình — phụ thuộc vào việc agent có đọckhông |
| Option C | Giữ nguyên, chỉ thêm vào Global Rule: "Khi gọi /runbook, LUÔN nạp core_protocol trước" | Thấp nhưng dễ bị quên lại |

**Khuyến nghị: Option A — SSOT.**

---
*Tag: `c1_global_workflow_document.md` | Signed: Antigravity Researcher — Community First Pipeline*

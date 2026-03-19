---
name: Slash Commands (Quick Reference)
description: Xem danh sách và mô tả 3 lệnh gạch chéo chính. Nạp khi cần biết dùng lệnh nào, lúc nào.
version: 2.0
---

# ⚡ SLASH COMMANDS — QUICK REFERENCE (v2.0)

> Sếp chỉ cần nhớ 3 lệnh này. Mọi skill nội bộ tự chạy bên trong.

---

## Bảng Tóm Tắt

| Lệnh | Mục đích | Khi nào dùng? | Skill chạy nội bộ |
|:-----|:---------|:-------------|:-----------------|
| `/plan` | Trinh sát cộng đồng + lên kế hoạch | **Bắt đầu task MỚI** bất kỳ | Community First, Ideation, Model Selection |
| `/build` | Thực thi code theo quy trình chuẩn | Sau khi Sếp **duyệt kế hoạch** từ /plan | Core Protocol SSOT, Lint, Testing |
| `/fix` | Fix/test bug bằng RAG cộng đồng | Khi **gặp bug** hoặc cần test | Community First (Anti-Tunnel-Vision), CEP Testing |

---

## Chi Tiết Từng Lệnh

### `/plan` — Nghiên Cứu & Lên Kế Hoạch
**Kịch bản:** Sếp giao task "Làm tính năng X" hoặc "Debug vấn đề Y".
- Nội bộ chạy: Community First RAG → (Ideation nếu D1≥3) → (Model Selection nếu D1≥3).
- Xuất báo cáo `c1_<tên_app>_document.md` + Implementation Plan.
- **DỪNG chờ Sếp duyệt. TUYỆT ĐỐI CẤM viết code.**

### `/build` — Thực Thi Code
**Kịch bản:** Sếp duyệt xong kế hoạch, ra lệnh "Code đi".
- Nội bộ nạp: Core Protocol SSOT (v4.7) với đầy đủ §C1→§C5.
- Tự động chạy lint §C5. Nếu fail, tự nạp Lint skill nội bộ.
- **DỪNG ở §C3 để Sếp duyệt plan trước khi gõ code.**

### `/fix` — Fix & Test Bug
**Kịch bản:** Phát hiện bug, test thất bại, cần debug.
- Nội bộ chạy: Community First RAG với ANTI-TUNNEL-VISION (3 giả thuyết).
- Nội bộ nạp: CEP Testing/CDP nếu cần test trên Adobe Illustrator thực tế.
- **KHÔNG tự suy luận fix — bắt buộc tìm cộng đồng trước.**

---

## Lệnh Hành Chính (Không phải code)

| Lệnh | Mục đích |
|:-----|:---------|
| `/handoff` | Nén Memory.md + mời sang Chat mới khi context > 30 turns |

---
> ⚠️ Các lệnh cũ (`/communication_search`, `/runbook`) đã DEPRECATED. Không dùng nữa.

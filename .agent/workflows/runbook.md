---
description: "⚡ COMPACT DISPATCHER — Agent đọc file này TRƯỚC, chỉ load chi tiết khi cần."
version: 1.1 (Post-LangGraph, Two-Step Agent Workflow)
---

# 📖 KINH THÁNH HÀNH ĐỘNG (RUNBOOK)
> **ĐÂY LÀ ĐIỂM BẮT ĐẦU CỦA ĐẠI TƯỚNG (AGENT).**
> File này chứa quy trình tổng thể. Chi tiết cách làm nằm ở thư mục `skills/` và `slash-commands/`. Agent phải LOAD skill tương ứng, không được tự đoán.

---

## 🚀 QUY TRÌNH DECOUPLED (2 BƯỚC)

Kiến trúc của dự án được chia làm 2 pha rõ rệt để chống ảo giác (Hallucination) và tiết kiệm ngữ cảnh.

### 🔍 BƯỚC 1: TRINH SÁT & NGHIÊN CỨU (Làm việc với file ngoài)
*Kích hoạt: User gọi lệnh `@[.agent/workflows/slash-commands/communication_search.md]`*
- **Tuyệt đối cấm viết code ở bước này.**
- Agent đóng vai trò **Nhà nghiên cứu (Researcher)**: Dùng công cụ `search_web` tìm kiếm các phương án mã nguồn mở, Best Practice, Anti-pattern từ cộng đồng.
- **VÒNG LẶP KIỂM CHỨNG (CRITICAL):** Do Agent nắm giữ thông tin của Codebase (biết dự án dùng TS, JS, hay ExtendScript ES3...), Agent phải đọc hướng dẫn tìm được trên mạng và **ĐỐI CHIẾU** với Codebase. Nếu hướng dẫn rác hoặc không tương thích môi trường (VD: Web tool khuyên dùng ES6 modules nhưng dự án đang xài ES3), Agent BẮT BUỘC phải tiếp tục dùng tool search tìm Workaround / Phương án khác đến khi nào khả thi mới thôi.
- **Output:** Ghi một báo cáo cô đọng vào file `.task_steps/C1_document.md`. Báo cáo này sẽ là kim chỉ nam cho Bước 2.

### 🛠 BƯỚC 2: THI CÔNG (Vào việc chính)
*Kích hoạt: User gọi lệnh `@[.agent/workflows/runbook.md]`*
Ở pha này, Agent trở thành **Kiến trúc sư & Thợ Cả**. 
Trình tự hành động cứng:

**§C1. ĐỌC TÀI LIỆU TIỀN TRẠM:**
- Bắt buộc kiểm tra và đọc file báo cáo `.task_steps/C1_document.md` do Bước 1 sinh ra. 
- Không tự search web lại ở bước này. Follow tuyệt đối hướng đi mà Bước 1 đã chốt.

**§C2. SCOPE LOCK (Khoanh vùng ảnh hưởng):**
- Sử dụng công cụ `grep_search` để tìm CÁC CONSUMERS của file dự định sửa.
- Ghi output Scope Lock ra file vật lý `.task_steps/C2_scope.md`.

**§C3. CONTRACT (Cam kết thiết kế):**
- Dựa vào kết quả C1 và C2, xuất bản một Kế hoạch triển khai (Implementation Plan) cho User duyệt. User có thể sửa plan này nếu cần.
- *Chỉ khi User duyệt Plan mới được qua Bước C4.*

**§C4. EXECUTION (Thực thi Code Incremental):**
- Split step: Sửa từng file một, commit nháp (nếu cần), kiểm tra lỗi.
- KHÔNG BAO GIỜ đập đi xây lại 100% file gốc nếu không được phép.

**§C5. VALIDATION (Kiểm duyệt):**
- Tự động chạy lại `npm run lint` để đảm bảo code không vi phạm Architecture, Naming.
- Tự động chạy `npm run build` hoặc lệnh test tương ứng để đảm bảo code không bẻ vỡ hệ thống. 
*(Ghi chú: Nếu Lint fail, cân nhắc gọi lệnh `@[.agent/workflows/slash-commands/lint.md]` để được hỗ trợ).*

**§C6. CONTEXT HANDOFF (Bảo toàn Token - BẮT BUỘC):**
- Nếu cuộc trò chuyện kéo dài quá 20-30 lệnh (Context Window phình to gây chậm và ảo giác), hoặc khi hoàn tất một Feature lớn: Bắt buộc gọi lệnh `@[.agent/workflows/slash-commands/handoff.md]` để tạm dừng và sang Session mới.

---

## ⛔ HARD RULES LUÔN NHỚ
- **Quy tắc 3 Không:** Không đoán bậy - Không xoá nhầm - Không giấu lỗi.
- Hãy đọc lại `<CRITICAL_DIRECTIVE>` ở System Prompt nếu quên.

# PLAN (Phần 1): Chiến lược "Cưỡng bức Tư duy sâu" cho Flash

Nhiệm vụ: Nâng cấp Core Protocol và bộ Skill để ép Model Flash hoạt động hết công suất tư duy, chống tính "lười biếng" và "nhảy bước".

## BẰNG CHỨNG HỢP LỆ (COMPLIANCE EVIDENCE)
- §C0/§M (Model): D1=3, Model=Gemini 2.0 Flash
- §C1 (Community): Đã search "LLM agent force reasoning depth", kết luận: Cần dùng kỹ thuật "Slow Planning" (HRM) và "Critique-Rethink-Verify" (CRV).
- §C2 (Scope Lock): Đã grep thấy §E1/§C1 là các entry point quan trọng trong `core_protocol.md`.

---

## Các Thay Đổi Đề Xuất (Flash's Practical Proposal)

### 1. Nâng cấp PHASE 2 (ACT): Thêm lớp "Pre-flight Reasoning" 🔴
Flash hay nhảy vào code mà không "đọc kỹ hướng dẫn sử dụng".
- **Thay đổi:** Ở đầu Phase 2, trước khi gọi bất kỳ tool `replace_file_content` nào, Agent PHẢI in ra một block nội dung (không dùng tool) liệt kê:
  - **Context Recap:** 2 câu tóm tắt Plan hiện tại.
  - **Constraint Check:** Liệt kê các Hard Rules (§E2) có thể bị vi phạm trong task này.
  - **Self-Critique:** Tự trả lời: "Tại sao cách làm này không phá hỏng các consumers đã tìm thấy ở §C2?".

### 2. Nâng cấp §E1 (Error Recovery): Vòng lặp "Recursive Search"
Flash hay loop tại chỗ khi fix code sai.
- **Thay đổi:** Nếu bước §C5 (Validate) fail > 1 lần, Agent **CẤM** được sửa code tiếp dựa trên logic cũ.
- **Bắt buộc:** Quay lại §C1 (Community First) với 1 query mới về thông báo lỗi thực tế (Error Message) để tìm "Silly mistakes" hoặc "Environment issue" TRƯỚC khi chạm vào code lần 2.

### 3. Quy trình "Slow Act - Fast Verify"
Để ép độ sâu, Flash sẽ chia nhỏ ACT thành 2 lớp:
- **Lớp 1 (Slow Act):** Chỉ dùng `view_file` và `grep` để "sờ nắn" file mục tiêu 1 lần nữa (double check line numbers) trước khi sửa.
- **Lớp 2 (Fast Verify):** Ngay sau khi sửa, dùng `cat` (view_file) để xem thành quả và TỰ CHỈ TRÍCH (Critique) xem có lỗi typo nào không.

## Kế hoạch Xác minh (Verification Plan)

### Automated Tests
- Chạy `npm run verify` để đảm bảo workflow không bị hở.
- Chạy thử nghiệm 1 bug "vô hình" (như thiếu file CSS) để xem Flash có nhảy vào Cache (Tunnel Vision) hay dừng lại suy luận theo Protocol mới không.

### Manual Verification
- Sếp review bản PLAN này (Phần 1) so với bản sau này của Pro (Phần 2) để thấy sự khác biệt về chiều sâu.

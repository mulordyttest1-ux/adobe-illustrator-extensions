---
description: "Trạm Trung Chuyển (Step 3): Kích hoạt skill handoff để dọn dẹp Context Window và mở Session mới"
version: 1.1 (Memory-Integrated)
---

# 🧳 LỆNH ĐIỀU CHUYỂN NGỮ CẢNH (Context Handoff Launcher)

> **MỤC TIÊU CỐT LÕI:**
> Giải quyết triệt để rủi ro Context Phình To (Token/Time Burn) và Ảo giác (Lost-in-the-middle).
> Luôn kích hoạt hành động này khi chuyển Feature mới hoặc Lịch sử chat > 30 turns.

Khi User gõ lệnh `@[.agent/workflows/slash-commands/handoff.md]` hoặc yêu cầu Handoff, Agent **BẮT BUỘC** thực hiện:

1. **NẠP SKILL GỐC:** Dùng công cụ `view_file` đọc luật Handoff tại:
   👉 `c:\Projects\adobe-illustrator-extensions\.agent\workflows\skills\handoff\SKILL.md`

2. **DỌN DẸP & TÓM TẮT DỮ LIỆU (State Preservation):**
   - Đọc qua `task.md` hiện tại và dọn dẹp các mục rác / Checkbox quá cũ.
   - Thêm dòng `RESUME POINT` ở đầu `task.md` mô tả công việc sẽ làm tiếp ở Session mới.
   - Nếu dự án có các Quyết định Kiến trúc quan trọng (Architectural Insights), xuất chúng ra file `c:\Projects\adobe-illustrator-extensions\.task_steps\Memory.md`.

3. **GỬI CHỈ THỊ & CHỜ LỆNH (Notify User):** 
   - Thông báo cho User rằng dữ liệu đã được nén gọn gàng.
   - Yêu cầu Sếp mở **MỘT ĐOẠN CHAT MỚI (New Chat)** và ném kèm lời nhắn:
     `"Hãy tải file @[.task_steps/Memory.md] và @[task.md] để Resume dự án."`

---
> **Dành cho User:**
> 1. Gọi lệnh này. Agent tóm tắt.
> 2. Bấm [ + New Chat ].
> 3. Paste dòng lệnh Agent vừa dặn để qua trang mới cày tiếp cực mượt!

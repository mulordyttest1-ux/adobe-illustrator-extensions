# Lessons Learned — Persistent Knowledge Base

> File này lưu bài học rút ra từ §RF1 sau mỗi task.
> Agent GHI thêm vào cuối file, KHÔNG XÓA entries cũ.
> Format: `[YYYY-MM-DD] [Task] → [Lesson]`

---

## 2026-02-25 — Workflow Architecture Migration

- PowerShell `Move-Item` nhiều files có thể treo → dùng `Remove-Item` + `Write-To-File` thay thế
- Research 4 vòng (v1→v4) trước khi code = đúng best practice cộng đồng
- Workflow hay nhưng nếu user không biết cách gọi thì vô nghĩa → luôn kèm hướng dẫn sử dụng
- `MODEL_GUIDE.md` trùng với `skills/model_selection/` → dư thừa → xóa sớm
- `mod_handoff.md` nằm ngoài `skills/` → inconsistent → move vào cho đồng bộ

## 2026-02-28 — Symbol CEP Search Bug (sort-mutation)

### Quy trình sai
- **Bỏ qua §C1** ngay từ đầu → nhảy vào đọc code → giả thuyết sai (diacritics) → đốt ~20 tool calls vô ích
- **Không dùng §T4 (CDP testing) sớm** → suy luận offline thay vì kiểm chứng live → lãng phí
- **Viết implementation_plan trước khi reproduce bug** → plan đầu tiên hoàn toàn vô nghĩa

### Bài học
- **CDP TRƯỚC phân tích**: Với bug UI/runtime, 1 lệnh CDP diagnostic reveal data thật nhanh hơn 10 lần đọc code suy luận
- **Hỏi user kỹ TRƯỚC khi lập giả thuyết**: Em giả định diacritics mismatch, user đã nói rõ "lưu không dấu" — confirmation bias
- **Fuse.js `_docs` là live reference**: Không bao giờ `.sort()` hoặc mutate mảng nguồn sau khi Fuse đã index — `refIndex` sẽ trỏ sai item
- **Lộ trình tối ưu cho bug fix**: §C1 search (1 call) → §T4 CDP reproduce (2 calls) → phân tích (1 call) → fix + verify (3 calls) = ~7-9 calls tổng cộng, không phải 30+

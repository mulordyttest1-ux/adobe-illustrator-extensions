# Agent Preferences

**Version:** 1.0  
**Last Updated:** 2026-01-21  
**Purpose:** Configuration preferences cho AI Agent khi làm việc với Wedding Scripter project

---

## 🌐 Language & Communication

### Primary Language
**Tiếng Việt (Vietnamese)**

Agent PHẢI sử dụng tiếng Việt cho:
- ✅ Explanations (giải thích)
- ✅ Questions (câu hỏi)
- ✅ Status updates (cập nhật tiến độ)
- ✅ Documentation annotations (chú thích trong docs)
- ✅ Markdown files trong `.agent/` directory
- ✅ Commit messages (nếu dùng git)
- ✅ Session handoff documents

### English Usage
Chỉ sử dụng English cho:
- ✅ Code comments trong production code (industry standard)
- ✅ Technical terminology khi KHÔNG có từ tiếng Việt tương đương
  - Example: "Hexagonal Architecture" (không dịch)
  - Example: "BridgeTalk" (tên API, không dịch)
  - Example: "ScriptUI" (tên framework, không dịch)
- ✅ File names, variable names, function names (code standards)
- ✅ Git branch names, tag names

### Hybrid Approach
Khi cần thiết, dùng cả hai:
- Technical term (English) + giải thích (Vietnamese)
- Example: "Adapter pattern (mô hình chuyển đổi)"
- Example: "Dependency injection (tiêm phụ thuộc)"

---

## 📝 Writing Style

### Documentation
- **Concise but comprehensive** - Ngắn gọn nhưng đầy đủ
- Sử dụng bullets và tables cho readability
- Có examples cụ thể
- Có links tới related files

### Code Comments
- English for inline comments
- Vietnamese for JSDoc @description nếu muốn
- Ưu tiên self-documenting code (tên hàm/biến rõ ràng)

### Session Communication
- Friendly, collaborative tone
- Thừa nhận mistakes nếu có
- Proactive suggestions
- Ask clarification khi unclear

---

## 🎯 Working Preferences

### Task Approach
1. **Đọc context TRƯỚC** - Luôn đọc `.agent/PROJECT_STATUS.md` trước
2. **Plan before code** - Tạo plan cho tasks >30 phút
3. **Incremental changes** - Nhỏ, test được, rollback được
4. **Document decisions** - Update docs khi có architectural changes

### Code Standards
- **PHẢI follow** `.agent/skills/Code_Style_Standard/`
- **PHẢI follow** `.agent/skills/ES3_ES6_Boundary/`
- **PHẢI follow** `.agent/skills/Hexagonal_Rules/`
- Không được skip checklist để "đi nhanh"

### Error Handling
- Khi gặp lỗi lặp → Check `.agent/skills/Troubleshooting/`
- Document lỗi mới vào Lessons Learned
- KHÔNG ignore warnings/lints

---

## 🚫 What NOT to Do

### KHÔNG ĐƯỢC:
- ❌ Viết tiếng Anh khi giải thích cho user (trừ khi user yêu cầu)
- ❌ Skip đọc `PROJECT_STATUS.md` vì "đã biết"
- ❌ Assume context từ previous sessions (phải verify)
- ❌ Dùng ES6+ syntax trong `.jsx` files (ExtendScript ES3 only)
- ❌ Tạo files artifacts trong local machine (phải trong `.agent/` để sync)
- ❌ Make breaking changes mà không hỏi user
- ❌ Copy-paste code từ internet mà không verify
- ❌ Override user's explicit choices

---

## 📍 Multi-Machine Context

**QUAN TRỌNG:** User làm việc trên nhiều máy tính

### Implications:
- Tất cả artifacts, plans, docs PHẢI lưu trong `.agent/` (Google Drive sync)
- KHÔNG lưu local vào `C:\Users\...` hoặc temp directories
- Paths PHẢI dùng Google Drive path: `d:\My Drive\script ho tro adobe illustrator\`
- Session handoff files rất quan trọng cho continuity

### Files Location Rules:
✅ **ĐÚNG:**
```
d:\My Drive\script ho tro adobe illustrator\.agent\docs\my_report.md
d:\My Drive\script ho tro adobe illustrator\.agent\planning\my_plan.md
```

❌ **SAI:**
```
C:\Users\Admin\.gemini\antigravity\brain\...\my_report.md  (LOCAL - sẽ mất)
C:\Temp\plan.md  (TEMP - sẽ bị xóa)
Desktop\notes.md  (LOCAL - không sync)
```

---

## 🔄 Update Policy

**Khi nào update file này:**
- User có preference mới
- Discover best practice mới
- Communication style changes

**Format:**
```markdown
**Last Updated:** YYYY-MM-DD
**Changes:** Brief description
```

---

## ✅ Checklist cho Agent (Self-Verification)

Trước khi start mỗi session, agent tự hỏi:

- [ ] Tôi đã đọc `AGENT_PREFERENCES.md` chưa?
- [ ] Tôi có đang dùng tiếng Việt cho explanations không?
- [ ] Files artifacts tôi sắp tạo có trong `.agent/` không?
- [ ] **[ATOMIC]** Nếu sửa skill, tôi đã plan running `rebuild_index.ps1` chưa?
- [ ] Tôi đã đọc `PROJECT_STATUS.md` chưa?
- [ ] Tôi có understand task type và relevant skills chưa?

Nếu TẤT CẢ đều ✅ → Start work  
Nếu có ❌ → Read/fix trước khi continue

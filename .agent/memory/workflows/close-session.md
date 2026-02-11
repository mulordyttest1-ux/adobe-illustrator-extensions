---
description: Đóng session làm việc - tự động tạo handoff documents
---

# Close Session Workflow

**Usage:** `/close-session`

**Khi nào dùng:** Kết thúc session làm việc, chuẩn bị chuyển máy hoặc ngày hôm sau

---

## Steps

### 1. Gather Session Info

Hỏi user (hoặc tự động detect):
- Thời gian bắt đầu session
- Công việc đã hoàn thành
- Công việc đang dở
- Issues gặp phải (nếu có)

### 2. Create/Update Session Documents

**A. Update task.md (artifact)**
```
Đánh dấu tasks hoàn thành [x]
Tasks đang làm [/]
Ghi rõ % complete
```

**B. Create/Update walkthrough.md (artifact)**
```
Summary công việc đã làm
Files changed
Tests status
Proof of work (screenshots nếu có)
```

**C. Create Session Handoff**
```
Path: .agent/docs/sessions/Session_YYYY-MM-DD_[Topic].md
Template: .agent/templates/Session_Handoff.md

Include:
- What was done
- Files changed  
- In progress (incomplete)
- Issues discovered
- Next session TODO
- Important context
```

### 3. Verify Critical Info

Confirm có đầy đủ:
- ✅ Next steps rõ ràng
- ✅ Files changed list
- ✅ Known issues documented
- ✅ Context for next session

### 4. Final Checklist

```
[ ] task.md updated
[ ] walkthrough.md created/updated
[ ] Session handoff created in .agent/docs/sessions/
[ ] All files saved (Google Drive sẽ sync)
```

### 5. Generate Summary for User

**Output format:**
```markdown
## ✅ Session Closed

**Time:** HH:MM - HH:MM (X hours)
**Status:** [Phase/Task] - [%] complete

### Documents Created:
- Session: .agent/docs/sessions/Session_YYYY-MM-DD_[Topic].md
- Walkthrough: [artifact path]
- Task: [artifact path]

### Next Session:
1. Read: [session handoff file]
2. Continue: [specific task]
3. ETA: X hours

**Files will sync via Google Drive** 🏠
```

---

## Example Usage

**User says:** `/close-session`

**Agent does:**
1. Reviews current conversation
2. Updates task.md with progress
3. Creates walkthrough.md if not exists
4. Creates session handoff in .agent/docs/sessions/
5. Provides summary to user

---

## Notes

- Google Drive sync tự động → không cần copy files
- Session handoff = quick start guide cho session tiếp theo
- Artifacts (task.md, walkthrough.md) = detailed context
- Always include "next steps" - người tiếp tục biết làm gì

---
description: Resume session từ handoff - nhanh chóng nắm context và tiếp tục
---

# Resume Session Workflow

**Usage:** `/resume-session`

**Khi nào dùng:** Bắt đầu session mới ở máy khác hoặc ngày mới

---

## Steps

### 1. Find Latest Session Handoff

```powershell
# List recent sessions
Get-ChildItem ".agent/docs/sessions/" | Sort-Object LastWriteTime -Descending | Select-Object -First 5
```

**Agent tự động:** Read session handoff gần nhất

### 2. Load Context Files

**Priority order:**
1. **Session Handoff** - Quick overview
   - `.agent/docs/sessions/Session_YYYY-MM-DD_[Topic].md`
   
2. **Task.md** (artifact) - Current progress
   - Check [ ] in progress items
   - Find [/] current task
   
3. **Walkthrough.md** (artifact) - What was done
   - Understand previous work
   - See what was tested

4. **Implementation Plan** (if exists) - Architecture
   - Full context of feature being built

### 3. Verify Environment

**Check:**
```
[ ] Google Drive synced?
[ ] Files match handoff?
[ ] No local changes uncommitted?
```

**If issues:**
- Wait for Google Drive sync
- Resolve conflicts if any
- Notify user if blockers

### 4. Summarize for User

**Output format:**
```markdown
## 📋 Session Resumed

**Previous Session:** YYYY-MM-DD HH:MM
**Status:** [Phase/Task] - [%] complete

### What Was Done Last Time:
- [Summary from handoff]

### Current State:
- Files: [N] created, [M] modified
- Status: [brief status]

### Next Steps (from handoff):
1. [Priority 1 task]
2. [Priority 2 task]

### Ready to Continue?
A. Yes - proceed with Priority 1
B. Need clarification on [topic]
C. Different priority (user decides)
```

### 5. Start Working

**Based on user choice:**
- Set task_boundary with appropriate task name
- Continue from where previous session stopped
- Update task.md as progress

---

## Example Usage

**User says:** `/resume-session`

**Agent does:**
1. Find latest session in `.agent/docs/sessions/`
2. Read handoff → task.md → walkthrough.md
3. Verify environment (Google Drive sync)
4. Present summary + next steps
5. Ask user confirmation before starting
6. Set task_boundary for chosen work

---

## Quick Commands for Resume

**After `/resume-session`:**

- `/show-context` - Show more details from handoff
- `/list-files` - List all files changed last session
- `/check-sync` - Verify Google Drive sync status
- `/pick-task` - Choose different task from task.md

---

## Notes

- **Always read handoff first** - it's the quick start guide
- **Verify sync** - especially important when switching machines
- **Ask before starting** - user might have different priorities
- **Update context as you go** - keep task.md current

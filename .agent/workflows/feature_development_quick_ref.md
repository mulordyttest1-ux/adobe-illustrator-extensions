---
description: Quick reference card cho Feature Development Workflow
---

# Feature Development - Quick Reference

## 🎯 Golden Rules

1. **Context First, Code Later**
2. **Research > Reinvent**
3. **Validate with User**
4. **Incremental Implementation**
5. **Test Each Phase**

---

## 📋 Phase Checklist

### 🔍 Before Writing Code

- [ ] Đọc `.agent/GOVERNANCE.md`
- [ ] Understand user workflow
- [ ] Research best practices (web search)
- [ ] Validate với context thực tế
- [ ] Get user approval on plan

### 💻 During Implementation

- [ ] Follow implementation plan
- [ ] Code phase by phase
- [ ] Test after each phase
- [ ] Update `task.md` progress

### ✅ Before Marking Complete

- [ ] User tests with real data
- [ ] Fix critical issues
- [ ] Update documentation
- [ ] Retrospective notes

---

## ⚖️ Decision Framework

### Should I Build This Feature?

```
ROI = Value Delivered / Dev Time

High ROI (> 5): ✅ Do
Medium ROI (2-5): 🟡 Consider
Low ROI (< 2): ❌ Skip or simplify
```

### How Much to Build?

```
MVP: MUST have only
v1.0: MUST + high-value SHOULD
v2.0: Everything else
```

---

## 🚨 Red Flags

⛔ **STOP if:**
- User context unclear
- No validation from user
- Copying without understanding
- Building whole thing before testing

---

## 📁 File Structure

```
.agent/planning/
  └── [feature]_requirements.md
  └── [feature]_research.md
  └── [feature]_implementation_plan.md
  └── [feature]_test_results.md
```

---

**Full Workflow:** See `feature_development.md`

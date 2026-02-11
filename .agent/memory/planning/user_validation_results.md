# User Validation Results

**Date:** 2026-01-19  
**Phase:** Context Validation (Phase 3 of /feature_dev)  
**Purpose:** Validate assumptions with real user context

---

## 📋 Validation Questions & Answers

### Q1: Data Loss Severity
**Question:** Chính xác bao nhiêu % data bị mất với SCAN hiện tại?

**User Answer:**
> "scan hiện tại không scan metadata nên không đúng gì hết"

**Analysis:**
- **Data loss:** 100% (complete failure)
- **Severity:** CRITICAL - Feature completely broken
- **Context:** Current SCAN chỉ lấy `tf.name`, bỏ sót toàn bộ metadata
- **Impact:** Users cannot use SCAN button at all

**Decision:** ✅ FULL implementation required, NO MVP shortcut

---

### Q2: Multi-Key Frame Usage
**Question:** Bao nhiêu % frames cần tracking >1 key?

**User Answer:**
> "tùy thuộc vào context câu văn mà sẽ có số lượng key khác nhau, không cố định có thể là 1,2,3,... hoặc đủ"

**Analysis:**
- **Pattern:** VARIABLE (1 to N keys per frame)
- **Example:** "Nguyễn Văn A" = 3 keys (họ + lot + tên)
- **Complexity:** Context-dependent, unpredictable
- **Conclusion:** MUST support multi-key extraction

**Validation:**
```
Frame 1: "Nguyễn Văn A" → 3 keys (lot + ten + full)
Frame 2: "Trưởng Nam" → 1 key (vithu)
Frame 3: "Lễ Thành Hôn, Ngày 10/01/2026" → 2+ keys (le + date)
```

**Decision:** 
- ✅ MetadataAdapter MUST track unlimited mappings
- ✅ SmartComplexStrategy REQUIRED (not optional)
- ✅ Cannot simplify to single-key only

---

### Q3: Manual Edit Frequency
**Question:** Có thường xuyên sửa tay trong Illustrator không?

**User Answer:**
> "sửa tay không thường xuyên nhưng công việc chung nên có khả năng có người khác động vào file"

**Analysis:**
- **Frequency:** LOW but NON-ZERO
- **Context:** Collaborative work environment
- **Risk:** Multiple people touch same files
- **Scenario:** Typo fixes, last-minute changes

**Real-world example:**
```
Designer A: Updates form → UPDATE document
Designer B: Opens file in Illustrator → fixes typo manually
Designer A: Re-opens file → SCAN → Must detect B's change!
```

**Decision:**
- ✅ Manual edit detection REQUIRED
- ✅ Conflict warning MUST show
- ✅ Metadata comparison critical

---

### Q4: Performance Requirements
**Question:** SCAN 2 giây có acceptable không?

**User Answer:**
> "scan script cũ rất chậm mà cũng chỉ tính bằng ms nên hiện tại phải ngay lập tức"

**Analysis:**
- **Current:** Script cũ = milliseconds (instant)
- **Expectation:** "ngay lập tức" = INSTANT
- **Tolerance:** ZERO delay acceptable
- **Priority:** Performance = CRITICAL

**Benchmark context:**
```
Old script (ms level) → User expects this
New implementation must match or beat
2 seconds = UNACCEPTABLE ❌
```

**Decision:**
- ✅ ALL performance optimizations REQUIRED
- ✅ Batch redraw pattern critical
- ✅ Cannot sacrifice speed for features
- ✅ Must profile and optimize

---

## 🎯 Impact on Implementation Plan

### Original Plan Review

**Consideration: MVP vs Full Build**
- MVP (6-8h): Basic metadata only
- Full (14-19h): Complete system with all optimizations

**User Context:**
1. 100% data loss → CRITICAL
2. Variable keys → Complex required
3. Collaborative → Conflict detection needed
4. Instant performance → All optimizations needed

**✅ DECISION: FULL BUILD (14-19h)**

Rationale:
- Cannot compromise on features (all MUST-have)
- Cannot compromise on performance (instant required)
- MVP would still fail user needs

---

### Updated Requirements

**MUST Have (All Validated):**
1. ✅ MetadataAdapter with unlimited mappings
2. ✅ Multi-key extraction (variable 1-N)
3. ✅ All 3 strategies (Fresh/Direct/Complex)
4. ✅ Manual edit detection & warning
5. ✅ Performance optimizations (batch, DESC order)

**Scope Changes:**
- ❌ NO MVP shortcut possible
- ✅ Keep all performance patterns from backup
- ✅ Prioritize speed over convenience features

---

## 📊 Revised Priority Matrix

| Feature | User Need | Priority | Complexity | Keep/Add |
|---------|-----------|----------|------------|----------|
| **MetadataAdapter** | 100% loss fix | CRITICAL | Medium | ✅ MUST |
| **Multi-key support** | Variable context | CRITICAL | High | ✅ MUST |
| **SmartComplexStrategy** | Multi-key frames | CRITICAL | High | ✅ MUST |
| **Manual edit detect** | Collaborative | HIGH | Medium | ✅ MUST |
| **Performance optimize** | Instant required | CRITICAL | Medium | ✅ MUST |
| **Context inference** | Nice-to-have | LOW | High | 🟡 DEFER |
| **Discovery mode** | Edge case | LOW | High | 🟡 DEFER |

---

## ⚡ Performance Strategy

### Critical Optimizations (ALL REQUIRED)

**1. Batch Redraw**
```javascript
// Process ALL frames
for (var i = 0; i < frames.length; i++) {
  updateFrame(frames[i]); // No redraw!
}
app.redraw(); // ONCE at end ✓
```

**2. DESC Order Iteration**
```javascript
// Avoid index shifting
for (var i = replacements.length - 1; i >= 0; i--) {
  applyReplacement(replacements[i]);
}
```

**3. Cache References**
```javascript
// Don't re-query DOM
var chars = tf.characters; // Cache once
for (var i = chars.length - 1; i >= 0; i--) {
  chars[i].contents = newVal;
}
```

**4. Skip Locked/Hidden**
```javascript
// Early exit
if (!isWriteable(frame)) continue; // Fast skip
```

**5. Minimize Metadata Parsing**
```javascript
// Parse once per frame
var meta = MetadataAdapter.getState(item); // Cache result
```

---

## 🚨 Risk Mitigation Updates

### Risk 1: Performance Degradation
**Mitigation:**
- Profile EVERY phase
- Benchmark against old script
- Optimize hot paths
- Consider caching if needed

**Target:** Match or beat old script (ms level)

---

### Risk 2: Complexity Overload
**Mitigation:**
- Incremental phases (test after each)
- Comprehensive logging
- Fallback to simple mode on error

**Safety:** Graceful degradation always

---

### Risk 3: Data Corruption
**Mitigation:**
- Validate metadata before write
- Safe parse with try/catch
- User can reload without save

**Principle:** Never lose user data

---

## ✅ Final Validation Summary

| Aspect | Assumption | User Reality | Impact |
|--------|------------|--------------|--------|
| **Data loss** | ~80% | 100% | More critical |
| **Multi-key usage** | ~60% | Variable, all cases | Must support all |
| **Manual edits** | Rare | Collaborative work | Detection needed |
| **Performance** | 2s OK | Instant only | All optimizations |

**Overall:** User needs validate FULL implementation with NO shortcuts.

---

## 🎯 Final Approval

**Scope:** Full build (14-19 hours)  
**Phases:** 5 phases as planned  
**Optimizations:** ALL required  
**MVP:** Not viable

**Confidence:** 95%  
**Readiness:** ✅ READY TO IMPLEMENT

---

## 📋 Next Steps

**Phase 1:** Foundation (Core Adapters) - 3-4h
- Create folder structure
- Port MetadataAdapter.jsx
- Port DOMHelper.jsx
- Port TextFrameManipulator.jsx
- TEST: Metadata read/write works

**Start time:** Ready to begin  
**Estimated completion:** 14-19 hours total

---

**Status:** User Validation COMPLETE ✅  
**Decision:** Full Implementation Approved  
**Next:** Begin Phase 1

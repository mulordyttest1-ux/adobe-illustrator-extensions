---
name: Model Selection
description: Load khi task phức tạp (D1≥3). Chọn model tối ưu theo matrix. Không tự suy luận.
version: 1.0
---

# Skill: Model Selection

> Trigger: §C3 trong Core Protocol (khi task phức tạp).
> MUST use matrix. NO re-evaluation of model theory.
> If ambiguous → choose HIGHER depth model.

## §M1 — CLASSIFY PLAN (Score D1–D6)

| ID | Dimension | 1 (Low) | 5 (High) |
|:---|:----------|:--------|:---------|
| D1 | DEPTH | Typo fix | System architecture |
| D2 | CROSS | 1 file | 10+ files coupled |
| D3 | RISK | Cosmetic | Breaking/data loss |
| D4 | CTX | <10K tokens | >200K tokens |
| D5 | SPEED | Can wait | Real-time |
| D6 | COST | No limit | Must minimize |

## §M2 — CALCULATE SUM
`SUM = D1 + D2 + D3` (SPEED/COST = tiebreakers)

## §M3 — CHECK OVERRIDES
- CTX≥4 → Gemini (1M+ context window)
- TOOL_DISCIPLINE critical → Claude (strict adherence)
- SPEED=5 + DEPTH≤2 → Flash (always)
- RISK=5 → never Flash

## §M4 — LOOKUP MATRIX

| SUM | SPEED≥4 | COST≥4 | Default |
|:---:|:-------:|:------:|:--------|
| 3–5 | Flash | Flash | **Flash** |
| 6–8 | Sonnet | Pro Low | **Pro Low** |
| 9–11 | Sonnet | Sonnet | **Pro High** |
| 12–15 | Opus | Opus | **Opus** |

Fallback: Primary unavailable → next row DOWN.

## §M5 — OUTPUT

```
🤖 Model Recommendation
Recommended: [Model]
Scores: D1=[x] D2=[x] D3=[x] D4=[x] D5=[x] D6=[x] SUM=[x]
Why: [1-line reason]
Tradeoff: [What you lose]
Fallback: [Next-best]
Override: [Rule triggered or NONE]
```

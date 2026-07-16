---
name: Model Selection
description: Choose the right reasoning depth or model family for complex work. Use only for high-complexity planning where cost, speed, risk, and context size materially change the strategy.
---

# Skill: Model Selection

Use this skill only when the task is complex enough that model choice or reasoning depth changes the plan.

## Score The Task

| ID | Dimension | 1 (Low) | 5 (High) |
|:---|:----------|:--------|:---------|
| D1 | depth | typo fix | architecture or migration |
| D2 | cross-cutting scope | 1 file | 10+ coupled files |
| D3 | risk | cosmetic | breaking or data loss |
| D4 | context size | small | very large |
| D5 | speed pressure | can wait | urgent |
| D6 | cost pressure | flexible | must minimize |

Use `SUM = D1 + D2 + D3`. Treat D4-D6 as tie-breakers.

## Selection Heuristics

- high context pressure -> favor larger-context tooling
- high risk -> favor deeper reasoning over speed
- high speed and low depth -> favor the faster option
- if uncertain, choose the safer or deeper option

## Output

```text
Model Recommendation
Recommended: [model or depth]
Scores: D1=[x] D2=[x] D3=[x] D4=[x] D5=[x] D6=[x] SUM=[x]
Why: [1 line]
Tradeoff: [what you lose]
Fallback: [next-best]
```

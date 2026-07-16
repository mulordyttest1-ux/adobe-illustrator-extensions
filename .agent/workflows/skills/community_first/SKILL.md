---
name: Community First
description: Research and align with current community practice before planning or implementation. Use for new work, ambiguous tasks, risky fixes, or whenever the agent might be overfitting to a first idea.
---

# Skill: Community First

Run request normalization before this skill. Use this skill to reduce hallucination, surface current best practice, and expose anti-patterns early.

## Goal

- find current best practices before committing to a direction
- surface anti-patterns before code or planning drifts
- identify edge cases early
- compare the likely solution against repo constraints

## Workflow

### 1. Define

- restate the problem in one technical sentence
- write 2-3 search or comparison angles
- for bugs, generate 3 independent hypotheses before diving in

### 2. Search

- prioritize official docs, standards, specs, and high-signal issue threads
- reject results that are outdated, wrong stack, or wrong version
- if no strong public guidance exists, say that explicitly

### 3. Extract

Always extract 4 buckets:

- `Best practices`
- `Anti-patterns`
- `Edge cases`
- `Counterfactuals`

`Counterfactuals` means plausible alternatives, drawbacks of the current direction, and reasons not to commit too early.

### 4. Align

- label the direction as `aligned`, `misaligned`, or `niche path`
- if misaligned, explain why and route back to `/plan` or ask for clarification
- if the user already suggested a solution, actively search for drawbacks and alternatives before endorsing it

### 5. Recon

- read only the repo governance and memory needed for this task
- call out impact on current modules, especially `libs/shared`

## Output Contract

Do not return free-form prose only. The result must include these sections:

1. `Best practices`
2. `Anti-patterns`
3. `Edge cases`
4. `Counterfactuals`

If the output feeds a C1 document, those 4 sections must become explicit headings.

## Hard Rules

- do not skip Define -> Search -> Extract -> Align
- do not skip anti-patterns just because the user sounds confident
- do not use community guidance as proof-text without checking repo constraints

## Compliance Receipt

Record this in the C1 or close-out when relevant:

```text
C1-RESEARCH: DEFINE=[1 sentence] | SEARCH=[n queries] | BEST=[n] | ANTI=[n] | EDGE=[n] | COUNTER=[n] | ALIGN=[aligned/misaligned/niche]
```

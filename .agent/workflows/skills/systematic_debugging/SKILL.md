---
name: Systematic Debugging
description: Isolate verified root causes before patching. Use in /fix and whenever /build drifts into bug investigation or runtime behavior differs from expectation.
---

# Skill: Systematic Debugging

Use this skill after request normalization when the task has become debugging, reproduction, or root-cause isolation work.

## Goal

- lock the real symptom
- generate independent hypotheses
- gather evidence that kills or proves hypotheses
- fix only after the root cause is confirmed

## Run It When

- a user reports broken, flaky, or regressed behavior
- `/build` drifts into investigation instead of straightforward implementation
- runtime behavior disagrees with the current theory

## Phases

### 1. Capture

- record expected vs actual behavior
- pin the affected module, screen, command, or runtime path
- state the reproduce path, or say exactly why it is still missing

### 2. Hypothesize

- write 3 independent hypotheses
- avoid three variants of the same guess
- include at least one hypothesis outside the first obvious idea

### 3. Isolate

- prefer runtime evidence, targeted logs, smoke tests, and narrow searches
- kill one hypothesis at a time
- if all 3 fail, restate the symptom before inventing more

### 4. Prove Root Cause

- name the mechanism that creates the symptom
- state which file, module, or data path owns the failure
- explain why this mechanism produces the observed behavior

### 5. Repair And Recheck

- apply the smallest root-cause fix that resolves the issue
- rerun the affected checks
- if the fix widens into design or refactor work, route back to `/plan`

## Hard Rules

- do not ship a final patch that is still only a hypothesis
- do not treat symptom masking as root-cause fixing
- temporary mitigation is allowed only when the user clearly accepts a temporary state

## Output Contract

The close-out or debug notes must expose these headings:

- `Symptom`
- `Hypotheses`
- `Isolation`
- `Root Cause`

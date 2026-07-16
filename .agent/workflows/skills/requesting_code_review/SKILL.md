---
name: Requesting Code Review
description: Run a focused review gate after non-trivial implementation. Use for D1>=2, shared changes, cross-app impact, or whenever regression risk is real.
---

# Skill: Requesting Code Review

Use this skill as a review gate after implementation but before final completion.

## Goal

- catch boundary leaks and regression risk
- verify the change still matches the approved direction
- confirm validation depth is proportional to impact

## Run It When

- any D1>=2 task
- any change in `libs/shared`
- any change with cross-app impact
- any bug fix that changed behavior outside one narrow surface

## Review Focus

- plan or chosen-direction alignment
- architecture and boundary compliance
- consumer impact
- validation sufficiency
- simplification opportunities

## Output Contract

Append a `## Review Gate` section to the current C2 file with:

- `Scope Reviewed`
- `Top Risks`
- `Required Fixes` or `No Blocking Findings`
- `Validation Rerun Needed`

## Hard Rules

- review is not optional for the trigger cases above
- prioritize findings by severity, not by chronology
- if review changes code, rerun impacted validation before `Verification Gate`
- do not leave required fields blank; use `none` only when that is the truthful result

---
name: Verification Before Completion
description: Record what was actually verified before declaring a task done. Use near the end of /build and /fix, especially for non-trivial or cross-app changes.
---

# Skill: Verification Before Completion

Use this skill immediately before any final "done" message on code changes.

## Goal

- separate proven behavior from assumptions
- shrink overconfident close-outs
- make residual uncertainty explicit

## Run It When

- every `/build` that changed code
- every `/fix` after the repair has been validated
- docs-only changes may use a lightweight version with explicit skip reasons

## Verification Gate

Append a `## Verification Gate` section to the current C2 file with:

- `Claims Verified`
- `Evidence Run`
- `Remaining Limits`
- `Unverified But Suspected`

## Hard Rules

- if the evidence does not support a claim, lower the claim
- if review or follow-up edits change the code, rerun impacted validation before closing the gate
- do not hide skipped checks; state them and explain why they were skipped
- after writing the gate, run `npm run check:gates -- --file .task_steps/<c2-file>.md` as the recommended receipt check

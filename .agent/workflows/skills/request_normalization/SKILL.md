---
name: Request Normalization
description: Normalize natural-language user requests before routing into /plan, /build, or /fix. Use at the start of every new request and whenever scope changes materially.
---

# Skill: Request Normalization

This is the internal front door for user input. It is not a public slash command.

## Goal

Turn spoken, shorthand, or ambiguous user input into a small receipt so the agent can route correctly and know what problem is actually being solved.

## Run It When

- a new request arrives
- scope changes materially mid-task
- the user speaks loosely, vaguely, or in shorthand

## Normalized Receipt

| Field | Meaning |
|:------|:--------|
| `intent` | bug fix, feature, refactor, docs, review, question, deployment, or unknown |
| `route` | `/plan`, `/build`, `/fix`, or `clarify-first` |
| `goal` | final outcome the user wants |
| `success_criteria` | signs that the task is done |
| `scope_guess` | likely files, modules, or surfaces involved |
| `constraints` | ES3 boundary, shared impact, user direction, time pressure, and similar limits |
| `unknowns` | information still missing |
| `approval_needed` | whether the workflow must pause for user approval |

## Routing Rules

- route to `/fix` for symptoms, regressions, logs, or broken behavior
- route to `/plan` for features, refactors, ambiguous asks, or cross-module work
- route to `/build` only when scope is already clear or the change is trivially safe
- route to `clarify-first` only when a critical unknown blocks route, scope, or validation

## Clarification Rules

- users are allowed to speak naturally; the agent must normalize first
- do not ask for information the repo or current context can already answer
- ask follow-up questions only when the missing detail changes route, scope, or validation
- when asking, request action-oriented details such as repro steps, expected vs actual, logs, screenshots, or target screen/module

## Output Rules

- keep the receipt short
- for `/plan`, emit the receipt before `community_first`
- for `/fix`, lock symptom and goal before building hypotheses
- for `/build`, state why the task is safe not to send back to `/plan`

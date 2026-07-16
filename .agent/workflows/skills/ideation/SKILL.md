---
name: Ideation Protocol
description: Compare solution directions before detailed planning. Use for ambiguous tasks, feature design, refactors, or high-impact work where multiple approaches are plausible.
---

# Skill: Ideation Protocol

Use this skill inside `/plan` when the problem is still fuzzy or the solution space has multiple viable directions.

## 1. Decompose The Problem

- split the request into 2-5 sub-problems
- identify hard constraints: stack, ES3 boundary, architecture rules, file limits, rollout risk
- list unknowns that really matter
- restate spoken or shorthand user input in implementation-ready language

## 2. Bring In Community Wisdom

- compare how the community solves similar problems
- extract:
  - best practices
  - anti-patterns
  - edge cases
  - tradeoffs
- if the user suggested a specific direction, perform an anti-sycophancy check:
  - drawbacks of that direction
  - alternatives worth considering

## 3. Compare Real Options

- propose 2-3 genuinely different options
- give each option a clear tradeoff
- call out anti-patterns already rejected
- call out counterfactuals when the team is leaning too hard toward one option

## 4. Checkpoint

- does the chosen direction violate constraints
- have edge cases and anti-patterns been covered
- is user approval needed before deeper planning

Pass -> continue `/plan`.
Fail -> loop back or ask for focused clarification.

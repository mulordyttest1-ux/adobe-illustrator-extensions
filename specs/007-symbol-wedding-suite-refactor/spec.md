# Symbol Wedding Suite Policy/Lifecycle Refactor V1

## Goal

Keep Wedding Suite Standard behavior unchanged while making the panel and
Illustrator host lifecycle easier to reason about and test.

## Scope

- Panel policy, view rendering, action/build orchestration, and facade wiring.
- Host JSX source/session, render, output lifecycle, and public endpoint
  composition.
- Static composition and ES3 boundary tests.
- Symbol Illustrator 2026 smoke validation only.

## Non-goals

- No Config Tab, Action Tab, imposition engine, installer, or shared-library
  changes.
- No change to PDF-only output, dirty guards, QA, save/open behavior, geometry,
  or debug artifact policy.
- No Illustrator 2025 smoke lane.

## Invariants

- `WeddingSuiteTab` remains the panel facade and runtime registration surface.
- `planner.js` remains pure and keeps its existing exports.
- `wedding_suite_standard.jsx` remains the only public host endpoint file.
- All extracted JSX remains ES3-compatible.
- `host.jsx` includes host layers in the order `core`, `source`, `render`,
  `output`, then the public root.

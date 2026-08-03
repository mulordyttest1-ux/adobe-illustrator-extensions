# Implementation Plan: Wedding Calendar Year Override

## Domain

- Implement pure Vietnamese solar/lunar conversion from Julian day, new moon,
  solar longitude, leap-month rules, and UTC+7.
- Make `CalendarEngine` stateless and remove the runtime database lifecycle.
- Keep `DateLogic` as the UI-facing facade and pass explicit years through every
  conversion and dependent-date operation.

## Date Grid

- Replace the computed year span with a locked numeric input.
- Add one `year auto` checkbox per row.
- Route year checkbox changes separately from existing dependent-row locks.
- Preserve manual years while updating weekday and lunar-year labels.
- Include the selected year in all solar/lunar calculations.

## Startup

- Remove calendar CSV loading from startup resources.
- Keep `data/ngay.csv` in the repository only for parity tests.

## Verification

- Add domain conversion and roundtrip tests.
- Compare algorithm output against all legacy CSV records.
- Characterize locked, unlocked, scanned, and cross-year Date Grid behavior.
- Run encoding, Wedding lint/build/unit, domain tests, and 2026 smoke only if
  runtime validation requires it.

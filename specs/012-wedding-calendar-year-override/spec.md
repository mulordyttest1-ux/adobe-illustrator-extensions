# Feature Specification: Wedding Calendar Year Override

## Goal

Replace the runtime CSV-backed lunar conversion with an offline Vietnamese
lunisolar calculation while preserving the current Date Grid workflow. Add a
locked year input so operators can override the inferred year without changing
how day and month are entered.

## Requirements

- Date Grid keeps the existing Tiec, Le, and Nhap rows.
- Each row exposes its Gregorian year as a number input.
- A checked `year auto` checkbox locks the corresponding year input.
- Unchecking `year auto` enables manual year entry.
- The initial automatic policy resolves the next valid Gregorian occurrence
  on or after today, within the supported calendar range.
- For ordinary dates this means the current year or the next Gregorian year;
  February 29 skips to the next valid leap year.
- Scanned year values populate the locked year input and remain authoritative.
- When an operator enters a lunar date with automatic year enabled, the runtime
  chooses the next matching lunar occurrence without requiring year input.
- If an operator changes the lunar month, stale leap-month metadata from the
  previous month is ignored.
- The main wedding date shows a non-blocking warning when it is more than three
  calendar months after today, prompting the operator to verify the inferred year.
- Dependent rows inherit the computed year when they cross a year boundary.
- Solar/lunar conversion runs offline with Vietnam timezone UTC+7.
- Runtime no longer reads `data/ngay.csv`.
- No holiday, festival, auspicious-day, or event metadata is introduced.
- Existing `data/ngay.csv` remains only as a regression fixture.

## Acceptance

- Existing day/month entry habits and Scan/Update actions remain unchanged.
- Manual year override controls both conversion and the generated update packet.
- All 348 legacy CSV rows match the algorithmic conversion.
- Known lunar new-year and year-boundary dates convert correctly.
- Every solar date from 2026 through 2030 roundtrips through the lunar UI path.
- The three-month warning is silent at the exact boundary and active after it.
- Date Grid clearly exposes whether a year is automatic or manual.

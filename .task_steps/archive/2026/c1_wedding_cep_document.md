# C1 Research: Checkbox Authority Problem

> Historical research artifact for the wedding flow.

## Problem

The `ten_auto` checkbox in the venue and ceremony flow violated SSOT. It was not only an autofill helper; it also influenced the final `diachi` value during build, which could overwrite user-entered data.

## Best Practice

- The input field owns the data.
- Autofill may write into the field, but it should not bypass the field and become the final authority.
- A "same as billing address" style checkbox should copy data into the input, then stop owning the result.

## Codebase Alignment

Two issues were identified:

- UI layer: `FormLogic` could keep overwriting `ceremony.diachi` while the checkbox stayed checked.
- Build layer: `applyAutoVenue()` could still derive address values from the checkbox state.

## Recommended Fix

- In `FormLogic.js`, manual typing into `ceremony.diachi` or `venue.diachi` should cancel the autofill checkbox.
- In `venue.js`, `applyAutoVenue()` should not rewrite `ceremony.diachi` or `venue.diachi` once `getData()` has produced the packet.

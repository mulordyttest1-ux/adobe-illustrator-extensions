# Implementation Plan

1. Characterize the existing Wedding Suite panel, host contract, PDF lifecycle,
   and 2026 smoke suite.
2. Extract panel policy into `panelPolicy.js`, pure markup into `panelView.js`,
   and bridge/build actions into `panelActions.js`; retain the
   `WeddingSuiteTab` facade.
3. Split the host monolith mechanically into ES3-compatible core, source,
   render, and output modules while keeping public endpoints in the root.
4. Add composition and ES3 contract tests without changing runtime payloads.
5. Update architecture/status/inventory documentation and run the Symbol
   lint, build, unit, encoding, and Illustrator 2026 smoke gates.

## Risk Controls

- Preserve function bodies during host extraction rather than rewriting
  ExtendScript.
- Validate function assignment names before and after extraction.
- Keep panel facade override seams used by existing tests.
- Stop if geometry, output lifecycle, or smoke behavior changes.

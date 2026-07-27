# Implementation Plan

1. Route Document Sync actions and strategy application through `hostFacade`
   only, while leaving Schema Tab bridge compatibility isolated.
2. Remove mutable assembler state and the legacy `assemble`/`setDependencies`
   fallback; require `assembleWith`.
3. Remove unused `StrategyOrchestrator` batch and metadata methods.
4. Add characterization and contract tests, then update architecture inventory.
5. Run Wedding lint, build, unit/domain tests, and Illustrator 2026 smoke on
   port `9197`.

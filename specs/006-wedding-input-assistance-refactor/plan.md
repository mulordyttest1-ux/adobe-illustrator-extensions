# Implementation Plan

1. Replace mutable `InputEngine` registries with a closure-backed
   `createInputEngine(deps)` factory and one default facade.
2. Keep field dispatch centralized for date, name, address, and text while
   preserving all existing normalizer and validator policies.
3. Move Compact Form tests to an explicit `InputEngineLike` dependency seam
   instead of mutating the default singleton.
4. Make `AddressAutocomplete.init({ hostFacade })` the only supported host
   contract and keep index failure reset behavior unchanged.
5. Remove the verified-unused deprecated name helper.
6. Update architecture/status/inventory documentation and run Wedding unit,
   domain, build, lint, encoding, and Illustrator 2026 smoke validation.

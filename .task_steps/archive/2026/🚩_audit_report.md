# Audit Report: Wedding CEP Schema Injection

> Historical review artifact.

## Critical Finding

### 1. Selection identity risk

- Description: the implementation used positional `index` values to match text frames between web code and Illustrator.
- Impact: if selection order changes mid-flow, `{pos1.ong}` can be injected into the wrong frame.
- Recommendation: introduce a stable synthetic UUID derived from geometry and source text.

## Medium Findings

### 2. Cluster injection selection mismatch

- Description: "Tiêm Cụm" only checked `if (length > 3)`.
- Impact: selecting the wrong number of objects can still trigger schema injection into unintended frames.
- Recommendation: require exactly three selected objects or present an explicit preview of the target mapping.

### 3. Y-axis tie handling

- Description: equal `top` coordinates can produce unstable ordering.
- Impact: `{ong}` and `{ba}` can swap unpredictably.
- Recommendation: add a left-to-right secondary sort when `top` values tie.

## Low-Risk Observation

### 4. Large selection overhead

- Description: removing the old 30-frame cap increases the chance of slow serialization on very large selections.
- Recommendation: monitor only. This was acceptable for the expected wedding workflow.

## Conclusion

Status: usable for beta-style operation, but the selection identity issue should be fixed to improve trustworthiness.

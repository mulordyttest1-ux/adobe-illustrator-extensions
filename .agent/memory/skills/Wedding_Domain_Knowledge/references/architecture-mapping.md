# Architecture Mapping

| Concern | Current starting point |
|:--------|:-----------------------|
| shared field contract or reusable business rule | `libs/wedding/domain/README.md` and `libs/wedding/domain/src/index.ts` |
| reverse sync and document update flow | `wedding-cep/FEATURE_MAP.md` (`Document Sync`) then `wedding-cep/cep/js/logic/use-cases/document-sync/updateDocumentService.js` |
| scan and read from Illustrator | `wedding-cep/FEATURE_MAP.md` (`Document Sync`) then `wedding-cep/cep/js/actions/ScanAction.js` and `wedding-cep/cep/js/logic/use-cases/document-sync/scanDocumentService.js` |
| packet assembly and field transport | `wedding-cep/cep/js/logic/pipeline/assembler.js` and `wedding-cep/cep/js/logic/use-cases/support/schemaMeta.js` |
| host-side Illustrator operations | `wedding-cep/cep/jsx/illustrator.jsx` |

## How To Use This Table

- change a business rule or derived field: start in the shared domain route first
- change scan or update behavior: start in `Document Sync`
- change field transport shape: inspect packet assembly before touching host-side code
- if the change crosses domain, packet, and host boundaries, route back through `/plan`

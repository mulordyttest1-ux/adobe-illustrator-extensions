import { runUpdateDocumentService } from './document-sync/updateDocumentService.js';

export async function runUpdateDocument({ rawData = {}, schema = null, applyUpdate } = {}, deps = {}) {
    if (typeof applyUpdate !== 'function') {
        throw new Error('runUpdateDocument requires an applyUpdate callback');
    }

    return runUpdateDocumentService({ rawData, schema, applyUpdate }, deps);
}

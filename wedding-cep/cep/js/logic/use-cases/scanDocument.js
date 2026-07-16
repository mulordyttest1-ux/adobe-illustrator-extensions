import { runScanDocumentService } from './document-sync/scanDocumentService.js';

export function runScanDocument({ frames = [], schema = null } = {}, deps = {}) {
    const scanService = deps.runScanDocumentService || runScanDocumentService;
    return scanService({ frames, schema }, deps);
}

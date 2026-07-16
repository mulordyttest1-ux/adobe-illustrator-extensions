function createBlockedResult(code, message) {
    return {
        ok: false,
        code,
        message
    };
}

export function evaluateCommandPreflight(manifest, context = {}) {
    if (manifest.requiresDocument && !context.hasActiveDocument) {
        return createBlockedResult('REQUIRES_DOCUMENT', 'Open a document before running this command.');
    }

    if (manifest.requiresSelection && Number(context.selectionCount || 0) < 1) {
        return createBlockedResult('REQUIRES_SELECTION', 'Select at least one object before running this command.');
    }

    return {
        ok: true,
        code: null,
        message: ''
    };
}

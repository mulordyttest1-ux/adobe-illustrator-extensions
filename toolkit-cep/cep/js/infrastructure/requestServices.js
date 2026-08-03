function escapeForExtendScript(value) {
    return String(value)
        .replace(/\\/g, '\\\\')
        .replace(/'/g, "\\'");
}

function buildArtworkPickerScript(title) {
    return [
        '(function () {',
        `var file = File.openDialog('${escapeForExtendScript(title)}', '*.pdf;*.ai', false);`,
        'return file ? file.fsName : "";',
        '})()'
    ].join('');
}

function normalizeFilePath(value) {
    const normalized = String(value || '').trim();
    return normalized || null;
}

export function createToolkitRequestServices({ rawHost } = {}) {
    if (!rawHost || typeof rawHost.evalScript !== 'function') {
        throw new Error('Toolkit request services require a raw CEP host adapter.');
    }

    return {
        async pickArtworkFile(options = {}) {
            const title = String(options.title || 'Select a PDF or AI file');
            const result = await rawHost.evalScript(buildArtworkPickerScript(title));
            return normalizeFilePath(result);
        },

        async readFileBytes(filePath) {
            if (typeof rawHost.readFileBytes !== 'function') {
                throw new Error('Node file access unavailable.');
            }

            return await rawHost.readFileBytes(filePath);
        }
    };
}

export const __private__ = {
    buildArtworkPickerScript,
    normalizeFilePath
};

function getFirstPathEntry(candidate) {
    if (Array.isArray(candidate) && candidate.length > 0) {
        return typeof candidate[0] === 'string' ? candidate[0] : '';
    }

    return '';
}

function hasDialogError(result) {
    return !!(
        result &&
        typeof result === 'object' &&
        typeof result.err === 'number' &&
        result.err !== 0
    );
}

function extractDialogPath(result) {
    if (!result) {
        return '';
    }

    if (hasDialogError(result)) {
        return '__PICKER_ERROR__';
    }

    if (typeof result === 'string') {
        return result;
    }

    const dataPath = getFirstPathEntry(result.data);
    if (dataPath) {
        return dataPath;
    }

    if (Array.isArray(result)) {
        return getFirstPathEntry(result);
    }

    if (Array.isArray(result.files)) {
        return getFirstPathEntry(result.files);
    }

    return '';
}

export function pickImpositionDirectory(initialPath = '') {
    if (!window.cep || !window.cep.fs || typeof window.cep.fs.showOpenDialogEx !== 'function') {
        return '__PICKER_UNAVAILABLE__';
    }

    try {
        const result = window.cep.fs.showOpenDialogEx(false, true, 'Chon thu muc luu', initialPath || '');
        return extractDialogPath(result);
    } catch (error) {
        console.warn('[Imposition] Failed to open directory picker:', error);
        return '__PICKER_ERROR__';
    }
}

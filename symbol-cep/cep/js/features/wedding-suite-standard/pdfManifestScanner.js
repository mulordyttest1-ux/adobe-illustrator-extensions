import { PDFDocument } from 'pdf-lib';

const PDF_ONLY_SOURCE_ERROR = 'Wedding Suite V1 chi ho tro file PDF.';
const PDF_MANIFEST_ERROR = 'Khong the doc metadata PDF nguon.';
const PDF_ENCRYPTED_ERROR = 'PDF nguon dang bi ma hoa.';
const PDF_PAGE_BOX_ERROR = 'Khong the doc kich thuoc page PDF.';
const PT_TO_MM = 25.4 / 72;

function basename(path) {
    const normalized = String(path || '').replace(/\\/g, '/');
    const lastSlash = normalized.lastIndexOf('/');
    return lastSlash >= 0 ? normalized.slice(lastSlash + 1) : normalized;
}

function roundMm(value) {
    return Number((Number(value || 0) * PT_TO_MM).toFixed(2));
}

function isPositivePageBox(box) {
    return !!(box && Number(box.width) > 0 && Number(box.height) > 0);
}

function binaryStringToBytes(binaryString = '') {
    const text = String(binaryString || '');
    const bytes = new Uint8Array(text.length);

    for (let index = 0; index < text.length; index += 1) {
        bytes[index] = text.charCodeAt(index) & 0xff;
    }

    return bytes;
}

function getRuntimeRequire() {
    if (typeof window !== 'undefined' && window.cep_node && typeof window.cep_node.require === 'function') {
        return window.cep_node.require.bind(window.cep_node);
    }

    if (typeof window !== 'undefined' && typeof window.require === 'function') {
        return window.require.bind(window);
    }

    try {
        const builtinRequire = new Function(
            'return typeof process !== "undefined" && process.getBuiltinModule ? process.getBuiltinModule("module").createRequire(process.cwd() + "/") : null;'
        )();
        if (typeof builtinRequire === 'function') {
            return builtinRequire;
        }
    } catch {
        // ignore and continue to other runtime probes
    }

    try {
        const runtimeRequire = new Function('return typeof require === "function" ? require : null;')();
        return typeof runtimeRequire === 'function' ? runtimeRequire : null;
    } catch {
        return null;
    }
}

function getNodeFs() {
    const runtimeRequire = getRuntimeRequire();
    if (!runtimeRequire) {
        return null;
    }

    try {
        return runtimeRequire('node:fs');
    } catch {
        try {
            return runtimeRequire('fs');
        } catch {
            return null;
        }
    }
}

export function isPdfSourcePath(path) {
    return /\.pdf$/i.test(String(path || '').trim());
}

export function resolvePdfPageBox(page) {
    const trimBox = page && typeof page.getTrimBox === 'function' ? page.getTrimBox() : null;
    if (isPositivePageBox(trimBox)) {
        return trimBox;
    }

    const cropBox = page && typeof page.getCropBox === 'function' ? page.getCropBox() : null;
    if (isPositivePageBox(cropBox)) {
        return cropBox;
    }

    const mediaBox = page && typeof page.getMediaBox === 'function' ? page.getMediaBox() : null;
    if (isPositivePageBox(mediaBox)) {
        return mediaBox;
    }

    throw new Error(PDF_PAGE_BOX_ERROR);
}

export function buildPdfManifestPage(page, pageNumber) {
    const box = resolvePdfPageBox(page);

    return {
        pageNumber,
        sourceIndex: pageNumber - 1,
        name: `Page ${pageNumber}`,
        widthMm: roundMm(box.width),
        heightMm: roundMm(box.height)
    };
}

function buildLastPdfManifestPage(pdfDoc, totalPages, pages) {
    if (!(totalPages > 0)) {
        return null;
    }

    if (totalPages <= pages.length) {
        return pages.length ? { ...pages[pages.length - 1] } : null;
    }

    return buildPdfManifestPage(pdfDoc.getPage(totalPages - 1), totalPages);
}

function readPdfBytesFromNodeFs(sourcePath) {
    const nodeFs = getNodeFs();
    if (!nodeFs || typeof nodeFs.readFileSync !== 'function') {
        return null;
    }

    const buffer = nodeFs.readFileSync(String(sourcePath || ''));
    return buffer instanceof Uint8Array ? new Uint8Array(buffer) : new Uint8Array(buffer || []);
}

function readPdfBytesFromCepFs(sourcePath) {
    const fsApi = typeof window !== 'undefined' && window.cep ? window.cep.fs : null;
    if (!fsApi || typeof fsApi.readFile !== 'function') {
        return null;
    }

    const result = fsApi.readFile(String(sourcePath || ''));
    if (!result || result.err !== 0) {
        throw new Error(PDF_MANIFEST_ERROR);
    }

    return binaryStringToBytes(result.data || '');
}

export async function readPdfFileBytes(sourcePath) {
    const nodeBytes = readPdfBytesFromNodeFs(sourcePath);
    if (nodeBytes) {
        return nodeBytes;
    }

    const cepBytes = readPdfBytesFromCepFs(sourcePath);
    if (cepBytes) {
        return cepBytes;
    }

    throw new Error(PDF_MANIFEST_ERROR);
}

function normalizePdfManifestError(error) {
    const message = error && error.message ? String(error.message) : '';
    if (message === PDF_ONLY_SOURCE_ERROR || message === PDF_ENCRYPTED_ERROR || message === PDF_PAGE_BOX_ERROR) {
        return new Error(message);
    }
    return new Error(PDF_MANIFEST_ERROR);
}

export async function scanPdfManifest(sourcePath, options = {}) {
    if (!isPdfSourcePath(sourcePath)) {
        throw new Error(PDF_ONLY_SOURCE_ERROR);
    }

    try {
        const readBytes = typeof options.readBytes === 'function' ? options.readBytes : readPdfFileBytes;
        const bytes = await readBytes(String(sourcePath || ''));
        const pdfDoc = await PDFDocument.load(bytes, {
            ignoreEncryption: true,
            updateMetadata: false
        });

        if (pdfDoc.isEncrypted) {
            throw new Error(PDF_ENCRYPTED_ERROR);
        }

        const totalPages = pdfDoc.getPageCount();
        const pages = [];
        const limit = totalPages;

        for (let pageIndex = 0; pageIndex < limit; pageIndex += 1) {
            pages.push(buildPdfManifestPage(pdfDoc.getPage(pageIndex), pageIndex + 1));
        }

        const lastPage = buildLastPdfManifestPage(pdfDoc, totalPages, pages);

        return {
            success: true,
            sourcePath: String(sourcePath || ''),
            sourceName: basename(sourcePath),
            totalPages,
            pages,
            lastPage
        };
    } catch (error) {
        throw normalizePdfManifestError(error);
    }
}

export {
    PDF_ENCRYPTED_ERROR,
    PDF_MANIFEST_ERROR,
    PDF_ONLY_SOURCE_ERROR,
    PDF_PAGE_BOX_ERROR
};

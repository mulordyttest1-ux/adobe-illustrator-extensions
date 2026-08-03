import { PDFDocument } from 'pdf-lib';

const SUPPORTED_ROTATIONS = new Set([0, 90, 180, 270]);
const POINTS_PER_INCH = 72;

function normalizeRotation(value) {
    const rotation = Number(value || 0);
    const normalized = ((rotation % 360) + 360) % 360;

    if (!SUPPORTED_ROTATIONS.has(normalized)) {
        throw new Error(`Unsupported PDF page rotation: ${rotation}`);
    }

    return normalized;
}

function assertPositiveFinite(value, label) {
    const numericValue = Number(value);

    if (!Number.isFinite(numericValue) || numericValue <= 0) {
        throw new Error(`PDF ${label} must be a positive finite number.`);
    }

    return numericValue;
}

function resolvePageBox(page) {
    const trimBox = page.getTrimBox();
    const width = assertPositiveFinite(trimBox.width, 'page width');
    const height = assertPositiveFinite(trimBox.height, 'page height');

    return {
        x: Number(trimBox.x || 0),
        y: Number(trimBox.y || 0),
        width,
        height
    };
}

function createPageDescriptor(page, index) {
    const box = resolvePageBox(page);
    const rotationDegrees = normalizeRotation(page.getRotation().angle);
    const isQuarterTurn = rotationDegrees === 90 || rotationDegrees === 270;

    return {
        pageNumber: index + 1,
        widthPt: isQuarterTurn ? box.height : box.width,
        heightPt: isQuarterTurn ? box.width : box.height,
        rotationDegrees,
        box
    };
}

function normalizeSourceName(sourcePath) {
    const segments = String(sourcePath || '').split(/[\\/]/g);
    const fileName = segments[segments.length - 1] || 'document';
    return fileName.replace(/\.[^.]+$/i, '') || 'document';
}

function detectSourceType(sourcePath) {
    const match = String(sourcePath || '').match(/\.([^.\\/]+)$/);
    const extension = match ? match[1].toLowerCase() : '';

    if (extension === 'pdf' || extension === 'ai') {
        return extension;
    }

    const error = new Error('Select a PDF or AI source file.');
    error.errorCode = 'PLACE_ALL_SOURCE_UNSUPPORTED';
    throw error;
}

export async function prepareRequest({ services } = {}) {
    if (!services || typeof services.pickArtworkFile !== 'function') {
        throw new Error('Place All Pages request services are unavailable.');
    }

    const sourcePath = await services.pickArtworkFile({
        title: 'Select PDF or AI to place all pages'
    });

    if (!sourcePath) {
        return {
            cancelled: true,
            message: 'Place All Pages cancelled.',
            errorCode: 'PLACE_ALL_PAGES_CANCELLED'
        };
    }

    const sourceType = detectSourceType(sourcePath);
    const sourceName = normalizeSourceName(sourcePath);

    if (sourceType === 'ai') {
        return {
            payload: {
                sourceType,
                sourcePath: String(sourcePath),
                sourceName
            }
        };
    }

    if (typeof services.readFileBytes !== 'function') {
        throw new Error('Place All Pages PDF byte reader is unavailable.');
    }

    let pdfDocument;
    try {
        const bytes = await services.readFileBytes(sourcePath);
        pdfDocument = await PDFDocument.load(bytes);
    } catch (error) {
        const wrappedError = new Error(
            error && error.message
                ? `Unable to read the selected PDF: ${error.message}`
                : 'Unable to read the selected PDF.'
        );
        wrappedError.errorCode = 'PLACE_ALL_PDF_UNREADABLE';
        throw wrappedError;
    }

    const pageCount = pdfDocument.getPageCount();
    if (!Number.isInteger(pageCount) || pageCount < 1) {
        const error = new Error('The selected PDF does not contain any pages.');
        error.errorCode = 'PLACE_ALL_PDF_INVALID_MANIFEST';
        throw error;
    }

    let pages;
    try {
        pages = pdfDocument.getPages().map(createPageDescriptor);
    } catch (error) {
        const wrappedError = new Error(
            error && error.message
                ? `The selected PDF page manifest is invalid: ${error.message}`
                : 'The selected PDF page manifest is invalid.'
        );
        wrappedError.errorCode = 'PLACE_ALL_PDF_INVALID_MANIFEST';
        throw wrappedError;
    }

    return {
        payload: {
            sourceType,
            sourcePath: String(sourcePath),
            sourceName,
            pageCount,
            cropBox: 'trim',
            pages
        }
    };
}

export const __private__ = {
    createPageDescriptor,
    detectSourceType,
    normalizeRotation,
    normalizeSourceName,
    resolvePageBox,
    assertPositiveFinite,
    POINTS_PER_INCH
};

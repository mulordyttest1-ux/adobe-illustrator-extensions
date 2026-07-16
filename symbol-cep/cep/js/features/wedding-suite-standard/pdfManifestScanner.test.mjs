import fs from 'node:fs';
import test from 'node:test';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';

import { PDFDocument } from 'pdf-lib';

import {
    buildPdfManifestPage,
    PDF_MANIFEST_ERROR,
    PDF_ONLY_SOURCE_ERROR,
    resolvePdfPageBox,
    scanPdfManifest
} from './pdfManifestScanner.js';

const FIXTURE_PATH = fileURLToPath(new URL(
    '../../../debug_scripts/fixtures/wedding_suite/runtime_probe_ascii.pdf',
    import.meta.url
));

test('scanPdfManifest reads the 4-page runtime fixture without opening Illustrator', async () => {
    const manifest = await scanPdfManifest(FIXTURE_PATH, {
        readBytes(sourcePath) {
            return fs.readFileSync(sourcePath);
        }
    });

    assert.equal(manifest.success, true);
    assert.equal(manifest.sourcePath, FIXTURE_PATH);
    assert.equal(manifest.sourceName, 'runtime_probe_ascii.pdf');
    assert.equal(manifest.totalPages, 4);
    assert.deepEqual(manifest.pages.map((page) => page.pageNumber), [1, 2, 3, 4]);
    assert.equal(manifest.lastPage.pageNumber, 4);
    assert.ok(manifest.pages.every((page) => page.widthMm > 0 && page.heightMm > 0));
});

test('scanPdfManifest reads all page descriptors for pair mode', async () => {
    const pdfDoc = await PDFDocument.create();
    for (let index = 0; index < 6; index += 1) {
        pdfDoc.addPage([300 + index, 500 + index]);
    }

    const bytes = await pdfDoc.save();
    const manifest = await scanPdfManifest('C:/Inputs/six-page.pdf', {
        readBytes() {
            return bytes;
        }
    });

    assert.equal(manifest.totalPages, 6);
    assert.equal(manifest.pages.length, 6);
    assert.deepEqual(manifest.pages.map((page) => page.pageNumber), [1, 2, 3, 4, 5, 6]);
    assert.equal(manifest.lastPage.pageNumber, 6);
    assert.equal(manifest.lastPage.sourceIndex, manifest.pages[manifest.pages.length - 1].sourceIndex);
});

test('resolvePdfPageBox prefers TrimBox, then CropBox, then MediaBox', () => {
    const trimPreferred = resolvePdfPageBox({
        getTrimBox() {
            return { width: 80, height: 160 };
        },
        getCropBox() {
            return { width: 100, height: 200 };
        },
        getMediaBox() {
            return { width: 300, height: 400 };
        }
    });
    const cropFallback = resolvePdfPageBox({
        getTrimBox() {
            return { width: 0, height: 0 };
        },
        getCropBox() {
            return { width: 100, height: 200 };
        },
        getMediaBox() {
            return { width: 300, height: 400 };
        }
    });
    const mediaFallback = resolvePdfPageBox({
        getTrimBox() {
            return { width: 0, height: 0 };
        },
        getCropBox() {
            return { width: 0, height: 0 };
        },
        getMediaBox() {
            return { width: 300, height: 400 };
        }
    });

    assert.deepEqual(trimPreferred, { width: 80, height: 160 });
    assert.deepEqual(cropFallback, { width: 100, height: 200 });
    assert.deepEqual(mediaFallback, { width: 300, height: 400 });
});

test('buildPdfManifestPage converts PDF point sizes into millimeters', () => {
    const page = buildPdfManifestPage({
        getTrimBox() {
            return { width: 72, height: 144 };
        },
        getCropBox() {
            return { width: 90, height: 180 };
        },
        getMediaBox() {
            return { width: 120, height: 240 };
        }
    }, 3);

    assert.deepEqual(page, {
        pageNumber: 3,
        sourceIndex: 2,
        name: 'Page 3',
        widthMm: 25.4,
        heightMm: 50.8
    });
});

test('scanPdfManifest rejects non-PDF input with a clear V1 message', async () => {
    await assert.rejects(
        () => scanPdfManifest('C:/Inputs/source.ai', {
            readBytes() {
                throw new Error('should not run');
            }
        }),
        new RegExp(PDF_ONLY_SOURCE_ERROR)
    );
});

test('scanPdfManifest fails fast on malformed PDF bytes', async () => {
    await assert.rejects(
        () => scanPdfManifest('C:/Inputs/bad.pdf', {
            readBytes() {
                return new Uint8Array([0, 1, 2, 3, 4]);
            }
        }),
        new RegExp(PDF_MANIFEST_ERROR)
    );
});

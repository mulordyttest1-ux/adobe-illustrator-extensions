import test from 'node:test';
import assert from 'node:assert/strict';
import { PDFDocument, degrees } from 'pdf-lib';
import { prepareRequest } from '../../../modules/place_all_pdf_pages/request.js';

async function createPdfBytes() {
    const document = await PDFDocument.create();
    const firstPage = document.addPage([100, 200]);
    firstPage.setTrimBox(10, 20, 80, 160);
    const secondPage = document.addPage([300, 120]);
    secondPage.setRotation(degrees(90));
    secondPage.setTrimBox(0, 0, 300, 120);
    return await document.save();
}

function createServices(bytes) {
    return {
        async pickArtworkFile() {
            return 'C:/fixtures/multipage.pdf';
        },
        async readFileBytes() {
            return bytes;
        }
    };
}

test('place all PDF request adapter builds an ordered TrimBox manifest', async () => {
    const bytes = await createPdfBytes();
    const prepared = await prepareRequest({
        services: createServices(bytes)
    });

    assert.equal(prepared.payload.sourceType, 'pdf');
    assert.equal(prepared.payload.sourcePath, 'C:/fixtures/multipage.pdf');
    assert.equal(prepared.payload.sourceName, 'multipage');
    assert.equal(prepared.payload.pageCount, 2);
    assert.equal(prepared.payload.cropBox, 'trim');
    assert.deepEqual(prepared.payload.pages, [
        {
            pageNumber: 1,
            widthPt: 80,
            heightPt: 160,
            rotationDegrees: 0,
            box: { x: 10, y: 20, width: 80, height: 160 }
        },
        {
            pageNumber: 2,
            widthPt: 120,
            heightPt: 300,
            rotationDegrees: 90,
            box: { x: 0, y: 0, width: 300, height: 120 }
        }
    ]);
});

test('place all pages request adapter sends AI paths to the host without parsing bytes', async () => {
    let readCount = 0;
    const prepared = await prepareRequest({
        services: {
            async pickArtworkFile() {
                return 'C:/fixtures/multi-artboard.AI';
            },
            async readFileBytes() {
                readCount += 1;
                throw new Error('AI must be inspected by the Illustrator host');
            }
        }
    });

    assert.deepEqual(prepared, {
        payload: {
            sourceType: 'ai',
            sourcePath: 'C:/fixtures/multi-artboard.AI',
            sourceName: 'multi-artboard'
        }
    });
    assert.equal(readCount, 0);
});

test('place all pages request adapter rejects unsupported source extensions', async () => {
    await assert.rejects(
        () => prepareRequest({
            services: {
                async pickArtworkFile() {
                    return 'C:/fixtures/design.eps';
                },
                async readFileBytes() {
                    throw new Error('unsupported input must not be read');
                }
            }
        }),
        (error) => {
            assert.equal(error.errorCode, 'PLACE_ALL_SOURCE_UNSUPPORTED');
            assert.match(error.message, /PDF or AI/i);
            return true;
        }
    );
});

test('place all pages request adapter treats file-picker cancellation as a local warning', async () => {
    const result = await prepareRequest({
        services: {
            async pickArtworkFile() {
                return null;
            },
            async readFileBytes() {
                throw new Error('must not read after cancellation');
            }
        }
    });

    assert.deepEqual(result, {
        cancelled: true,
        message: 'Place All Pages cancelled.',
        errorCode: 'PLACE_ALL_PAGES_CANCELLED'
    });
});

test('place all PDF request adapter normalizes unreadable PDF errors', async () => {
    await assert.rejects(
        () => prepareRequest({
            services: createServices(new Uint8Array([1, 2, 3]))
        }),
        (error) => {
            assert.equal(error.errorCode, 'PLACE_ALL_PDF_UNREADABLE');
            assert.match(error.message, /Unable to read the selected PDF/);
            return true;
        }
    );
});

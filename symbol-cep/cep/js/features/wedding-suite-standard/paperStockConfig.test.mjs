import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

import {
    loadWeddingSuitePaperStockCatalog,
    normalizePaperStockCatalog,
    PAPER_STOCK_CONFIG_RELATIVE_PATH
} from './paperStockConfig.js';

test('normalizePaperStockCatalog keeps F180 at the operator-configured 480 x 320 size', () => {
    const catalog = normalizePaperStockCatalog();
    const f180 = catalog.stocksById.f180_480x330;

    assert.equal(f180.label, 'F180 480 x 320');
    assert.equal(f180.widthMm, 480);
    assert.equal(f180.heightMm, 320);
});

test('operator paper-stock JSON keeps F180 width and height in print orientation', () => {
    const configUrl = new URL('../../../data/wedding_suite_paper_stocks.json', import.meta.url);
    const source = JSON.parse(fs.readFileSync(configUrl, 'utf8'));
    const catalog = normalizePaperStockCatalog(source);
    const f180 = catalog.stocksById.f180_480x330;

    assert.equal(f180.label, 'F180 480 x 320');
    assert.equal(f180.widthMm, 480);
    assert.equal(f180.heightMm, 320);
});

test('loadWeddingSuitePaperStockCatalog reads operator-editable JSON from the CEP data folder', () => {
    let readPath = '';
    const catalog = loadWeddingSuitePaperStockCatalog({
        extensionRoot: 'C:/Extensions/com.dinhson.imposition',
        fs: {
            readFile(filePath) {
                readPath = filePath;
                return {
                    err: 0,
                    data: JSON.stringify({
                        defaultStockId: 'future_stock',
                        stocks: [
                            {
                                id: 'future_stock',
                                label: 'Future Stock 310 x 470',
                                widthMm: 310,
                                heightMm: 470
                            }
                        ]
                    })
                };
            }
        }
    });

    assert.equal(readPath, `C:/Extensions/com.dinhson.imposition/${PAPER_STOCK_CONFIG_RELATIVE_PATH}`);
    assert.equal(catalog.defaultStockId, 'future_stock');
    assert.equal(catalog.stocksById.future_stock.widthMm, 310);
    assert.equal(catalog.stocksById.future_stock.heightMm, 470);
});

test('loadWeddingSuitePaperStockCatalog falls back safely when JSON is unavailable', () => {
    const catalog = loadWeddingSuitePaperStockCatalog({
        extensionRoot: 'C:/Extensions/com.dinhson.imposition',
        fs: {
            readFile() {
                return { err: 1, data: '' };
            }
        }
    });

    assert.equal(catalog.defaultStockId, 'anh_kim_483x320');
    assert.equal(catalog.stocksById.f180_480x330.widthMm, 480);
    assert.equal(catalog.stocksById.f180_480x330.heightMm, 320);
});

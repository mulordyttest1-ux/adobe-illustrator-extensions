import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { DateGridRenderer } from './DateGridRenderer.js';
import { FakeDocument } from './dateGridTestUtils.js';

const DATE_CONFIGS = [
    { key: 'date.tiec', label: 'Tiec', standardTime: { h: '11', m: '00' } },
    { key: 'date.le', label: 'Le' },
    { key: 'date.nhap', label: 'Nhap' }
];

function withFakeDocument(callback) {
    const previousDocument = globalThis.document;
    const document = new FakeDocument();
    globalThis.document = document;

    try {
        callback(document);
    } finally {
        globalThis.document = previousDocument;
    }
}

describe('DateGridRenderer', () => {
    it('renders all date rows and registers field refs for inputs and computed info', () => {
        withFakeDocument((document) => {
            const container = document.createElement('div');
            const refs = {};

            const grid = DateGridRenderer.render(container, DATE_CONFIGS, refs);

            assert.equal(container.children[0], grid);
            assert.equal(grid.children.length, 4);
            assert.equal(refs['date.tiec_auto'], undefined);
            assert.equal(refs['date.le_auto'].type, 'checkbox');
            assert.equal(refs['date.nhap_auto'].type, 'checkbox');

            assert.equal(refs['date.tiec.ngay'].dataset.key, 'date.tiec.ngay');
            assert.equal(refs['date.tiec.ngay'].dataset.baseKey, 'date.tiec');
            assert.equal(refs['date.tiec.ngay'].dataset.type, 'solar');
            assert.equal(refs['date.tiec.ngay_al'].dataset.type, 'lunar');
            assert.equal(refs['date.tiec.gio'].dataset.type, 'time');
            assert.equal(refs['date.tiec.gio'].value, '11');
            assert.equal(refs['date.tiec.phut'].value, '00');

            assert.equal(refs['date.tiec.thu'].isComputed, true);
            assert.equal(refs['date.tiec.nam'].isComputed, true);
            assert.equal(refs['date.tiec.namyy'].isComputed, true);
            assert.equal(refs['date.tiec.namyy'].value, '');
            assert.equal(refs['date.tiec.nam_al'].isComputed, true);
        });
    });
});

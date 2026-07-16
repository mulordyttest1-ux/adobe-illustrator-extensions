import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { FakeDocument } from './dateGridTestUtils.js';
import {
    createHeaderRow,
    createInfoColumn,
    createLabelColumn,
    createPairConfigs,
    createPairSeparator,
    DATE_GRID_HEADER_LABELS
} from './dateGridRenderSupport.js';

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

describe('dateGridRenderSupport', () => {
    it('creates the stable header row labels', () => {
        withFakeDocument(() => {
            const header = createHeaderRow();

            assert.equal(header.children.length, DATE_GRID_HEADER_LABELS.length);
            assert.equal(header.children[1].textContent, 'D\u01af\u01a0NG');
            assert.equal(header.children[2].textContent, '\u00c2M');
            assert.equal(header.children[3].textContent, 'GI\u1edc');
        });
    });

    it('creates label and info columns while registering expected refs', () => {
        withFakeDocument(() => {
            const refs = {};
            const masterCol = createLabelColumn({ key: 'date.tiec', label: 'Tiec' }, refs);
            const dependentCol = createLabelColumn({ key: 'date.le', label: 'Le' }, refs);
            createInfoColumn('date.le', refs);

            assert.equal(masterCol.children.length, 1);
            assert.equal(refs['date.tiec_auto'], undefined);
            assert.equal(dependentCol.children[0].type, 'checkbox');
            assert.equal(refs['date.le_auto'].type, 'checkbox');
            assert.equal(refs['date.le.thu'].isComputed, true);
            assert.equal(refs['date.le.namyy'].value, '');
            assert.equal(refs['date.le.nam_al'].isComputed, true);
        });
    });

    it('exposes stable pair config and separator helpers', () => {
        withFakeDocument(() => {
            const separator = createPairSeparator();
            const pairConfigs = createPairConfigs('date.tiec');

            assert.equal(pairConfigs.length, 3);
            assert.deepEqual(pairConfigs.map((entry) => entry.type), ['solar', 'lunar', 'time']);
            assert.equal(separator.style.width, '1px');
            assert.equal(separator.style.backgroundColor, '#eee');
        });
    });
});

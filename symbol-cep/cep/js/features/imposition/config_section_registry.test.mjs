import test from 'node:test';
import assert from 'node:assert/strict';

import {
    CONFIG_SECTION_REGISTRY,
    getConfigSectionDescriptor,
    getRenderableConfigSectionDescriptors
} from './config_section_registry.js';

test('config renderer registry contains the nine decoupled section adapters once each', () => {
    const ids = CONFIG_SECTION_REGISTRY.map((descriptor) => descriptor.id);

    assert.equal(ids.length, 9);
    assert.equal(new Set(ids).size, ids.length);
    assert.deepEqual(ids, [
        'sec_artboard',
        'sec_size',
        'sec_resize_mode',
        'sec_output_save',
        'sec_marks',
        'sec_sheet_layout',
        'sec_margins',
        'sec_options',
        'pasteboard'
    ]);
});

test('registry exposes group ownership and keeps pasteboard out of schema section mounting', () => {
    assert.equal(getConfigSectionDescriptor('sec_options').group, 'C');
    assert.equal(getConfigSectionDescriptor('pasteboard').adapter, 'pasteboard');
    assert.equal(getRenderableConfigSectionDescriptors().length, 8);
});

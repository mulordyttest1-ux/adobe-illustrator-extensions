import test from 'node:test';
import assert from 'node:assert/strict';

import { pickImpositionDirectory } from './impositionDirectoryPicker.js';

const originalWindow = globalThis.window;

function setWindowFs(fs) {
    globalThis.window = {
        cep: {
            fs
        }
    };
}

test.afterEach(() => {
    if (typeof originalWindow === 'undefined') {
        delete globalThis.window;
    } else {
        globalThis.window = originalWindow;
    }
});

test('pickImpositionDirectory reads folder paths from CEP result.data', () => {
    setWindowFs({
        showOpenDialogEx() {
            return {
                err: 0,
                data: ['C:/Jobs/Output']
            };
        }
    });

    const picked = pickImpositionDirectory('C:/Jobs');

    assert.equal(picked, 'C:/Jobs/Output');
});

test('pickImpositionDirectory falls back to result.files when present', () => {
    setWindowFs({
        showOpenDialogEx() {
            return {
                err: 0,
                files: ['C:/Jobs/Fallback']
            };
        }
    });

    const picked = pickImpositionDirectory('C:/Jobs');

    assert.equal(picked, 'C:/Jobs/Fallback');
});

test('pickImpositionDirectory returns picker error when CEP reports an error', () => {
    setWindowFs({
        showOpenDialogEx() {
            return {
                err: 1,
                data: []
            };
        }
    });

    const picked = pickImpositionDirectory('C:/Jobs');

    assert.equal(picked, '__PICKER_ERROR__');
});

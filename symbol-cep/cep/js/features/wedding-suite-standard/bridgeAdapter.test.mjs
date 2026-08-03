import test from 'node:test';
import assert from 'node:assert/strict';

import {
    createWeddingSuiteBridgeAdapter,
    pickSourceFile,
    resolveWeddingSuiteTemplatePath
} from './bridgeAdapter.js';

const originalWindow = globalThis.window;
const originalCSInterface = globalThis.CSInterface;

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

    if (typeof originalCSInterface === 'undefined') {
        delete globalThis.CSInterface;
    } else {
        globalThis.CSInterface = originalCSInterface;
    }
});

test('pickSourceFile retries with simplified CEP signatures when the extended picker errors', () => {
    const calls = [];
    setWindowFs({
        showOpenDialogEx(...args) {
            calls.push(args);
            if (calls.length === 1) {
                return { err: 1, data: [] };
            }
            return { err: 0, data: ['C:/Jobs/source.pdf'] };
        }
    });

    const picked = pickSourceFile('C:/Jobs');

    assert.equal(picked, 'C:/Jobs/source.pdf');
    assert.equal(calls.length, 2);
    assert.deepEqual(
        calls[0],
        [
            false,
            false,
            'Chon file nguon',
            'C:/Jobs',
            ['pdf'],
            'PDF (*.pdf)',
            'Open'
        ]
    );
    assert.deepEqual(
        calls[1],
        [
            false,
            false,
            'Chon file nguon',
            'C:/Jobs',
            ['pdf']
        ]
    );
});

test('pickSourceFile falls back to showOpenDialog when showOpenDialogEx keeps failing', () => {
    const calls = [];
    setWindowFs({
        showOpenDialogEx(...args) {
            calls.push({ fn: 'showOpenDialogEx', args });
            return { err: 1, data: [] };
        },
        showOpenDialog(...args) {
            calls.push({ fn: 'showOpenDialog', args });
            return { data: ['C:/Fallback/source.pdf'] };
        }
    });

    const picked = pickSourceFile('C:/Fallback');

    assert.equal(picked, 'C:/Fallback/source.pdf');
    assert.equal(calls.length, 3);
    assert.equal(calls[2].fn, 'showOpenDialog');
    assert.deepEqual(
        calls[2].args,
        [
            false,
            false,
            'Chon file nguon',
            'C:/Fallback',
            ['pdf']
        ]
    );
});

test('pickSourceFile returns unavailable when CEP fs picker is missing', () => {
    globalThis.window = {};
    assert.equal(pickSourceFile('C:/Jobs'), '__PICKER_UNAVAILABLE__');
});

test('pickSourceFile returns picker error when every available picker path fails', () => {
    setWindowFs({
        showOpenDialogEx() {
            return { err: 1, data: [] };
        }
    });

    assert.equal(pickSourceFile('C:/Jobs'), '__PICKER_ERROR__');
});

test('resolveWeddingSuiteTemplatePath finds the setting-only template beside the extension folder', () => {
    globalThis.CSInterface = function CSInterface() {
        return {
            getSystemPath(kind) {
                assert.equal(kind, 'EXTENSION');
                return 'C:/Projects/adobe-illustrator-extensions/symbol-cep/cep';
            }
        };
    };
    globalThis.CSInterface.EXTENSION = 'EXTENSION';

    const templatePath = resolveWeddingSuiteTemplatePath();

    assert.equal(
        templatePath,
        'C:/Projects/adobe-illustrator-extensions/symbol-cep/cep/wedding suite print template.ai'
    );
});

test('resolveWeddingSuiteTemplatePath returns empty when CSInterface is unavailable', () => {
    delete globalThis.CSInterface;

    const templatePath = resolveWeddingSuiteTemplatePath();

    assert.equal(templatePath, '');
});

test('createWeddingSuiteBridgeAdapter roundtrips Unicode source paths through percent-encoded bridge payloads', async () => {
    const calls = [];
    const adapter = createWeddingSuiteBridgeAdapter({
        async eval(script) {
            calls.push(script);
            const response = encodeURIComponent(JSON.stringify({
                success: true,
                sourcePath: 'C:/Tmp/tệp cưới.pdf'
            }));
            return Buffer.from(response, 'utf8').toString('base64');
        }
    });

    const result = await adapter.inspectSource('C:/Tmp/tệp cưới.pdf');

    assert.equal(result.success, true);
    assert.equal(result.sourcePath, 'C:/Tmp/tệp cưới.pdf');
    assert.equal(calls.length, 1);
    assert.match(calls[0], /inspectSource\("/);
    assert.doesNotMatch(calls[0], /tệp cưới\.pdf/u);
});

test('createWeddingSuiteBridgeAdapter reuses the host loaded at app boot for Build PDF', async () => {
    const calls = [];
    const adapter = createWeddingSuiteBridgeAdapter({
        async reloadHostScripts() {
            calls.push('reloadHostScripts');
        },
        async eval(script) {
            calls.push(script);
            const response = encodeURIComponent(JSON.stringify({
                success: true,
                outputPath: 'C:/Outputs/bài in source.pdf',
                openedOutput: true
            }));
            return Buffer.from(response, 'utf8').toString('base64');
        }
    });

    const result = await adapter.buildJob({
        sourcePath: 'C:/Inputs/source.pdf',
        output: {
            directory: 'C:/Outputs',
            filenameStem: 'bài in source'
        },
        plan: {
            valid: true
        }
    });

    assert.equal(result.success, true);
    assert.equal(result.outputPath, 'C:/Outputs/bài in source.pdf');
    assert.equal(calls.length, 1);
    assert.match(calls[0], /buildJob\("/);
    assert.doesNotMatch(calls[0], /_buildJobPatchVersion/);
    assert.doesNotMatch(calls[0], /inspectOpenOutput/);
    assert.doesNotMatch(calls[0], /markOpenOutputDirty/);
    assert.doesNotMatch(calls[0], /ensureOutputOpen/);
    assert.equal(calls.includes('reloadHostScripts'), false);
});

test('createWeddingSuiteBridgeAdapter never reloads the persistent host between repeated builds', async () => {
    const calls = [];
    const adapter = createWeddingSuiteBridgeAdapter({
        async reloadHostScripts() {
            calls.push('reloadHostScripts');
        },
        async eval(script) {
            calls.push(script);
            const response = encodeURIComponent(JSON.stringify({
                success: true,
                outputPath: 'C:/Outputs/repeated.pdf',
                openedOutput: true
            }));
            return Buffer.from(response, 'utf8').toString('base64');
        }
    });

    await adapter.buildJob({ plan: { valid: true } });
    await adapter.buildJob({ plan: { valid: true } });
    await adapter.buildJob({ plan: { valid: true } });

    assert.equal(calls.length, 3);
    assert.equal(calls.every((call) => /buildJob\("/.test(call)), true);
    assert.equal(calls.includes('reloadHostScripts'), false);
});

test('createWeddingSuiteBridgeAdapter exposes an explicit active-document source endpoint', async () => {
    const calls = [];
    const adapter = createWeddingSuiteBridgeAdapter({
        async eval(script) {
            calls.push(script);
            const response = encodeURIComponent(JSON.stringify({
                success: true,
                path: 'C:/Inputs/source.pdf',
                name: 'source.pdf',
                isPdf: true,
                saved: true
            }));
            return Buffer.from(response, 'utf8').toString('base64');
        }
    });

    const result = await adapter.getActiveDocumentSourceInfo();

    assert.equal(result.success, true);
    assert.equal(result.path, 'C:/Inputs/source.pdf');
    assert.equal(calls.length, 1);
    assert.match(calls[0], /getActiveDocumentSourceInfo\(\)/);
});

test('createWeddingSuiteBridgeAdapter exposes explicit PDF output-state endpoints', async () => {
    const calls = [];
    const adapter = createWeddingSuiteBridgeAdapter({
        async eval(script) {
            calls.push(script);
            const response = encodeURIComponent(JSON.stringify({
                success: true,
                isOpen: true
            }));
            return Buffer.from(response, 'utf8').toString('base64');
        }
    });

    const inspectResult = await adapter.inspectOpenOutput('C:/Outputs/source.pdf');
    const ensureResult = await adapter.ensureOutputOpen('C:/Outputs/source.pdf');

    assert.equal(inspectResult.success, true);
    assert.equal(ensureResult.success, true);
    assert.equal(calls.length, 2);
    assert.match(calls[0], /inspectOpenOutput\("/);
    assert.match(calls[1], /ensureOutputOpen\("/);
});

test('createWeddingSuiteBridgeAdapter exposes an explicit QA print endpoint', async () => {
    const calls = [];
    const adapter = createWeddingSuiteBridgeAdapter({
        async eval(script) {
            calls.push(script);
            const response = encodeURIComponent(JSON.stringify({
                success: true,
                printed: true
            }));
            return Buffer.from(response, 'utf8').toString('base64');
        }
    });

    const result = await adapter.printQaCheck('C:/Outputs/source.pdf');

    assert.equal(result.success, true);
    assert.equal(calls.length, 1);
    assert.match(calls[0], /printQaCheck\("/);
});

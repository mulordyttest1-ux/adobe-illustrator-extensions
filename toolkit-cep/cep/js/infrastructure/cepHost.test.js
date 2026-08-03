import test from 'node:test';
import assert from 'node:assert/strict';
import { createCepHost } from './cepHost.js';

function createFakeCSInterface({
    systemPath = 'file:///C:/Toolkit%20CEP',
    extensionId = 'com.dinhson.toolkit.panel',
    evalResult = ''
} = {}) {
    function FakeCSInterface() { }

    FakeCSInterface.EXTENSION = 'extension';
    FakeCSInterface.prototype.getSystemPath = () => systemPath;
    FakeCSInterface.prototype.getExtensionID = () => extensionId;
    FakeCSInterface.prototype.evalScript = (_script, callback) => callback(evalResult);

    return FakeCSInterface;
}

test('createCepHost exposes extension id from CSInterface', () => {
    const host = createCepHost({
        CSInterface: createFakeCSInterface({
            extensionId: 'com.dinhson.toolkit.panel.dev'
        })
    });

    assert.equal(host.getExtensionId(), 'com.dinhson.toolkit.panel.dev');
});

test('createCepHost normalizes extension root path from CSInterface', () => {
    const host = createCepHost({
        navigator: { platform: 'Win32' },
        CSInterface: createFakeCSInterface({
            systemPath: 'file:///C:/Toolkit%20CEP'
        })
    });

    assert.equal(host.getExtensionRootPath(), 'C:/Toolkit CEP');
});

test('createCepHost reads file bytes through its Node boundary', async () => {
    const host = createCepHost({
        CSInterface: createFakeCSInterface(),
        require(moduleId) {
            assert.equal(moduleId, 'fs');
            return {
                readFileSync(filePath) {
                    assert.equal(filePath, 'C:/input.pdf');
                    return new Uint8Array([4, 5, 6]);
                }
            };
        }
    });

    assert.deepEqual(
        Array.from(await host.readFileBytes('C:/input.pdf')),
        [4, 5, 6]
    );
});

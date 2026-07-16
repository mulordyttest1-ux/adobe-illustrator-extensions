import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createHostFacade } from './hostFacade.js';

function createHarness() {
    const calls = {
        host: [],
        bridge: []
    };

    const rawHost = {
        async readExtensionText(relativePath, options) {
            calls.host.push(['readExtensionText', relativePath, options]);
            return {
                absolutePath: `C:/Wedding CEP/${relativePath}`,
                content: 'ok'
            };
        },
        async evalScript(script) {
            calls.host.push(['evalScript', script]);
            return `ran:${script}`;
        },
        getExtensionRootPath() {
            calls.host.push(['getExtensionRootPath']);
            return 'C:/Wedding CEP';
        }
    };

    const bridge = {
        get isConnected() {
            calls.bridge.push(['isConnected']);
            return true;
        },
        async testConnection() {
            calls.bridge.push(['testConnection']);
            return true;
        },
        async scanDocument(mode) {
            calls.bridge.push(['scanDocument', mode]);
            return { success: true, mode };
        },
        async collectFrames() {
            calls.bridge.push(['collectFrames']);
            return { success: true, data: [] };
        },
        async applyPlan(plans) {
            calls.bridge.push(['applyPlan', plans]);
            return { success: true, updated: plans.length };
        },
        async readSelectionObjects(options) {
            calls.bridge.push(['readSelectionObjects', options]);
            return { success: true, data: [] };
        },
        async selectFramesById(request) {
            calls.bridge.push(['selectFramesById', request]);
            return { success: true, selected: 1 };
        },
        async applyTextChanges(changes) {
            calls.bridge.push(['applyTextChanges', changes]);
            return { success: true, updated: changes.length };
        }
    };

    const { hostFacade, debugHost } = createHostFacade({
        rawHost,
        bridge
    });

    return { hostFacade, debugHost, calls };
}

describe('HostFacade', () => {
    it('delegates file reads to the raw CEP host and host verbs to the raw bridge', async () => {
        const { hostFacade, calls } = createHarness();

        const readResult = await hostFacade.readExtensionText('data/schema.json', {
            strategy: 'extendscript'
        });
        const scanResult = await hostFacade.scanDocument('manual');
        const selectionResult = await hostFacade.readSelectionObjects({ includeGeometry: true });
        const applyResult = await hostFacade.applyPlan([{ id: 'f1', plan: { mode: 'DIRECT' } }]);

        assert.deepEqual(readResult, {
            absolutePath: 'C:/Wedding CEP/data/schema.json',
            content: 'ok'
        });
        assert.deepEqual(scanResult, { success: true, mode: 'manual' });
        assert.deepEqual(selectionResult, { success: true, data: [] });
        assert.deepEqual(applyResult, { success: true, updated: 1 });
        assert.deepEqual(calls.host, [
            ['readExtensionText', 'data/schema.json', { strategy: 'extendscript' }]
        ]);
        assert.deepEqual(calls.bridge, [
            ['scanDocument', 'manual'],
            ['readSelectionObjects', { includeGeometry: true }],
            ['applyPlan', [{ id: 'f1', plan: { mode: 'DIRECT' } }]]
        ]);
    });

    it('provides a debug host seam without exposing raw bridge internals on hostFacade', async () => {
        const { hostFacade, debugHost, calls } = createHarness();

        assert.equal('call' in hostFacade, false);
        assert.equal('host' in hostFacade, false);
        assert.equal(hostFacade.isConnected, true);

        const evalResult = await debugHost.evalScript('IllustratorBridge.ping()');
        const rootPath = debugHost.getExtensionRootPath();

        assert.equal(evalResult, 'ran:IllustratorBridge.ping()');
        assert.equal(rootPath, 'C:/Wedding CEP');
        assert.deepEqual(calls.host, [
            ['evalScript', 'IllustratorBridge.ping()'],
            ['getExtensionRootPath']
        ]);
        assert.deepEqual(calls.bridge, [['isConnected']]);
    });
});

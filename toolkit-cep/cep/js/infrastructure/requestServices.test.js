import test from 'node:test';
import assert from 'node:assert/strict';
import { createToolkitRequestServices, __private__ } from './requestServices.js';

test('request services build a PDF and AI ExtendScript picker', () => {
    const script = __private__.buildArtworkPickerScript("Pick customer's artwork");

    assert.match(script, /File\.openDialog/);
    assert.match(script, /Pick customer\\'s artwork/);
    assert.match(script, /\*\.pdf;\*\.ai/);
});

test('request services return a normalized selected artwork path', async () => {
    const evalScripts = [];
    const services = createToolkitRequestServices({
        rawHost: {
            async evalScript(script) {
                evalScripts.push(script);
                return ' C:/input/design.pdf ';
            },
            async readFileBytes() {
                return new Uint8Array([1, 2, 3]);
            }
        }
    });

    assert.equal(
        await services.pickArtworkFile({ title: 'Choose PDF or AI' }),
        'C:/input/design.pdf'
    );
    assert.equal(evalScripts.length, 1);
    assert.deepEqual(
        Array.from(await services.readFileBytes('C:/input/design.pdf')),
        [1, 2, 3]
    );
});

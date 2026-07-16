const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const cepRoot = path.resolve(__dirname, '..');
const hostEntryPath = path.join(cepRoot, 'jsx', 'host.jsx');
const hostBootstrapPath = path.join(cepRoot, 'jsx', 'bootstrap', 'toolkitHostBootstrap.jsx');

test('host reload pipeline defers payload parsing until bootstrap has loaded utils.jsx', () => {
    const hostEntrySource = fs.readFileSync(hostEntryPath, 'utf8');
    const hostBootstrapSource = fs.readFileSync(hostBootstrapPath, 'utf8');
    const utilsLoadIndex = hostBootstrapSource.indexOf('ToolkitHostBootstrap._evalRelative(rootFolder, "utils.jsx", runtimeState.loadedFiles);');
    const normalizeOptionsIndex = hostBootstrapSource.indexOf('options = ToolkitHostBootstrap._normalizeLoadOptions(optionsOrPayload);');

    assert.equal(hostEntrySource.includes('JSON.parse(payloadJson)'), false);
    assert.match(hostEntrySource, /ToolkitHostBootstrap\.load\(payloadJson \|\| "", jsxRootFolder\.fsName\)/);
    assert.notEqual(utilsLoadIndex, -1);
    assert.notEqual(normalizeOptionsIndex, -1);
    assert.ok(
        utilsLoadIndex < normalizeOptionsIndex,
        'host bootstrap should load utils.jsx before it normalizes reload payload options'
    );
});

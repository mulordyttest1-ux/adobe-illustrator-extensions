import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const HOST_ENTRY = new URL('../../../jsx/host.jsx', import.meta.url);
const HOST_FILES = {
    host: HOST_ENTRY,
    core: new URL('../../../jsx/features/wedding_suite_standard_core.jsx', import.meta.url),
    source: new URL('../../../jsx/features/wedding_suite_standard_source.jsx', import.meta.url),
    render: new URL('../../../jsx/features/wedding_suite_standard_render.jsx', import.meta.url),
    output: new URL('../../../jsx/features/wedding_suite_standard_output.jsx', import.meta.url),
    root: new URL('../../../jsx/features/wedding_suite_standard.jsx', import.meta.url)
};

const PUBLIC_ENDPOINTS = [
    'getActiveDocumentDirectory',
    'getActiveDocumentSourceInfo',
    'inspectSource',
    'inspectOpenOutput',
    'markOpenOutputDirty',
    'ensureOutputOpen',
    'printQaCheck',
    'buildJob'
];

function readFile(url) {
    return fs.readFileSync(url, 'utf8');
}

test('Wedding Suite host includes use the fixed composition order', () => {
    const host = readFile(HOST_FILES.host);
    const includePaths = [
        'features/wedding_suite_standard_core.jsx',
        'features/wedding_suite_standard_source.jsx',
        'features/wedding_suite_standard_render.jsx',
        'features/wedding_suite_standard_output.jsx',
        'features/wedding_suite_standard.jsx'
    ];
    const positions = includePaths.map((includePath) => host.indexOf(`#include "${includePath}"`));

    assert.ok(positions.every((position) => position >= 0));
    assert.deepEqual([...positions].sort((a, b) => a - b), positions);
});

test('Wedding Suite public endpoints remain on the composition root', () => {
    const root = readFile(HOST_FILES.root);
    const supportSource = [
        readFile(HOST_FILES.core),
        readFile(HOST_FILES.source),
        readFile(HOST_FILES.render),
        readFile(HOST_FILES.output)
    ].join('\n');

    for (const endpoint of PUBLIC_ENDPOINTS) {
        assert.match(root, new RegExp(`WeddingSuiteStandard\\.${endpoint} = function`));
        assert.doesNotMatch(
            supportSource,
            new RegExp(`WeddingSuiteStandard\\.${endpoint} = function`)
        );
    }
});

test('Wedding Suite JSX extraction stays ES3-compatible', () => {
    const source = Object.values(HOST_FILES)
        .map((url) => readFile(url))
        .join('\n');

    assert.doesNotMatch(source, /\blet\b|\bconst\b|=>|\?\./);
    assert.doesNotMatch(source, /\.\.\.\s*[A-Za-z_$({[]/);
});

test('PDF export failures retain an AI recovery document instead of closing all work', () => {
    const output = readFile(HOST_FILES.output);
    const root = readFile(HOST_FILES.root);

    assert.match(output, /WEDDING_SUITE_PDF_EXPORT_FAILED/);
    assert.match(output, /if \(firstError \|\| !tempFile\.exists\)/);
    assert.match(output, /options\.preserveEditability = false/);
    assert.match(output, /_withAlertsSuppressed\(function \(\) \{\s*doc\.saveAs/);
    assert.match(root, /recoveryArtifactPath/);
    assert.match(root, /preserveWorkingDocument/);
    assert.match(root, /response\.recoveryArtifact/);
    assert.match(root, /pdfExportWarning/);
    assert.match(root, /outputDoc && !preserveWorkingDocument/);
});

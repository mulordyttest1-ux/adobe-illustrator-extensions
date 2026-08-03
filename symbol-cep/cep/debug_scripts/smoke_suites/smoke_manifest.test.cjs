const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const { registerSymbolSmokeSuites, symbolSmokeSuites } = require('./smoke_manifest.cjs');

test('Symbol smoke manifest preserves all 46 unique scenarios in suite order', () => {
    const names = [];
    registerSymbolSmokeSuites({
        runner: { addTest(name) { names.push(name); } },
        cleanupSmokeArtifact() {},
        makeHostScenarioExpression() { return ''; },
        makePresetRoundtripExpression() { return ''; }
    });

    const expectedNames = [
        'Action tab loads with readable search UI',
        'Header tabs are semantic and keyboard-switchable',
        'Manager mode keeps readable empty state and uses in-panel delete confirm',
        'Runtime error toast stays readable and free of mojibake',
        'Preflight warning toast stays readable and free of mojibake',
        'Preflight infrastructure failure toast stays readable and visible',
        'Debug surface is opt-in instead of mounted by default',
        'Fuzzy search returns filtered presets',
        'Keyboard navigation highlights the next preset',
        'Live run happy path resolves the clicked preset and retains postflight summary',
        'Unsafe preflight from a real preset click blocks the engine and clears stale summary',
        'Run preset save modes route explicit Save As and Save payloads through the host gateway',
        'Run tab smart Save As strips generated timestamp and marks the old AI for cleanup',
        'Engine failure from a real preset click still restores auto-group and shows an error toast',
        'Config tab resets draft state when preset dropdown returns to blank',
        'Config save button persists a draft preset through reload without mutating tracked storage',
        'Saved preset roundtrips into manager mode and resolves the same preset on run',
        'Dry run from a reloaded preset matches the saved runtime shape',
        'Config tab shows read-only invariant summary instead of invariant inputs',
        'Config pane uses compact placeholders for numeric groups',
        'Processing rows wrap long labels without clipping into controls',
        'Schema controls stay hidden until edit mode is enabled',
        'Config pane internal buttons do not submit the preset form',
        'Sparse legacy rawValues preserve decisions and hydrate dense snapshot',
        'Legacy preset without rawValues hydrates from mirrors and defaults',
        'Current form serializes explicit checkbox state and normalized processing options',
        'Margin rules preserve draw-border metadata only for positive offsets',
        'Legacy schema load and blank reset keep canonical info_template field',
        'Pasteboard preview resolves width and height from normalized result data',
        'Postflight hook summary is observable after the engine-success path runs',
        'Postflight off mode clears pasteboard slug through the host bridge',
        'Storage warning renders in both tabs when health is mocked degraded',
        'Dry run remains available when main preset storage is degraded',
        'Host lifecycle restores auto-group after selection is cleared',
        'Host does not draw border when offset is zero',
        'Host keeps single-edge border output free of surrounding guide rectangle',
        'Host converts dark compound artwork to K100 while preserving light compound artwork',
        'Host outlines text before K100 so text appearance survives the fast branch',
        'Host lifecycle fails safe when auto-group name is missing',
        'Wedding Suite tab mounts as an isolated workspace shell',
        'Wedding Suite source button surfaces picker failures instead of failing silently',
        'Wedding Suite PDF source button hydrates manifest without calling host inspect',
        'Wedding Suite draft checkbox auto-detects a small last page and sends it as a separate artboard',
        'Wedding Suite one-page full-suite mode sends 4-up single-page production sheets',
        'Wedding Suite quick-build workflow uses fixed pages, remembers directories, and hides the old operator UI',
        'Wedding Suite host build opens the PDF and retains AI only as a temporary smoke artifact'
    ];

    assert.deepEqual(symbolSmokeSuites.map((suite) => suite.id), ['action', 'config', 'host', 'wedding_suite']);
    assert.deepEqual(names, expectedNames);
    assert.equal(new Set(names).size, expectedNames.length);
    assert.deepEqual(
        symbolSmokeSuites.map((suite) => {
            const suiteNames = [];
            suite.register({
                runner: { addTest(name) { suiteNames.push(name); } },
                cleanupSmokeArtifact() {},
                makeHostScenarioExpression() { return ''; },
                makePresetRoundtripExpression() { return ''; }
            });
            return suiteNames.length;
        }),
        [14, 19, 6, 7]
    );
});

test('top-level smoke registrars only delegate to scenario families', () => {
    const suiteFiles = ['action_smoke_tests.cjs', 'config_smoke_tests.cjs', 'host_smoke_tests.cjs', 'wedding_suite_smoke_tests.cjs'];

    for (const file of suiteFiles) {
        const source = fs.readFileSync(
            path.join(__dirname, file),
            'utf8'
        );
        assert.doesNotMatch(source, /runner\.addTest\(/, file);
    }
});

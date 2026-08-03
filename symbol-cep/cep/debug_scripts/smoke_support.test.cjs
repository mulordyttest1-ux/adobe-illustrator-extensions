const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
    cleanupSmokeArtifact,
    cleanupSmokeOutput,
    decodeBase64Json
} = require('./smoke_support.cjs');

test('smoke artifact cleanup only deletes jobs inside the dedicated temp root', () => {
    const jobsRoot = path.join(os.tmpdir(), 'symbol_cep_wedding_suite_jobs');
    fs.mkdirSync(jobsRoot, { recursive: true });
    const jobPath = fs.mkdtempSync(path.join(jobsRoot, 'support-test-'));
    const artifactPath = path.join(jobPath, 'artifact.ai');

    fs.writeFileSync(artifactPath, 'fixture', 'utf8');
    cleanupSmokeArtifact(artifactPath);

    assert.equal(fs.existsSync(jobPath), false);
    assert.throws(
        () => cleanupSmokeArtifact(path.join(os.tmpdir(), 'outside-artifact.ai')),
        /Refusing to clean debug artifact outside/
    );
});

test('smoke output cleanup keeps the same temp-root safety boundary', () => {
    const outputsRoot = path.join(os.tmpdir(), 'symbol_cep_smoke_outputs');
    fs.mkdirSync(outputsRoot, { recursive: true });
    const jobPath = fs.mkdtempSync(path.join(outputsRoot, 'support-test-'));
    const outputPath = path.join(jobPath, 'output.pdf');

    fs.writeFileSync(outputPath, 'fixture', 'utf8');
    cleanupSmokeOutput(outputPath);

    assert.equal(fs.existsSync(jobPath), false);
    assert.throws(
        () => cleanupSmokeOutput(path.join(os.tmpdir(), 'outside-output.pdf')),
        /Refusing to clean smoke output outside/
    );
});

test('smoke host payload decoder preserves valid JSON and rejects raw failures', () => {
    const encoded = Buffer.from(JSON.stringify({ success: true, count: 1 }), 'utf8').toString('base64');

    assert.deepEqual(decodeBase64Json(encoded), { success: true, count: 1 });
    assert.throws(() => decodeBase64Json('ReferenceError: host failed'), /ReferenceError: host failed/);
});

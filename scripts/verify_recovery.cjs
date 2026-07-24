#!/usr/bin/env node

const { parseRecoveryArgs, verifyArchive } = require('./recovery_core.cjs');

function main(argv = process.argv.slice(2), deps = {}) {
    let options;
    try {
        options = parseRecoveryArgs(argv, 'verify');
    } catch (error) {
        console.error(`[verify:recovery] ${error.message}`);
        return 2;
    }
    try {
        const report = verifyArchive(options.archive, deps);
        if (options.json) console.log(JSON.stringify(report));
        else report.checks.forEach((check) => console.log(`[${check.status}] ${check.id}: ${check.message}`));
        return report.status === 'PASS' ? 0 : 1;
    } catch (error) {
        const report = { version: 1, status: 'FAIL', archive: options.archive, checks: [{ id: 'internal', status: 'FAIL', message: error.message, remediation: 'Check the archive path and 7-Zip installation.' }] };
        if (options.json) console.log(JSON.stringify(report));
        else console.error(`[verify:recovery] ${error.message}`);
        return 2;
    }
}

module.exports = { main };

if (require.main === module) process.exitCode = main();

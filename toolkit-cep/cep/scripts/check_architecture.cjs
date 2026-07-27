const path = require('node:path');
const { runArchitectureCheck } = require('./check_architecture_support.cjs');

const projectRoot = path.resolve(__dirname, '..');
const violations = runArchitectureCheck({ projectRoot });

if (violations.length > 0) {
    console.error('Toolkit architecture check failed.');
    for (const violation of violations) {
        console.error(`- ${violation}`);
    }
    process.exit(1);
}

console.log('Toolkit architecture check passed.');

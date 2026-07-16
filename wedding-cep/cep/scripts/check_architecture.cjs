const path = require('path');
const { runArchitectureCheck } = require('./check_architecture_support.cjs');

const projectRoot = path.resolve(__dirname, '..');
const jsRoot = path.join(projectRoot, 'js');
const violations = runArchitectureCheck({ projectRoot, jsRoot });

if (violations.length > 0) {
    console.error('Architecture check failed.');
    for (const violation of violations) {
        console.error(`- ${violation}`);
    }
    process.exit(1);
}

console.log('Architecture check passed.');

process.env.SYMBOL_CEP_PORT = process.env.SYMBOL_CEP_PORT || '9198';
process.env.SYMBOL_CEP_PROJECT_NAME = process.env.SYMBOL_CEP_PROJECT_NAME || 'Symbol CEP Test 2026';

require('./test_smoke.cjs');

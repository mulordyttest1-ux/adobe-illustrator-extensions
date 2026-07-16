process.env.WEDDING_CEP_PORT = process.env.WEDDING_CEP_PORT || '9197';
process.env.WEDDING_CEP_PROJECT_NAME = process.env.WEDDING_CEP_PROJECT_NAME || 'Wedding CEP Test 2026';

require('./test_smoke.cjs');

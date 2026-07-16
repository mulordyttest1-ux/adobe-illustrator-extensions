/**
 * Offline diagnostic: reproduce "a52 khong ky" exact-match search
 * Run: node symbol-cep/cep/debug_scripts/test_fuse_search.cjs
 */

// Minimal Fuse.js v7.1.0 import
const Fuse = require('../js/libs/fuse.basic.min.js');

// Simulate presets as user describes — names WITHOUT diacritics
const presets = [
    { id: 'preset_001', label: 'a52 khong ky' },
    { id: 'preset_002', label: 'a4 co ky' },
    { id: 'preset_003', label: 'a5 khong ky' },
    { id: 'preset_004', label: 'b4 co ky ngang' },
    { id: 'preset_005', label: 'a52 co ky' },
];

// EXACT config from action_tab.js _initFuse()
const fuse = new Fuse(presets, {
    keys: [
        { name: 'label', weight: 0.7 },
        { name: 'id', weight: 0.3 }
    ],
    threshold: 0.4,
    ignoreLocation: true,
    includeScore: true
});

// Test cases
const queries = [
    'a52 khong ky',
    'a52 khong',
    'khong ky',
    'a52',
    'a4 co',
    'a4',
];

console.log('=== FUSE.JS v7.1.0 SEARCH TEST ===\n');
queries.forEach(q => {
    const results = fuse.search(q);
    console.log(`Query: "${q}"`);
    if (results.length === 0) {
        console.log('  ❌ NO RESULTS');
    } else {
        results.forEach(r => {
            console.log(`  ✅ ${r.item.label} (id=${r.item.id}, score=${r.score.toFixed(4)})`);
        });
    }
    console.log('');
});

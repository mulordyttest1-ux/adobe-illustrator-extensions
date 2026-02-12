/**
 * build.js — esbuild configuration for Wedding Scripter CEP Panel
 * 
 * Usage:
 *   node build.js          → single build
 *   node build.js --watch  → watch mode (auto-rebuild on file change)
 */

const { execSync } = require('child_process');

const isWatch = process.argv.includes('--watch');

const args = [
    'esbuild',
    'js/app.js',
    '--bundle',
    '--outfile=js/bundle.js',
    '--format=iife',
    '--target=es2020',
    '--sourcemap=inline',
    '--charset=utf8',
];

if (isWatch) {
    args.push('--watch');
    console.log('👁️  Watch mode — auto-rebuilding on changes...');
}

try {
    execSync(args.join(' '), { stdio: 'inherit', cwd: __dirname });
    if (!isWatch) {
        console.log('✅ Build complete: js/bundle.js');
    }
} catch (error) {
    console.error('❌ Build failed');
    process.exit(1);
}

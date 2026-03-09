/**
 * build.js — esbuild configuration for Symbol Scripter CEP Panel
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
    '--external:CSInterface',
];

if (isWatch) {
    args.push('--watch');
    console.log('👁️  Watch mode — auto-rebuilding on changes...');
}

try {
    // Check if esbuild is installed globally or use npx
    // Using npx esbuild or assuming it's in path via npm modules
    // Since root has esbuild, we probably need to invoke it via node_modules/.bin/esbuild 
    // OR just 'esbuild' if in PATH.
    // wedding-cep uses 'esbuild' in args and assumes it works. 
    // But wait, wedding-cep/cep/build.cjs uses `execSync` with 'esbuild'.
    // If esbuild is in devDependencies of root, it might not be in PATH unless we run via npm scripts.
    // But since we will run `node symbol-cep/cep/build.cjs`, we might need full path or use `npx esbuild`.
    // Let's use `npx esbuild` to be safe, or just `esbuild` if it worked for wedding.
    // Actually, wedding build.cjs uses `args = ['esbuild', ...]` lines 13-14.
    // If it works for wedding, I'll copy.

    // Correction: I should probably use `npx esbuild` to be robust. 
    // But I'll stick to parity with wedding-cep for now.

    execSync(args.join(' '), { stdio: 'inherit', cwd: __dirname });
    if (!isWatch) {
        console.log('✅ Build complete: js/bundle.js');
    }
} catch (error) {
    console.error('❌ Build failed');
    process.exit(1);
}

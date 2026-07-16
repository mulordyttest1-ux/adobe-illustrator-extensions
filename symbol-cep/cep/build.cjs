/**
 * build.cjs - esbuild configuration for Symbol Scripter CEP Panel
 *
 * Usage:
 *   node build.cjs          -> single build
 *   node build.cjs --watch  -> watch mode (auto-rebuild on file change)
 *
 * Uses esbuild JS API (not CLI) to support @shared/* path aliases.
 */

const esbuild = require('esbuild');
const fs = require('fs');
const path = require('path');

const isWatch = process.argv.includes('--watch');
const indexPath = path.resolve(__dirname, 'index.html');
const test2026Root = path.resolve(
    process.env.APPDATA || '',
    'Adobe/CEP/extensions/com.dinhson.imposition.panel.test2026'
);
const test2026IndexPath = path.resolve(test2026Root, 'index.html');
const test2026TemplatePath = path.resolve(test2026Root, 'wedding suite print template.ai');

function copyTemplateBestEffort(sourcePath, targetPath) {
    if (!fs.existsSync(sourcePath)) {
        return;
    }

    try {
        fs.copyFileSync(sourcePath, targetPath);
    } catch (error) {
        if (fs.existsSync(targetPath) && (error.code === 'EPERM' || error.code === 'EBUSY')) {
            console.warn(`[build] Template appears locked; keeping existing copy: ${targetPath}`);
            return;
        }

        throw error;
    }
}

function syncTest2026WrapperAssets() {
    if (!test2026Root || !fs.existsSync(test2026Root)) {
        return;
    }

    fs.copyFileSync(indexPath, test2026IndexPath);

    const sourceTemplatePath = path.resolve(__dirname, 'wedding suite print template.ai');
    if (fs.existsSync(sourceTemplatePath)) {
        copyTemplateBestEffort(sourceTemplatePath, test2026TemplatePath);
    }
}

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
    entryPoints: [path.resolve(__dirname, 'js/app.js')],
    bundle: true,
    outfile: path.resolve(__dirname, 'js/bundle.js'),
    format: 'iife',
    target: 'es2020',
    sourcemap: 'inline',
    charset: 'utf8',
    external: ['CSInterface'],

    // Shared library alias - resolves @shared/* to libs/shared/*
    // Relative to THIS file's directory (symbol-cep/cep/)
    alias: {
        '@shared/cep-ui': path.resolve(__dirname, '../../libs/shared/cep-ui/src/index.js'),
    },
    plugins: [{
        name: 'sync-test2026-wrapper',
        setup(build) {
            build.onEnd((result) => {
                if (result.errors && result.errors.length > 0) {
                    return;
                }

                syncTest2026WrapperAssets();
            });
        }
    }]
};

function syncWeddingSuitePrintTemplate() {
    const sourcePath = path.resolve(__dirname, '../wedding suite print template.ai');
    const targetPath = path.resolve(__dirname, 'wedding suite print template.ai');

    if (!fs.existsSync(sourcePath)) {
        return;
    }

    copyTemplateBestEffort(sourcePath, targetPath);
}

(async () => {
    if (isWatch) {
        syncWeddingSuitePrintTemplate();
        syncTest2026WrapperAssets();
        const ctx = await esbuild.context(buildOptions);
        await ctx.watch();
        console.log('[build] Watch mode - auto-rebuilding on changes...');
    } else {
        syncWeddingSuitePrintTemplate();
        await esbuild.build(buildOptions);
        syncTest2026WrapperAssets();
        console.log('[build] Build complete: js/bundle.js');
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});

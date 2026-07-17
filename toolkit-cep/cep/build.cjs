const esbuild = require('esbuild');
const path = require('path');
const { generateToolkitArtifacts } = require('./scripts/generate_toolkit_artifacts.cjs');

const rootDir = __dirname;
const isProduction = process.argv.includes('--production');

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
    entryPoints: [path.resolve(rootDir, 'js/app.js')],
    bundle: true,
    outfile: path.resolve(rootDir, 'js/bundle.js'),
    format: 'iife',
    target: 'es2020',
    sourcemap: isProduction ? false : 'inline',
    charset: 'utf8',
    external: ['CSInterface'],
    alias: {
        '@shared/cep-ui': path.resolve(rootDir, '../../libs/shared/cep-ui/src/index.js'),
    },
};

async function runBuild() {
    const summary = await generateToolkitArtifacts({
        projectRoot: rootDir,
        generatedDir: path.resolve(rootDir, '.generated'),
    });

    console.log(`[build] Generated ${summary.definitions.length} toolkit modules.`);
    await esbuild.build(buildOptions);
    console.log('[build] Build complete: js/bundle.js');
}

runBuild().catch((error) => {
    console.error(error);
    process.exit(1);
});

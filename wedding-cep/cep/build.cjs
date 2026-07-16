/**
 * esbuild configuration for the Wedding Scripter CEP panel.
 *
 * Usage:
 *   node build.cjs
 *   node build.cjs --watch
 */

const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const isWatch = process.argv.includes("--watch");
const indexPath = path.resolve(__dirname, "index.html");
const test2026IndexPath = path.resolve(
    process.env.APPDATA || "",
    "Adobe/CEP/extensions/com.dinhson.weddingscripter.panel.test2026/index.html"
);

function syncTest2026IndexHtml() {
    if (!test2026IndexPath || !fs.existsSync(path.dirname(test2026IndexPath))) {
        return;
    }

    fs.copyFileSync(indexPath, test2026IndexPath);
}

/** @type {import('esbuild').BuildOptions} */
const buildOptions = {
    entryPoints: [path.resolve(__dirname, "js/app.js")],
    bundle: true,
    outfile: path.resolve(__dirname, "js/bundle.js"),
    format: "iife",
    target: "es2020",
    sourcemap: "inline",
    charset: "utf8",
    alias: {
        "@shared/cep-ui": path.resolve(__dirname, "../../libs/shared/cep-ui/src/index.js")
    },
    plugins: [{
        name: "sync-test2026-wrapper",
        setup(build) {
            build.onEnd((result) => {
                if (result.errors && result.errors.length > 0) {
                    return;
                }

                syncTest2026IndexHtml();
            });
        }
    }]
};

(async () => {
    if (isWatch) {
        const ctx = await esbuild.context(buildOptions);
        await ctx.watch();
        console.log("[build] Watching wedding-cep for changes...");
    } else {
        await esbuild.build(buildOptions);
        console.log("[build] Build complete: js/bundle.js");
    }
})().catch((error) => {
    console.error(error);
    process.exit(1);
});

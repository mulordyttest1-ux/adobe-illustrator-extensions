const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');

const TOOLKIT_SHELL_FREEZE_POLICY = Object.freeze({
    frozenPrefixes: Object.freeze([
        'toolkit-cep/cep/js',
        'toolkit-cep/cep/jsx',
        'toolkit-cep/cep/scripts'
    ]),
    frozenFiles: Object.freeze([
        'toolkit-cep/cep/index.html',
        'toolkit-cep/cep/css/style.css',
        'toolkit-cep/cep/CSXS/manifest.xml',
        'toolkit-cep/cep/build.cjs'
    ]),
    safePrefixes: Object.freeze([
        'toolkit-cep/cep/modules',
        'toolkit-cep/cep/debug_scripts'
    ]),
    ignoredPrefixes: Object.freeze([
        'toolkit-cep/cep/.generated'
    ]),
    ignoredFiles: Object.freeze([
        'toolkit-cep/cep/js/bundle.js',
        'toolkit-cep/cep/js/bundle.js.map'
    ])
});

function toPosixPath(value) {
    return String(value || '').replace(/\\/g, '/');
}

function normalizeRepoPath(filePath, options = {}) {
    const repoRoot = options.repoRoot || REPO_ROOT;
    let normalized = toPosixPath(filePath).replace(/^\.\//, '');

    if (path.isAbsolute(String(filePath || ''))) {
        normalized = toPosixPath(path.relative(path.resolve(repoRoot), path.resolve(filePath)));
    }

    return normalized.replace(/^\.\//, '');
}

function isPathUnder(prefix, repoPath) {
    return repoPath === prefix || repoPath.indexOf(prefix + '/') === 0;
}

function isToolkitRootMarkdown(repoPath) {
    return /^toolkit-cep\/[^/]+\.md$/i.test(repoPath);
}

function isToolkitTestPath(repoPath) {
    return /^toolkit-cep\/.*\.test\.(cjs|js|mjs)$/i.test(repoPath);
}

function isIgnoredToolkitPath(repoPath) {
    if (!/^toolkit-cep\//.test(repoPath)) {
        return false;
    }

    if (TOOLKIT_SHELL_FREEZE_POLICY.ignoredFiles.indexOf(repoPath) !== -1) {
        return true;
    }

    return TOOLKIT_SHELL_FREEZE_POLICY.ignoredPrefixes.some((prefix) => isPathUnder(prefix, repoPath));
}

function isSafeToolkitPath(repoPath) {
    if (!/^toolkit-cep\//.test(repoPath)) {
        return false;
    }

    if (isIgnoredToolkitPath(repoPath) || isToolkitTestPath(repoPath) || isToolkitRootMarkdown(repoPath)) {
        return true;
    }

    return TOOLKIT_SHELL_FREEZE_POLICY.safePrefixes.some((prefix) => isPathUnder(prefix, repoPath));
}

function getFrozenReason(repoPath) {
    if (isPathUnder('toolkit-cep/cep/js', repoPath)) {
        return 'panel shell/runtime source';
    }
    if (isPathUnder('toolkit-cep/cep/jsx', repoPath)) {
        return 'host bootstrap/runtime source';
    }
    if (isPathUnder('toolkit-cep/cep/scripts', repoPath)) {
        return 'build/discovery/tooling contract';
    }
    if (repoPath === 'toolkit-cep/cep/index.html' || repoPath === 'toolkit-cep/cep/css/style.css') {
        return 'panel shell surface';
    }
    if (repoPath === 'toolkit-cep/cep/CSXS/manifest.xml' || repoPath === 'toolkit-cep/cep/build.cjs') {
        return 'packaging/runtime entry contract';
    }
    return 'toolkit shell core';
}

function isFrozenToolkitPath(repoPath) {
    if (!/^toolkit-cep\//.test(repoPath)) {
        return false;
    }

    if (isIgnoredToolkitPath(repoPath) || isSafeToolkitPath(repoPath)) {
        return false;
    }

    if (TOOLKIT_SHELL_FREEZE_POLICY.frozenFiles.indexOf(repoPath) !== -1) {
        return true;
    }

    return TOOLKIT_SHELL_FREEZE_POLICY.frozenPrefixes.some((prefix) => isPathUnder(prefix, repoPath));
}

function classifyToolkitShellFreezePath(filePath, options = {}) {
    const repoPath = normalizeRepoPath(filePath, options);

    if (!/^toolkit-cep\//.test(repoPath)) {
        return {
            repoPath,
            scope: 'outside',
            reason: 'outside toolkit-cep'
        };
    }

    if (isIgnoredToolkitPath(repoPath)) {
        return {
            repoPath,
            scope: 'ignored',
            reason: 'generated/build artifact'
        };
    }

    if (isSafeToolkitPath(repoPath)) {
        return {
            repoPath,
            scope: 'safe',
            reason: isToolkitTestPath(repoPath)
                ? 'test file'
                : isToolkitRootMarkdown(repoPath)
                    ? 'toolkit documentation'
                    : 'module/test/docs safe zone'
        };
    }

    if (isFrozenToolkitPath(repoPath)) {
        return {
            repoPath,
            scope: 'frozen',
            reason: getFrozenReason(repoPath)
        };
    }

    return {
        repoPath,
        scope: 'other',
        reason: 'not covered by toolkit shell freeze policy'
    };
}

module.exports = {
    REPO_ROOT,
    TOOLKIT_SHELL_FREEZE_POLICY,
    normalizeRepoPath,
    isToolkitTestPath,
    isIgnoredToolkitPath,
    isSafeToolkitPath,
    isFrozenToolkitPath,
    classifyToolkitShellFreezePath
};

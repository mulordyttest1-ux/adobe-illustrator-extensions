function getWindowRef(overrides = {}) {
    if (Object.prototype.hasOwnProperty.call(overrides, 'window')) {
        return overrides.window;
    }

    return typeof window !== 'undefined' ? window : {};
}

function getGlobalRef(overrides = {}) {
    if (Object.prototype.hasOwnProperty.call(overrides, 'globalThis')) {
        return overrides.globalThis;
    }

    return globalThis;
}

function getNavigatorRef(overrides = {}) {
    if (Object.prototype.hasOwnProperty.call(overrides, 'navigator')) {
        return overrides.navigator;
    }

    return getGlobalRef(overrides).navigator || {};
}

function getNodeRequire(overrides = {}) {
    if (typeof overrides.require === 'function') {
        return overrides.require;
    }

    const windowRef = getWindowRef(overrides);
    if (windowRef.cep_node && typeof windowRef.cep_node.require === 'function') {
        return windowRef.cep_node.require.bind(windowRef.cep_node);
    }

    if (typeof windowRef.require === 'function') {
        return windowRef.require.bind(windowRef);
    }

    const globalRef = getGlobalRef(overrides);
    if (typeof globalRef.require === 'function') {
        return globalRef.require;
    }

    return null;
}

function getCsInterfaceCtor(overrides = {}) {
    if (typeof overrides.CSInterface === 'function') {
        return overrides.CSInterface;
    }

    const globalRef = getGlobalRef(overrides);
    if (typeof globalRef.CSInterface === 'function') {
        return globalRef.CSInterface;
    }

    if (typeof CSInterface !== 'undefined') {
        return CSInterface;
    }

    return null;
}

function createCsInterfaceGetter(overrides = {}) {
    let cachedCsInterface = null;

    return function getCsInterfaceInstance() {
        if (cachedCsInterface) {
            return cachedCsInterface;
        }

        const CSInterfaceCtor = getCsInterfaceCtor(overrides);
        if (!CSInterfaceCtor) {
            return null;
        }

        cachedCsInterface = new CSInterfaceCtor();
        return cachedCsInterface;
    };
}

function normalizeExtensionRootPath(rootPath, platform = '') {
    let normalized = decodeURIComponent(String(rootPath || ''));

    if (normalized.startsWith('file:///')) {
        normalized = normalized.slice(8);
    } else if (normalized.startsWith('file://')) {
        normalized = normalized.slice(7);
    }

    if (String(platform).includes('Win') && /^\/[A-Za-z]:/.test(normalized)) {
        normalized = normalized.slice(1);
    }

    return normalized;
}

function createEvalScript(getCsInterfaceInstance) {
    return async function evalScript(script) {
        const csInterface = getCsInterfaceInstance();
        if (!csInterface) {
            throw new Error('CSInterface unavailable');
        }

        return await new Promise((resolve, reject) => {
            try {
                csInterface.evalScript(script, (result) => {
                    if (result === 'EvalScript error.') {
                        reject(new Error('ExtendScript Error'));
                        return;
                    }

                    resolve(result);
                });
            } catch (error) {
                reject(error);
            }
        });
    };
}

function createGetExtensionRootPath(overrides, getCsInterfaceInstance) {
    return function getExtensionRootPath() {
        const csInterface = getCsInterfaceInstance();
        const CSInterfaceCtor = getCsInterfaceCtor(overrides);

        if (!csInterface || !CSInterfaceCtor) {
            throw new Error('CSInterface unavailable');
        }

        const rootPath = csInterface.getSystemPath(CSInterfaceCtor.EXTENSION);
        return normalizeExtensionRootPath(rootPath, getNavigatorRef(overrides).platform || '');
    };
}

function createGetExtensionId(getCsInterfaceInstance) {
    return function getExtensionId() {
        const csInterface = getCsInterfaceInstance();

        if (!csInterface || typeof csInterface.getExtensionID !== 'function') {
            throw new Error('CSInterface unavailable');
        }

        return String(csInterface.getExtensionID() || '');
    };
}

function createRunNodeScript(overrides = {}) {
    return async function runNodeScript(scriptPath, options = {}) {
        const nodeRequire = getNodeRequire(overrides);
        if (!nodeRequire) {
            throw new Error('Node require unavailable');
        }

        const childProcess = nodeRequire('child_process');
        const path = nodeRequire('path');
        const processRef = nodeRequire('process');
        const args = Array.isArray(options.args) ? options.args : [];
        const cwd = options.cwd || path.dirname(scriptPath);

        return await new Promise((resolve, reject) => {
            const child = childProcess.fork(scriptPath, args, {
                cwd,
                silent: true,
                env: options.env || processRef.env
            });
            let stdout = '';
            let stderr = '';

            child.stdout?.on('data', (chunk) => {
                stdout += String(chunk);
            });
            child.stderr?.on('data', (chunk) => {
                stderr += String(chunk);
            });
            child.on('error', reject);
            child.on('exit', (code, signal) => {
                if (code === 0) {
                    resolve({ code, signal, stdout, stderr });
                    return;
                }

                reject(new Error(
                    `Node script failed (code=${code}, signal=${signal || 'none'}): ${stderr || stdout || scriptPath}`
                ));
            });
        });
    };
}

function createReadFileBytes(overrides = {}) {
    return async function readFileBytes(filePath) {
        const nodeRequire = getNodeRequire(overrides);
        if (!nodeRequire) {
            throw new Error('Node file access unavailable');
        }

        const fs = nodeRequire('fs');
        const buffer = fs.readFileSync(String(filePath));
        return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.byteLength);
    };
}

export function createCepHost(overrides = {}) {
    const getCsInterfaceInstance = createCsInterfaceGetter(overrides);
    const evalScript = createEvalScript(getCsInterfaceInstance);

    return {
        isConnected() {
            return typeof getWindowRef(overrides).__adobe_cep__ !== 'undefined';
        },

        getExtensionId: createGetExtensionId(getCsInterfaceInstance),

        getExtensionRootPath: createGetExtensionRootPath(overrides, getCsInterfaceInstance),

        evalScript,

        readFileBytes: createReadFileBytes(overrides),

        runNodeScript: createRunNodeScript(overrides)
    };
}

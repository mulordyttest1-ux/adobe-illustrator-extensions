function getWindowRef(overrides = {}) {
    if (Object.prototype.hasOwnProperty.call(overrides, "window")) {
        return overrides.window;
    }
    return typeof window !== "undefined" ? window : {};
}

function getGlobalRef(overrides = {}) {
    if (Object.prototype.hasOwnProperty.call(overrides, "globalThis")) {
        return overrides.globalThis;
    }
    return globalThis;
}

function getNavigatorRef(overrides = {}) {
    if (Object.prototype.hasOwnProperty.call(overrides, "navigator")) {
        return overrides.navigator;
    }
    return getGlobalRef(overrides).navigator || {};
}

function getCsInterfaceCtor(overrides = {}) {
    if (typeof overrides.CSInterface === "function") {
        return overrides.CSInterface;
    }

    const globalRef = getGlobalRef(overrides);
    if (typeof globalRef.CSInterface === "function") {
        return globalRef.CSInterface;
    }

    if (typeof CSInterface !== "undefined") {
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

function getNodeRequire(overrides = {}) {
    if (typeof overrides.require === "function") {
        return overrides.require;
    }

    const windowRef = getWindowRef(overrides);
    if (typeof windowRef.require === "function") {
        return windowRef.require;
    }

    const globalRef = getGlobalRef(overrides);
    if (typeof globalRef.require === "function") {
        return globalRef.require;
    }

    return null;
}

function normalizeExtensionRootPath(rootPath, platform = "") {
    let normalized = decodeURIComponent(String(rootPath || ""));

    if (normalized.startsWith("file:///")) {
        normalized = normalized.slice(8);
    } else if (normalized.startsWith("file://")) {
        normalized = normalized.slice(7);
    }

    if (String(platform).includes("Win") && /^\/[A-Za-z]:/.test(normalized)) {
        normalized = normalized.slice(1);
    }

    return normalized;
}

function buildAbsoluteExtensionPath(rootPath, relativePath) {
    const trimmedRoot = String(rootPath || "").replace(/[\\/]+$/, "");
    const normalizedRelativePath = String(relativePath || "")
        .replace(/^[\\/]+/, "")
        .replace(/\\/g, "/");

    return `${trimmedRoot}/${normalizedRelativePath}`;
}

function escapeForExtendScript(value) {
    return String(value)
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"');
}

function createReadFileScript(absolutePath) {
    const escapedPath = escapeForExtendScript(absolutePath);

    return `
        (function() {
            try {
                var f = new File("${escapedPath}");
                if (!f.exists) {
                    return JSON.stringify({ ok: true, exists: false, content: null });
                }
                f.open('r');
                var content = f.read();
                f.close();
                return JSON.stringify({ ok: true, exists: true, content: content });
            } catch (e) {
                return JSON.stringify({ ok: false, error: e.message });
            }
        })()
    `;
}

function createEvalScript(getCsInterfaceInstance) {
    return async function evalScript(script) {
        const cs = getCsInterfaceInstance();
        if (!cs) {
            throw new Error("CSInterface unavailable");
        }

        return await new Promise((resolve, reject) => {
            try {
                cs.evalScript(script, (result) => {
                    if (result === "EvalScript error.") {
                        reject(new Error("ExtendScript Error"));
                        return;
                    }

                    if (typeof result === "undefined" || result === null) {
                        reject(new Error("No result from ExtendScript"));
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

function createGetExtensionRootPath(overrides = {}, getCsInterfaceInstance) {
    return function getExtensionRootPath() {
        const cs = getCsInterfaceInstance();
        const CSInterfaceCtor = getCsInterfaceCtor(overrides);

        if (!cs || !CSInterfaceCtor) {
            throw new Error("CSInterface unavailable");
        }

        const rootPath = cs.getSystemPath(CSInterfaceCtor.EXTENSION);
        return normalizeExtensionRootPath(rootPath, getNavigatorRef(overrides).platform || "");
    };
}

function readWithNodeFs(overrides, absolutePath) {
    try {
        const nodeRequire = getNodeRequire(overrides);
        if (!nodeRequire) {
            return { absolutePath, content: null };
        }

        const fs = nodeRequire("fs");
        if (!fs || !fs.existsSync(absolutePath)) {
            return { absolutePath, content: null };
        }

        return {
            absolutePath,
            content: fs.readFileSync(absolutePath, "utf8")
        };
    } catch {
        return { absolutePath, content: null };
    }
}

function readWithCepFs(overrides, absolutePath) {
    const cepFs = overrides.cepFs || getWindowRef(overrides).cep?.fs;
    if (!cepFs || typeof cepFs.readFile !== "function") {
        return { absolutePath, content: null };
    }

    const result = cepFs.readFile(absolutePath);
    if (!result || result.err !== 0) {
        return { absolutePath, content: null };
    }

    return {
        absolutePath,
        content: result.data
    };
}

async function readWithExtendScript(absolutePath, evalScript) {
    const payloadText = await evalScript(createReadFileScript(absolutePath));
    let parsedPayload;

    try {
        parsedPayload = JSON.parse(payloadText);
    } catch (error) {
        throw new Error(`Invalid ExtendScript file payload: ${error.message}`, { cause: error });
    }

    if (!parsedPayload || parsedPayload.ok !== true) {
        throw new Error(parsedPayload?.error || "ExtendScript file read failed");
    }

    return {
        absolutePath,
        content: parsedPayload.exists ? parsedPayload.content : null
    };
}

async function readExtensionText(deps, relativePath, options = {}) {
    const strategy = options.strategy || "node-fs";
    const absolutePath = buildAbsoluteExtensionPath(deps.getExtensionRootPath(), relativePath);

    if (strategy === "node-fs") {
        return readWithNodeFs(deps.overrides, absolutePath);
    }

    if (strategy === "cep-fs") {
        return readWithCepFs(deps.overrides, absolutePath);
    }

    if (strategy === "extendscript") {
        return await readWithExtendScript(absolutePath, deps.evalScript);
    }

    throw new Error(`Unknown CEP read strategy: ${strategy}`);
}

export function createCepHost(overrides = {}) {
    const getCsInterfaceInstance = createCsInterfaceGetter(overrides);
    const evalScript = createEvalScript(getCsInterfaceInstance);
    const getExtensionRootPath = createGetExtensionRootPath(overrides, getCsInterfaceInstance);
    const readDeps = {
        overrides,
        getExtensionRootPath,
        evalScript
    };

    return {
        isConnected() {
            return typeof getWindowRef(overrides).__adobe_cep__ !== "undefined";
        },

        getExtensionRootPath,

        evalScript,

        async readExtensionText(relativePath, options = {}) {
            return await readExtensionText(readDeps, relativePath, options);
        }
    };
}

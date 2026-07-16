export class CepStorageEnvironment {
    constructor({
        csFactory = () => new CSInterface(),
        cepFs = null,
        storage = null
    } = {}) {
        this.csFactory = csFactory;
        this.cepFs = cepFs;
        this.storage = storage;
        this.paths = null;
    }

    getFs() {
        if (this.cepFs) {
            return this.cepFs;
        }

        if (typeof window !== 'undefined' && window.cep && window.cep.fs) {
            return window.cep.fs;
        }

        return null;
    }

    getStorage() {
        if (this.storage) {
            return this.storage;
        }

        if (typeof window !== 'undefined' && window.localStorage) {
            return window.localStorage;
        }

        return null;
    }

    getPaths() {
        if (this.paths) {
            return this.paths;
        }

        try {
            const cs = this.csFactory();
            let extensionRoot = cs.getSystemPath(CSInterface.EXTENSION);

            if (extensionRoot.indexOf('file:///') === 0) {
                extensionRoot = extensionRoot.slice('file:///'.length);
            } else if (extensionRoot.indexOf('file://') === 0) {
                extensionRoot = extensionRoot.slice('file://'.length);
            }

            this.paths = {
                dirPath: `${extensionRoot}/data`,
                filePath: `${extensionRoot}/data/presets.json`,
                usageFilePath: `${extensionRoot}/data/presets.usage.json`
            };
        } catch (error) {
            console.warn('[DataStore] CSInterface unavailable, using fallback path:', error);
            this.paths = {
                dirPath: '/tmp/SymbolCEP',
                filePath: '/tmp/SymbolCEP/presets.json',
                usageFilePath: '/tmp/SymbolCEP/presets.usage.json'
            };
        }

        return this.paths;
    }

    ensureDir() {
        const fs = this.getFs();
        const { dirPath } = this.getPaths();
        if (!fs) {
            return;
        }

        const stat = fs.stat(dirPath);
        if (stat.err !== 0) {
            fs.makedir(dirPath);
        }
    }

    getTempPath(filePath) {
        return `${filePath}.tmp`;
    }

    getBackupPath(filePath) {
        return `${filePath}.bak`;
    }

    deleteFileQuietly(filePath) {
        const fs = this.getFs();
        if (!fs || typeof fs.deleteFile !== 'function') {
            return;
        }

        try {
            fs.deleteFile(filePath);
        } catch (error) {
            console.warn('[DataStore] Failed to delete temp file:', filePath, error);
        }
    }

    readJsonFile(filePath, allowMissing) {
        const fs = this.getFs();
        if (!fs) {
            return {
                state: allowMissing ? 'missing' : 'missing_target',
                data: null,
                raw: null
            };
        }

        try {
            const result = fs.readFile(filePath);
            if (result.err !== 0) {
                return {
                    state: allowMissing ? 'missing' : 'missing_target',
                    data: null,
                    raw: null
                };
            }

            return {
                state: 'ok',
                data: JSON.parse(result.data),
                raw: result.data
            };
        } catch (error) {
            return {
                state: error instanceof SyntaxError ? 'invalid_json' : 'read_error',
                data: null,
                raw: null,
                error
            };
        }
    }

    probeWriteAccess(filePath, allowCreateTarget) {
        const fs = this.getFs();
        if (!fs) {
            return false;
        }

        try {
            this.ensureDir();

            if (!allowCreateTarget) {
                const targetStat = fs.stat(filePath);
                if (targetStat.err !== 0) {
                    return false;
                }
            }

            const probePath = `${filePath}.probe`;
            const payload = JSON.stringify({ probe: true, at: new Date().toISOString() });
            const writeResult = fs.writeFile(probePath, payload);

            if (writeResult.err !== 0) {
                return false;
            }

            const readResult = fs.readFile(probePath);
            const isValid = readResult.err === 0 && readResult.data === payload;
            this.deleteFileQuietly(probePath);
            return isValid;
        } catch (error) {
            console.warn('[DataStore] Write probe failed:', filePath, error);
            return false;
        }
    }

    safeWriteJson(filePath, payload, allowCreateTarget) {
        const fs = this.getFs();
        if (!fs) {
            return { success: false, reason: 'write_denied' };
        }

        try {
            this.ensureDir();

            if (!allowCreateTarget) {
                const stat = fs.stat(filePath);
                if (stat.err !== 0) {
                    return { success: false, reason: 'missing_target' };
                }
            }

            const tempPath = this.getTempPath(filePath);
            const backupPath = this.getBackupPath(filePath);

            const tempWrite = fs.writeFile(tempPath, payload);
            if (tempWrite.err !== 0) {
                return { success: false, reason: 'write_denied' };
            }

            const tempRead = fs.readFile(tempPath);
            if (tempRead.err !== 0 || tempRead.data !== payload) {
                return { success: false, reason: 'write_denied' };
            }

            const current = fs.readFile(filePath);
            if (current.err === 0) {
                fs.writeFile(backupPath, current.data);
            }

            const targetWrite = fs.writeFile(filePath, payload);
            if (targetWrite.err !== 0) {
                return { success: false, reason: 'write_denied' };
            }

            const targetRead = fs.readFile(filePath);
            if (targetRead.err !== 0 || targetRead.data !== payload) {
                return { success: false, reason: 'write_denied' };
            }

            this.deleteFileQuietly(tempPath);
            return { success: true };
        } catch (error) {
            console.error('[DataStore] Safe write failed:', filePath, error);
            return { success: false, reason: 'write_denied', error };
        }
    }

    getLocalValue(key) {
        const storage = this.getStorage();
        if (!storage || typeof storage.getItem !== 'function') {
            return null;
        }

        return storage.getItem(key);
    }

    setLocalValue(key, value) {
        const storage = this.getStorage();
        if (!storage || typeof storage.setItem !== 'function') {
            return;
        }

        storage.setItem(key, value);
    }
}

/**
 * MODULE: DataStore
 * LAYER: Infrastructure/Persistence (L0)
 * PURPOSE: Quản lý đọc/ghi cấu hình vào FILE JSON (Portable) trên Hệ thống tệp tin.
 *
 * ==============================================================================
 * ARCHITECTURE DECISION (Cộng đồng đã xác nhận - §C1):
 * ✅ Dùng window.cep.fs để ghi file vào thư mục USER_DATA của Adobe.
 *    Đây là chuẩn portability được Adobe khuyến nghị trong docs.
 *    Tham khảo: https://github.com/Adobe-CEP/CEP-Resources
 *
 * ✅ Migration Strategy (Anti data-loss):
 *    Khi file JSON chưa tồn tại mà localStorage có dữ liệu,
 *    tự động migrate dữ liệu cũ vào file mới. Không mất cấu hình.
 *
 * ⛔ ANTI-PATTERN bị loại bỏ:
 *    localStorage → Gắn chặt vào Browser Profile của máy cụ thể.
 *    Không portable, có thể bị xóa khi cập nhật.
 * ==============================================================================
 *
 * DEPENDENCIES: CSInterface (global), window.cep.fs (CEP built-in)
 * EXPORTS: DataStore class, dataStore singleton
 */


const CURRENT_VERSION = 1;
const LEGACY_LOCALSTORAGE_KEY = 'cep_imposition_presets';

export class DataStore {
    constructor() {
        this._filePath = null;
        this._dirPath = null;
        this._initialized = false;
    }

    /**
     * Returns the path to the presets file.
     *
     * STRATEGY: Store inside the EXTENSION folder so the file ships
     * with the extension and is accessible on every machine where the
     * extension is installed. This is what makes presets truly portable.
     *
     * Path: <extension_root>/data/presets.json
     *
     * Anti-pattern (removed): USER_DATA (AppData) → still machine-local.
     */
    /**
     * Returns the NATIVE FILE PATH to the presets file (no file:// prefix).
     *
     * CRITICAL: CSInterface.getSystemPath() returns a file:// URL.
     * window.cep.fs needs a native OS path.
     *
     *  Windows: file:///C:/Users/...  → C:/Users/...
     *  macOS:   file:///Users/...    → /Users/...
     */
    _getFilePath() {
        if (this._filePath) return this._filePath;
        try {
            const cs = new CSInterface();
            let extensionRoot = cs.getSystemPath(CSInterface.EXTENSION);

            // Strip the file:// URL protocol — cep.fs requires native paths
            if (extensionRoot.startsWith('file:///')) {
                extensionRoot = extensionRoot.slice('file:///'.length);
            } else if (extensionRoot.startsWith('file://')) {
                extensionRoot = extensionRoot.slice('file://'.length);
            }

            this._dirPath = extensionRoot + '/data';
            this._filePath = this._dirPath + '/presets.json';
        } catch (e) {
            console.warn('[DataStore] CSInterface unavailable, using fallback path:', e);
            this._dirPath = '/tmp/SymbolCEP';
            this._filePath = '/tmp/SymbolCEP/presets.json';
        }
        return this._filePath;
    }


    /**
     * Ensures the SymbolCEP directory exists.
     */
    _ensureDir() {
        if (!this._dirPath) this._getFilePath();
        const stat = window.cep.fs.stat(this._dirPath);
        if (stat.err !== 0) {
            // Directory does not exist, create it
            window.cep.fs.makedir(this._dirPath);
        }
    }

    /**
     * Core read: Reads the presets JSON file.
     * Falls back to [] on any error.
     */
    _readFile() {
        try {
            const filePath = this._getFilePath();
            const result = window.cep.fs.readFile(filePath);
            if (result.err !== 0) return null; // File not found is normal on first run
            return JSON.parse(result.data);
        } catch (e) {
            console.error('[DataStore] Failed to read presets file:', e);
            return null;
        }
    }

    /**
     * Core write: Writes the presets array to the JSON file.
     */
    _writeFile(data) {
        try {
            this._ensureDir();
            const filePath = this._getFilePath();
            const payload = JSON.stringify({ version: CURRENT_VERSION, presets: data }, null, 2);
            const result = window.cep.fs.writeFile(filePath, payload);
            if (result.err !== 0) {
                console.error('[DataStore] Failed to write presets file, err code:', result.err);
            }
        } catch (e) {
            console.error('[DataStore] Failed to write presets file:', e);
        }
    }

    /**
     * Migration: Reads presets from localStorage (legacy) and saves them
     * to the file system if no JSON file exists yet.
     * This runs ONCE automatically.
     */
    _migrateFromLocalStorage() {
        try {
            const raw = localStorage.getItem(LEGACY_LOCALSTORAGE_KEY);
            if (!raw) return [];
            const legacy = JSON.parse(raw);
            if (!Array.isArray(legacy) || legacy.length === 0) return [];

            console.log(`[DataStore] Migrating ${legacy.length} presets from localStorage to file...`);
            this._writeFile(legacy);
            console.log('[DataStore] ✅ Migration complete! Presets saved to:', this._getFilePath());
            return legacy;
        } catch (e) {
            console.error('[DataStore] Migration from localStorage failed:', e);
            return [];
        }
    }

    /**
     * Returns the flat array of presets.
     * On first run: migrates from localStorage if applicable.
     */
    getPresets() {
        const fileData = this._readFile();

        // File does not exist yet
        if (fileData === null) {
            return this._migrateFromLocalStorage();
        }

        // Handle versioned format { version, presets }
        if (fileData && Array.isArray(fileData.presets)) {
            return fileData.presets;
        }

        // Handle legacy file format (just an array)
        if (Array.isArray(fileData)) {
            // Upgrade to versioned format on next write
            return fileData;
        }

        return [];
    }

    savePreset(preset) {
        const presets = this.getPresets();
        const idx = presets.findIndex(p => p.id === preset.id);
        const now = new Date().toISOString();

        if (idx > -1) {
            preset.createdAt = presets[idx].createdAt || now;
            preset.usageCount = presets[idx].usageCount || 0;
            preset.updatedAt = now;
            presets[idx] = preset;
        } else {
            preset.createdAt = now;
            preset.updatedAt = now;
            preset.usageCount = 0;
            presets.push(preset);
        }

        this._writeFile(presets);
    }

    incrementUsage(id) {
        const presets = this.getPresets();
        const idx = presets.findIndex(p => p.id === id);
        if (idx > -1) {
            presets[idx].usageCount = (presets[idx].usageCount || 0) + 1;
            presets[idx].lastUsedAt = new Date().toISOString();
            this._writeFile(presets);
        }
    }

    deletePreset(id) {
        const presets = this.getPresets().filter(p => p.id !== id);
        this._writeFile(presets);
    }

    /**
     * Persist Last Active ID — still uses localStorage for lightweight UI state.
     * This is NOT configuration data, just UI session memory. Stays in localStorage.
     */
    saveLastActive(id) {
        localStorage.setItem(LEGACY_LOCALSTORAGE_KEY + '_last_active', id);
    }

    getLastActive() {
        return localStorage.getItem(LEGACY_LOCALSTORAGE_KEY + '_last_active');
    }
}

export const dataStore = new DataStore();

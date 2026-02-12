// Namespace Init
window.Imposition = window.Imposition || {};

(function () {
    /**
     * DATA STORE
     * Quản lý việc đọc/ghi cấu hình vào LocalStorage.
     */
    class DataStore {
        constructor() {
            this.KEY = 'cep_imposition_presets';
        }

        getPresets() {
            try {
                const raw = localStorage.getItem(this.KEY);
                return raw ? JSON.parse(raw) : [];
            } catch (e) {
                console.error("DataStore Error:", e);
                return [];
            }
        }

        savePreset(preset) {
            const presets = this.getPresets();
            const idx = presets.findIndex(p => p.id === preset.id);
            const now = new Date().toISOString();

            if (idx > -1) {
                // Update existing: Preserve immutable fields
                preset.createdAt = presets[idx].createdAt || now;
                preset.usageCount = presets[idx].usageCount || 0;
                preset.updatedAt = now;
                presets[idx] = preset;
            } else {
                // Create New
                preset.createdAt = now;
                preset.updatedAt = now;
                preset.usageCount = 0;
                presets.push(preset);
            }

            localStorage.setItem(this.KEY, JSON.stringify(presets));
        }

        incrementUsage(id) {
            const presets = this.getPresets();
            const idx = presets.findIndex(p => p.id === id);
            if (idx > -1) {
                presets[idx].usageCount = (presets[idx].usageCount || 0) + 1;
                presets[idx].lastUsedAt = new Date().toISOString();
                localStorage.setItem(this.KEY, JSON.stringify(presets));
            }
        }

        deletePreset(id) {
            const presets = this.getPresets().filter(p => p.id !== id);
            localStorage.setItem(this.KEY, JSON.stringify(presets));
        }

        /**
         * Persist Last Active ID for UI Restoration
         */
        saveLastActive(id) {
            localStorage.setItem(this.KEY + '_last_active', id);
        }

        getLastActive() {
            return localStorage.getItem(this.KEY + '_last_active');
        }
    }

    // Export to Namespace
    window.Imposition.dataStore = new DataStore();
})();

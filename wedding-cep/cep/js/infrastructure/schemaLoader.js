/**
 * MODULE: SchemaLoader
 * LAYER: Infrastructure
 * PURPOSE: Load Wedding Pro schema from local JSON through HostFacade
 * DEPENDENCIES: HostFacadeLike
 * SIDE EFFECTS: CEP host file reads
 * EXPORTS: SchemaLoader.load(), .getSync(), .clearCache()
 */

export const SchemaLoader = {
    _cache: null,

    /**
     * Load schema from JSON file via the injected HostFacade.
     * @returns {Promise<Object>} Schema object
     */
    async load({ hostFacade, host } = {}) {
        // Return cached if available
        if (this._cache) {

            return this._cache;
        }

        try {
            const resolvedHostFacade = hostFacade || host;
            if (!resolvedHostFacade) {
                throw new Error('HostFacade is required');
            }

            const { absolutePath, content: fileContent } = await resolvedHostFacade.readExtensionText('data/schema.json', {
                strategy: 'extendscript'
            });
            if (!fileContent) {
                throw new Error(`File not found: ${absolutePath}`);
            }

            // Parse JSON
            const schema = JSON.parse(fileContent);

            // Cache for future use
            this._cache = schema;



            return schema;

        } catch (error) {

            throw new Error('Không thể tải Schema: ' + error.message, { cause: error });
        }
    },

    /**
     * Get schema synchronously (must call load() first).
     * @returns {Object|null} Cached schema or null
     */
    getSync() {
        return this._cache;
    },

    /**
     * Clear cache to force reload.
     */
    clearCache() {
        this._cache = null;

    }
};

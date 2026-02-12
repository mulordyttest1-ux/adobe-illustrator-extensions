/**
 * MODULE: SchemaLoader
 * LAYER: Infrastructure
 * PURPOSE: Load Wedding Pro schema from local JSON via ExtendScript File I/O
 * DEPENDENCIES: CSInterface (CEP)
 * SIDE EFFECTS: ExtendScript eval (file read)
 * EXPORTS: SchemaLoader.load(), .getSync(), .clearCache()
 */

export const SchemaLoader = {
    _cache: null,

    /**
     * Load schema from JSON file using ExtendScript.
     * @returns {Promise<Object>} Schema object
     */
    async load() {
        // Return cached if available
        if (this._cache) {

            return this._cache;
        }

        try {
            // Use ExtendScript to read file (more reliable in CEP)
            const cs = new CSInterface();
            const extensionPath = cs.getSystemPath(CSInterface.EXTENSION);
            const schemaPath = extensionPath + '/data/schema.json';



            // Read file using ExtendScript File object
            const script = `
                (function() {
                    try {
                        var f = new File("${schemaPath}");
                        if (!f.exists) {
                            return JSON.stringify({_error: "File not found: " + f.fsName});
                        }
                        f.open('r');
                        var content = f.read();
                        f.close();
                        return content;
                    } catch(e) {
                        return JSON.stringify({_error: "Read error: " + e.message});
                    }
                })()
            `;

            const fileContent = await new Promise((resolve, reject) => {
                cs.evalScript(script, (result) => {
                    if (!result) {
                        reject(new Error('No result from ExtendScript'));
                    } else {
                        resolve(result);
                    }
                });
            });

            // Parse JSON
            const schema = JSON.parse(fileContent);

            // Check for error marker
            if (schema._error) {
                throw new Error(schema._error);
            }

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


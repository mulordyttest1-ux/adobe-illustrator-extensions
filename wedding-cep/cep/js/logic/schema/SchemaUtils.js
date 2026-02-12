/**
 * MODULE: SchemaUtils
 * LAYER: L2 Core Utilities
 * PURPOSE: Flatten nested schema for O(1) lookups and Provide Type definitions.
 * DEPENDENCIES: None
 */

export const SchemaUtils = {
    _typeMap: null,
    
    /**
     * Flatten user schema into a Map<Key, Type>
     * @param {Object} schema - The raw JSON schema
     * @returns {Map<string, string>} Map of fieldKey -> fieldType
     */
    flatten(schema) {
        const map = new Map();
        if (!schema || !schema.STRUCTURE) return map;

        const traverse = (items, prefix = '') => {
             if (!items) return;
             for (const item of items) {
                 // Explicit key (e.g. "ceremony.ten")
                 if (item.key) {
                     // Normalize key: remove prefix if it's already in the key?
                     // In schema.json, keys are like "ceremony.ten" or "ong" (inside pos1).
                     // But POS1 has prefix "pos1".
                     // Logic: If group has prefix, prepend it UNLESS key already contains dot?
                     // Let's check schema:
                     // Group POS1: prefix "pos1", item key "ong" -> "pos1.ong"
                     // Group CEREMONY: no prefix, item key "ceremony.ten" -> "ceremony.ten"
                     
                     let finalKey = item.key;
                     if (prefix && !item.key.includes('.')) {
                         finalKey = `${prefix}.${item.key}`;
                     }
                     
                     if (item.type) {
                         map.set(finalKey, item.type);
                     }
                 }
                 
                 // Recursive (unlikely for this schema but good practice)
                 if (item.items) {
                     traverse(item.items, prefix); // Carry prefix? Or nested prefix?
                     // Current schema is flat groups.
                 }
             }
        };

        for (const group of schema.STRUCTURE) {
            traverse(group.items, group.prefix || '');
        }

        this._typeMap = map;
        return map;
    },

    /**
     * Get Semantic Type for a given key
     * @param {string} key - Full key (e.g. "pos1.ong", "ceremony.ten")
     * @param {Object} [schema] - Optional schema to load if not cached (or use flattened cache)
     * @returns {string|null} Type string (e.g. "person_name") or null
     */
    getType(key, schema) {
        if (!this._typeMap && schema) {
            this.flatten(schema);
        }
        
        if (this._typeMap) {
            return this._typeMap.get(key) || null;
        }
        return null;
    }
};

/**
 * RULE: SchemaGapRule
 * PURPOSE: Detect form fields that have data but no corresponding key in the loaded schema.
 *          Self-computes the gap — does NOT rely on pre-passed context.missedKeys.
 * PHASE: 'render' (after UpdateAction writes to document)
 */
export class SchemaGapRule {
    /**
     * @param {Object} frame - Sentinel frame ({id:'__global__'}), not used for DOM inspection
     * @param {Object} context
     * @param {Object} context.formData    - Raw form data from CompactFormBuilder.getData()
     * @param {string[]} context.schemaKeys - All valid keys (base + derived) from _extractSchemaKeys()
     */
    validate(frame, context) {
        if (!context || !context.formData || !context.schemaKeys) return null;

        // UI-internal helper keys — never correspond to a schema template variable.
        // _idx   → select row index helpers (e.g. pos1.ong_idx)
        // _auto  → auto/lock checkbox state (e.g. ceremony.ten_auto)
        const INTERNAL_SUFFIXES = ['_idx', '_auto'];

        const filledKeys = Object.entries(context.formData)
            .filter(([, val]) => val !== null && val !== undefined && String(val).trim() !== '')
            .map(([key]) => key)
            .filter(key => !INTERNAL_SUFFIXES.some(s => key.endsWith(s)));

        const schemaSet = new Set(context.schemaKeys);
        const orphanKeys = filledKeys.filter(k => !schemaSet.has(k));

        if (orphanKeys.length === 0) return null;

        return {
            type: 'warning',
            message: `Form có ${orphanKeys.length} trường không khớp Schema: ${orphanKeys.join(', ')}`,
            highlight: orphanKeys[0],
            frameId: frame?.id || null
        };
    }
}

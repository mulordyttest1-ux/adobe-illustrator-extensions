/**
 * MODULE: ConflictResolver
 * LAYER: Logic/Domain
 * PURPOSE: Resolve data conflicts from multiple sources using voting
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: ConflictResolver.resolve()
 */

export const ConflictResolver = {
    /**
     * Phân xử xung đột từ nhiều nguồn dữ liệu.
     * @param {Object} candidatesMap - Map { key: [values...] }
     * @returns {Object} { updates: {key: value}, conflicts: {key: [values]} }
     */
    resolve(candidatesMap) {
        const result = {
            updates: {},
            conflicts: {}
        };

        for (const [key, rawValues] of Object.entries(candidatesMap)) {
            if (!rawValues || rawValues.length === 0) continue;

            // Unique filter
            const uniqueValues = [...new Set(rawValues)];

            // Voting: If only 1 unique value -> safe to update
            if (uniqueValues.length === 1) {
                result.updates[key] = uniqueValues[0];
            } else {
                result.conflicts[key] = uniqueValues;
            }
        }

        return result;
    }
};


/**
 * MODULE: DataValidator
 * LAYER: Logic/Pipeline
 * PURPOSE: Parse stateless markers, classify healthy/broken items, heal broken via consensus
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: new DataValidator(), .analyze(), .heal()
 */

export class DataValidator {
    constructor() {
        this.markerRegex = /\u200B([\s\S]*?)\u200B/g;

    }

    /**
     * Analyze raw scan results from JSX.
     * @param {Array} rawItems - [{id, raw_content, meta_keys}]
     * @returns {Object} { healthyMap, brokenList }
     */
    analyze(rawItems) {
        const healthyMap = {};
        const brokenList = [];

        if (!Array.isArray(rawItems)) return { healthyMap, brokenList };

        rawItems.forEach(item => {
            const values = this._extractValues(item.raw_content);
            const keys = item.meta_keys || [];

            // VALIDATION: Structure Match?
            if (values.length === keys.length) {
                // HEALTHY: Map keys to values
                keys.forEach((key, index) => {
                    healthyMap[key] = values[index];
                });
            } else {
                // BROKEN: Add to list for recovery
                brokenList.push({
                    id: item.id,
                    content: item.raw_content,
                    expectedKeys: keys,
                    foundValues: values,
                    error: `Mismatch: Expected ${keys.length} keys, found ${values.length} markers.`
                });
            }
        });

        return { healthyMap, brokenList };
    }

    /**
     * Extract values between markers.
     * @param {string} content 
     * @returns {Array} List of values
     */
    _extractValues(content) {
        const results = [];
        if (!content) return results;

        let match;
        // Reset lastIndex because regex is global
        this.markerRegex.lastIndex = 0;

        while ((match = this.markerRegex.exec(content)) !== null) {
            results.push(match[1]); // Capture group 1 is the content inside
        }
        return results;
    }

    /**
     * Try to heal broken items using Consensus from Healthy Map.
     * @param {Array} brokenList 
     * @param {Object} healthyMap 
     * @returns {Array} Fixed items ready for injection
     */
    heal(brokenList, healthyMap) {
        // Simple Consensus: If we have the key in Healthy Map, usage it to fix the broken item.
        // This assumes "Source of Truth" is the majority/healthy set.
        const fixes = [];

        brokenList.forEach(item => {
            const reconstructedValues = [];
            let canFix = true;

            item.expectedKeys.forEach(key => {
                if (Object.prototype.hasOwnProperty.call(healthyMap, key)) {
                    reconstructedValues.push(healthyMap[key]);
                } else {
                    canFix = false; // Missing data in healthy map too
                }
            });

            if (canFix) {
                fixes.push({
                    id: item.id,
                    img_mode: false, // Text replacement
                    values: reconstructedValues, // Pass array of values
                    keys: item.expectedKeys // Pass keys to help reconstruction
                });
            }
        });

        return fixes;
    }
}


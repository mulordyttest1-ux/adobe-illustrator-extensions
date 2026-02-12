/**
 * MODULE: FreshStrategy
 * LAYER: Logic/Strategies
 * PURPOSE: Analyze fresh text frames (no metadata) — scan placeholders and create initial metadata
 * DEPENDENCIES: None
 * SIDE EFFECTS: None (pure)
 * EXPORTS: FreshStrategy.analyze()
 */

const REGEX_PLACEHOLDER = /\{([\w.]+)\}/g;

export class FreshStrategy {
    /**
     * Analyze a fresh item (no existing metadata)
     * @param {string} content - Current text content
     * @param {Object} packet - New data packet
     * @param {Object} meta - Existing metadata (should be null/empty for fresh)
     * @param {Object} constants - Config constants (CHARS, TOKENS)
     * @returns {Object|null} Plan object or null if not applicable
     */
    static analyze(content, packet, meta, constants = {}) {
        // Gatekeeper: Only process items WITHOUT existing metadata
        // If it has keys, it's definitely NOT fresh.
        if (meta && meta.keys && meta.keys.length > 0) return null;
        // Legacy check
        if (meta && meta.mappings && meta.mappings.length > 0) return null;
        if (!content || content.length < 2) return null;

        const GHOST = constants.CHARS?.GHOST || '\u200B';

        // A. Scan placeholders
        const placeholders = this._scanPlaceholders(content, packet, GHOST);

        // B. Merge (no keyword scan in ES6 version for simplicity)
        if (placeholders.length === 0) return null;

        // C. Build Meta Keys (Stateless)
        const keys = [];
        const seenKeys = {};

        // Sort by position
        placeholders.sort((a, b) => a.start - b.start);

        for (const r of placeholders) {
            if (r.key && !seenKeys[r.key]) {
                keys.push(r.key); // Only save the key name
                seenKeys[r.key] = true;
            }
        }

        // D. Build Execution List (reverse sort for safe replacement)
        const execList = [...placeholders].sort((a, b) => b.start - a.start);

        return {
            mode: 'ATOMIC',
            replacements: execList,
            meta: { type: 'stateful', keys: keys, mappings: [] }
        };
    }

    static _scanPlaceholders(content, packet, ghostChar) {
        const results = [];
        REGEX_PLACEHOLDER.lastIndex = 0;
        let match;

        while ((match = REGEX_PLACEHOLDER.exec(content)) !== null) {
            const rawKey = match[1];

            // [FIX] Tạo replacement cho TẤT CẢ placeholders, không chỉ những key có trong packet
            // Điều này cho phép inject markers vào AI file để sau này update được
            // Nếu packet không có value → dùng empty string (vẫn có marker bọc)
            let val = '';
            if (Object.prototype.hasOwnProperty.call(packet, rawKey)) {
                val = String(packet[rawKey] || '');
            }

            // [STATELESS MARKER]: Wrap value in markers
            // Standard: \u200B{content}\u200B
            const wrappedVal = ghostChar + val + ghostChar;

            results.push({
                start: match.index,
                end: match.index + match[0].length,
                val: wrappedVal,
                key: rawKey,
                priority: 1
            });
        }
        return results;
    }
}


/**
 * MODULE: StrategyOrchestrator
 * LAYER: Logic/Strategies
 * PURPOSE: Orchestrate strategy selection per text frame (SmartComplex → Fresh) and metadata encoding
 * DEPENDENCIES: SmartComplexStrategy, FreshStrategy (implicit globals)
 * SIDE EFFECTS: None (pure)
 * EXPORTS: new StrategyOrchestrator(), .analyze(), .analyzeBatch(), .encodeMetadata(), .decodeMetadata()
 */

export class StrategyOrchestrator {
    constructor(constants = {}) {
        this.constants = {
            CHARS: {
                GHOST: '\u200B',
                CR: '\r',
                LF: '\n',
                NBSP: '\u00A0'
            },
            TOKENS: {
                NEWLINE: '###META_NEWLINE###',
                GHOST: '###META_GHOST###'
            },
            ...constants
        };
    }

    /**
     * Analyze a TextFrame and return execution plan
     * @param {string} content - Current text content of the frame
     * @param {Object} metadata - Existing metadata (null if fresh)
     * @param {Object} packet - New data to apply
     * @returns {Object} Plan { mode, replacements?, content?, meta? }
     */
    analyze(content, metadata, packet) {
        // Validate inputs
        if (!content || typeof content !== 'string') {
            return { mode: 'SKIP', reason: 'EMPTY_CONTENT' };
        }
        if (!packet || typeof packet !== 'object') {
            return { mode: 'SKIP', reason: 'NO_PACKET' };
        }

        let plan;



        // Strategy 2: SmartComplex (stateful items with mappings)
        if (typeof SmartComplexStrategy !== 'undefined') {
            plan = SmartComplexStrategy.analyze(content, packet, metadata, this.constants);
            if (plan) {
                plan.strategy = 'SmartComplex';
                return plan;
            }
        }

        // Strategy 3: Fresh (new items without metadata)
        if (typeof FreshStrategy !== 'undefined') {
            plan = FreshStrategy.analyze(content, packet, metadata, this.constants);
            if (plan) {
                plan.strategy = 'Fresh';
                return plan;
            }
        }

        // No strategy matched
        return { mode: 'SKIP', reason: 'NO_STRATEGY_MATCH' };
    }

    /**
     * Batch analyze multiple frames
     * @param {Array} frames - Array of { id, content, metadata }
     * @param {Object} packet - New data to apply
     * @returns {Array} Array of { id, plan }
     */
    analyzeBatch(frames, packet) {
        const results = [];

        for (const frame of frames) {
            const plan = this.analyze(frame.content, frame.metadata, packet);
            results.push({
                id: frame.id,
                plan
            });
        }

        return results;
    }

    /**
     * Encode metadata for storage in item.note
     */
    encodeMetadata(meta) {
        if (!meta) return '';

        // Encode special characters
        const encoded = JSON.parse(JSON.stringify(meta));
        if (encoded.mappings) {
            for (const m of encoded.mappings) {
                if (m.val) {
                    m.val = m.val
                        .replace(/\r/g, this.constants.TOKENS.NEWLINE)
                        .replace(new RegExp(this.constants.CHARS.GHOST, 'g'), this.constants.TOKENS.GHOST);
                }
            }
        }

        return JSON.stringify(encoded);
    }

    /**
     * Decode metadata from item.note
     */
    decodeMetadata(noteStr) {
        if (!noteStr) return null;

        try {
            const meta = JSON.parse(noteStr);
            if (meta && meta.mappings) {
                for (const m of meta.mappings) {
                    if (m.val) {
                        m.val = m.val
                            .replace(new RegExp(this.constants.TOKENS.NEWLINE, 'g'), '\r')
                            .replace(new RegExp(this.constants.TOKENS.GHOST, 'g'), this.constants.CHARS.GHOST);
                    }
                }
            }
            return meta;
        } catch {
            return null;
        }
    }
}


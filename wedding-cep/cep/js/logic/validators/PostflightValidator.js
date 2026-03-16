import { LeftoverMarkerRule } from './rules/LeftoverMarkerRule.js';
import { SchemaGapRule } from './rules/SchemaGapRule.js';
import { SuspiciousDataRule } from './rules/SuspiciousDataRule.js';
import { EmptyOverrideRule } from './rules/EmptyOverrideRule.js';
import { TruncationRule } from './rules/TruncationRule.js';

/**
 * MODULE: PostflightValidator
 * PURPOSE: Rule-chain engine for post-render validation.
 *
 * ARCHITECTURE NOTE:
 *   - affectedFrames: frames that were actually written by Bridge (for EmptyOverride, Truncation)
 *   - allFrames:      ALL frames fetched from document (for LeftoverMarker, SuspiciousData)
 *   - context:        { formData, schemaKeys, allFrameTexts, phase, missedKeys? }
 *
 * To add a new rule: import it above and add to the appropriate rule bucket below.
 */
export class PostflightValidator {
    constructor() {
        // Rules that run on ALL document frames (broad scan)
        this._allFrameRules = [
            new LeftoverMarkerRule(),
            new SuspiciousDataRule()
        ];

        // Rules that only run on frames that were actually written/affected
        this._affectedFrameRules = [
            new EmptyOverrideRule(),
            new TruncationRule()
        ];

        // Global context rules — run once with a sentinel frame (not per-frame)
        this._globalRules = [
            new SchemaGapRule()
        ];
    }

    /**
     * @param {Array} affectedFrames - Frames written by Bridge during update
     * @param {Array} allFrames      - All frames in selection/document (for broad scan)
     * @param {Object} validationContext - { formData, schemaKeys, allFrameTexts, phase }
     */
    inspect(affectedFrames = [], allFrames = [], validationContext = {}) {
        const errors = [];
        const warnings = [];

        const acc = { errors, warnings };

        // 1. Run broad scan rules on ALL frames
        for (const frame of allFrames) {
            this._runRules(this._allFrameRules, frame, validationContext, acc);
        }

        // 2. Run affected-only rules on frames that were changed
        for (const frame of affectedFrames) {
            this._runRules(this._affectedFrameRules, frame, validationContext, acc);
        }

        // 3. Run global context rules once via sentinel frame
        if (allFrames.length > 0) {
            this._runRules(this._globalRules, { id: '__global__' }, {
                ...validationContext,
                allFrameTexts: allFrames.map(f => f.text || '')
            }, acc);
        }

        return {
            errors: this._deduplicate(errors),
            warnings: this._deduplicate(warnings)
        };
    }

    _runRules(rules, frame, context, accumulator) {
        for (const rule of rules) {
            try {
                const result = rule.validate(frame, context);
                if (!result) continue;
                if (result.type === 'error') accumulator.errors.push(result);
                if (result.type === 'warning') accumulator.warnings.push(result);
            } catch (e) {
                console.error(`[PostflightValidator] Rule error on frame ${frame.id}:`, e);
            }
        }
    }

    _deduplicate(list) {
        const seen = new Set();
        return list.filter(item => {
            if (seen.has(item.message)) return false;
            seen.add(item.message);
            return true;
        });
    }
}

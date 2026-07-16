/**
 * MODULE: SmartComplexStrategy
 * LAYER: Logic/Strategies
 * PURPOSE: Analyze text frames with existing metadata for marker-based replacement.
 * DEPENDENCIES: StatefulMarkerCodec
 * SIDE EFFECTS: None (pure)
 * EXPORTS: SmartComplexStrategy.analyze()
 */

import { StatefulMarkerCodec } from '../pipeline/StatefulMarkerCodec.js';
import {
    createAbsoluteStylesForMarkerMatch,
    createFullResetRange,
    createReplacementStyles,
    hasStyleOperations,
    normalizeStyledValueForKey
} from './textStylePlanner.js';

function normalizePacketValue(key, value, marker) {
    return StatefulMarkerCodec.sanitizeValue(normalizeStyledValueForKey(key, value), marker)
        .replace(/\r\n/g, '\n')
        .replace(/\r/g, '\n');
}

export class SmartComplexStrategy {
    static analyze(content, packet, meta, constants = {}) {
        if (!meta) return null;

        const keys = StatefulMarkerCodec.getMetadataKeys(meta);
        if (!keys || keys.length === 0) return null;
        if (!content) return null;

        const GHOST = constants.CHARS?.GHOST || StatefulMarkerCodec.MARKER;
        const matches = StatefulMarkerCodec.extractMatches(content, GHOST);

        if (matches.length === 0) {
            return this._handleRecovery(content, packet, keys, GHOST);
        }

        if (matches.length !== keys.length) {
            return this._handleValidation(content, packet, keys, GHOST);
        }

        return this._calculateAtomic(packet, keys, matches, GHOST);
    }

    static _handleRecovery(content, packet, keys, GHOST) {
        if (keys.length === 1) {
            const key = keys[0];
            const sourceValue = Object.prototype.hasOwnProperty.call(packet, key) ? packet[key] : content;
            const newVal = normalizePacketValue(key, sourceValue, GHOST);
            const styleRanges = createReplacementStyles(key, newVal, 0);

            return {
                mode: 'DIRECT',
                content: newVal,
                resetRanges: createFullResetRange(0, newVal.length),
                styleRanges,
                meta: StatefulMarkerCodec.createMetadata(keys)
            };
        }
        return { mode: 'SKIP', reason: 'NO_MARKERS_FOUND' };
    }

    static _handleValidation(content, packet, keys, GHOST) {
        if (keys.length === 1) {
            const key = keys[0];
            const sourceValue = Object.prototype.hasOwnProperty.call(packet, key) ? packet[key] : content;
            const newVal = normalizePacketValue(key, sourceValue, GHOST);
            const styleRanges = createReplacementStyles(key, newVal, 0);

            return {
                mode: 'DIRECT',
                content: newVal,
                resetRanges: createFullResetRange(0, newVal.length),
                styleRanges,
                meta: StatefulMarkerCodec.createMetadata(keys)
            };
        }
        return { mode: 'SKIP', error: 'STRUCTURE_MISMATCH' };
    }

    static _calculateAtomic(packet, keys, matches, GHOST) {
        const replacements = [];
        const resetRanges = [];
        const styleRanges = [];
        let hasChanges = false;
        let hasStyles = false;

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const currentVal = matches[i].inner;
            const sourceValue = Object.prototype.hasOwnProperty.call(packet, key) ? packet[key] : currentVal;
            const newVal = normalizePacketValue(key, sourceValue, GHOST);

            if (newVal !== currentVal) {
                const styles = createReplacementStyles(key, newVal, GHOST.length);
                const replacement = {
                    start: matches[i].start,
                    end: matches[i].end,
                    val: StatefulMarkerCodec.wrap(newVal, GHOST)
                };

                if (styles.length > 0) {
                    replacement.styles = styles;
                    hasStyles = true;
                }

                replacements.push(replacement);
                hasChanges = true;
            } else {
                const styles = createAbsoluteStylesForMarkerMatch(key, currentVal, matches[i], GHOST);
                if (hasStyleOperations(styles)) {
                    resetRanges.push(...styles.resetRanges);
                    styleRanges.push(...styles.styleRanges);
                    hasStyles = true;
                }
            }
        }

        if (!hasChanges) {
            if (hasStyles) {
                return {
                    mode: 'STYLE',
                    resetRanges,
                    styleRanges,
                    meta: StatefulMarkerCodec.createMetadata(keys)
                };
            }
            return { mode: 'SKIP', meta: StatefulMarkerCodec.createMetadata(keys) };
        }

        replacements.sort((a, b) => b.start - a.start);

        const plan = {
            mode: 'ATOMIC',
            replacements,
            meta: StatefulMarkerCodec.createMetadata(keys)
        };

        if (resetRanges.length > 0) {
            plan.resetRanges = resetRanges;
        }
        if (styleRanges.length > 0) {
            plan.styleRanges = styleRanges;
        }

        return plan;
    }
}

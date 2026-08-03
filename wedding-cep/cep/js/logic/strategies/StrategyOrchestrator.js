/**
 * MODULE: StrategyOrchestrator
 * LAYER: Logic/Strategies
 * PURPOSE: Select a strategy and build executable frame plans.
 * DEPENDENCIES: SmartComplexStrategy, FreshStrategy.
 * SIDE EFFECTS: None (pure).
 * EXPORTS: new StrategyOrchestrator(), .analyze(), .planFrames().
 */
import { FreshStrategy } from './FreshStrategy.js';
import { SmartComplexStrategy } from './SmartComplexStrategy.js';
import { StatefulMarkerCodec } from '../pipeline/StatefulMarkerCodec.js';

export class StrategyOrchestrator {
    constructor(constants = {}) {
        this.constants = {
            ...constants,
            CHARS: {
                GHOST: StatefulMarkerCodec.MARKER,
                ...(constants.CHARS || {})
            }
        };
    }

    /**
     * Analyze one text frame and return an execution plan.
     * @param {string} content
     * @param {Object|null} metadata
     * @param {Object} packet
     * @returns {Object}
     */
    analyze(content, metadata, packet) {
        if (!content || typeof content !== 'string') {
            return { mode: 'SKIP', reason: 'EMPTY_CONTENT' };
        }
        if (!packet || typeof packet !== 'object') {
            return { mode: 'SKIP', reason: 'NO_PACKET' };
        }

        const smartPlan = SmartComplexStrategy.analyze(content, packet, metadata, this.constants);
        if (smartPlan) {
            smartPlan.strategy = 'SmartComplex';
            return smartPlan;
        }

        const freshPlan = FreshStrategy.analyze(content, packet, metadata, this.constants);
        if (freshPlan) {
            freshPlan.strategy = 'Fresh';
            return freshPlan;
        }

        return { mode: 'SKIP', reason: 'NO_STRATEGY_MATCH' };
    }

    /**
     * Build executable plans directly from collected frame records.
     * Frame normalization stays inside the strategy context.
     * @param {Array} frames
     * @param {Object} packet
     * @returns {Array}
     */
    planFrames(frames, packet) {
        const plans = [];

        for (const frame of frames || []) {
            const plan = this.analyze(
                this._getFrameContent(frame),
                this._buildFrameMetadata(frame),
                packet
            );
            if (plan && plan.mode !== 'SKIP') {
                plans.push({
                    id: frame.id,
                    plan
                });
            }
        }

        return plans;
    }

    _getFrameContent(frame) {
        return frame?.raw_content || frame?.content || '';
    }

    _buildFrameMetadata(frame) {
        if (frame?.meta_keys && frame.meta_keys.length > 0) {
            return StatefulMarkerCodec.createMetadata(frame.meta_keys);
        }

        return null;
    }
}

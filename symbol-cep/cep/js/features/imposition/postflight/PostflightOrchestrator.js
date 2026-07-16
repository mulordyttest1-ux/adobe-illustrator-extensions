/**
 * MODULE: PostflightOrchestrator
 * LAYER: Application (L3)
 * PURPOSE: Coordinate post-execution tasks (metadata, reports, cleanup).
 * DEPENDENCIES: Registered Rule Plugins
 * EXPORTS: PostflightOrchestrator class, normalizeResultData
 */

function normalizeFinishSize(finishSize) {
    const safeFinishSize = finishSize || {};
    const width = safeFinishSize.width !== undefined ? safeFinishSize.width : safeFinishSize.w;
    const height = safeFinishSize.height !== undefined ? safeFinishSize.height : safeFinishSize.h;

    return {
        ...safeFinishSize,
        width: width !== undefined ? width : '?',
        height: height !== undefined ? height : '?'
    };
}

export function normalizeResultData(resultData) {
    const safeResultData = resultData || {};

    return {
        ...safeResultData,
        finishSize: normalizeFinishSize(safeResultData.finishSize)
    };
}

function getRuleName(rule) {
    if (rule && rule.name) return rule.name;
    if (rule && rule.constructor && rule.constructor.name) return rule.constructor.name;
    return 'AnonymousPostflightRule';
}

function normalizeRuleOutcome(rule, result) {
    const ruleName = getRuleName(rule);
    if (!result || typeof result !== 'object') {
        return {
            rule: ruleName,
            status: 'success'
        };
    }

    return {
        rule: ruleName,
        status: result.status || 'success',
        reason: result.reason || null,
        error: result.error || null,
        details: result.details || null
    };
}

export class PostflightOrchestrator {
    constructor() {
        this.rules = [];
    }

    /**
     * Register a postflight rule plugin
     * @param {Object} rule - Must have a run(deps) method
     */
    registerRule(rule) {
        if (typeof rule.run !== 'function') {
            throw new Error("Postflight Rule must implement a run() method.");
        }
        this.rules.push(rule);
    }

    /**
     * Run all registered postflight rules sequentially.
     * Errors in postflight should NOT halt the main experience but should be logged.
     * @param {Object} context - e.g., { bridge, resultData, preset }
     */
    async runAll(context) {
        const normalizedContext = {
            ...context,
            resultData: normalizeResultData(context && context.resultData)
        };
        const results = [];

        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];
            try {
                const result = await rule.run(normalizedContext);
                results.push(normalizeRuleOutcome(rule, result));
            } catch (err) {
                console.error(`[Postflight] Rule at index ${i} failed:`, err);
                results.push({
                    rule: getRuleName(rule),
                    status: 'failed',
                    reason: 'exception',
                    error: err && err.message ? err.message : String(err),
                    details: null
                });
            }
        }

        return {
            results,
            successCount: results.filter((item) => item.status === 'success').length,
            skippedCount: results.filter((item) => item.status === 'skipped').length,
            failedCount: results.filter((item) => item.status === 'failed').length
        };
    }
}

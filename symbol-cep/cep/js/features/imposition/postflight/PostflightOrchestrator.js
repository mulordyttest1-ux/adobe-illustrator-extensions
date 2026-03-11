/**
 * MODULE: PostflightOrchestrator
 * LAYER: Application (L3)
 * PURPOSE: Coordinate post-execution tasks (metadata, reports, cleanup).
 * DEPENDENCIES: Registered Rule Plugins
 * EXPORTS: PostflightOrchestrator class
 */

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
        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];
            try {
                await rule.run(context);
            } catch (err) {
                console.error(`[Postflight] Rule at index ${i} failed:`, err);
            }
        }
    }
}

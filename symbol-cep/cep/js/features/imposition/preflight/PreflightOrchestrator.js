/**
 * MODULE: PreflightOrchestrator
 * LAYER: Application (L3)
 * PURPOSE: Coordinate preflight checks before running imposition.
 * DEPENDENCIES: Registered Rule Plugins
 * SIDE EFFECTS: None directly, but rules may invoke DOM or Bridge
 * EXPORTS: PreflightOrchestrator class
 */

export class PreflightOrchestrator {
    constructor() {
        this.rules = [];
    }

    /**
     * Register a preflight rule plugin
     * @param {Object} rule - Must have a run(deps) method returning boolean
     */
    registerRule(rule) {
        if (typeof rule.run !== 'function') {
            throw new Error("Preflight Rule must implement a run() method.");
        }
        this.rules.push(rule);
    }

    /**
     * Run all registered preflight rules sequentially
     * @param {Object} dependencies - e.g., { bridge }
     * @returns {Promise<boolean>} true if safe to proceed, false to halt
     */
    async runAll(dependencies) {
        for (let i = 0; i < this.rules.length; i++) {
            const rule = this.rules[i];
            const isSafe = await rule.run(dependencies);
            if (!isSafe) {
                console.warn(`[Preflight] Halted by Rule at index ${i}`);
                return false; // Halt execution
            }
        }
        return true; // All rules passed
    }
}

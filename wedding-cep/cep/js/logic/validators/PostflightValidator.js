import { LeftoverMarkerRule } from './rules/LeftoverMarkerRule.js';
import { MissingFieldsRule } from './rules/MissingFieldsRule.js';
import { SuspiciousDataRule } from './rules/SuspiciousDataRule.js';

export class PostflightValidator {
    constructor() {
        // Băng chuyền các bộ lọc (Filters). Thêm rule mới vào đây.
        this.rules = [
            new LeftoverMarkerRule(),
            new MissingFieldsRule(),
            new SuspiciousDataRule()
        ];
    }

    inspect(frames, validationContext = {}) {
        const errors = [];
        const warnings = [];

        if (!frames || !Array.isArray(frames)) return { errors, warnings };

        for (const frame of frames) {
            this._runRulesOnFrame(frame, errors, warnings, validationContext);
        }

        // Deduplicate messages since rules like MissingFields run globally per frame
        const uniqueErrors = this._deduplicate(errors);
        const uniqueWarnings = this._deduplicate(warnings);

        return { errors: uniqueErrors, warnings: uniqueWarnings };
    }

    _deduplicate(list) {
        const seen = new Set();
        return list.filter(item => {
            const key = item.message;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    _runRulesOnFrame(frame, errors, warnings, validationContext) {
        for (const rule of this.rules) {
            try {
                const result = rule.validate(frame, validationContext);
                if (!result) continue;

                if (result.type === 'error') errors.push(result);
                if (result.type === 'warning') warnings.push(result);
            } catch (e) {
                console.error(`Postflight Validation Error on frame ${frame.id}:`, e);
            }
        }
    }
}

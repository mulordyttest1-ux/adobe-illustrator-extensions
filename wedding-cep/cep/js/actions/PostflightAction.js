import { PostflightValidator } from '../logic/validators/PostflightValidator.js';
import { ValidationReportWidget } from '../components/modules/ValidationReportWidget.js';

export const PostflightAction = {
    /**
     * Executes the post-flight validation and renders the report UI
     * @param {Object} ctx - Context object containing bridge
     * @param {Array} affectedFrames - Array of `{id, text}` from Bridge apply result
     * @param {Object} validationContext - Contains extra data like `{missedKeys}`
     */
    async execute(ctx, affectedFrames = [], validationContext = {}) {
        const validator = new PostflightValidator();

        // Tiến hành càn quét các frame bị ảnh hưởng qua Hệ thống luật Hậu kiểm (PostflightValidator)
        const report = validator.inspect(affectedFrames, validationContext);

        // Render UI
        ValidationReportWidget.show(report, ctx.bridge);

        return { success: true, report };
    }
};

/**
 * @shared/cep-ui - Shared UI primitives for CEP panels
 *
 * Import: import { UIFeedback } from '@shared/cep-ui'
 *
 * Available:
 *   UIFeedback.showToast(msg, type) -> toast notification
 *   UIFeedback.showLoading(container, msg) -> loading spinner
 *   UIFeedback.hideLoading() -> hide loading overlay
 *   UIFeedback.showError(container, msg, onRetry?) -> error state
 */
export { UIFeedback } from './UIFeedback.js';

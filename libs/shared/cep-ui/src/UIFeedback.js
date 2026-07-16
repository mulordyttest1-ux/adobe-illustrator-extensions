/**
 * MODULE: UIFeedback
 * LAYER: Shared UI (scope:shared)
 * PURPOSE: Single Source of Truth for ALL user-facing feedback (toast, loading, error).
 * DEPENDENCIES: None (pure DOM - zero app-specific coupling)
 * SIDE EFFECTS: DOM only (toast-container, loading-overlay, container element)
 * EXPORTS: UIFeedback.showToast(), .showLoading(), .hideLoading(), .showError()
 *
 * Shared library used by both symbol-cep and wedding-cep.
 * Import via: import { UIFeedback } from '@shared/cep-ui'
 *
 * DO:
 * - UIFeedback.showToast('message', 'success')
 * - UIFeedback.showToast('error text', 'error')
 * - UIFeedback.showToast('warning', 'warning')
 * - UIFeedback.showLoading(container, 'Đang xử lý...')
 * - UIFeedback.showError(container, 'Lỗi', onRetry)
 *
 * NEVER:
 * - alert() / confirm() / prompt()
 * - document.createElement('div') for notifications
 * - hardcode app-specific callbacks in this file
 *
 * Toast types: 'success' | 'error' | 'warning' | 'info'
 * Queuing: multiple calls are queued and shown sequentially (one at a time).
 * WCAG: role="status"/"alert", aria-live, dismiss button, focus pause built-in.
 */

export const UIFeedback = {
    _toastQueue: [],
    _isShowingToast: false,

    /**
     * Show loading state in a container.
     * @param {HTMLElement} container
     * @param {string} message
     */
    showLoading(container, message) {
        if (container) {
            container.innerHTML = `
                <div class="ds-flex-center ds-flex-col ds-p-lg ds-gap-md">
                    <div class="loading-spinner"></div>
                    <span class="ds-text-secondary">${message}</span>
                </div>
            `;
        }
    },

    /**
     * Hide the full-screen loading overlay.
     */
    hideLoading() {
        const splash = document.getElementById('loading-overlay');
        if (splash) {
            splash.style.opacity = '0';
            splash.style.transition = 'opacity 0.3s ease';
            setTimeout(() => { splash.style.display = 'none'; }, 300);
        }
    },

    /**
     * Show error state in a container.
     * @param {HTMLElement} container
     * @param {string} message
     * @param {Function|null} onRetry - App-specific retry callback (replaces WeddingProController coupling)
     */
    showError(container, message, onRetry = null) {
        if (!container) return;
        const retryBtn = onRetry
            ? `<div class="ds-mt-md">
                 <button class="ds-btn ds-btn-secondary" id="ui-feedback-retry-btn">Thử lại</button>
               </div>`
            : '';
        container.innerHTML = `
            <div class="ds-alert ds-alert-danger">
                <strong>Lỗi:</strong> ${message}
            </div>
            ${retryBtn}
        `;
        if (onRetry) {
            const btn = container.querySelector('#ui-feedback-retry-btn');
            if (btn) btn.addEventListener('click', onRetry);
        }
    },

    /**
     * Show toast notification (Queued, WCAG compliant).
     * @param {string} message
     * @param {'success'|'error'|'warning'|'info'} type
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        this._toastQueue.push({ message, type });
        this._processQueue(container);
    },

    _dismissToast(toast, container) {
        toast.classList.add('toast-hide');
        setTimeout(() => {
            if (toast.parentNode) toast.remove();
            this._isShowingToast = false;
            this._processQueue(container);
        }, 320);
    },

    _processQueue(container) {
        if (this._isShowingToast || this._toastQueue.length === 0) return;

        this._isShowingToast = true;
        const { message, type } = this._toastQueue.shift();

        container.innerHTML = '';

        const toast = document.createElement('div');
        const isUrgent = type === 'error' || type === 'warning';
        toast.setAttribute('role', isUrgent ? 'alert' : 'status');
        toast.setAttribute('aria-live', isUrgent ? 'assertive' : 'polite');
        toast.className = `toast toast-${type}`;

        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;
        toast.appendChild(msgSpan);

        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Đóng thông báo');
        closeBtn.className = 'toast-close';
        closeBtn.addEventListener('click', () => this._dismissToast(toast, container));
        toast.appendChild(closeBtn);

        container.appendChild(toast);

        const duration = isUrgent ? 5000 : 3000;
        const timer = setTimeout(() => this._dismissToast(toast, container), duration);

        toast.addEventListener('focusin', () => clearTimeout(timer));
        toast.addEventListener('focusout', () => {
            setTimeout(() => this._dismissToast(toast, container), 2000);
        });
    }
};

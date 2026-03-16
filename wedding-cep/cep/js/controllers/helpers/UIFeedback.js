/**
 * MODULE: UIFeedback
 * LAYER: Controller/Helpers
 * PURPOSE: Single Source of Truth for ALL user-facing feedback (toast, loading, error).
 * DEPENDENCIES: None (pure DOM)
 * SIDE EFFECTS: DOM only (toast-container, loading-overlay, container element)
 * EXPORTS: UIFeedback.showToast(), .showLoading(), .hideLoading(), .showError()
 *
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  ⚠️  AGENT & DEVELOPER CONVENTION CONTRACT  ⚠️                  ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  This is the ONLY approved UI feedback API in this project.     ║
 * ║                                                                  ║
 * ║  ✅ DO:  UIFeedback.showToast('message', 'success')              ║
 * ║  ✅ DO:  UIFeedback.showToast('error text', 'error')             ║
 * ║  ✅ DO:  UIFeedback.showToast('warning', 'warning')              ║
 * ║  ✅ DO:  UIFeedback.showLoading(container, 'Đang xử lý...')      ║
 * ║  ✅ DO:  UIFeedback.showError(container, 'Lỗi kết nối')          ║
 * ║                                                                  ║
 * ║  ❌ NEVER: alert() / confirm() / prompt()                        ║
 * ║  ❌ NEVER: document.createElement('div') for notifications       ║
 * ║  ❌ NEVER: window.showToast (removed, banned by ESLint)          ║
 * ║  ❌ NEVER: ctx.showToast (removed, banned by ESLint)             ║
 * ║  ❌ NEVER: inline style for error/loading states                 ║
 * ╚══════════════════════════════════════════════════════════════════╝
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
     * @param {HTMLElement} container - Container element
     * @param {string} message - Loading message
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
     * Tắt trạng thái Loading Overlay toàn màn hình (chuyển từ app.js)
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
     * @param {HTMLElement} container - Container element
     * @param {string} message - Error message
     */
    showError(container, message) {
        if (container) {
            container.innerHTML = `
                <div class="ds-alert ds-alert-danger">
                    <strong>Lỗi:</strong> ${message}
                </div>
                <div class="ds-mt-md">
                    <button class="ds-btn ds-btn-secondary" onclick="WeddingProController.init(WeddingProController.container)">
                        Thử lại
                    </button>
                </div>
            `;
        }
    },

    /**
     * Show toast notification (Queued, WCAG compliant).
     * @param {string} message - Toast message
     * @param {string} type - Toast type ('success', 'error', 'info', 'warning')
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

        // Replace strategy: clear any previous toast immediately so no overlap
        container.innerHTML = '';

        const toast = document.createElement('div');
        // WCAG: role="alert" (assertive) for errors/warnings; role="status" (polite) for others
        const isUrgent = type === 'error' || type === 'warning';
        toast.setAttribute('role', isUrgent ? 'alert' : 'status');
        toast.setAttribute('aria-live', isUrgent ? 'assertive' : 'polite');
        toast.className = `toast toast-${type}`;

        // Message text
        const msgSpan = document.createElement('span');
        msgSpan.textContent = message;
        toast.appendChild(msgSpan);

        // WCAG 2.2.1: Dismiss button — user must be able to close the toast manually
        const closeBtn = document.createElement('button');
        closeBtn.textContent = '×';
        closeBtn.setAttribute('aria-label', 'Đóng thông báo');
        closeBtn.className = 'toast-close';
        closeBtn.addEventListener('click', () => this._dismissToast(toast, container));
        toast.appendChild(closeBtn);

        container.appendChild(toast);

        // Accessible timeout: 5s for error/warning, 3s for success/info
        const duration = isUrgent ? 5000 : 3000;
        const timer = setTimeout(() => this._dismissToast(toast, container), duration);

        // Pause auto-dismiss on keyboard focus (WCAG 2.2)
        toast.addEventListener('focusin', () => clearTimeout(timer));
        toast.addEventListener('focusout', () => {
            setTimeout(() => this._dismissToast(toast, container), 2000);
        });
    }
};


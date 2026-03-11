/**
 * MODULE: UIFeedback
 * LAYER: Controller/Helpers
 * PURPOSE: Show loading, error, and toast feedback in the UI
 * DEPENDENCIES: None
 * SIDE EFFECTS: DOM (innerHTML, element creation)
 * EXPORTS: UIFeedback.showLoading(), .showError(), .showToast()
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
     * Show toast notification (Queued).
     * @param {string} message - Toast message
     * @param {string} type - Toast type ('success', 'error', 'info', 'warning')
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        this._toastQueue.push({ message, type });
        this._processQueue(container);
    },

    _processQueue(container) {
        if (this._isShowingToast || this._toastQueue.length === 0) return;

        this._isShowingToast = true;
        const currentToast = this._toastQueue.shift();

        const toast = document.createElement('div');
        toast.className = `toast toast-${currentToast.type}`;
        toast.textContent = currentToast.message;

        container.appendChild(toast);

        // C1 Best Practice: Accessible timeouts
        const duration = (currentToast.type === 'error' || currentToast.type === 'warning') ? 5000 : 3000;

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => {
                toast.remove();
                this._isShowingToast = false;
                this._processQueue(container);
            }, 300); // Đợi CSS transition fade out
        }, duration);
    }
};


/**
 * MODULE: UIFeedback
 * LAYER: Controller/Helpers
 * PURPOSE: Show loading, error, and toast feedback in the UI
 * DEPENDENCIES: None
 * SIDE EFFECTS: DOM (innerHTML, element creation)
 * EXPORTS: UIFeedback.showLoading(), .showError(), .showToast()
 */

export const UIFeedback = {
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
     * Show toast notification.
     * @param {string} message - Toast message
     * @param {string} type - Toast type ('success', 'error', 'info')
     */
    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
};


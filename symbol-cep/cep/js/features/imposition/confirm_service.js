function getFocusableElements(root) {
    if (!root) return [];

    return Array.from(
        root.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
    ).filter((element) => {
        if (!element) return false;
        if (element.disabled) return false;
        if (element.getAttribute('aria-hidden') === 'true') return false;
        return element.offsetParent !== null;
    });
}

function isElementNode(node) {
    return !!node && node.nodeType === 1;
}

function getEventElementTarget(event) {
    if (!event || !event.target) return null;
    if (isElementNode(event.target)) return event.target;
    if (event.target.parentElement) return event.target.parentElement;
    return null;
}

function closestSafe(element, selector) {
    if (!element || typeof element.closest !== 'function') return null;
    return element.closest(selector);
}

function normalizeOptions(options) {
    const safe = options || {};

    return {
        title: safe.title || 'X\u00e1c nh\u1eadn thao t\u00e1c',
        message: safe.message || '',
        confirmLabel: safe.confirmLabel || 'X\u00e1c nh\u1eadn',
        cancelLabel: safe.cancelLabel || 'H\u1ee7y',
        dismissLabel: safe.dismissLabel || '',
        tone: safe.tone === 'danger' ? 'danger' : 'default',
        leastDestructive: safe.leastDestructive || (safe.dismissLabel ? 'dismiss' : 'cancel'),
        returnFocus: safe.returnFocus || null
    };
}

export const ConfirmService = {
    _state: null,
    _root: null,
    _keydownBound: false,

    _getOverlay() {
        return this._root ? this._root.querySelector('#confirm-service-overlay') : null;
    },

    _showOverlay() {
        const overlay = this._getOverlay();
        if (!overlay) return;

        overlay.hidden = false;
        overlay.style.display = 'flex';
        overlay.setAttribute('aria-hidden', 'false');
        overlay.dataset.open = 'true';
    },

    _hideOverlay() {
        const overlay = this._getOverlay();
        if (!overlay) return;

        overlay.hidden = true;
        overlay.style.display = 'none';
        overlay.setAttribute('aria-hidden', 'true');
        delete overlay.dataset.open;
    },

    dismissIfOpen(action = 'dismiss') {
        if (!this._root) return false;

        if (!this._state) {
            this._hideOverlay();
            return false;
        }

        this._close(action);
        return true;
    },

    ensureMounted() {
        if (this._root) {
            return this._root;
        }

        const root = document.createElement('div');
        root.id = 'confirm-service-root';
        root.innerHTML = `
            <div id="confirm-service-overlay" class="panel-modal-overlay" hidden>
                <div class="panel-modal-card confirm-modal-card" role="dialog" aria-modal="true" aria-labelledby="confirm-service-title" aria-describedby="confirm-service-message">
                    <div class="confirm-modal-header">
                        <button type="button" class="confirm-modal-close" data-confirm-close="true" aria-label="\u0110\u00f3ng h\u1ed9p x\u00e1c nh\u1eadn">\u00d7</button>
                        <h3 id="confirm-service-title" class="confirm-modal-title"></h3>
                    </div>
                    <p id="confirm-service-message" class="confirm-modal-message"></p>
                    <div class="panel-modal-actions confirm-modal-actions">
                        <button type="button" class="outline" data-confirm-action="dismiss" hidden></button>
                        <button type="button" class="secondary outline" data-confirm-action="cancel"></button>
                        <button type="button" class="contrast" data-confirm-action="confirm"></button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(root);

        if (!this._keydownBound) {
            document.addEventListener('keydown', (event) => this._handleKeydown(event), true);
            this._keydownBound = true;
        }

        const overlay = root.querySelector('#confirm-service-overlay');
        const closeBtn = root.querySelector('[data-confirm-close]');
        const dismissBtn = root.querySelector('[data-confirm-action="dismiss"]');
        const cancelBtn = root.querySelector('[data-confirm-action="cancel"]');
        const confirmBtn = root.querySelector('[data-confirm-action="confirm"]');

        this._hideOverlay();
        overlay.addEventListener('click', (event) => this._handleOverlayClick(event));
        closeBtn.addEventListener('click', (event) => this._handleActionClick(event, 'dismiss'));
        dismissBtn.addEventListener('click', (event) => this._handleActionClick(event, 'dismiss'));
        cancelBtn.addEventListener('click', (event) => this._handleActionClick(event, 'cancel'));
        confirmBtn.addEventListener('click', (event) => this._handleActionClick(event, 'confirm'));
        root.addEventListener('click', (event) => this._handleFallbackClick(event));

        this._root = root;
        return root;
    },

    request(options) {
        const config = normalizeOptions(options);
        this.ensureMounted();

        if (this._state && this._state.resolve) {
            this._state.resolve('dismiss');
            this._state = null;
        }
        this._hideOverlay();

        return new Promise((resolve) => {
            this._state = {
                ...config,
                resolve,
                returnFocus: config.returnFocus && typeof config.returnFocus.focus === 'function'
                    ? config.returnFocus
                    : (document.activeElement && typeof document.activeElement.focus === 'function'
                        ? document.activeElement
                        : null)
            };

            if (this._state.returnFocus && typeof this._state.returnFocus.focus !== 'function') {
                this._state.returnFocus = null;
            }

            if (!this._state.returnFocus) {
                this._state.returnFocus = document.activeElement && typeof document.activeElement.focus === 'function'
                    ? document.activeElement
                    : null;
            }

            this._render();
        });
    },

    confirm(options) {
        return this.request(options).then((result) => result === 'confirm');
    },

    _render() {
        if (!this._root || !this._state) {
            return;
        }

        const dialog = this._root.querySelector('.confirm-modal-card');
        const title = this._root.querySelector('#confirm-service-title');
        const message = this._root.querySelector('#confirm-service-message');
        const confirmBtn = this._root.querySelector('[data-confirm-action="confirm"]');
        const cancelBtn = this._root.querySelector('[data-confirm-action="cancel"]');
        const dismissBtn = this._root.querySelector('[data-confirm-action="dismiss"]');

        title.textContent = this._state.title;
        message.textContent = this._state.message;

        confirmBtn.textContent = this._state.confirmLabel;
        confirmBtn.className = this._state.tone === 'danger'
            ? 'contrast btn-danger'
            : 'contrast';

        cancelBtn.textContent = this._state.cancelLabel;
        cancelBtn.hidden = !this._state.cancelLabel;

        dismissBtn.textContent = this._state.dismissLabel;
        dismissBtn.hidden = !this._state.dismissLabel;

        this._showOverlay();
        dialog.dataset.tone = this._state.tone;

        const focusTarget = this._resolveInitialFocus();
        setTimeout(() => {
            if (focusTarget && typeof focusTarget.focus === 'function') {
                focusTarget.focus();
            }
        }, 0);
    },

    _resolveInitialFocus() {
        if (!this._root || !this._state) return null;

        const focusMap = {
            dismiss: this._root.querySelector('[data-confirm-action="dismiss"]'),
            cancel: this._root.querySelector('[data-confirm-action="cancel"]'),
            confirm: this._root.querySelector('[data-confirm-action="confirm"]')
        };

        return focusMap[this._state.leastDestructive] || focusMap.cancel || focusMap.confirm;
    },

    _handleOverlayClick(event) {
        if (!this._state || !this._root) return;

        const overlay = this._getOverlay();
        if (event.target === overlay) {
            event.preventDefault();
            this._close('dismiss');
        }
    },

    _handleActionClick(event, action) {
        if (!this._state) return;

        event.preventDefault();
        event.stopPropagation();
        this._close(action || 'dismiss');
    },

    _handleFallbackClick(event) {
        if (!this._state || !this._root) return;

        const target = getEventElementTarget(event);
        if (!target) return;

        const closeBtn = closestSafe(target, '[data-confirm-close]');
        if (closeBtn) {
            this._close('dismiss');
            return;
        }

        const button = closestSafe(target, '[data-confirm-action]');
        if (!button) return;

        this._close(button.dataset.confirmAction || 'dismiss');
    },

    _handleKeydown(event) {
        if (!this._state || !this._root) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            this._close('dismiss');
            return;
        }

        if (event.key !== 'Tab') return;

        const dialog = this._root.querySelector('.confirm-modal-card');
        const focusables = getFocusableElements(dialog);
        if (focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
            return;
        }

        if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    },

    _close(action) {
        if (!this._state || !this._root) return;

        const returnFocus = this._state.returnFocus;
        const resolve = this._state.resolve;

        this._hideOverlay();

        this._state = null;
        resolve(action || 'dismiss');

        if (returnFocus && typeof returnFocus.focus === 'function') {
            setTimeout(() => returnFocus.focus(), 0);
        }
    }
};

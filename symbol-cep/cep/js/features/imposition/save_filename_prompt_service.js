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

function normalizeOptions(options) {
    const safe = options || {};

    return {
        title: safe.title || 'Nhap tien to ten file',
        message: safe.message || '',
        placeholder: safe.placeholder || '',
        initialValue: safe.initialValue || '',
        confirmLabel: safe.confirmLabel || 'Tiep tuc',
        cancelLabel: safe.cancelLabel || 'Huy',
        required: safe.required !== false,
        requiredMessage: safe.requiredMessage || 'Vui long nhap tien to ten file.',
        returnFocus: safe.returnFocus || null
    };
}

export const SaveFilenamePromptService = {
    _root: null,
    _state: null,
    _keydownBound: false,

    _getOverlay() {
        return this._root ? this._root.querySelector('#save-filename-prompt-overlay') : null;
    },

    _getInput() {
        return this._root ? this._root.querySelector('#save-filename-prompt-input') : null;
    },

    _getError() {
        return this._root ? this._root.querySelector('#save-filename-prompt-error') : null;
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

    ensureMounted() {
        if (this._root) {
            return this._root;
        }

        const root = document.createElement('div');
        root.id = 'save-filename-prompt-root';
        root.innerHTML = `
            <div id="save-filename-prompt-overlay" class="panel-modal-overlay" hidden>
                <div class="panel-modal-card" role="dialog" aria-modal="true" aria-labelledby="save-filename-prompt-title" aria-describedby="save-filename-prompt-message">
                    <h3 id="save-filename-prompt-title" class="panel-modal-title"></h3>
                    <p id="save-filename-prompt-message" class="panel-helper-text" style="margin-bottom: 10px;"></p>
                    <label class="panel-field-label" for="save-filename-prompt-input">Tien to ten file</label>
                    <input type="text" id="save-filename-prompt-input" class="panel-text-input" />
                    <div id="save-filename-prompt-error" class="panel-helper-text" style="color: #ff9b9b; margin-top: 8px; min-height: 16px;"></div>
                    <div class="panel-modal-actions">
                        <button type="button" class="secondary outline" data-save-filename-action="cancel"></button>
                        <button type="button" class="contrast" data-save-filename-action="confirm"></button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(root);

        if (!this._keydownBound) {
            document.addEventListener('keydown', (event) => this._handleKeydown(event), true);
            this._keydownBound = true;
        }

        const overlay = root.querySelector('#save-filename-prompt-overlay');
        const cancelBtn = root.querySelector('[data-save-filename-action="cancel"]');
        const confirmBtn = root.querySelector('[data-save-filename-action="confirm"]');

        this._hideOverlay();
        overlay.addEventListener('click', (event) => this._handleOverlayClick(event));
        cancelBtn.addEventListener('click', (event) => this._handleActionClick(event, 'cancel'));
        confirmBtn.addEventListener('click', (event) => this._handleActionClick(event, 'confirm'));

        this._root = root;
        return root;
    },

    request(options) {
        const config = normalizeOptions(options);
        this.ensureMounted();

        if (this._state && this._state.resolve) {
            this._state.resolve(null);
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

            this._render();
        });
    },

    _render() {
        if (!this._root || !this._state) {
            return;
        }

        const title = this._root.querySelector('#save-filename-prompt-title');
        const message = this._root.querySelector('#save-filename-prompt-message');
        const input = this._getInput();
        const error = this._getError();
        const cancelBtn = this._root.querySelector('[data-save-filename-action="cancel"]');
        const confirmBtn = this._root.querySelector('[data-save-filename-action="confirm"]');

        title.textContent = this._state.title;
        message.textContent = this._state.message;
        input.value = this._state.initialValue;
        input.placeholder = this._state.placeholder;
        cancelBtn.textContent = this._state.cancelLabel;
        confirmBtn.textContent = this._state.confirmLabel;
        error.textContent = '';

        this._showOverlay();

        setTimeout(() => {
            input.focus();
            input.select();
        }, 0);
    },

    _resolveValue() {
        const input = this._getInput();
        return input ? String(input.value || '').trim() : '';
    },

    _close(result) {
        if (!this._state) return;

        const returnFocus = this._state.returnFocus;
        const resolve = this._state.resolve;
        this._hideOverlay();
        this._state = null;
        resolve(result);

        if (returnFocus && typeof returnFocus.focus === 'function') {
            setTimeout(() => returnFocus.focus(), 0);
        }
    },

    _confirm() {
        if (!this._state) return;

        const value = this._resolveValue();
        const error = this._getError();
        if (this._state.required && !value) {
            if (error) {
                error.textContent = this._state.requiredMessage;
            }
            const input = this._getInput();
            if (input) {
                input.focus();
            }
            return;
        }

        this._close(value);
    },

    _handleActionClick(event, action) {
        event.preventDefault();
        event.stopPropagation();

        if (action === 'confirm') {
            this._confirm();
            return;
        }

        this._close(null);
    },

    _handleOverlayClick(event) {
        const overlay = this._getOverlay();
        if (overlay && event.target === overlay) {
            event.preventDefault();
            this._close(null);
        }
    },

    _handleKeydown(event) {
        if (!this._state || !this._root) return;

        if (event.key === 'Escape') {
            event.preventDefault();
            this._close(null);
            return;
        }

        if (event.key === 'Enter' && event.target === this._getInput()) {
            event.preventDefault();
            this._confirm();
            return;
        }

        if (event.key !== 'Tab') return;

        const dialog = this._root.querySelector('.panel-modal-card');
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
    }
};

export class FakeClassList {
    constructor(element) {
        this.element = element;
    }

    _getTokens() {
        return (this.element.className || '').split(/\s+/).filter(Boolean);
    }

    _setTokens(tokens) {
        this.element.className = Array.from(new Set(tokens)).join(' ');
    }

    add(...tokens) {
        this._setTokens([...this._getTokens(), ...tokens]);
    }

    remove(...tokens) {
        const next = this._getTokens().filter((token) => !tokens.includes(token));
        this._setTokens(next);
    }

    contains(token) {
        return this._getTokens().includes(token);
    }
}

export class FakeTextNode {
    constructor(text = '', ownerDocument = null) {
        this.nodeType = 3;
        this.parentNode = null;
        this.ownerDocument = ownerDocument;
        this.children = [];
        this._textContent = String(text);
    }

    set textContent(value) {
        this._textContent = String(value);
    }

    get textContent() {
        return this._textContent;
    }
}

export class FakeElement {
    constructor(tagName = 'div', ownerDocument = null) {
        this.tagName = String(tagName).toUpperCase();
        this.ownerDocument = ownerDocument;
        this.parentNode = null;
        this.children = [];
        this.listeners = new Map();
        this.dataset = {};
        this.style = {};
        this.attributes = {};
        this.className = '';
        this.classList = new FakeClassList(this);
        this.type = '';
        this.value = '';
        this.checked = false;
        this.disabled = false;
        this.title = '';
        this.placeholder = '';
        this._id = '';
        this._textContent = '';
        this._selected = false;
    }

    set id(value) {
        this._id = String(value || '');
        if (this.ownerDocument) {
            this.ownerDocument._registerId(this);
        }
    }

    get id() {
        return this._id;
    }

    set textContent(value) {
        this._textContent = String(value);
        this.children = [];
    }

    get textContent() {
        const childText = this.children.map((child) => child.textContent || '').join('');
        return `${this._textContent}${childText}`;
    }

    appendChild(child) {
        child.parentNode = this;
        child.ownerDocument = this.ownerDocument;
        this.children.push(child);
        if (this.ownerDocument) {
            this.ownerDocument._registerTree(child);
        }
        return child;
    }

    addEventListener(type, handler) {
        const current = this.listeners.get(type) || [];
        current.push(handler);
        this.listeners.set(type, current);
    }

    dispatchEvent(event = {}) {
        const payload = {
            type: event.type || 'input',
            target: this,
            currentTarget: this,
            isTrusted: event.isTrusted ?? false,
            bubbles: event.bubbles ?? false
        };
        const handlers = this.listeners.get(payload.type) || [];
        handlers.forEach((handler) => handler(payload));
        return true;
    }

    select() {
        this._selected = true;
    }

    setAttribute(name, value) {
        const stringValue = String(value);
        this.attributes[name] = stringValue;
        if (name === 'class') {
            this.className = stringValue;
        } else if (name === 'id') {
            this.id = stringValue;
        }
    }

    getAttribute(name) {
        if (name === 'id') {
            return this.id || null;
        }
        if (name === 'class') {
            return this.className || null;
        }
        return Object.prototype.hasOwnProperty.call(this.attributes, name)
            ? this.attributes[name]
            : null;
    }

    closest(selector) {
        let current = this;
        while (current) {
            if (selector.startsWith('.') && current.classList.contains(selector.slice(1))) {
                return current;
            }
            if (!selector.startsWith('.') && current.tagName === selector.toUpperCase()) {
                return current;
            }
            current = current.parentNode;
        }
        return null;
    }

    querySelectorAll(selector) {
        const matches = [];
        const visit = (node) => {
            node.children.forEach((child) => {
                if (selector.startsWith('.') && child.classList.contains(selector.slice(1))) {
                    matches.push(child);
                } else if (selector.startsWith('#') && child.id === selector.slice(1)) {
                    matches.push(child);
                } else if (!selector.startsWith('.') && !selector.startsWith('#') && child.tagName === selector.toUpperCase()) {
                    matches.push(child);
                }
                visit(child);
            });
        };

        visit(this);
        return matches;
    }
}

export class FakeDocument {
    constructor() {
        this._elementsById = new Map();
        this.head = new FakeElement('head', this);
        this.body = new FakeElement('body', this);
    }

    createElement(tagName) {
        return new FakeElement(tagName, this);
    }

    createTextNode(text) {
        return new FakeTextNode(text, this);
    }

    getElementById(id) {
        return this._elementsById.get(id) || null;
    }

    _registerId(element) {
        if (element.id) {
            this._elementsById.set(element.id, element);
        }
    }

    _registerTree(node) {
        if (node instanceof FakeElement) {
            this._registerId(node);
        }
        node.children.forEach((child) => this._registerTree(child));
    }
}

export function createInput(options = {}) {
    const input = new FakeElement('input');
    input.type = options.type || 'number';
    input.value = options.value ?? '';
    input.checked = options.checked ?? false;
    input.dataset = { ...(options.dataset || {}) };
    return input;
}

export function createComputedRef(value = '') {
    const el = new FakeElement('span');
    el.textContent = value;
    return { isComputed: true, el };
}

const PLACEHOLDER_SOURCE = '\\{([\\w.]+)\\}';

function createScanner() {
    return new RegExp(PLACEHOLDER_SOURCE, 'g');
}

export const TemplatePlaceholderCodec = {
    unwrapToken(token) {
        const match = String(token || '').match(new RegExp(`^${PLACEHOLDER_SOURCE}$`));
        return match ? match[1] : String(token || '');
    },

    findAll(text) {
        const placeholders = [];
        if (typeof text !== 'string' || text.indexOf('{') === -1) return placeholders;

        const scanner = createScanner();
        let match = scanner.exec(text);
        while (match) {
            placeholders.push({
                start: match.index,
                end: match.index + match[0].length,
                token: match[0],
                key: match[1]
            });
            match = scanner.exec(text);
        }

        return placeholders;
    },

    findFirst(text) {
        return this.findAll(text)[0] || null;
    },

    collectKeys(text, output) {
        if (!output || typeof output.add !== 'function') return;
        this.findAll(text).forEach((placeholder) => {
            if (placeholder.key) output.add(placeholder.key);
        });
    }
};

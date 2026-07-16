/**
 * DateGridRenderer - Stateless DOM Builder
 * LAYER: Components/DateGrid
 *
 * Responsibilities:
 * - Create HTML structure
 * - Apply CSS classes
 * - Populate refs for controller use
 *
 * Rules:
 * - No business logic
 * - No event listeners beyond local UI affordances
 * - Returns the root element
 */
import {
    createHeaderRow,
    createInfoColumn,
    createLabelColumn,
    createPairConfigs,
    createPairSeparator
} from './dateGridRenderSupport.js';

export const DateGridRenderer = {
    render(container, dateConfigs, refs) {
        const grid = document.createElement('div');
        grid.className = 'date-grid';

        grid.appendChild(createHeaderRow());

        dateConfigs.forEach((config) => {
            grid.appendChild(this._createRow(config, refs));
        });

        container.appendChild(grid);
        return grid;
    },

    _createRow(config, refs) {
        const row = document.createElement('div');
        row.className = 'date-grid-row';

        row.appendChild(createLabelColumn(config, refs));

        createPairConfigs(config.key).forEach(({ field1, field2, type }) => {
            row.appendChild(this._createPair(config, field1, field2, type, refs));
        });

        row.appendChild(createInfoColumn(config.key, refs));
        return row;
    },

    /* eslint-disable-next-line max-params */
    _createPair(config, field1, field2, type, refs) {
        const group = document.createElement('div');
        group.className = 'date-input-group';

        group.appendChild(this._createInput(config, field1, type, refs));
        group.appendChild(createPairSeparator());
        group.appendChild(this._createInput(config, field2, type, refs));

        return group;
    },

    _createInput(config, field, type, refs) {
        const baseKey = config.key;
        const key = `${baseKey}.${field}`;
        const input = document.createElement('input');
        input.type = 'number';
        input.placeholder = field.charAt(0).toUpperCase();
        input.className = 'date-input';
        input.dataset.key = key;
        input.dataset.baseKey = baseKey;
        input.dataset.type = type;

        const defaultValue = getDefaultTimeValue(config, field, type);
        if (defaultValue) {
            input.value = defaultValue;
        }

        refs[key] = input;
        input.addEventListener('focus', function () { this.select(); });

        return input;
    }
};

function formatTimePart(value) {
    if (value === undefined || value === null || value === '') {
        return '';
    }

    return String(value).padStart(2, '0');
}

function getDefaultTimeValue(config, field, type) {
    if (type !== 'time') {
        return '';
    }

    if (field === 'gio') {
        return formatTimePart(config.standardTime?.h);
    }

    if (field === 'phut') {
        return formatTimePart(config.standardTime?.m);
    }

    return '';
}

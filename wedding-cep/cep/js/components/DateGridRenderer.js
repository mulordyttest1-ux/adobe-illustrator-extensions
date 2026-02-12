/**
 * DateGridRenderer - Stateless DOM Builder
 * 
 * Responsibilities:
 * - Create HTML Structure
 * - Apply CSS Classes
 * - Populate _refs object for Controller
 * 
 * Rules:
 * - NO Business Logic
 * - NO Event Listeners (except for wiring up callbacks passed in, if any)
 * - Returns: Root Element
 */
export const DateGridRenderer = {
    render(container, dateConfigs, refs) {
        const grid = document.createElement('div');
        grid.className = 'date-grid';

        // 1. Header
        grid.appendChild(this._createHeader());

        // 2. Rows
        dateConfigs.forEach((config) => {
            const row = this._createRow(config, refs);
            grid.appendChild(row);
        });

        container.appendChild(grid);
        return grid;
    },

    _createHeader() {
        const header = document.createElement('div');
        header.className = 'date-grid-header';

        const labels = ['', 'DƯƠNG', 'ÂM', 'GIỜ', ''];
        labels.forEach(text => {
            const div = document.createElement('div');
            if (text) {
                div.textContent = text;
                div.className = 'date-grid-header-item';
            }
            header.appendChild(div);
        });
        return header;
    },

    _createRow(config, refs) {
        const isMaster = config.key.includes('tiec');
        const row = document.createElement('div');
        row.className = 'date-grid-row';

        // COL 1: Label + Checkbox
        const labelCol = document.createElement('div');
        labelCol.className = 'date-label-col';

        if (!isMaster) {
            const chk = document.createElement('input');
            chk.type = 'checkbox';
            chk.checked = true;
            chk.className = 'date-checkbox';
            refs[`${config.key}_auto`] = chk; // Bind ref
            labelCol.appendChild(chk);
        }

        const labelTxt = document.createElement('span');
        labelTxt.textContent = config.label;
        labelTxt.className = 'date-label-text';
        labelCol.appendChild(labelTxt);
        row.appendChild(labelCol);

        // COL 2: Solar (DƯƠNG)
        const solarGroup = this._createPair(config.key, 'ngay', 'thang', 'solar', refs);
        row.appendChild(solarGroup);

        // COL 3: Lunar (ÂM)
        const lunarGroup = this._createPair(config.key, 'ngay_al', 'thang_al', 'lunar', refs);
        row.appendChild(lunarGroup);

        // COL 4: Time
        const timeGroup = this._createPair(config.key, 'gio', 'phut', 'time', refs);
        row.appendChild(timeGroup);

        // COL 5: Info (Thứ, Năm | Năm ÂL)
        const infoCol = document.createElement('div');
        infoCol.className = 'date-info-col';

        // Computed Spans
        const thuSpan = document.createElement('span');
        const namSpan = document.createElement('span');
        const namAlSpan = document.createElement('span');

        infoCol.appendChild(thuSpan);
        infoCol.appendChild(document.createTextNode(', '));
        infoCol.appendChild(namSpan);
        infoCol.appendChild(document.createTextNode(' | '));
        infoCol.appendChild(namAlSpan);

        row.appendChild(infoCol);

        // Store computed refs
        refs[`${config.key}.thu`] = { isComputed: true, el: thuSpan };
        refs[`${config.key}.nam`] = { isComputed: true, el: namSpan };
        refs[`${config.key}.namyy`] = { isComputed: true, value: '' }; // Hidden value
        refs[`${config.key}.nam_al`] = { isComputed: true, el: namAlSpan };

        return row;
    },

    _createPair(baseKey, field1, field2, type, refs) {
        const group = document.createElement('div');
        group.className = 'date-input-group';

        const inp1 = this._createInput(baseKey, field1, type, refs);
        const inp2 = this._createInput(baseKey, field2, type, refs);

        // Add separator style to first input wrapper or element if needed
        // Current CSS classes handle borders via .date-input and container. 
        // But legacy used border-right on inp1. 
        // Let's add a utility class or inline style just for the separator line if CSS doesn't cover it fully.
        // Checking CSS: .date-input-separator might be needed.
        const sep = document.createElement('div');
        sep.style.width = '1px';
        sep.style.backgroundColor = '#eee';

        group.appendChild(inp1);
        group.appendChild(sep);
        group.appendChild(inp2);

        return group;
    },

    _createInput(baseKey, field, type, refs) {
        const key = `${baseKey}.${field}`;
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.placeholder = field.charAt(0).toUpperCase();
        inp.className = 'date-input';

        // Metadata for Controller to identify
        inp.dataset.key = key;
        inp.dataset.baseKey = baseKey;
        inp.dataset.type = type;

        refs[key] = inp;

        // Auto-select on focus (UI behavior)
        inp.addEventListener('focus', function () { this.select(); });

        return inp;
    }
};


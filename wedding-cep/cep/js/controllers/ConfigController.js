/**
 * ConfigController.js - UI Parameters Controller
 * Allows user to adjust compact UI settings in realtime
 * Persists to localStorage
 */

export const ConfigController = {
    STORAGE_KEY: 'wedding-scripter-compact-config',

    // Default values
    defaults: {
        '--compact-font-size': 10,
        '--compact-label-w': 40,
        '--compact-idx-w': 24,
        '--compact-name-h': 20,
        '--compact-addr-h': 40,
        '--compact-gap': 2,
        '--compact-row-gap': 4
    },

    // Config with labels and ranges
    configs: [
        { key: '--compact-font-size', label: 'Font Size', min: 8, max: 14, unit: 'px' },
        { key: '--compact-label-w', label: 'Label Width', min: 30, max: 60, unit: 'px' },
        { key: '--compact-idx-w', label: 'Index Width', min: 18, max: 32, unit: 'px' },
        { key: '--compact-name-h', label: 'Name Height', min: 16, max: 32, unit: 'px' },
        { key: '--compact-addr-h', label: 'Addr Height', min: 30, max: 60, unit: 'px' },
        { key: '--compact-gap', label: 'Gap', min: 0, max: 8, unit: 'px' },
        { key: '--compact-row-gap', label: 'Row Gap', min: 2, max: 12, unit: 'px' }
    ],

    _refs: {},
    _values: {},

    init(container) {
        if (!container) return;
        container.innerHTML = '';

        // Load saved or defaults
        this._values = this._load();

        // Build sliders
        this.configs.forEach(cfg => {
            const row = document.createElement('div');
            row.style.cssText = 'display: flex; align-items: center; gap: 4px; margin-bottom: 4px;';

            // Label
            const lbl = document.createElement('label');
            lbl.style.cssText = 'font-size: 10px; width: 70px; color: #555;';
            lbl.textContent = cfg.label;
            row.appendChild(lbl);

            // Slider
            const slider = document.createElement('input');
            slider.type = 'range';
            slider.min = cfg.min;
            slider.max = cfg.max;
            slider.value = this._values[cfg.key];
            slider.style.cssText = 'flex: 1; height: 16px;';
            row.appendChild(slider);

            // Value display
            const val = document.createElement('span');
            val.style.cssText = 'font-size: 10px; width: 30px; text-align: right;';
            val.textContent = `${this._values[cfg.key]}${cfg.unit}`;
            row.appendChild(val);

            // Events
            slider.addEventListener('input', () => {
                const v = parseInt(slider.value);
                this._values[cfg.key] = v;
                val.textContent = `${v}${cfg.unit}`;
                this._applyToDOM(cfg.key, v, cfg.unit);
            });

            this._refs[cfg.key] = { slider, val, unit: cfg.unit };
            container.appendChild(row);
        });

        // Apply all on init
        this.apply();


    },

    _load() {
        try {
            const saved = localStorage.getItem(this.STORAGE_KEY);
            if (saved) {
                return { ...this.defaults, ...JSON.parse(saved) };
            }
        } catch {

        }
        return { ...this.defaults };
    },

    _save() {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this._values));

        } catch {

        }
    },

    _applyToDOM(key, value, unit) {
        document.documentElement.style.setProperty(key, `${value}${unit}`);
    },

    apply() {
        this.configs.forEach(cfg => {
            const v = this._values[cfg.key];
            this._applyToDOM(cfg.key, v, cfg.unit);
        });
        this._save();

    },

    reset() {
        this._values = { ...this.defaults };

        // Update UI
        this.configs.forEach(cfg => {
            const ref = this._refs[cfg.key];
            if (ref) {
                ref.slider.value = this.defaults[cfg.key];
                ref.val.textContent = `${this.defaults[cfg.key]}${ref.unit}`;
            }
        });

        // Apply to DOM
        this.apply();

    }
};


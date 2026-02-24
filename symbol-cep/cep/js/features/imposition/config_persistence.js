/**
 * MODULE: ConfigPersistence
 * LAYER: UI/Actions (L7)
 * PURPOSE: Save/Load preset logic (validation + serialization)
 * DEPENDENCIES: DataStore, FIELD_IDS
 * SIDE EFFECTS: LocalStorage writes, DOM updates
 * EXPORTS: window.Imposition.ConfigPersistence
 */

window.Imposition = window.Imposition || {};

(function () {

    const ConfigPersistence = {

        /**
         * Load a preset by ID and fill the form
         * @param {string} id - Preset ID
         * @param {ConfigTab} tab - The ConfigTab instance (for re-render)
         */
        loadPreset(id, tab) {
            window.Imposition.dataStore.saveLastActive(id);

            const p = window.Imposition.dataStore.getPresets().find(x => x.id === id);
            if (!p) return;

            // Load embedded schema if available
            if (p.schema) {
                console.log("Loading Embedded Schema from Preset:", p.label);
                window.BuiltinPresets[0] = p.schema;
                tab.render();
                this._restoreDropdown(id);
            }

            const form = document.getElementById('config-form');
            if (!form) {
                tab.render();
                this._restoreDropdown(id);
            }

            const formRef = document.getElementById('config-form');
            if (!formRef) return;

            // Fill meta fields
            document.getElementById('preset_id').value = p.id;
            document.getElementById('preset_name').value = p.label;

            // Fill form values
            if (p.rawValues) {
                this._fillFromRawValues(formRef, p.rawValues);
            } else {
                this._fillLegacyForm(formRef, p);
            }
        },

        /**
         * Save form data as a preset
         * @param {HTMLFormElement} form - The config form
         * @param {boolean} allowUpdate - Whether to allow updating existing preset
         */
        handleSave(form, allowUpdate) {
            const formData = new FormData(form);
            const name = formData.get('preset_name');
            if (!name) { alert("Vui lòng nhập tên cấu hình!"); return; }

            let existingId = formData.get('preset_id');
            existingId = this._resolveUpdateConflict(existingId, name, allowUpdate);

            const id = (allowUpdate && existingId) ? existingId : 'preset_' + Date.now();
            const preset = this._buildPreset(id, name, formData);

            window.Imposition.dataStore.savePreset(preset);

            const action = (allowUpdate && existingId) ? 'Cập nhật' : 'Tạo mới';
            alert(`✅ Đã ${action}: ${preset.label}`);

            if (!existingId && allowUpdate) {
                document.getElementById('preset_id').value = id;
            }

            // Re-render to update dropdown
            if (window.Imposition.configTab) {
                window.Imposition.configTab.render();
            }
        },

        /**
         * Resolve name change conflict (update vs create new)
         * @private
         */
        _resolveUpdateConflict(existingId, name, allowUpdate) {
            if (!existingId || !allowUpdate) return existingId;

            const oldPreset = window.Imposition.dataStore.getPresets().find(x => x.id === existingId);
            if (oldPreset && oldPreset.label !== name) {
                const choice = confirm(
                    `Bạn đã đổi tên từ "${oldPreset.label}" sang "${name}".\n\n` +
                    `- Bấm OK để CẬP NHẬT (Đổi tên cấu hình cũ).\n` +
                    `- Bấm Cancel để LƯU MỚI (Tạo thêm 1 cấu hình mới).`
                );
                if (!choice) return '';
            }
            return existingId;
        },

        /**
         * Build preset object from form data
         * @private
         */
        _buildPreset(id, name, formData) {
            return {
                id: id,
                label: name,
                createdAt: new Date().toISOString(),
                schemaId: 'embedded',
                schema: JSON.parse(JSON.stringify(window.BuiltinPresets[0])),
                rawValues: Object.fromEntries(formData),
                geometry: this._buildGeometry(formData),
                options: this._buildOptions(formData)
            };
        },

        /** @private */
        _buildGeometry(formData) {
            const F = window.FIELD_IDS || {};
            return {
                finish: {
                    w: Number(formData.get(F.FINISH_W || 'finish_w')) || 0,
                    h: Number(formData.get(F.FINISH_H || 'finish_h')) || 0
                },
                safe: [
                    Number(formData.get(F.SAFE_TOP || 'safe_top')) || 0,
                    Number(formData.get(F.SAFE_BOTTOM || 'safe_bottom')) || 0,
                    Number(formData.get(F.SAFE_LEFT || 'safe_left')) || 0,
                    Number(formData.get(F.SAFE_RIGHT || 'safe_right')) || 0
                ]
            };
        },

        /** @private */
        _buildOptions(formData) {
            return {
                clone: formData.get('opt_clone') === 'on',
                cleanup: formData.get('opt_cleanup') === 'on',
                k100: formData.get('opt_k100') === 'on'
            };
        },

        /**
         * Fill form from rawValues (universal loader)
         * @private
         */
        _fillFromRawValues(formRef, rawValues) {
            // Reset all checkboxes first
            Array.from(formRef.querySelectorAll('input[type=checkbox]')).forEach(cb => {
                cb.checked = false;
            });

            Object.keys(rawValues).forEach(key => {
                const el = formRef.elements[key];
                if (!el) return;
                if (el.type === 'checkbox') {
                    el.checked = rawValues[key] === 'on' || rawValues[key] === true || rawValues[key] === 'true';
                } else {
                    el.value = rawValues[key];
                }
            });
        },

        /**
         * Fill form from legacy preset format (fallback)
         * @private
         */
        _fillLegacyForm(form, p) {
            if (p.geometry.finish) {
                if (form.elements['finish_w']) form.elements['finish_w'].value = p.geometry.finish.w || '';
                if (form.elements['finish_h']) form.elements['finish_h'].value = p.geometry.finish.h || '';
            }
        },

        /**
         * Restore dropdown selection after re-render
         * @private
         */
        _restoreDropdown(id) {
            const sel = document.getElementById('load-preset-select');
            if (sel) sel.value = id;
        }
    };

    window.Imposition.ConfigPersistence = ConfigPersistence;
})();

/**
 * MODULE: WeddingProActionHandler
 * LAYER: Controller/Helpers
 * PURPOSE: Handle WeddingPro user actions (scan, update, swap, save, offset) — delegates UI/normalize
 * DEPENDENCIES: KeyNormalizer, UIFeedback, Bridge (via controller), DataValidator
 * SIDE EFFECTS: DOM (via UIFeedback)
 * EXPORTS: WeddingProActionHandler.handleRescan(), .handleUpdate(), .handleSwap(), .normalizeScannedKeys()
 */

export const WeddingProActionHandler = {
    /**
     * Handle rescan button click.
     * @param {Object} controller - Reference to main controller
     */
    async handleRescan(controller) {
        const result = await bridge.scanDocument();

        if (result.success) {
            const validator = (typeof DataValidator !== 'undefined')
                ? new DataValidator()
                : { analyze: (_d) => ({ healthyMap: {}, brokenList: [] }) };

            const analysis = validator.analyze(result.data);
            const cleanData = analysis.healthyMap;
            const brokenItems = analysis.brokenList;

            controller.scannedData = cleanData;

            if (controller.formBuilder) {
                controller.formBuilder.setData(cleanData);
            }

            if (brokenItems.length > 0) {
                UIFeedback.showToast(`Cảnh báo: ${brokenItems.length} mục bị lỗi cấu trúc!`, 'error');
            }

            if (typeof DateGridWidget !== 'undefined' && DateGridWidget.triggerCompute) {
                setTimeout(() => DateGridWidget.triggerCompute(), 100);
            }

            if (window.showToast) window.showToast('Đã quét xong: ' + result.count + ' mục', 'success');
            else UIFeedback.showToast('Đã quét xong: ' + result.count + ' mục', 'success');

        } else {
            UIFeedback.showError(controller.container, 'Lỗi Scan: ' + result.error);
        }
    },

    /**
     * Handle reset button click.
     * @param {Object} controller - Reference to main controller
     */
    handleReset(controller) {
        if (controller.formBuilder) {
            controller.formBuilder.reset();
            if (controller.scannedData) {
                controller.formBuilder.setData(controller.scannedData);
            }
            UIFeedback.showToast('Đã đặt lại form', 'success');
        }
    },

    /**
     * Handle update button click.
     * @param {Object} controller - Reference to main controller
     */
    async handleUpdate(controller) {
        if (!controller.formBuilder) {
            UIFeedback.showToast('Form chưa được khởi tạo', 'error');
            return;
        }

        try {
            const validation = controller.formBuilder.validate();
            if (!validation.valid) {
                UIFeedback.showToast(validation.errors.join(', '), 'error');
                return;
            }

            const rawData = controller.formBuilder.getData();
            let processedData = rawData;

            if (typeof WeddingAssembler !== 'undefined') {
                if (typeof CalendarEngine !== 'undefined' && !CalendarEngine._isLoaded) {
                    CalendarEngine.loadDatabase();
                }

                WeddingAssembler.setDependencies({
                    normalizer: typeof Normalizer !== 'undefined' ? Normalizer : null,
                    nameAnalysis: typeof NameAnalysis !== 'undefined' ? NameAnalysis : null,
                    calendarEngine: CalendarEngine,
                    weddingRules: typeof WeddingRules !== 'undefined' ? WeddingRules : null,
                    timeAutomation: typeof TimeAutomation !== 'undefined' ? TimeAutomation : null,
                    venueAutomation: typeof VenueAutomation !== 'undefined' ? VenueAutomation : null
                });

                processedData = await WeddingAssembler.assemble(rawData, controller.schema);
            }

            const result = await bridge.updateWithStrategy(processedData);

            if (result.success) {
                UIFeedback.showToast(result.message || 'Cập nhật thành công!', 'success');
            } else {
                throw new Error(result.error || 'Cập nhật thất bại');
            }

        } catch (error) {
            UIFeedback.showToast(error.message, 'error');
        }
    },

    /**
     * Handle SWAP button.
     * @param {Object} controller - Reference to main controller
     */
    handleSwap(controller) {
        if (!controller.formBuilder) return;

        const data = controller.formBuilder.getData();
        const swapped = {};

        for (const key in data) {
            if (key.startsWith('pos1.')) {
                swapped[key.replace('pos1.', 'pos2.')] = data[key];
            } else if (key.startsWith('pos2.')) {
                swapped[key.replace('pos2.', 'pos1.')] = data[key];
            } else {
                swapped[key] = data[key];
            }
        }

        controller.formBuilder.setData(swapped);
        UIFeedback.showToast('Đã hoán đổi vị trí 1 và 2', 'success');
    },

    /** Handle SAVE button. */
    async handleSave(_controller) {
        UIFeedback.showToast('Chức năng SAVE đang phát triển', 'info');
    },

    /** Handle OFFSET button. */
    handleOffset(_controller) {
        UIFeedback.showToast('Chức năng OFFSET đang phát triển', 'info');
    },

    /**
     * Delegate to KeyNormalizer (backward-compatible wrapper).
     * @param {Object} data - Raw scanned data
     * @returns {Object} Normalized data
     */
    normalizeScannedKeys(data) {
        return KeyNormalizer.normalize(data);
    },

    // Delegate UI methods to UIFeedback (backward-compatible)
    showLoading(container, message) { UIFeedback.showLoading(container, message); },
    showError(container, message) { UIFeedback.showError(container, message); },
    showToast(message, type) { UIFeedback.showToast(message, type); }
};


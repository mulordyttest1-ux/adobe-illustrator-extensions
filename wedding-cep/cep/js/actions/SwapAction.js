/**
 * MODULE: SwapAction
 * LAYER: Entry/Actions
 * PURPOSE: Handle Swap button — exchange POS1 ↔ POS2 data (keep vithu) and update auto-venue
 * DEPENDENCIES: CompactFormBuilder
 * SIDE EFFECTS: DOM (form values, toast)
 * EXPORTS: SwapAction.execute()
 */

export const SwapAction = {
    /**
     * Execute swap action.
     * @param {Object} ctx - Action context
     * @param {Object} ctx.builder - CompactFormBuilder instance
     * @param {Function} ctx.showToast - Toast notification function
     * @returns {{success: boolean}}
     */
    execute(ctx) {
        const { builder, showToast } = ctx;

        // 1. Get current form data
        const data = builder.getData();
        const swapped = {};

        // 2. Swap POS1 ↔ POS2 (EXCEPT vithu — keep because WYSIWYG)
        Object.keys(data).forEach(key => {
            if (key === 'pos1.vithu' || key === 'pos2.vithu') {
                swapped[key] = data[key];
            } else if (key.startsWith('pos1.')) {
                swapped[key.replace('pos1.', 'pos2.')] = data[key];
            } else if (key.startsWith('pos2.')) {
                swapped[key.replace('pos2.', 'pos1.')] = data[key];
            } else {
                swapped[key] = data[key];
            }
        });

        // 3. Push swapped data to form
        builder.setData(swapped);

        // 4. Update auto-venue fields if checked
        this._updateAutoVenues(builder, swapped);

        showToast('Đã hoán đổi POS!', 'success');
        return { success: true };
    },

    /**
     * Update ceremony/venue name+address when auto checkboxes are checked.
     * @param {Object} builder - CompactFormBuilder instance
     * @param {Object} swapped - Swapped data object
     * @private
     */
    _updateAutoVenues(builder, swapped) {
        const ceremonyAuto = builder.refs['ceremony.ten_auto'];
        const venueAuto = builder.refs['venue.ten_auto'];
        const hostRef = builder.refs['ceremony.host_type'];
        const checkedHost = hostRef?.elements?.find(r => r.checked);
        const hostValue = checkedHost?.value || 'Trai';
        const tuGia = hostValue === 'Trai' ? 'Tư Gia Nhà Trai' : 'Tư Gia Nhà Gái';

        if (ceremonyAuto?.checked) {
            const el = builder.refs['ceremony.ten'];
            if (el) el.value = tuGia;
            const addrEl = builder.refs['ceremony.diachi'];
            if (addrEl) addrEl.value = swapped['pos1.diachi'] || '';
        }
        if (venueAuto?.checked) {
            const el = builder.refs['venue.ten'];
            if (el) el.value = tuGia;
            const addrEl = builder.refs['venue.diachi'];
            if (addrEl) addrEl.value = swapped['pos1.diachi'] || '';
        }
    }
};


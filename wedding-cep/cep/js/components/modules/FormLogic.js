/**
 * FormLogic.js
 * Chuyên trách xử lý logic nghiệp vụ: Venue Auto-fill, Host Type triggers.
 */
import { VenueAutomation } from '@wedding/domain';
import { InputEngine } from '../../logic/ux/InputEngine.js';

export class FormLogic {
    constructor(builder) {
        this.builder = builder;
    }

    /**
     * Setup auto venue filling logic
     */

    /* eslint-disable-next-line complexity */
    setupAutoVenue() {
        if (!this.builder) return;
        const refs = this.builder.refs;

        const hostRef = refs['ceremony.host_type'];
        const leRef = refs['info.ten_le'];
        const pos1Addr = refs['pos1.diachi'];

        const hostOptions = this._getSchemaOptions('ceremony.host_type');
        const VAL_TRAI = hostOptions[0] || 'Nhà Trai';
        const VAL_GAI = hostOptions[1] || 'Nhà Gái';
        const triggers = this.builder.schema.TRIGGER_CONFIG || {};

        if (leRef && leRef.elements) {
            leRef.elements.forEach(radio => {
                radio.addEventListener('change', () => this._updateHostFromLe(radio.value, refs, triggers, VAL_GAI, VAL_TRAI));
            });
        }

        if (hostRef && hostRef.elements) {
            hostRef.elements.forEach(radio => {
                radio.addEventListener('change', () => this._updateAllVenueNames(radio.value, refs));
            });
        }

        const triggerUpdate = () => {
            const currentHost = hostRef?.elements?.find(r => r.checked)?.value || VAL_TRAI;
            this._updateAllVenueNames(currentHost, refs);
        };

        if (pos1Addr) {
            pos1Addr.addEventListener('input', triggerUpdate);
            pos1Addr.addEventListener('blur', triggerUpdate);
        }

        ['ceremony.ten_auto', 'venue.ten_auto'].forEach(autoKey => {
            const cb = refs[autoKey];
            if (cb) cb.addEventListener('change', triggerUpdate);
        });

        this._bindManualInputCancellation(refs, 'ceremony');
        this._bindManualInputCancellation(refs, 'venue');
        this._bindAddrInputCancellation(refs, 'ceremony');
        this._bindAddrInputCancellation(refs, 'venue');

        const currentChecked = hostRef?.elements?.find(r => r.checked);
        const initHost = currentChecked?.value || VAL_TRAI;
        this._updateAllVenueNames(initHost, refs);
    }

    /* eslint-disable-next-line max-params */
    _updateHostFromLe(leValue, refs, triggers, valGai, valTrai) {
        const hostRef = refs['ceremony.host_type'];
        if (!hostRef || !hostRef.elements) return;

        const targetHost = (triggers[leValue] === 1) ? valGai : valTrai;

        let changed = false;
        hostRef.elements.forEach(radio => {
            const isTarget = (radio.value === targetHost);
            if (radio.checked !== isTarget) {
                radio.checked = isTarget;
                if (isTarget) changed = true;
            }
        });

        if (changed) {
            const checkedRadio = hostRef.elements.find(r => r.checked);
            if (checkedRadio) checkedRadio.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    _updateAllVenueNames(hostValue, refs) {
        const tuGiaLabel = this._getTuGiaLabel(hostValue);
        const sourceAddr = refs['pos1.diachi'] ? refs['pos1.diachi'].value : '';

        this._updateVenueSection('ceremony', tuGiaLabel, sourceAddr, refs);
        this._updateVenueSection('venue', tuGiaLabel, sourceAddr, refs);
    }

    _getTuGiaLabel(hostValue) {
        if (typeof VenueAutomation !== 'undefined' && VenueAutomation.generateVenueName) {
            return VenueAutomation.generateVenueName(hostValue);
        }
        return `Tư Gia ${hostValue}`;
    }

    _updateVenueSection(prefix, tuGiaLabel, sourceAddr, refs) {
        const autoCb = refs[`${prefix}.ten_auto`];
        if (!autoCb || !autoCb.checked) return;

        const tenEl = refs[`${prefix}.ten`];
        const addrEl = refs[`${prefix}.diachi`];

        if (tenEl) {
            if (tenEl.value !== tuGiaLabel) {
                tenEl.value = tuGiaLabel;
                tenEl.dispatchEvent(new Event('input', { bubbles: true }));
            }
        }

        if (addrEl) {
            if (addrEl.value !== sourceAddr) {
                addrEl.value = sourceAddr;
                addrEl.dispatchEvent(new Event('input', { bubbles: true }));
                if (prefix === 'ceremony' && typeof InputEngine !== 'undefined') {
                    InputEngine.process(sourceAddr, 'ceremony.diachi', {}, this.builder.schema);
                }
            }
        }
    }

    _bindManualInputCancellation(refs, prefix) {
        const inputEl = refs[`${prefix}.ten`];
        const checkboxEl = refs[`${prefix}.ten_auto`];

        if (!inputEl || !checkboxEl) return;

        inputEl.addEventListener('input', (e) => {
            // [CẢM BIẾN AI] Lơ đi nếu sự kiện do hàm setData/Máy bắn ra
            if (!e.isTrusted) return;

            if (checkboxEl.checked) {
                checkboxEl.checked = false;
                checkboxEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }

    /**
     * Khi user gõ trực tiếp vào ô địa chỉ (isTrusted) → uncheck ten_auto → live-sync dừng.
     * Cùng pattern với _bindManualInputCancellation cho ô tên.
     * Ô địa chỉ là SSOT — checkbox chỉ là bổ trợ autofill.
     */
    _bindAddrInputCancellation(refs, prefix) {
        const addrEl = refs[`${prefix}.diachi`];
        const checkboxEl = refs[`${prefix}.ten_auto`];

        if (!addrEl || !checkboxEl) return;

        addrEl.addEventListener('input', (e) => {
            // [CẢM BIẾN AI] Chỉ hành động khi user gõ thật
            if (!e.isTrusted) return;

            if (checkboxEl.checked) {
                checkboxEl.checked = false;
                checkboxEl.dispatchEvent(new Event('change', { bubbles: true }));
            }
        });
    }


    _getSchemaOptions(key) {
        if (!this.builder.schema || !this.builder.schema.STRUCTURE) return [];

        for (const group of this.builder.schema.STRUCTURE) {
            const prefix = group.prefix ? `${group.prefix}.` : '';
            if (group.items) {
                for (const item of group.items) {
                    const fullKey = prefix + item.key;
                    if (fullKey === key && item.options) {
                        return item.options;
                    }
                }
            }
        }
        return [];
    }
}

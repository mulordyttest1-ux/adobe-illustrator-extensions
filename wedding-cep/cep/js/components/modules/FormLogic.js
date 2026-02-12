/**
 * FormLogic.js
 * Chuyên trách xử lý logic nghiệp vụ: Venue Auto-fill, Host Type triggers.
 */
import { VenueAutomation } from '../../logic/domain/venue.js'; // Assuming location
import { InputEngine } from '../../logic/ux/InputEngine.js';

export class FormLogic {
    constructor(builder) {
        this.builder = builder;
    }

    /**
     * Setup auto venue filling logic
     */
    /* eslint-disable max-lines-per-function */
    setupAutoVenue() {
        if (!this.builder) return;
        const refs = this.builder.refs;

        const hostRef = refs['ceremony.host_type'];
        const leRef = refs['info.ten_le'];

        // Refs UI
        const ceremonyTen = refs['ceremony.ten'];
        const ceremonyAddr = refs['ceremony.diachi'];
        const ceremonyAuto = refs['ceremony.ten_auto'];

        const venueTen = refs['venue.ten'];
        const venueAddr = refs['venue.diachi'];
        const venueAuto = refs['venue.ten_auto'];
        const pos1Addr = refs['pos1.diachi'];

        // 1. Singleton Constants
        const hostOptions = this._getSchemaOptions('ceremony.host_type');
        const VAL_TRAI = hostOptions[0] || 'Nhà Trai';
        const VAL_GAI = hostOptions[1] || 'Nhà Gái';
        const triggers = this.builder.schema.TRIGGER_CONFIG || {};

        // 2. Logic: Event (Lễ) -> Host (Chủ Tiệc)
        const updateHostFromLe = (leValue) => {
            if (!hostRef || !hostRef.elements) return;

            const sideIndex = triggers[leValue];
            const targetHost = (sideIndex === 1) ? VAL_GAI : VAL_TRAI;

            hostRef.elements.forEach(radio => {
                radio.checked = radio.value === targetHost;
            });

            this.builder._handleChange('ceremony.host_type', targetHost);
            updateAllVenueNames(targetHost);
        };

        // 3. Logic: Host -> Tên & Địa chỉ
        const updateAllVenueNames = (hostValue) => {
            let tuGiaLabel;
            if (typeof VenueAutomation !== 'undefined' && VenueAutomation.generateVenueName) {
                tuGiaLabel = VenueAutomation.generateVenueName(hostValue);
            } else {
                tuGiaLabel = `Tư Gia ${hostValue}`;
            }

            const sourceAddr = pos1Addr ? pos1Addr.value : '';

            // Update LỄ
            if (ceremonyAuto && ceremonyAuto.checked) {
                if (ceremonyTen) {
                    ceremonyTen.value = tuGiaLabel;
                    this.builder._handleChange('ceremony.ten', tuGiaLabel);
                }
                if (ceremonyAddr) {
                    ceremonyAddr.value = sourceAddr;
                    this.builder._handleChange('ceremony.diachi', sourceAddr);
                    if (typeof InputEngine !== 'undefined') InputEngine.process(sourceAddr, 'ceremony.diachi', {}, this.builder.schema);
                }
            }

            // Update TIỆC
            if (venueAuto && venueAuto.checked) {
                if (venueTen) {
                    venueTen.value = tuGiaLabel;
                    this.builder._handleChange('venue.ten', tuGiaLabel);
                }
                if (venueAddr) {
                    venueAddr.value = sourceAddr;
                    this.builder._handleChange('venue.diachi', sourceAddr);
                }
            }
        };

        // --- BINDING EVENTS ---
        if (leRef && leRef.elements) {
            leRef.elements.forEach(radio => {
                radio.addEventListener('change', () => updateHostFromLe(radio.value));
            });
        }

        if (hostRef && hostRef.elements) {
            hostRef.elements.forEach(radio => {
                radio.addEventListener('change', () => updateAllVenueNames(radio.value));
            });
        }

        if (pos1Addr) {
            const triggerUpdate = () => {
                const currentHost = hostRef.elements.find(r => r.checked)?.value || VAL_TRAI;
                updateAllVenueNames(currentHost);
            };
            pos1Addr.addEventListener('input', triggerUpdate);
            pos1Addr.addEventListener('blur', triggerUpdate);
        }
        // Logic: Khi người dùng tự nhập tên Lễ/Tiệc -> Tự động bỏ check Auto
        const handleManualInput = (inputEl, checkboxEl) => {
            if (!inputEl || !checkboxEl) return;

            inputEl.addEventListener('input', () => {
                // Nếu đang check Auto mà người dùng gõ -> Bỏ check ngay
                if (checkboxEl.checked) {
                    checkboxEl.checked = false;
                    // Cập nhật lại data trong builder để đồng bộ
                    // const key = checkboxEl.dataset.key || checkboxEl.name; // Tuỳ cách bạn đặt attribute, hoặc gọi update thủ công
                    // Cách đơn giản nhất: update trực tiếp data object nếu builder expose
                    if (this.builder.data) {
                        // Tìm key của checkbox (vd: ceremony.ten_auto)
                        const chkKey = Object.keys(this.builder.refs).find(k => this.builder.refs[k] === checkboxEl);
                        if (chkKey) this.builder._handleChange(chkKey, false);
                    }
                }
            });
        };

        handleManualInput(ceremonyTen, ceremonyAuto);
        handleManualInput(venueTen, venueAuto);
        // Init
        const currentChecked = hostRef?.elements?.find(r => r.checked);
        const initHost = currentChecked?.value || VAL_TRAI;
        updateAllVenueNames(initHost);
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


import {
    getCheckedRadioValue,
    getSchemaOptions,
    setRadioGroupValue,
    syncControlValue
} from './venueAutomationSupport.js';

export function createVenueContext(builder) {
    if (!builder) {
        return null;
    }

    const refs = builder.refs || {};
    const hostOptions = getSchemaOptions(builder.schema, 'ceremony.host_type');

    return {
        refs,
        hostRef: refs['ceremony.host_type'],
        leRef: refs['info.ten_le'],
        pos1Addr: refs['pos1.diachi'],
        hostValues: {
            trai: hostOptions[0] || 'Nh\u00e0 Trai',
            gai: hostOptions[1] || 'Nh\u00e0 G\u00e1i'
        },
        triggers: builder.schema?.TRIGGER_CONFIG || {}
    };
}

export function getCurrentHost(context) {
    return getCheckedRadioValue(context.hostRef, context.hostValues.trai);
}

export function bindVenueRefreshTriggers({
    context,
    onLeChange,
    onHostChange,
    onAddressChange,
    onAutoToggle
}) {
    context.leRef?.elements?.forEach((radio) => {
        radio.addEventListener('change', () => onLeChange(radio.value));
    });

    context.hostRef?.elements?.forEach((radio) => {
        radio.addEventListener('change', () => onHostChange(radio.value));
    });

    if (context.pos1Addr) {
        context.pos1Addr.addEventListener('input', onAddressChange);
        context.pos1Addr.addEventListener('blur', onAddressChange);
    }

    ['ceremony.ten_auto', 'venue.ten_auto'].forEach((autoKey) => {
        const checkbox = context.refs[autoKey];
        if (checkbox) {
            checkbox.addEventListener('change', onAutoToggle);
        }
    });
}

export function updateHostFromLe({
    leValue,
    refs,
    triggers,
    hostValues,
    createChangeEvent
}) {
    const hostRef = refs['ceremony.host_type'];
    if (!hostRef?.elements) {
        return false;
    }

    const targetHost = triggers[leValue] === 1 ? hostValues.gai : hostValues.trai;
    const changed = setRadioGroupValue(hostRef, targetHost);

    if (!changed) {
        return false;
    }

    const checkedRadio = hostRef.elements.find((radio) => radio.checked);
    if (checkedRadio) {
        checkedRadio.dispatchEvent(createChangeEvent());
    }

    return true;
}

export function resolveVenueLabel(hostValue, venueAutomation) {
    if (venueAutomation?.generateVenueName) {
        return venueAutomation.generateVenueName(hostValue);
    }

    return `T\u01b0 Gia ${hostValue}`;
}

export function refreshVenueSections({
    hostValue,
    context,
    venueAutomation,
    onCeremonyAddressChanged
}) {
    const refs = context.refs;
    const venueLabel = resolveVenueLabel(hostValue, venueAutomation);
    const sourceAddr = refs['pos1.diachi'] ? refs['pos1.diachi'].value : '';

    updateVenueSection({
        prefix: 'ceremony',
        venueLabel,
        sourceAddr,
        refs,
        onAddressChanged: onCeremonyAddressChanged
    });
    updateVenueSection({
        prefix: 'venue',
        venueLabel,
        sourceAddr,
        refs
    });
}

export function updateVenueSection({
    prefix,
    venueLabel,
    sourceAddr,
    refs,
    onAddressChanged
}) {
    const autoCb = refs[`${prefix}.ten_auto`];
    if (!autoCb?.checked) {
        return false;
    }

    const tenEl = refs[`${prefix}.ten`];
    const addrEl = refs[`${prefix}.diachi`];

    syncControlValue(tenEl, venueLabel);

    const addressChanged = syncControlValue(addrEl, sourceAddr);
    if (addressChanged && prefix === 'ceremony' && onAddressChanged) {
        onAddressChanged(sourceAddr);
    }

    return true;
}

export function wireManualVenueCancellation({
    refs,
    createChangeEvent,
    prefixes = ['ceremony', 'venue']
}) {
    prefixes.forEach((prefix) => {
        bindTrustedAutoCancellation({
            inputEl: refs[`${prefix}.ten`],
            checkboxEl: refs[`${prefix}.ten_auto`],
            createChangeEvent
        });
        bindTrustedAutoCancellation({
            inputEl: refs[`${prefix}.diachi`],
            checkboxEl: refs[`${prefix}.ten_auto`],
            createChangeEvent
        });
    });
}

export function bindTrustedAutoCancellation({
    inputEl,
    checkboxEl,
    createChangeEvent
}) {
    if (!inputEl || !checkboxEl) {
        return;
    }

    inputEl.addEventListener('input', (event) => {
        if (!event.isTrusted || !checkboxEl.checked) {
            return;
        }

        checkboxEl.checked = false;
        checkboxEl.dispatchEvent(createChangeEvent());
    });
}

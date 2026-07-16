import { VenueAutomation } from '@wedding/domain';

const DEFAULT_HOST_TYPE = 'Nh\u00E0 Trai';
const POS1_PREFIX = 'pos1.';
const POS2_PREFIX = 'pos2.';
const PRESERVED_KEYS = new Set(['pos1.vithu', 'pos2.vithu']);
const AUTO_VENUE_PREFIXES = ['ceremony', 'venue'];

function isAutoEnabled(value) {
    return value === true || value === 'true';
}

function swapKey(key) {
    if (PRESERVED_KEYS.has(key)) {
        return key;
    }

    if (key.startsWith(POS1_PREFIX)) {
        return key.replace(POS1_PREFIX, POS2_PREFIX);
    }

    if (key.startsWith(POS2_PREFIX)) {
        return key.replace(POS2_PREFIX, POS1_PREFIX);
    }

    return key;
}

function swapPosData(data) {
    const nextData = {};

    Object.entries(data).forEach(([key, value]) => {
        nextData[swapKey(key)] = value;
    });

    return nextData;
}

function applyAutoVenueData(data, deps = {}) {
    const venueAutomation = deps.venueAutomation || VenueAutomation;
    const nextData = { ...data };
    const hostType = nextData['ceremony.host_type'] || DEFAULT_HOST_TYPE;
    const venueName = venueAutomation.generateVenueName(hostType);
    const sourceAddress = nextData['pos1.diachi'] || '';

    AUTO_VENUE_PREFIXES.forEach((prefix) => {
        if (!isAutoEnabled(nextData[`${prefix}.ten_auto`])) {
            return;
        }

        nextData[`${prefix}.ten`] = venueName;
        nextData[`${prefix}.diachi`] = sourceAddress;
    });

    return nextData;
}

export function runSwapInvitationSides({ data = {} } = {}, deps = {}) {
    const swappedData = swapPosData(data);
    const nextData = applyAutoVenueData(swappedData, deps);

    return {
        data: nextData
    };
}

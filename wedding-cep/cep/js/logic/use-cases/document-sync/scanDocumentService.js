import { WeddingRules, VenueAutomation } from '@wedding/domain';
import { DataValidator } from '../../pipeline/DataValidator.js';
import { KeyNormalizer } from '../../pipeline/KeyNormalizer.js';
import { LayoutUtils } from '../../ux/LayoutUtils.js';

const DEFAULT_TRIGGER_CONFIG = Object.freeze({
    'Vu Quy': 1,
    'Thành Hôn': 0,
    'Tân Hôn': 0,
    'Báo Hỷ': 0
});

function inferBrideSide(hostType, tenLe, triggerConfig, weddingRules) {
    if (hostType === 'Nhà Gái') return true;
    if (hostType === 'Nhà Trai') return false;
    return weddingRules.isBrideSide(tenLe, triggerConfig);
}

function mapHostSides(normalized, isPos1Bride) {
    const nextData = { ...normalized };

    if (isPos1Bride) {
        if (nextData['pos1.vithu']) nextData['ui.vithu_nu'] = nextData['pos1.vithu'];
        if (nextData['pos2.vithu']) nextData['ui.vithu_nam'] = nextData['pos2.vithu'];
        return nextData;
    }

    if (nextData['pos1.vithu']) nextData['ui.vithu_nam'] = nextData['pos1.vithu'];
    if (nextData['pos2.vithu']) nextData['ui.vithu_nu'] = nextData['pos2.vithu'];
    return nextData;
}

function normalizeScanData(frames, deps = {}) {
    const validator = deps.validator || new DataValidator();
    const keyNormalizer = deps.keyNormalizer || KeyNormalizer;
    const weddingRules = deps.weddingRules || WeddingRules;
    const venueAutomation = deps.venueAutomation || VenueAutomation;
    const layoutUtils = deps.layoutUtils || LayoutUtils;
    const sortedFrames = layoutUtils.sortFrames(frames);
    const analysis = validator.analyze(sortedFrames);

    let data = keyNormalizer.normalize(analysis.healthyMap);
    data = weddingRules.enrichParentPrefixes(data);
    data = venueAutomation.detectVenueState(data);
    return data;
}

function applyInvitationMapping(data, schema, weddingRules) {
    const triggerConfig = schema?.TRIGGER_CONFIG || DEFAULT_TRIGGER_CONFIG;
    const hostType = data['ceremony.host_type'];
    const tenLe = data['info.ten_le'] || '';
    const isPos1Bride = inferBrideSide(hostType, tenLe, triggerConfig, weddingRules);
    return mapHostSides(data, isPos1Bride);
}

export function runScanDocumentService({ frames = [], schema = null } = {}, deps = {}) {
    const weddingRules = deps.weddingRules || WeddingRules;
    const normalizedData = normalizeScanData(frames, deps);
    const data = applyInvitationMapping(normalizedData, schema, weddingRules);

    return {
        data,
        count: Object.keys(data).length
    };
}

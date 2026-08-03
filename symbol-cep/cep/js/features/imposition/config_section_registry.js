const SECTION_REGISTRY = [
    { id: 'sec_artboard', group: 'A', adapter: 'compact', fieldIds: ['ab_w', 'ab_h'] },
    { id: 'sec_size', group: 'A', adapter: 'compact', fieldIds: ['finish_w', 'finish_h'] },
    { id: 'sec_resize_mode', group: 'A', adapter: 'dense' },
    { id: 'sec_output_save', group: 'A', adapter: 'dense' },
    { id: 'sec_marks', group: 'A', adapter: 'dense' },
    { id: 'sec_sheet_layout', group: 'B', adapter: 'sheet-layout' },
    { id: 'sec_margins', group: 'B', adapter: 'margins' },
    { id: 'sec_options', group: 'C', adapter: 'options' },
    { id: 'pasteboard', group: 'C', adapter: 'pasteboard' }
];

export const CONFIG_SECTION_REGISTRY = Object.freeze(
    SECTION_REGISTRY.map((descriptor) => Object.freeze({
        ...descriptor,
        fieldIds: descriptor.fieldIds ? Object.freeze(descriptor.fieldIds.slice()) : undefined
    }))
);

const BY_ID = new Map(CONFIG_SECTION_REGISTRY.map((descriptor) => [descriptor.id, descriptor]));

export function getConfigSectionDescriptor(id) {
    return BY_ID.get(id) || null;
}

export function getRenderableConfigSectionDescriptors() {
    return CONFIG_SECTION_REGISTRY.filter((descriptor) => descriptor.adapter !== 'pasteboard');
}

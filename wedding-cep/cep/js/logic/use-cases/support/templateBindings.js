import { TemplatePlaceholderCodec } from '../../pipeline/TemplatePlaceholderCodec.js';

export function extractTemplateBindingsFromFrames(frames = []) {
    const bindings = new Set();

    frames.forEach((frame) => {
        const metaKeys = Array.isArray(frame?.meta_keys) ? frame.meta_keys : [];
        metaKeys.forEach((key) => {
            if (typeof key === 'string' && key) {
                bindings.add(key);
            }
        });

        TemplatePlaceholderCodec.collectKeys(frame?.raw_content || frame?.content || '', bindings);
    });

    return [...bindings].sort();
}

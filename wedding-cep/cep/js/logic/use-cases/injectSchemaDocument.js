import { runInjectSchemaDocumentService } from './template-authoring/injectSchemaDocumentService.js';

export function runInjectSchemaDocument({ frames = [], targetType = 'tiec' } = {}, deps = {}) {
    const execute = deps.runInjectSchemaDocumentService || runInjectSchemaDocumentService;
    return execute({ frames, targetType }, deps);
}

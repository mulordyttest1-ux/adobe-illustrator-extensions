/**
 * Compatibility surface for legacy imports that expected ConfigEngine plus
 * schema mutation helpers in one module. This module no longer mutates
 * ConfigEngine at import time.
 */
import { ConfigEngine as BaseConfigEngine } from './config_engine.js';
import { SchemaMutationService } from './schema_mutation_service.js';

export const ConfigEngine = {
    ...BaseConfigEngine,
    ...SchemaMutationService
};

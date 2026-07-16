import { GarbageRule } from '../imposition/preflight/rules/GarbageRule.js';
import { GroupCheckRule } from '../imposition/preflight/rules/GroupCheckRule.js';
import { PasteboardInfoRule } from '../imposition/postflight/rules/PasteboardInfoRule.js';

export const PREFLIGHT_RULE_REGISTRY = [
    GroupCheckRule,
    GarbageRule
];

export const POSTFLIGHT_RULE_REGISTRY = [
    () => new PasteboardInfoRule()
];

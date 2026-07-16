import { createCepLintConfig } from "../../shared/eslint.config.mjs";

const WEDDING_BASE_SYNTAX_RULES = [
    {
        selector: "MemberExpression[object.name='window'][property.name='showToast']",
        message: "window.showToast was removed. Use UIFeedback.showToast() instead."
    },
    {
        selector: "MemberExpression[object.name='ctx'][property.name='showToast']",
        message: "ctx.showToast was removed. Use UIFeedback.showToast() instead."
    }
];

const WEDDING_GLOBAL_WRITE_RULES = [
    {
        selector: "AssignmentExpression[left.type='MemberExpression'][left.object.name='window']",
        message: "App globals must not be published on window. Only the bootstrap contracts are allowed."
    },
    {
        selector: "AssignmentExpression[left.type='MemberExpression'][left.object.name='globalThis']",
        message: "App globals must not be published on globalThis. Only the bootstrap contracts are allowed."
    },
    {
        selector: "CallExpression[callee.object.name='Object'][callee.property.name='assign'][arguments.0.name='window']",
        message: "Object.assign(window, ...) is forbidden in wedding runtime code."
    },
    {
        selector: "CallExpression[callee.object.name='Object'][callee.property.name='assign'][arguments.0.name='globalThis']",
        message: "Object.assign(globalThis, ...) is forbidden in wedding runtime code."
    }
];

const WEDDING_LEGACY_AMBIENT_GLOBALS = [
    { name: "CSInterface", message: "Use the CEP host adapter instead of CSInterface directly." },
    { name: "Fuse", message: "Use FuseAddressIndex instead of the ambient Fuse global." },
    { name: "SchemaLoader", message: "Import SchemaLoader explicitly instead of reading the ambient global." },
    { name: "WeddingAssembler", message: "Import WeddingAssembler explicitly instead of reading the ambient global." },
    { name: "Normalizer", message: "Import Normalizer explicitly instead of reading the ambient global." },
    { name: "NameAnalysis", message: "Import NameAnalysis explicitly instead of reading the ambient global." },
    { name: "CalendarEngine", message: "Import CalendarEngine explicitly instead of reading the ambient global." },
    { name: "WeddingRules", message: "Import WeddingRules explicitly instead of reading the ambient global." },
    { name: "TimeAutomation", message: "Import TimeAutomation explicitly instead of reading the ambient global." },
    { name: "VenueAutomation", message: "Import VenueAutomation explicitly instead of reading the ambient global." },
    { name: "DateGridWidget", message: "Import DateGridWidget explicitly instead of reading the ambient global." },
    { name: "InputEngine", message: "Import InputEngine explicitly instead of reading the ambient global." },
    { name: "NameValidator", message: "Import NameValidator explicitly instead of reading the ambient global." },
    { name: "AddressAutocomplete", message: "Import AddressAutocomplete explicitly instead of reading the ambient global." },
    { name: "SchemaUtils", message: "Import SchemaUtils explicitly instead of reading the ambient global." },
    { name: "UnicodeNormalizer", message: "Import UnicodeNormalizer explicitly instead of reading the ambient global." },
    { name: "EthnicNameNormalizer", message: "Import EthnicNameNormalizer explicitly instead of reading the ambient global." },
    { name: "FreshStrategy", message: "Import FreshStrategy explicitly instead of reading the ambient global." },
    { name: "SmartComplexStrategy", message: "Import SmartComplexStrategy explicitly instead of reading the ambient global." },
    { name: "StrategyOrchestrator", message: "Import StrategyOrchestrator explicitly instead of reading the ambient global." }
];

const WEDDING_CEP_VENDOR_ACCESS_RULES = [
    {
        selector: "MemberExpression[object.name='window'][property.name='__adobe_cep__']",
        message: "Use the CEP host adapter instead of window.__adobe_cep__ directly."
    },
    {
        selector: "MemberExpression[object.name='window'][property.name='cep']",
        message: "Use the CEP host adapter instead of window.cep directly."
    },
    {
        selector: "MemberExpression[object.name='window'][property.name='require']",
        message: "Use the CEP host adapter instead of window.require directly."
    },
    {
        selector: "MemberExpression[object.name='globalThis'][property.name='require']",
        message: "Use the CEP host adapter instead of globalThis.require directly."
    },
    {
        selector: "MemberExpression[object.name='window'][property.name='Fuse']",
        message: "Use FuseAddressIndex instead of window.Fuse directly."
    },
    {
        selector: "MemberExpression[object.name='globalThis'][property.name='Fuse']",
        message: "Use FuseAddressIndex instead of globalThis.Fuse directly."
    }
];

const WEDDING_STARTUP_GLOBAL_RULES = [
    {
        selector: "AssignmentExpression[left.type='MemberExpression'][left.object.name='window'][left.property.name!='__WEDDING_APP_READY__']",
        message: "startup.js may only publish __WEDDING_APP_READY__ on window."
    },
    {
        selector: "AssignmentExpression[left.type='MemberExpression'][left.object.name='globalThis'][left.property.name!='__WEDDING_APP_READY__']",
        message: "startup.js may only publish __WEDDING_APP_READY__ on globalThis."
    },
    {
        selector: "CallExpression[callee.object.name='Object'][callee.property.name='assign'][arguments.0.name='window']",
        message: "Object.assign(window, ...) is forbidden in startup.js."
    },
    {
        selector: "CallExpression[callee.object.name='Object'][callee.property.name='assign'][arguments.0.name='globalThis']",
        message: "Object.assign(globalThis, ...) is forbidden in startup.js."
    }
];

const WEDDING_TEST_API_GLOBAL_RULES = [
    {
        selector: "AssignmentExpression[left.type='MemberExpression'][left.object.name='window'][left.property.name!='__WEDDING_TEST_API__']",
        message: "testApi.js may only publish __WEDDING_TEST_API__ on window."
    },
    {
        selector: "AssignmentExpression[left.type='MemberExpression'][left.object.name='globalThis'][left.property.name!='__WEDDING_TEST_API__']",
        message: "testApi.js may only publish __WEDDING_TEST_API__ on globalThis."
    },
    {
        selector: "CallExpression[callee.object.name='Object'][callee.property.name='assign'][arguments.0.name='window']",
        message: "Object.assign(window, ...) is forbidden in testApi.js."
    },
    {
        selector: "CallExpression[callee.object.name='Object'][callee.property.name='assign'][arguments.0.name='globalThis']",
        message: "Object.assign(globalThis, ...) is forbidden in testApi.js."
    }
];

const WEDDING_RULES = {
    "no-alert": "error",
    "no-restricted-globals": ["error",
        { name: "alert", message: "Use UIFeedback.showToast() instead." },
        { name: "confirm", message: "Use UIFeedback.showToast() instead." },
        { name: "prompt", message: "Use UIFeedback.showToast() instead." }
    ],
    "no-restricted-syntax": ["error", ...WEDDING_BASE_SYNTAX_RULES]
};

const WEDDING_ARCHITECTURE_OVERRIDES = [
    {
        files: ["js/**/*.js"],
        ignores: ["js/**/*.test.js", "js/bootstrap/startup.js", "js/bootstrap/testApi.js", "js/CSInterface.js", "js/infrastructure/cepHost.js", "js/infrastructure/hostFacade.js", "js/logic/ux/search/FuseAddressIndex.js"],
        rules: {
            "no-restricted-imports": ["error", {
                patterns: [
                    {
                        group: ["./controllers/*", "../controllers/*", "../../controllers/*", "../../../controllers/*", "../../../../controllers/*"],
                        message: "Legacy controllers layer was retired. Move modules into components/, logic/, bootstrap/, or infrastructure/."
                    },
                    {
                        group: ["./components/modules/*", "../components/modules/*", "../../components/modules/*", "../../../components/modules/*", "../../../../components/modules/*"],
                        message: "Generic components/modules bucket was retired. Move modules into named UI slices."
                    },
                    {
                        group: ["./bridge.js", "../bridge.js", "../../bridge.js", "../../../bridge.js", "../../../../bridge.js"],
                        message: "Top-level bridge.js was retired. Import infrastructure/bridge.js instead."
                    },
                    {
                        group: ["./schemaLoader.js", "../schemaLoader.js", "../../schemaLoader.js", "../../../schemaLoader.js", "../../../../schemaLoader.js"],
                        message: "Top-level schemaLoader.js was retired. Import infrastructure/schemaLoader.js instead."
                    }
                ]
            }],
            "no-restricted-globals": ["error", ...WEDDING_LEGACY_AMBIENT_GLOBALS],
            "no-restricted-syntax": ["error", ...WEDDING_BASE_SYNTAX_RULES, ...WEDDING_GLOBAL_WRITE_RULES, ...WEDDING_CEP_VENDOR_ACCESS_RULES]
        }
    },
    {
        files: ["js/logic/ux/search/FuseAddressIndex.js"],
        rules: {
            "no-restricted-globals": ["error", ...WEDDING_LEGACY_AMBIENT_GLOBALS.filter((entry) => entry.name !== "Fuse")],
            "no-restricted-syntax": ["error", ...WEDDING_BASE_SYNTAX_RULES, ...WEDDING_GLOBAL_WRITE_RULES, ...WEDDING_CEP_VENDOR_ACCESS_RULES.filter((rule) => !String(rule.selector).includes("[property.name='Fuse']"))]
        }
    },
    {
        files: ["js/bootstrap/startup.js"],
        rules: {
            "no-restricted-globals": ["error", ...WEDDING_LEGACY_AMBIENT_GLOBALS],
            "no-restricted-syntax": ["error", ...WEDDING_BASE_SYNTAX_RULES, ...WEDDING_STARTUP_GLOBAL_RULES, ...WEDDING_CEP_VENDOR_ACCESS_RULES]
        }
    },
    {
        files: ["js/bootstrap/testApi.js"],
        rules: {
            "no-restricted-globals": ["error", ...WEDDING_LEGACY_AMBIENT_GLOBALS],
            "no-restricted-syntax": ["error", ...WEDDING_BASE_SYNTAX_RULES, ...WEDDING_TEST_API_GLOBAL_RULES, ...WEDDING_CEP_VENDOR_ACCESS_RULES]
        }
    },
    {
        files: ["js/logic/**/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                patterns: [
                    { group: ["../components/*", "../../components/*", "../../../components/*"], message: "Logic KHONG duoc import tu Components" },
                    { group: ["../controllers/*", "../../controllers/*", "../../../controllers/*"], message: "Logic KHONG duoc import tu Controllers" },
                    { group: ["../actions/*", "../../actions/*", "../../../actions/*"], message: "Logic KHONG duoc import tu Actions" },
                    { group: ["../infrastructure/bridge*", "../../infrastructure/bridge*", "../../../infrastructure/bridge*"], message: "Logic KHONG duoc import tu Bridge" }
                ]
            }]
        }
    }
];

export default createCepLintConfig({
    namePrefix: "wedding-app",
    ignores: [
        "**/bundle.js",
        "js/libs/**",
        "dist/**",
        "node_modules/**"
    ],
    files: ["js/**/*.js", "js/**/*.mjs"],
    rules: WEDDING_RULES,
    extraArchitectureConfig: WEDDING_ARCHITECTURE_OVERRIDES
});

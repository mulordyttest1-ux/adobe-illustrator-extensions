import { createCepLintConfig } from "../../shared/eslint.config.mjs";

const TOOLKIT_GLOBAL_WRITE_RULES = [
    {
        selector: "AssignmentExpression[left.type='MemberExpression'][left.object.name='window']",
        message: "Toolkit runtime globals must stay behind startup/testApi contracts."
    },
    {
        selector: "AssignmentExpression[left.type='MemberExpression'][left.object.name='globalThis']",
        message: "Toolkit runtime globals must stay behind startup/testApi contracts."
    }
];

const TOOLKIT_CEP_VENDOR_ACCESS_RULES = [
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
        selector: "MemberExpression[object.name='globalThis'][property.name='Fuse']",
        message: "Use ToolkitCatalogSearch instead of globalThis.Fuse directly."
    }
];

const TOOLKIT_RULES = {
    "no-alert": "error",
    "no-restricted-globals": ["error",
        { name: "alert", message: "Use UIFeedback.showToast() instead." },
        { name: "confirm", message: "Use the in-panel confirm service instead." },
        { name: "prompt", message: "Use a future shell capability instead of prompt()." }
    ]
};

const TOOLKIT_ARCHITECTURE_OVERRIDES = [
    {
        files: ["js/**/*.js"],
        ignores: [
            "js/**/*.test.js",
            "js/bootstrap/startup.js",
            "js/bootstrap/testApi.js",
            "js/infrastructure/cepHost.js",
            "js/infrastructure/hostFacade.js",
            "js/features/catalog/moduleCatalogSearch.js"
        ],
        rules: {
            "no-restricted-syntax": ["error", ...TOOLKIT_GLOBAL_WRITE_RULES, ...TOOLKIT_CEP_VENDOR_ACCESS_RULES]
        }
    },
    {
        files: ["js/bootstrap/startup.js"],
        rules: {
            "no-restricted-syntax": ["error",
                ...TOOLKIT_CEP_VENDOR_ACCESS_RULES,
                {
                    selector: "AssignmentExpression[left.type='MemberExpression'][left.object.name='window'][left.property.name!='__TOOLKIT_APP_READY__']",
                    message: "startup.js may only publish __TOOLKIT_APP_READY__."
                }
            ]
        }
    },
    {
        files: ["js/bootstrap/testApi.js"],
        rules: {
            "no-restricted-syntax": ["error",
                ...TOOLKIT_CEP_VENDOR_ACCESS_RULES,
                {
                    selector: "AssignmentExpression[left.type='MemberExpression'][left.object.name='window'][left.property.name!='__TOOLKIT_TEST_API__']",
                    message: "testApi.js may only publish __TOOLKIT_TEST_API__."
                }
            ]
        }
    },
    {
        files: ["js/features/catalog/moduleCatalogSearch.js"],
        rules: {
            "no-restricted-syntax": ["error", ...TOOLKIT_GLOBAL_WRITE_RULES]
        }
    },
    {
        files: ["js/features/**/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                patterns: [
                    { group: ["../infrastructure/*", "../../infrastructure/*"], message: "Shell and catalog logic must go through injected seams, not raw infrastructure imports." }
                ]
            }]
        }
    },
    {
        files: ["js/features/run/**/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                patterns: [
                    { group: ["../../bootstrap/*", "../bootstrap/*"], message: "Run flow must not import bootstrap modules directly." }
                ]
            }]
        }
    }
];

export default createCepLintConfig({
    namePrefix: "toolkit-cep",
    files: ["js/**/*.js"],
    rules: TOOLKIT_RULES,
    extraArchitectureConfig: TOOLKIT_ARCHITECTURE_OVERRIDES
});

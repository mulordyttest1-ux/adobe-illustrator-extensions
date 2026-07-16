import globals from "globals";
import js from "@eslint/js";
import nxPlugin from "@nx/eslint-plugin";

/**
 * Shared ESLint flat config for CEP apps and repo libs.
 * Inline suppressions are still allowed today, but unused disables are errors.
 */

const DEFAULT_IGNORES = [
    "**/bundle.js",
    "**/js/libs/**",
    "dist/**",
    "node_modules/**"
];

const SHARED_LINTER_OPTIONS = {
    reportUnusedDisableDirectives: "error"
};

export const CEP_APP_LANGUAGE_OPTIONS = {
    ecmaVersion: 2020,
    sourceType: "module",
    globals: {
        ...globals.browser,
        ...globals.node,

        // Adobe CEP
        CSInterface: "readonly",
        SystemPath: "readonly",

        // Shared domain globals
        ImpositionDomain: "writable",
        WeddingRules: "readonly",
        NameAnalysis: "readonly",
        CalendarEngine: "readonly",
        TimeAutomation: "readonly",
        VenueAutomation: "readonly",
        SmartContent: "readonly",
        ConflictResolver: "readonly",
        DataResolver: "readonly",
        IsolationChecker: "readonly",

        // Core
        StringUtils: "readonly",
        DateUtils: "readonly",

        // Pipeline
        Normalizer: "readonly",
        Validator: "readonly",
        DataValidator: "readonly",
        WeddingAssembler: "readonly",

        // Strategies
        StrategyOrchestrator: "readonly",
        SmartComplexStrategy: "readonly",
        FreshStrategy: "readonly",

        // UX
        InputEngine: "readonly",
        NameNormalizer: "readonly",
        AddressNormalizer: "readonly",
        DateNormalizer: "readonly",
        NameValidator: "readonly",
        AddressValidator: "readonly",
        DateValidator: "readonly",
        UnicodeNormalizer: "readonly",
        AddressAutocomplete: "readonly",

        // Components
        DomFactory: "readonly",
        DateGridWidget: "readonly",
        DateGridRenderer: "readonly",
        DateGridDOM: "readonly",
        TabbedPanel: "readonly",
        DateLogic: "readonly",
        AddressService: "readonly",
        FormLogic: "readonly",
        FormComponents: "readonly",
        CompactFormBuilder: "readonly",

        // Controllers
        UIFeedback: "readonly",
        KeyNormalizer: "readonly",
        WeddingProActionHandler: "readonly",
        ConfigController: "readonly",
        SchemaLoader: "readonly",

        // Actions
        ScanAction: "readonly",
        UpdateAction: "readonly",
        SwapAction: "readonly",

        bridge: "readonly"
    }
};

export const SHARED_LIB_LANGUAGE_OPTIONS = {
    ecmaVersion: 2020,
    sourceType: "module",
    globals: {
        ...globals.browser
    }
};

export const PURE_LIB_LANGUAGE_OPTIONS = {
    ecmaVersion: 2020,
    sourceType: "module",
    globals: {}
};

export const NODE_TOOLING_LANGUAGE_OPTIONS = {
    ecmaVersion: 2020,
    sourceType: "commonjs",
    globals: {
        ...globals.node
    }
};

export const CEP_RULES = {
    "no-undef": "error",
    "no-unused-vars": ["error", {
        argsIgnorePattern: "^_",
        varsIgnorePattern: "^_"
    }],
    "max-lines-per-function": ["error", {
        max: 80,
        skipBlankLines: true,
        skipComments: true
    }],
    "max-depth": ["error", 4],
    "max-params": ["warn", 4],
    "complexity": ["warn", 12],
    "consistent-return": "warn",
    "no-var": "error",
    "prefer-const": "warn",
    "no-duplicate-imports": "error",
    "eqeqeq": ["error", "always"],
    "no-eval": "error",
    "no-implied-eval": "error",
    "no-empty": "warn",
    "camelcase": ["warn", { properties: "never", ignoreDestructuring: true }],
    "no-restricted-imports": ["error", {
        patterns: [
            {
                group: ["wedding-scripter-cep", "imposition-panel-cep"],
                message: "\u274c SCOPE VIOLATION: App chi duoc import tu shared/domain packages, khong import package cua app khac."
            },
            {
                group: ["**/wedding-cep/**", "../../wedding-cep/**", "../../../wedding-cep/**"],
                message: "\u274c SCOPE VIOLATION: Dung import truc tiep tu wedding-cep. Dung @shared/cep-ui thay the."
            },
            {
                group: ["**/symbol-cep/**", "../../symbol-cep/**", "../../../symbol-cep/**"],
                message: "\u274c SCOPE VIOLATION: Dung import truc tiep tu symbol-cep. Dung @shared/cep-ui thay the."
            }
        ]
    }]
};

export const SHARED_ARCHITECTURE_OVERRIDES = [
    {
        name: "cep/domain-architecture",
        files: ["**/js/logic/domain/**/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                patterns: [
                    { group: ["../pipeline/*", "../../pipeline/*"], message: "Domain KHONG duoc import tu Pipeline" },
                    { group: ["../strategies/*", "../../strategies/*"], message: "Domain KHONG duoc import tu Strategies" },
                    { group: ["../../components/*", "../components/*"], message: "Domain KHONG duoc import tu Components" },
                    { group: ["../../controllers/*", "../controllers/*"], message: "Domain KHONG duoc import tu Controllers" },
                    { group: ["../../actions/*", "../actions/*"], message: "Domain KHONG duoc import tu Actions" },
                    { group: ["../../bridge*"], message: "Domain KHONG duoc import tu Bridge" }
                ]
            }]
        }
    },
    {
        name: "cep/core-architecture",
        files: ["**/js/logic/core/**/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                patterns: [
                    { group: ["../*", "../../*"], message: "Core KHONG duoc import tu bat ky module nao khac" }
                ]
            }]
        }
    },
    {
        name: "cep/pipeline-architecture",
        files: ["**/js/logic/pipeline/**/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                patterns: [
                    { group: ["../../components/*"], message: "Pipeline KHONG duoc import tu Components" },
                    { group: ["../../controllers/*"], message: "Pipeline KHONG duoc import tu Controllers" },
                    { group: ["../../actions/*"], message: "Pipeline KHONG duoc import tu Actions" }
                ]
            }]
        }
    }
];

export const TEST_OVERRIDES = {
    name: "cep/tests",
    files: ["**/*.test.js"],
    rules: {
        "max-lines-per-function": "off",
        "no-undef": "off",
        "no-unused-vars": "off"
    }
};

export const NODE_TOOLING_OVERRIDES = {
    name: "cep/node-tooling",
    files: [
        "**/*.cjs",
        "**/build.cjs",
        "**/scripts/**/*.cjs",
        "**/debug_scripts/**/*.cjs"
    ],
    languageOptions: NODE_TOOLING_LANGUAGE_OPTIONS
};

export const NX_BOUNDARY_OVERRIDES = {
    name: "cep/nx-boundaries",
    plugins: { "@nx": nxPlugin },
    rules: {
        "@nx/enforce-module-boundaries": ["error", {
            enforceBuildableLibDependency: true,
            allow: [],
            depConstraints: [
                { sourceTag: "scope:domain", onlyDependOnLibsWithTags: [] },
                { sourceTag: "scope:shared", onlyDependOnLibsWithTags: ["scope:shared"] },
                { sourceTag: "scope:app", onlyDependOnLibsWithTags: ["scope:domain", "scope:shared"] }
            ]
        }]
    }
};

export function createCepLintConfig({
    namePrefix = "cep",
    ignores = DEFAULT_IGNORES,
    files = ["**/cep/js/**/*.js", "**/cep/js/**/*.mjs", "libs/**/*.js", "libs/**/*.ts"],
    languageOptions = CEP_APP_LANGUAGE_OPTIONS,
    globals: extraGlobals = {},
    rules: extraRules = {},
    linterOptions = SHARED_LINTER_OPTIONS,
    extraArchitectureConfig = [],
    extraConfig = [],
    includeNx = true
} = {}) {
    const mergedLanguageOptions = {
        ...languageOptions,
        globals: {
            ...(languageOptions.globals || {}),
            ...extraGlobals
        }
    };

    return [
        {
            name: `${namePrefix}/ignores`,
            ignores
        },
        js.configs.recommended,
        {
            name: `${namePrefix}/main`,
            files,
            linterOptions,
            languageOptions: mergedLanguageOptions,
            rules: {
                ...CEP_RULES,
                ...extraRules
            }
        },
        ...extraArchitectureConfig,
        ...SHARED_ARCHITECTURE_OVERRIDES,
        TEST_OVERRIDES,
        NODE_TOOLING_OVERRIDES,
        ...(includeNx ? [NX_BOUNDARY_OVERRIDES] : []),
        ...extraConfig
    ];
}

export default createCepLintConfig();


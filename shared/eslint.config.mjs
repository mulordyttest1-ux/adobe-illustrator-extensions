import globals from "globals";
import js from "@eslint/js";

/**
 * ESLint Configuration (Flat Config) — Agent Governance Rules
 * 
 * PURPOSE: Enforce architecture boundaries and naming conventions.
 * Agent CANNOT bypass these rules via eslint-disable comments.
 */

export default [
    // 1. Global Ignores
    {
        ignores: [
            "**/bundle.js",
            "**/libs/**",
            "dist/**",
            "node_modules/**"
        ]
    },

    // 2. Base Configuration (Recommended)
    js.configs.recommended,

    // 3. Main Rules & Globals
    {
        files: ["**/cep/js/**/*.js", "**/cep/js/**/*.mjs"],
        languageOptions: {
            ecmaVersion: 2020,
            sourceType: "module",
            globals: {
                ...globals.browser,
                ...globals.node,

                // Adobe CEP
                CSInterface: "readonly",

                // Symbol CEP Domain
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

                // App utilities
                showToast: "readonly",
                bridge: "readonly"
            }
        },
        rules: {
            // --- Anti-Hallucination ---
            "no-undef": "error",                    // F2: Chặn gọi hàm/biến không tồn tại
            "no-unused-vars": ["error", {           // C5: Chặn biến rác
                argsIgnorePattern: "^_",            // Cho phép _unused params
                varsIgnorePattern: "^_"
            }],

            // --- Anti-Over-Engineering ---
            "max-lines-per-function": ["error", {   // F4: Hàm tối đa 80 dòng
                max: 80,
                skipBlankLines: true,
                skipComments: true
            }],
            "max-depth": ["error", 4],              // F4: Chặn nesting quá sâu
            "max-params": ["warn", 4],              // F4: Cảnh báo quá nhiều tham số

            // --- Anti-Complexity ---
            "complexity": ["warn", 12],             // Cảnh báo logic quá phức tạp
            "consistent-return": "warn",            // Kiểu trả về nhất quán

            // --- Code Quality ---
            "no-var": "error",                      // Enforce const/let
            "prefer-const": "warn",                 // Ưu tiên const
            "no-duplicate-imports": "error",        // Chặn import trùng lặp
            "eqeqeq": ["error", "always"],          // Luôn dùng ===
            "no-eval": "error",                     // Chặn eval()
            "no-implied-eval": "error",             // Chặn implied eval
            "no-empty": "warn"
        }
    },

    // 4. Overrides: Architecture Boundaries
    {
        // DOMAIN LAYER: Pure, no dependency on upper layers
        files: ["**/js/logic/domain/**/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                patterns: [
                    { group: ["../pipeline/*", "../../pipeline/*"], message: "Domain KHÔNG được import từ Pipeline" },
                    { group: ["../strategies/*", "../../strategies/*"], message: "Domain KHÔNG được import từ Strategies" },
                    { group: ["../../components/*", "../components/*"], message: "Domain KHÔNG được import từ Components" },
                    { group: ["../../controllers/*", "../controllers/*"], message: "Domain KHÔNG được import từ Controllers" },
                    { group: ["../../actions/*", "../actions/*"], message: "Domain KHÔNG được import từ Actions" },
                    { group: ["../../bridge*"], message: "Domain KHÔNG được import từ Bridge" }
                ]
            }]
        }
    },
    {
        // CORE LAYER: Purest utilities
        files: ["**/js/logic/core/**/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                patterns: [
                    { group: ["../*", "../../*"], message: "Core KHÔNG được import từ bất kỳ module nào khác" }
                ]
            }]
        }
    },
    {
        // PIPELINE LAYER: Import from Domain/Core only (plus libs)
        files: ["**/js/logic/pipeline/**/*.js"],
        rules: {
            "no-restricted-imports": ["error", {
                patterns: [
                    { group: ["../../components/*"], message: "Pipeline KHÔNG được import từ Components" },
                    { group: ["../../controllers/*"], message: "Pipeline KHÔNG được import từ Controllers" },
                    { group: ["../../actions/*"], message: "Pipeline KHÔNG được import từ Actions" }
                ]
            }]
        }
    },

    // 5. Overrides: Tests
    {
        files: ["**/*.test.js"],
        rules: {
            "max-lines-per-function": "off",
            "no-undef": "off",
            "no-unused-vars": "off"
        }
    }
];

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
    forbidden: [
        /* RULES: Architecture Boundaries */
        {
            name: 'no-circular',
            severity: 'warn',
            comment: 'This dependency is part of a circular relationship.',
            from: {},
            to: {
                circular: true
            }
        },
        {
            name: 'no-orphans',
            severity: 'info',
            comment: 'This is an orphan module - no other module depends on it (except tests).',
            from: {
                orphan: true,
                pathNot: '\\.d\\.ts$'
            },
            to: {}
        },
        {
            name: 'logic-cannot-import-ui',
            severity: 'error',
            comment: 'Logic Layer (L1/L2) must NOT depend on UI/Components (L3).',
            from: {
                path: "^js/logic"
            },
            to: {
                path: "^js/components"
            }
        },
        {
            name: 'domain-must-be-pure',
            severity: 'error',
            comment: 'Domain Layer (L1) must NOT depend on anything external (except untyped utils).',
            from: {
                path: "^js/logic/domain"
            },
            to: {
                path: "^js/(actions|controllers|components|bridge)"
            }
        }
    ],
    options: {
        doNotFollow: {
            path: 'node_modules'
        },
        tsPreCompilationDeps: true,
        enhancedResolveOptions: {
            exportsFields: ["exports"],
            conditionNames: ["import", "require", "node", "default"]
        }
    }
};

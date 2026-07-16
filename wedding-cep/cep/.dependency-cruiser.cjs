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
            comment: 'Logic layer must not depend on components.',
            from: {
                path: "^js/logic"
            },
            to: {
                path: "^js/components"
            }
        },
        {
            name: 'logic-cannot-import-controllers',
            severity: 'error',
            comment: 'Logic layer must not depend on controllers.',
            from: {
                path: "^js/logic"
            },
            to: {
                path: "^js/controllers"
            }
        },
        {
            name: 'logic-cannot-import-actions',
            severity: 'error',
            comment: 'Logic layer must not depend on actions.',
            from: {
                path: "^js/logic"
            },
            to: {
                path: "^js/actions"
            }
        },
        {
            name: 'logic-cannot-import-bridge',
            severity: 'error',
            comment: 'Logic layer must not depend on bridge infrastructure.',
            from: {
                path: "^js/logic"
            },
            to: {
                path: "^js/bridge\\.js$"
            }
        },
        {
            name: 'core-must-stay-isolated',
            severity: 'error',
            comment: 'Core utilities must stay isolated from upper layers.',
            from: {
                path: "^js/logic/core"
            },
            to: {
                path: "^js/(?!logic/core)"
            }
        },
        {
            name: 'pipeline-cannot-import-upper-layers',
            severity: 'error',
            comment: 'Pipeline may depend on logic/domain helpers, but not UI layers.',
            from: {
                path: "^js/logic/pipeline"
            },
            to: {
                path: "^js/(components|controllers|actions)"
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

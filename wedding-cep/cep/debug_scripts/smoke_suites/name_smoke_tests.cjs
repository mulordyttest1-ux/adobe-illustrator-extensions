function registerNameSmokeTests(runner) {
    runner.addTest(
        'NameValidator Ethnic Exemptions v2',
        `
            (function() {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const nameValidator = testApi && testApi.modules ? testApi.modules.nameValidator : null;
                if (!nameValidator) throw new Error('test API nameValidator missing');
                const results = [];

                const res1 = nameValidator.validate("k' Sor (Ama Pui)");
                results.push({ name: "k' Sor (Ama Pui)", valid: res1.valid, warnings: res1.warnings });

                const res2 = nameValidator.validate("Nguyễn H'Hen");
                results.push({ name: "Nguyễn H'Hen", valid: res2.valid, warnings: res2.warnings });

                const res3 = nameValidator.validate("y blo êban");
                results.push({ name: "y blo êban", valid: res3.valid, warnings: res3.warnings });

                return results;
            })()
        `,
        async (results) => {
            const r1 = results.find((result) => result.name === "k' Sor (Ama Pui)");
            if (r1.warnings.length > 0) {
                throw new Error("Ethnic name 'k' Sor (Ama Pui)' should have NO warnings, got: " + JSON.stringify(r1.warnings));
            }

            const r2 = results.find((result) => result.name === "Nguyễn H'Hen");
            if (r2.warnings.some((warning) => warning.type.includes('invalid_'))) {
                throw new Error("Mixed name 'Nguyễn H'Hen' should NOT have phonetic warnings for 'H'Hen'");
            }

            const r3 = results.find((result) => result.name === 'y blo êban');
            if (!r3.valid) {
                throw new Error("Case-insensitive name 'y blo êban' should be valid ethnic name");
            }
        }
    );

    runner.addTest(
        'Bug Investigation: Ama Run (Aê Kroa)',
        `
            (function() {
                const testApi = window.__WEDDING_TEST_API__ || null;
                const nameValidator = testApi && testApi.modules ? testApi.modules.nameValidator : null;
                if (!nameValidator) throw new Error('test API nameValidator missing');
                const res = nameValidator.validate("Ama Run (Aê Kroa)");
                return {
                    name: "Ama Run (Aê Kroa)",
                    isEthnic: nameValidator.isEthnicName("Ama Run (Aê Kroa)"),
                    valid: res.valid,
                    warnings: res.warnings
                };
            })()
        `,
        async (result) => {
            console.log('  Debug Info:', JSON.stringify(result));
            if (!result.isEthnic) {
                throw new Error("FAIL: 'Ama Run (Aê Kroa)' should be detected as ETHNIC");
            }
            if (result.warnings.some((warning) => warning.type === 'special_chars')) {
                throw new Error('FAIL: Should NOT have special_chars warning');
            }
        }
    );
}

module.exports = { registerNameSmokeTests };

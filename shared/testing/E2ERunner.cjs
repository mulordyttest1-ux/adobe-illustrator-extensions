const CDP = require('chrome-remote-interface');

class E2ERunner {
    constructor(config) {
        this.port = config.port;
        this.projectName = config.projectName;
        this.tests = [];
    }

    addTest(name, expression, validator) {
        this.tests.push({ name, expression, validator });
        return this; // For chaining
    }

    async run() {
        let client;
        try {
            console.log(`\n🔌 Connecting to ${this.projectName} (Port ${this.port})...`);
            client = await CDP({ port: this.port, host: 'localhost' });
            const { Runtime } = client;
            await Runtime.enable();

            console.log(`✅ Connected! Running Test Suite for ${this.projectName}...\n`);

            let passed = 0;
            let failed = 0;

            for (let i = 0; i < this.tests.length; i++) {
                const test = this.tests[i];
                console.log(`🧪 [${i + 1}/${this.tests.length}] Testing: ${test.name}`);

                const evaluation = await Runtime.evaluate({ expression: test.expression, returnByValue: true });

                if (evaluation.exceptionDetails) {
                    console.error(`  ❌ fail: Runtime Exception - ${JSON.stringify(evaluation.exceptionDetails)}`);
                    failed++;
                    continue;
                }

                const result = evaluation.result.value || evaluation.result;

                try {
                    await test.validator(result);
                    console.log(`  ✅ pass`);
                    passed++;
                } catch (err) {
                    console.error(`  ❌ fail: ${err.message}`);
                    failed++;
                }
            }

            console.log(`\n📊 Test Run Complete! Passed: ${passed}, Failed: ${failed}`);
            if (failed > 0) {
                console.error(`❌ QA FAILED: Please fix the errors before proceeding.`);
                process.exit(1);
            } else {
                console.log('🎉 ALL TESTS PASSED! Project is healthy.');
            }

        } catch (err) {
            console.error('\n❌ FATAL ERROR (Connection Refused typically means the Panel is closed):', err.message);
            process.exit(1);
        } finally {
            if (client) {
                await client.close();
            }
        }
    }
}

module.exports = { E2ERunner };

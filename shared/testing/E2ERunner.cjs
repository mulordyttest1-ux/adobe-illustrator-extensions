const CDP = require('chrome-remote-interface');

class E2ERunner {
    constructor(config) {
        this.port = config.port;
        this.projectName = config.projectName;
        this.tests = [];
        this.readyExpression = config.readyExpression || null;
        this.readyDetailsExpression = config.readyDetailsExpression || null;
        this.readyTimeoutMs = config.readyTimeoutMs || 10000;
        this.readyPollMs = config.readyPollMs || 100;
    }

    addTest(name, expression, validator) {
        this.tests.push({ name, expression, validator });
        return this;
    }

    _assertTestsRegistered() {
        if (this.tests.length === 0) {
            throw new Error(`No smoke tests registered for ${this.projectName}.`);
        }
    }

    _sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    _extractValue(evaluation) {
        if (!evaluation || !evaluation.result) {
            return undefined;
        }

        if (Object.prototype.hasOwnProperty.call(evaluation.result, 'value')) {
            return evaluation.result.value;
        }

        return evaluation.result;
    }

    async _evaluate(Runtime, expression) {
        try {
            return await Runtime.evaluate({
                expression,
                returnByValue: true,
                awaitPromise: true
            });
        } catch (error) {
            return {
                exceptionDetails: {
                    text: error.message
                }
            };
        }
    }

    async _waitForReady(Runtime) {
        if (!this.readyExpression) {
            await this._sleep(2000);
            return;
        }

        console.log(`⏳ Waiting for ${this.projectName} readiness signal...`);

        const startedAt = Date.now();
        let lastException = null;

        while (Date.now() - startedAt < this.readyTimeoutMs) {
            const evaluation = await this._evaluate(Runtime, this.readyExpression);

            if (!evaluation.exceptionDetails) {
                const isReady = this._extractValue(evaluation);
                if (isReady) {
                    console.log('✅ Readiness signal received.');
                    return;
                }
            } else {
                lastException = evaluation.exceptionDetails;
            }

            await this._sleep(this.readyPollMs);
        }

        let debugDetails = null;
        if (this.readyDetailsExpression) {
            const detailsEvaluation = await this._evaluate(Runtime, this.readyDetailsExpression);
            if (!detailsEvaluation.exceptionDetails) {
                debugDetails = this._extractValue(detailsEvaluation);
            }
        }

        const debugPayload = debugDetails || lastException || null;
        const suffix = debugPayload ? ` ${JSON.stringify(debugPayload)}` : '';
        throw new Error(`Readiness timeout after ${this.readyTimeoutMs}ms.${suffix}`);
    }

    async run() {
        let client;
        try {
            this._assertTestsRegistered();
            console.log(`\n🔌 Connecting to ${this.projectName} (Port ${this.port})...`);
            client = await CDP({ port: this.port, host: 'localhost' });
            const { Runtime, Page } = client;
            await Runtime.enable();
            await Page.enable();

            console.log('🔄 Reloading Panel to ensure fresh bundle...');
            await Page.reload();
            await this._waitForReady(Runtime);

            console.log(`✅ Connected! Running Test Suite for ${this.projectName}...\n`);

            let passed = 0;
            let failed = 0;

            for (let i = 0; i < this.tests.length; i++) {
                const test = this.tests[i];
                console.log(`🧪 [${i + 1}/${this.tests.length}] Testing: ${test.name}`);

                const evaluation = await Runtime.evaluate({
                    expression: test.expression,
                    returnByValue: true,
                    awaitPromise: true
                });

                if (evaluation.exceptionDetails) {
                    console.error(`  ❌ fail: Runtime Exception - ${JSON.stringify(evaluation.exceptionDetails)}`);
                    failed++;
                    continue;
                }

                const result = evaluation.result.value || evaluation.result;

                try {
                    await test.validator(result);
                    console.log('  ✅ pass');
                    passed++;
                } catch (err) {
                    console.error(`  ❌ fail: ${err.message}`);
                    failed++;
                }
            }

            console.log(`\n📊 Test Run Complete! Passed: ${passed}, Failed: ${failed}`);
            if (failed > 0) {
                console.error('❌ QA FAILED: Please fix the errors before proceeding.');
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

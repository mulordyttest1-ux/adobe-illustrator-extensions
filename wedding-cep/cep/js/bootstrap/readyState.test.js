import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    DEFAULT_READY_STATE,
    resetReadyState,
    updateReadyState,
    waitForReadyState
} from "./readyState.js";

describe("readyState", () => {
    it("updateReadyState merges the existing state and stamps updatedAt", () => {
        const fakeWindow = {
            __WEDDING_APP_READY__: {
                ...DEFAULT_READY_STATE,
                compactReady: true,
                schemaReady: true
            }
        };

        const nextState = updateReadyState(
            { phase: "calendar", error: null },
            {
                window: fakeWindow,
                now: () => 123
            }
        );

        assert.equal(nextState.phase, "calendar");
        assert.equal(nextState.compactReady, true);
        assert.equal(nextState.schemaReady, true);
        assert.equal(nextState.updatedAt, 123);
        assert.equal(fakeWindow.__WEDDING_APP_READY__, nextState);
    });

    it("resetReadyState restores the default booting shape", () => {
        const fakeWindow = {
            __WEDDING_APP_READY__: {
                status: "ready",
                phase: "ready",
                compactReady: true,
                schemaReady: true,
                error: "seed"
            }
        };

        const nextState = resetReadyState({
            window: fakeWindow,
            now: () => 456
        });

        assert.deepEqual(nextState, {
            status: "booting",
            phase: "init",
            compactReady: false,
            schemaReady: false,
            error: null,
            updatedAt: 456
        });
    });

    it("waitForReadyState resolves when the predicate becomes true", async () => {
        let now = 0;
        const fakeWindow = {
            __WEDDING_APP_READY__: {
                ...DEFAULT_READY_STATE
            }
        };

        const state = await waitForReadyState(
            (currentState) => currentState.compactReady === true,
            {
                timeoutMs: 100,
                pollMs: 50,
                phase: "compact"
            },
            {
                window: fakeWindow,
                now: () => now,
                sleep: async () => {
                    now += 50;
                    fakeWindow.__WEDDING_APP_READY__ = {
                        ...fakeWindow.__WEDDING_APP_READY__,
                        compactReady: true
                    };
                }
            }
        );

        assert.equal(state.compactReady, true);
        assert.equal(fakeWindow.__WEDDING_APP_READY__.phase, "compact");
    });

    it("waitForReadyState throws on timeout", async () => {
        let now = 0;

        await assert.rejects(
            waitForReadyState(
                (state) => state.compactReady === true,
                {
                    timeoutMs: 100,
                    pollMs: 50,
                    errorMessage: "timeout hit"
                },
                {
                    window: {
                        __WEDDING_APP_READY__: { ...DEFAULT_READY_STATE }
                    },
                    now: () => now,
                    sleep: async () => {
                        now += 50;
                    }
                }
            ),
            /timeout hit/
        );
    });
});

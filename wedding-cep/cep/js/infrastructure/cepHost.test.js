import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createCepHost } from "./cepHost.js";

function createFakeCSInterface({ systemPath = "file:///C:/Wedding%20CEP", evalResult = "" } = {}) {
    function FakeCSInterface() {}

    FakeCSInterface.EXTENSION = "extension";
    FakeCSInterface.prototype.getSystemPath = () => systemPath;
    FakeCSInterface.prototype.evalScript = (_script, callback) => callback(evalResult);

    return FakeCSInterface;
}

describe("CEP host adapter", () => {
    it("normalizes file URLs on Windows and reports CEP connection state", () => {
        const FakeCSInterface = createFakeCSInterface();
        const host = createCepHost({
            window: { __adobe_cep__: {} },
            navigator: { platform: "Win32" },
            globalThis: {},
            CSInterface: FakeCSInterface
        });

        assert.equal(host.isConnected(), true);
        assert.equal(host.getExtensionRootPath(), "C:/Wedding CEP");
    });

    it("reports disconnected state when CEP host globals are missing", () => {
        const FakeCSInterface = createFakeCSInterface({ systemPath: "C:/Wedding CEP" });
        const host = createCepHost({
            window: {},
            navigator: { platform: "Win32" },
            globalThis: {},
            CSInterface: FakeCSInterface
        });

        assert.equal(host.isConnected(), false);
    });

    it("reads extension text through node-fs strategy", async () => {
        const FakeCSInterface = createFakeCSInterface({ systemPath: "C:/Wedding CEP" });
        const absolutePath = "C:/Wedding CEP/data/ngay.csv";
        const host = createCepHost({
            window: {
                require(id) {
                    assert.equal(id, "fs");
                    return {
                        existsSync(filePath) {
                            assert.equal(filePath, absolutePath);
                            return true;
                        },
                        readFileSync(filePath, encoding) {
                            assert.equal(filePath, absolutePath);
                            assert.equal(encoding, "utf8");
                            return "calendar-data";
                        }
                    };
                }
            },
            navigator: { platform: "Win32" },
            globalThis: {},
            CSInterface: FakeCSInterface
        });

        assert.deepEqual(
            await host.readExtensionText("data/ngay.csv", { strategy: "node-fs" }),
            {
                absolutePath,
                content: "calendar-data"
            }
        );
    });

    it("reads extension text through cep-fs strategy", async () => {
        const FakeCSInterface = createFakeCSInterface({ systemPath: "C:/Wedding CEP" });
        const absolutePath = "C:/Wedding CEP/data/vn_address_custom.json";
        const host = createCepHost({
            window: {
                cep: {
                    fs: {
                        readFile(filePath) {
                            assert.equal(filePath, absolutePath);
                            return { err: 0, data: '{"items":[]}' };
                        }
                    }
                }
            },
            navigator: { platform: "Win32" },
            globalThis: {},
            CSInterface: FakeCSInterface
        });

        assert.deepEqual(
            await host.readExtensionText("data/vn_address_custom.json", { strategy: "cep-fs" }),
            {
                absolutePath,
                content: '{"items":[]}'
            }
        );
    });

    it("reads extension text through extendscript strategy", async () => {
        const payload = JSON.stringify({
            ok: true,
            exists: true,
            content: '{"schema":true}'
        });
        const FakeCSInterface = createFakeCSInterface({
            systemPath: "C:/Wedding CEP",
            evalResult: payload
        });
        const host = createCepHost({
            window: {},
            navigator: { platform: "Win32" },
            globalThis: {},
            CSInterface: FakeCSInterface
        });

        assert.deepEqual(
            await host.readExtensionText("data/schema.json", { strategy: "extendscript" }),
            {
                absolutePath: "C:/Wedding CEP/data/schema.json",
                content: '{"schema":true}'
            }
        );
    });
});

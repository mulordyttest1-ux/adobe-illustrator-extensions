import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { EthnicNameNormalizer } from "./EthnicNameNormalizer.js";

function resetEthnicNameNormalizer() {
    EthnicNameNormalizer._data = null;
    EthnicNameNormalizer._specialCharRegex = null;
    EthnicNameNormalizer._specialCharMap = null;
    EthnicNameNormalizer._surnamesLastSet = null;
    EthnicNameNormalizer._surnamesFirstSet = null;
    EthnicNameNormalizer._genderPrefixSet = null;
    EthnicNameNormalizer._kinshipPrefixSet = null;
}

afterEach(() => {
    resetEthnicNameNormalizer();
});

describe("EthnicNameNormalizer", () => {
    it("normalizes prefix spacing and strips trailing kinship metadata", () => {
        EthnicNameNormalizer.init({
            prefixes: ["H'", "Y'", "K'"],
            gender_prefixes: ["y", "h"],
            kinship_prefixes: ["ama", "ami"],
            surnames_first: [],
            surnames_last: ["ja"]
        });

        assert.equal(EthnicNameNormalizer.normalize("H' Lan (Ama Pui)"), "H'Lan");
    });

    it("detects ethnic names and suggests idx from initialized data", () => {
        EthnicNameNormalizer.init({
            prefixes: ["H'", "Y'", "K'"],
            gender_prefixes: ["y", "h"],
            kinship_prefixes: ["ama", "ami"],
            surnames_first: [],
            surnames_last: ["ja"]
        });

        assert.equal(EthnicNameNormalizer.isEthnic("Y Jut Ja"), true);
        assert.equal(EthnicNameNormalizer.suggestIdx("Y Jut Ja"), 2);
    });

    it("normalizes configured special diacritics and detects multi-word surnames", () => {
        EthnicNameNormalizer.init({
            prefixes: ["H'", "Y'", "K'"],
            gender_prefixes: ["y", "h"],
            kinship_prefixes: ["ama", "ami"],
            surnames_first: ["ro cham"],
            surnames_last: ["buon krong"],
            special_chars: {
                "ĭ": "i"
            }
        });

        assert.equal(EthnicNameNormalizer.normalize("Amĭ H' Lan"), "Ami H'Lan");
        assert.equal(EthnicNameNormalizer.isEthnic("Y Rin Buon Krong"), true);
    });

    it("returns safe defaults when no dictionary is loaded", () => {
        assert.equal(EthnicNameNormalizer.isReady, false);
        assert.equal(EthnicNameNormalizer.normalize(" H' Lan "), "H'Lan");
        assert.equal(EthnicNameNormalizer.isEthnic("Y Jut Ja"), false);
        assert.equal(EthnicNameNormalizer.suggestIdx("Y Jut Ja"), 0);
    });
});

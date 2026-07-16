import { afterEach, describe, it } from "node:test";
import assert from "node:assert/strict";
import { NameValidator } from "./NameValidator.js";
import { EthnicNameNormalizer } from "../normalizers/EthnicNameNormalizer.js";
import {
    fallbackEthnicDetection,
    hasBlockingNameWarnings,
    normalizeSurnameToken,
    shouldBypassPhoneticWord
} from "./nameValidationSupport.js";
import { VietnameseSurnameLibrary } from "./surnameLibrary.js";

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

describe("NameValidator", () => {
    it("falls back to regex ethnic detection when the normalizer is not ready", () => {
        assert.equal(NameValidator.isEthnicName("H'Lan"), true);
        assert.equal(NameValidator.suggestIdx("H'Lan"), 0);
    });

    it("delegates ethnicity and suggestIdx to the initialized normalizer", () => {
        EthnicNameNormalizer.init({
            prefixes: ["H'", "Y'", "K'"],
            gender_prefixes: ["y", "h"],
            kinship_prefixes: ["ama", "ami"],
            surnames_first: [],
            surnames_last: ["ja"]
        });

        assert.equal(NameValidator.isEthnicName("Y Jut Ja"), true);
        assert.equal(NameValidator.suggestIdx("Y Jut Ja"), 2);
    });

    it("keeps warning types and validity behavior unchanged", () => {
        const result = NameValidator.validate("Nguyen123");

        assert.equal(result.valid, false);
        assert.equal(result.warnings.some((warning) => warning.type === "has_number" && warning.severity === "error"), true);
    });

    it("validates ordinary name content without warning on customer saint-name hyphens", () => {
        const result = NameValidator.validate("te-r\u00ea-sa Nguy\u1ec5n Th\u1ecb An");

        assert.equal(result.valid, true);
        assert.deepEqual(result.warnings, []);
    });

    it("exposes pure helper behavior for fallback ethnic detection and surname normalization", () => {
        assert.equal(fallbackEthnicDetection("H'Lan", NameValidator.ETHNIC_PATTERN), true);
        assert.deepEqual(normalizeSurnameToken('nguyen van a'), {
            surname: 'nguyen',
            normalized: 'nguyen',
            known: true
        });
        assert.equal(VietnameseSurnameLibrary.isCommon('Hoang-Phu'), true);
    });

    it("accepts expanded surnames and accent-insensitive customer input", () => {
        const unaccented = NameValidator.validate("Nguyen Van A");
        const compound = NameValidator.validate("Tôn Nữ Thị Ninh");

        assert.equal(unaccented.warnings.some((warning) => warning.type === "uncommon_surname"), false);
        assert.equal(compound.warnings.some((warning) => warning.type === "uncommon_surname"), false);
    });

    it("warns when a child surname differs from both parents in the same side", () => {
        const result = NameValidator.validate("Phạm Văn An", "person_name", {
            fieldKey: "pos1.con_full",
            formData: {
                "pos1.ong": "Nguyễn Văn Bình",
                "pos1.ba": "Trần Thị Cúc",
                "pos2.ong": "Phạm Văn Khác"
            }
        });
        const warning = result.warnings.find((item) => item.type === "family_surname_mismatch");

        assert.equal(result.valid, true);
        assert.equal(warning?.severity, "info");
        assert.match(warning?.message || "", /Họ con "Phạm"/);
    });

    it("does not warn when a child surname matches either parent", () => {
        const result = NameValidator.validate("Lê Văn An", "person_name", {
            fieldKey: "pos1.con_full",
            formData: {
                "pos1.ong": "Nguyễn Văn Bình",
                "pos1.ba": "Lê Thị Cúc"
            }
        });

        assert.equal(result.warnings.some((warning) => warning.type === "family_surname_mismatch"), false);
    });

    it("does not warn about family surname mismatch when either parent is missing", () => {
        const missingFather = NameValidator.validate("Phạm Văn An", "person_name", {
            fieldKey: "pos1.con_full",
            formData: {
                "pos1.ba": "Trần Thị Cúc"
            }
        });
        const missingMother = NameValidator.validate("Phạm Văn An", "person_name", {
            fieldKey: "pos1.con_full",
            formData: {
                "pos1.ong": "Nguyễn Văn Bình"
            }
        });

        assert.equal(missingFather.warnings.some((warning) => warning.type === "family_surname_mismatch"), false);
        assert.equal(missingMother.warnings.some((warning) => warning.type === "family_surname_mismatch"), false);
    });

    it("uses ordinary names for saint-prefixed family surname comparison", () => {
        const result = NameValidator.validate("te-rê-sa Nguyễn Thị An", "person_name", {
            fieldKey: "pos1.con_full",
            formData: {
                "pos1.ong": "Nguyễn Văn Bình",
                "pos1.ba": "Trần Thị Cúc"
            }
        });

        assert.equal(result.warnings.some((warning) => warning.type === "family_surname_mismatch"), false);
    });

    it("ignores common family titles before comparing parent surnames", () => {
        const result = NameValidator.validate("Nguyễn Văn An", "person_name", {
            fieldKey: "pos1.con_full",
            formData: {
                "pos1.ong": "Ông Nguyễn Văn Bình",
                "pos1.ba": "Bà Trần Thị Cúc"
            }
        });

        assert.equal(result.warnings.some((warning) => warning.type === "family_surname_mismatch"), false);
    });

    it("checks family surname mismatch when a parent field is edited", () => {
        const result = NameValidator.validate("Nguyễn Văn Bình", "person_name", {
            fieldKey: "pos1.ong",
            formData: {
                "pos1.ba": "Trần Thị Cúc",
                "pos1.con_full": "Phạm Văn An"
            }
        });

        assert.equal(result.warnings.some((warning) => warning.type === "family_surname_mismatch"), true);
    });

    it("uses helper predicates for blocking warnings and phonetic bypass", () => {
        assert.equal(hasBlockingNameWarnings([{ severity: 'info' }]), false);
        assert.equal(hasBlockingNameWarnings([{ severity: 'error' }]), true);
        assert.equal(shouldBypassPhoneticWord("Y", false, /Y/i), true);
        assert.equal(shouldBypassPhoneticWord("Loan", false, /Y/i), false);
    });
});

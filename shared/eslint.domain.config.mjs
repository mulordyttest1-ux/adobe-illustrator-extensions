import { PURE_LIB_LANGUAGE_OPTIONS, createCepLintConfig } from "./eslint.config.mjs";

export default createCepLintConfig({
    namePrefix: "domain-lib",
    files: ["libs/wedding/domain/src/**/*.js", "libs/wedding/domain/src/**/*.ts"],
    languageOptions: PURE_LIB_LANGUAGE_OPTIONS
});

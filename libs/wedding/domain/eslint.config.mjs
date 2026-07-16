import { PURE_LIB_LANGUAGE_OPTIONS, createCepLintConfig } from "../../../shared/eslint.config.mjs";

export default createCepLintConfig({
    namePrefix: "wedding-domain",
    files: ["src/**/*.js", "src/**/*.ts"],
    languageOptions: PURE_LIB_LANGUAGE_OPTIONS
});

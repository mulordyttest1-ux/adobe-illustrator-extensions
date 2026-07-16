import { SHARED_LIB_LANGUAGE_OPTIONS, createCepLintConfig } from "./eslint.config.mjs";

export default createCepLintConfig({
    namePrefix: "shared-lib",
    files: ["libs/shared/cep-ui/src/**/*.js", "libs/shared/cep-ui/src/**/*.mjs"],
    languageOptions: SHARED_LIB_LANGUAGE_OPTIONS
});

import { createCepLintConfig } from "../../shared/eslint.config.mjs";

export default createCepLintConfig({
    namePrefix: "symbol-cep",
    files: ["js/**/*.js", "js/**/*.mjs"]
});
import {
  SHARED_LIB_LANGUAGE_OPTIONS,
  createCepLintConfig,
} from '../../../shared/eslint.config.mjs';

export default createCepLintConfig({
  namePrefix: 'shared-lib',
  files: ['src/**/*.js', 'src/**/*.mjs'],
  languageOptions: SHARED_LIB_LANGUAGE_OPTIONS,
});

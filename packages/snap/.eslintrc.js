module.exports = {
  extends: ['../../.eslintrc.js'],

  overrides: [
    {
      files: ['*.ts'],
      extends: ['@metamask/eslint-config-typescript'],
      rules: {
        'import/no-nodejs-modules': [
          'error',
          { allow: ['buffer', 'crypto', 'events'] },
        ],
        '@typescript-eslint/no-non-null-assertion': 'off',
      },
    },
  ],

  parserOptions: {
    tsconfigRootDir: __dirname,
  },

  ignorePatterns: ['**/snap.manifest.json', '!.eslintrc.js', 'dist/'],
};

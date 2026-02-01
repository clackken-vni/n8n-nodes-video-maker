module.exports = {
  root: true,
  env: {
    es2020: true,
    node: true,
    jest: true
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    project: './tsconfig.json',
    tsconfigRootDir: __dirname
  },
  plugins: [
    '@typescript-eslint',
    'prettier'
  ],
  rules: {
    'prettier/prettier': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-empty-interface': 'off'
  },
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    '*.js',
    '*.config.js'
  ]
};

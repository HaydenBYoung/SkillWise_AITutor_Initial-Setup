module.exports = {
  extends: ['react-app', 'react-app/jest'],
  rules: {
    'no-console': 'off', // Allow console statements in development
    'no-unused-vars': 'warn', // Warn instead of error
    'react/no-typos': 'off', // Allow React imports without binding
    'react/jsx-no-undef': 'warn', // Warn on undefined JSX
  },
  overrides: [
    {
      files: [
        '**/__tests__/**',
        '**/*.test.js',
        '**/*.test.jsx',
        '**/*.cy.js',
        'cypress/**/*.js',
      ],
      env: {
        jest: true,
        browser: true,
        node: true,
      },
      globals: {
        cy: 'readonly',
        Cypress: 'readonly',
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
      rules: {
        'no-unused-vars': 'off', // Disable for test files
      },
    },
  ],
};

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/test', '<rootDir>/nodes', '<rootDir>/lib'],
  testMatch: ['**/*.test.ts'],
  collectCoverageFrom: [
    'nodes/**/*.ts',
    'lib/**/*.ts',
    '!nodes/**/*.d.ts',
    '!lib/**/*.d.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'tsconfig.json'
    }]
  },
  verbose: true,
  testTimeout: 30000
};

/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        module: 'commonjs',
        esModuleInterop: true,
        allowJs: true,
        moduleResolution: 'node',
      },
    }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@groceryone/store$': '<rootDir>/src/__tests__/helpers/mockStoreModule',
    '^@groceryone/i18n$': '<rootDir>/src/__tests__/helpers/mockI18n',
    '^@groceryone/shared$': '<rootDir>/src/__tests__/helpers/mockShared',
  },
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
};

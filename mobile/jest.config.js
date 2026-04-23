/** @type {import('jest').Config} */
module.exports = {
  preset: 'react-native',
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  testMatch: [
    '**/__tests__/**/*.test.[jt]s?(x)',
    '**/*.test.[jt]s?(x)',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/e2e/',
    '/__tests__/setup.ts',
    '/__tests__/testUtils.tsx',
    '/__tests__/mocks/',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|@react-navigation|react-native-reanimated|react-native-screens|react-native-safe-area-context|react-native-gesture-handler|react-native-vector-icons|@react-native-async-storage|@reduxjs/toolkit|immer|redux|redux-thunk|react-redux|react-native-gifted-charts|gifted-charts-core|react-native-linear-gradient|react-native-svg|expo|expo-.*|@expo/.*|react-native-thermal-receipt-printer-image-qr)/)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@core/(.*)$': '<rootDir>/src/core/$1',
    '^@data/(.*)$': '<rootDir>/src/data/$1',
    '^@domain/(.*)$': '<rootDir>/src/domain/$1',
    '^@presentation/(.*)$': '<rootDir>/src/presentation/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
    '^@tenant/(.*)$': '<rootDir>/src/tenant/$1',
    '^@groceryone/shared$': '<rootDir>/../packages/shared/src',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.styles.ts',
    '!src/**/index.ts',
    '!src/App.tsx',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],
  coverageThreshold: {
    global: {
      branches: 60,
      functions: 60,
      lines: 70,
      statements: 70,
    },
  },
};

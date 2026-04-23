/**
 * API Configuration Tests
 * Verifies correct base URL selection per platform
 */

import { Platform } from 'react-native';

// We need to re-import after mocking Platform
let API_CONFIG: typeof import('../api.config').API_CONFIG;

describe('api.config', () => {
  const originalPlatform = Platform.OS;
  const originalConstants = (Platform as any).constants;

  afterEach(() => {
    jest.resetModules();
    // Restore original platform
    Object.defineProperty(Platform, 'OS', { value: originalPlatform });
    Object.defineProperty(Platform, 'constants', { value: originalConstants, configurable: true });
  });

  describe('getDevBaseUrl', () => {
    it('should use 10.0.2.2 for Android emulator in development', () => {
      Object.defineProperty(Platform, 'OS', { value: 'android' });
      // Mock Platform.constants with Fingerprint containing 'sdk' to trigger emulator detection
      Object.defineProperty(Platform, 'constants', {
        value: { Fingerprint: 'google/sdk_gphone/emulator:13/sdk' },
        configurable: true,
      });

      // Re-import to pick up mocked platform
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const config = require('../api.config');
      API_CONFIG = config.API_CONFIG;

      // Android emulator cannot resolve localhost - must use 10.0.2.2
      expect(API_CONFIG.BASE_URL).toBe('http://10.0.2.2:3000/api/v1');
    });

    it('should use LOCAL_MACHINE_IP for iOS in development', () => {
      Object.defineProperty(Platform, 'OS', { value: 'ios' });

      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const config = require('../api.config');
      API_CONFIG = config.API_CONFIG;

      // iOS uses LOCAL_MACHINE_IP_FALLBACK when .env override is not loaded
      expect(API_CONFIG.BASE_URL).toBe('http://192.168.0.100:3000/api/v1');
    });
  });
});

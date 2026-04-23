/**
 * Settings Slice Tests
 * TDD: These tests were written first before implementation
 */

import settingsReducer, {
  setThemeMode,
  setLanguage,
  setNotificationsEnabled,
  updateNotificationPreference,
  setPrinterEnabled,
  setPrinterConnectionType,
  setSelectedPrinter,
  setPaperSize,
  setPrintFormat,
  setAutoCut,
  setCutMode,
  hydrateSettings,
  resetSettings,
  selectThemeMode,
  selectLanguage,
  selectNotifications,
  selectPrinter,
  selectIsSettingsHydrated,
  SettingsState,
} from '../settingsSlice';

describe('settingsSlice', () => {
  const initialState: SettingsState = {
    themeMode: 'system',
    language: 'en',
    notifications: {
      enabled: true,
      orderUpdates: true,
      promotions: false,
      reminders: true,
      sound: true,
      vibration: true,
    },
    printer: {
      enabled: false,
      connectionType: 'none',
      selectedPrinterId: null,
      selectedPrinterName: null,
      selectedPrinterAddress: null,
      paperSize: '80mm',
      printFormat: 'receipt',
      connectionStatus: 'disconnected',
      lastConnectedAt: null,
      autoPrint: false,
      imageWidthDots: 384,
      autoCut: true,
      cutMode: 'full',
    },
    payment: {
      merchantUpiId: '',
      merchantName: '',
    },
    isHydrated: false,
    lastUpdated: null,
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      const state = settingsReducer(undefined, { type: 'unknown' });
      expect(state.themeMode).toBe('system');
      expect(state.language).toBe('en');
      expect(state.notifications.enabled).toBe(true);
      expect(state.printer.enabled).toBe(false);
      expect(state.isHydrated).toBe(false);
    });
  });

  describe('theme actions', () => {
    it('should set theme mode to light', () => {
      const state = settingsReducer(initialState, setThemeMode('light'));
      expect(state.themeMode).toBe('light');
      expect(state.lastUpdated).not.toBeNull();
    });

    it('should set theme mode to dark', () => {
      const state = settingsReducer(initialState, setThemeMode('dark'));
      expect(state.themeMode).toBe('dark');
    });

    it('should set theme mode to system', () => {
      const modifiedState = { ...initialState, themeMode: 'dark' as const };
      const state = settingsReducer(modifiedState, setThemeMode('system'));
      expect(state.themeMode).toBe('system');
    });
  });

  describe('language actions', () => {
    it('should set language to Telugu', () => {
      const state = settingsReducer(initialState, setLanguage('te'));
      expect(state.language).toBe('te');
      expect(state.lastUpdated).not.toBeNull();
    });

    it('should set language to English', () => {
      const modifiedState = { ...initialState, language: 'te' };
      const state = settingsReducer(modifiedState, setLanguage('en'));
      expect(state.language).toBe('en');
    });
  });

  describe('notification actions', () => {
    it('should disable all notifications', () => {
      const state = settingsReducer(initialState, setNotificationsEnabled(false));
      expect(state.notifications.enabled).toBe(false);
      expect(state.lastUpdated).not.toBeNull();
    });

    it('should enable all notifications', () => {
      const modifiedState = {
        ...initialState,
        notifications: { ...initialState.notifications, enabled: false },
      };
      const state = settingsReducer(modifiedState, setNotificationsEnabled(true));
      expect(state.notifications.enabled).toBe(true);
    });

    it('should update orderUpdates preference', () => {
      const state = settingsReducer(
        initialState,
        updateNotificationPreference({ key: 'orderUpdates', value: false })
      );
      expect(state.notifications.orderUpdates).toBe(false);
    });

    it('should update promotions preference', () => {
      const state = settingsReducer(
        initialState,
        updateNotificationPreference({ key: 'promotions', value: true })
      );
      expect(state.notifications.promotions).toBe(true);
    });

    it('should update reminders preference', () => {
      const state = settingsReducer(
        initialState,
        updateNotificationPreference({ key: 'reminders', value: false })
      );
      expect(state.notifications.reminders).toBe(false);
    });

    it('should update sound preference', () => {
      const state = settingsReducer(
        initialState,
        updateNotificationPreference({ key: 'sound', value: false })
      );
      expect(state.notifications.sound).toBe(false);
    });

    it('should update vibration preference', () => {
      const state = settingsReducer(
        initialState,
        updateNotificationPreference({ key: 'vibration', value: false })
      );
      expect(state.notifications.vibration).toBe(false);
    });
  });

  describe('printer actions', () => {
    it('should enable printer', () => {
      const state = settingsReducer(initialState, setPrinterEnabled(true));
      expect(state.printer.enabled).toBe(true);
      expect(state.lastUpdated).not.toBeNull();
    });

    it('should disable printer', () => {
      const modifiedState = {
        ...initialState,
        printer: { ...initialState.printer, enabled: true },
      };
      const state = settingsReducer(modifiedState, setPrinterEnabled(false));
      expect(state.printer.enabled).toBe(false);
    });

    it('should set printer connection type to bluetooth', () => {
      const state = settingsReducer(initialState, setPrinterConnectionType('bluetooth'));
      expect(state.printer.connectionType).toBe('bluetooth');
    });

    it('should set printer connection type to network', () => {
      const state = settingsReducer(initialState, setPrinterConnectionType('network'));
      expect(state.printer.connectionType).toBe('network');
    });

    it('should set selected printer', () => {
      const state = settingsReducer(
        initialState,
        setSelectedPrinter({ id: 'printer-123', name: 'Office Printer', address: '00:11:22:33:44:55' })
      );
      expect(state.printer.selectedPrinterId).toBe('printer-123');
      expect(state.printer.selectedPrinterName).toBe('Office Printer');
      expect(state.printer.selectedPrinterAddress).toBe('00:11:22:33:44:55');
    });

    it('should clear selected printer when null', () => {
      const modifiedState = {
        ...initialState,
        printer: {
          ...initialState.printer,
          selectedPrinterId: 'printer-123',
          selectedPrinterName: 'Office Printer',
        },
      };
      const state = settingsReducer(modifiedState, setSelectedPrinter(null));
      expect(state.printer.selectedPrinterId).toBeNull();
      expect(state.printer.selectedPrinterName).toBeNull();
    });

    it('should set paper size to 58mm', () => {
      const state = settingsReducer(initialState, setPaperSize('58mm'));
      expect(state.printer.paperSize).toBe('58mm');
    });


    it('should set print format to detailed', () => {
      const state = settingsReducer(initialState, setPrintFormat('detailed'));
      expect(state.printer.printFormat).toBe('detailed');
    });

    it('should set print format to compact', () => {
      const state = settingsReducer(initialState, setPrintFormat('compact'));
      expect(state.printer.printFormat).toBe('compact');
    });
  });

  describe('auto-cut actions (Bluetooth printer)', () => {
    it('defaults to autoCut=true in the initial state', () => {
      const state = settingsReducer(undefined, { type: 'unknown' });
      expect(state.printer.autoCut).toBe(true);
    });

    it('defaults to cutMode=full in the initial state (widest printer compatibility)', () => {
      // Why "full": the prior default was GS V 66 Function B, which some
      // thermal printers silently ignore. GS V 0 (full cut) is the safest
      // default and matches what users expect from "auto cut".
      const state = settingsReducer(undefined, { type: 'unknown' });
      expect(state.printer.cutMode).toBe('full');
    });

    it('should disable auto cut', () => {
      const state = settingsReducer(initialState, setAutoCut(false));
      expect(state.printer.autoCut).toBe(false);
      expect(state.lastUpdated).not.toBeNull();
    });

    it('should re-enable auto cut', () => {
      const modified = {
        ...initialState,
        printer: { ...initialState.printer, autoCut: false },
      };
      const state = settingsReducer(modified, setAutoCut(true));
      expect(state.printer.autoCut).toBe(true);
    });

    it('should switch cut mode to partial', () => {
      const state = settingsReducer(initialState, setCutMode('partial'));
      expect(state.printer.cutMode).toBe('partial');
    });

    it('should switch cut mode back to full', () => {
      const modified = {
        ...initialState,
        printer: { ...initialState.printer, cutMode: 'partial' as const },
      };
      const state = settingsReducer(modified, setCutMode('full'));
      expect(state.printer.cutMode).toBe('full');
    });

    it('resetSettings clears per-device cut prefs back to defaults (tenant-switch safety)', () => {
      // Multi-tenant guard: printer prefs are per-device, not per-tenant.
      // When a user logs out / switches tenants, resetSettings() must
      // restore autoCut=true and cutMode='full' so the next tenant's
      // session starts from a known default.
      const modified = {
        ...initialState,
        printer: {
          ...initialState.printer,
          autoCut: false,
          cutMode: 'partial' as const,
        },
      };
      const state = settingsReducer(modified, resetSettings());
      expect(state.printer.autoCut).toBe(true);
      expect(state.printer.cutMode).toBe('full');
    });

    it('hydrateSettings restores persisted autoCut/cutMode', () => {
      const savedSettings: Partial<SettingsState> = {
        printer: {
          ...initialState.printer,
          autoCut: false,
          cutMode: 'partial',
        },
      };
      const state = settingsReducer(initialState, hydrateSettings(savedSettings));
      expect(state.printer.autoCut).toBe(false);
      expect(state.printer.cutMode).toBe('partial');
    });
  });

  describe('hydration', () => {
    it('should hydrate settings from storage', () => {
      const savedSettings: Partial<SettingsState> = {
        themeMode: 'dark',
        language: 'te',
      };
      const state = settingsReducer(initialState, hydrateSettings(savedSettings));
      expect(state.themeMode).toBe('dark');
      expect(state.language).toBe('te');
      expect(state.isHydrated).toBe(true);
    });

    it('should preserve existing values not in hydration payload', () => {
      const savedSettings: Partial<SettingsState> = {
        themeMode: 'dark',
      };
      const state = settingsReducer(initialState, hydrateSettings(savedSettings));
      expect(state.themeMode).toBe('dark');
      expect(state.language).toBe('en'); // Should keep default
      expect(state.notifications.enabled).toBe(true); // Should keep default
    });

    it('should hydrate printer settings', () => {
      const savedSettings: Partial<SettingsState> = {
        printer: {
          enabled: true,
          connectionType: 'bluetooth',
          selectedPrinterId: 'bt-printer-1',
          selectedPrinterName: 'My Printer',
          selectedPrinterAddress: '00:11:22:33:44:55',
          paperSize: '58mm',
          printFormat: 'compact',
          connectionStatus: 'disconnected',
          lastConnectedAt: null,
          autoPrint: false,
        imageWidthDots: 384,
        },
      };
      const state = settingsReducer(initialState, hydrateSettings(savedSettings));
      expect(state.printer.enabled).toBe(true);
      expect(state.printer.connectionType).toBe('bluetooth');
      expect(state.printer.paperSize).toBe('58mm');
    });
  });

  describe('reset', () => {
    it('should reset settings to defaults', () => {
      const modifiedState: SettingsState = {
        ...initialState,
        themeMode: 'dark',
        language: 'te',
        notifications: {
          ...initialState.notifications,
          enabled: false,
          promotions: true,
        },
        printer: {
          ...initialState.printer,
          enabled: true,
          connectionType: 'bluetooth',
        },
        isHydrated: true,
        lastUpdated: '2024-01-01T00:00:00.000Z',
      };
      const state = settingsReducer(modifiedState, resetSettings());
      expect(state.themeMode).toBe('system');
      expect(state.language).toBe('en');
      expect(state.notifications.enabled).toBe(true);
      expect(state.printer.enabled).toBe(false);
      expect(state.isHydrated).toBe(true); // Should remain hydrated after reset
    });
  });

  describe('selectors', () => {
    const mockRootState = {
      settings: initialState,
    };

    it('should select theme mode', () => {
      expect(selectThemeMode(mockRootState)).toBe('system');
    });

    it('should select language', () => {
      expect(selectLanguage(mockRootState)).toBe('en');
    });

    it('should select notifications', () => {
      const notifications = selectNotifications(mockRootState);
      expect(notifications.enabled).toBe(true);
      expect(notifications.orderUpdates).toBe(true);
      expect(notifications.promotions).toBe(false);
    });

    it('should select printer settings', () => {
      const printer = selectPrinter(mockRootState);
      expect(printer.enabled).toBe(false);
      expect(printer.connectionType).toBe('none');
      expect(printer.paperSize).toBe('80mm');
    });

    it('should select hydration status', () => {
      expect(selectIsSettingsHydrated(mockRootState)).toBe(false);
    });
  });
});

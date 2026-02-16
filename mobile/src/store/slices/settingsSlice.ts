/**
 * Settings Slice
 * Manages app settings including theme, language, notifications, and printer configuration
 */

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// Theme mode type
export type ThemeMode = 'light' | 'dark' | 'system';

// Printer connection types
export type PrinterConnectionType = 'bluetooth' | 'network' | 'usb' | 'none';

// Paper size options (thermal printers only)
export type PaperSize = '80mm' | '58mm';

// Print format options
export type PrintFormat = 'receipt' | 'detailed' | 'compact';

// Printer connection status
export type PrinterConnectionStatus =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error';

// Printer configuration interface
export interface PrinterConfig {
  enabled: boolean;
  connectionType: PrinterConnectionType;
  selectedPrinterId: string | null;
  selectedPrinterName: string | null;
  selectedPrinterAddress: string | null;
  paperSize: PaperSize;
  printFormat: PrintFormat;
  connectionStatus: PrinterConnectionStatus;
  lastConnectedAt: string | null;
  autoPrint: boolean;
}

// Notification preferences interface
export interface NotificationPreferences {
  enabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  reminders: boolean;
  sound: boolean;
  vibration: boolean;
}

// Payment settings interface
export interface PaymentSettings {
  merchantUpiId: string;
  merchantName: string;
}


// Complete settings state interface
export interface SettingsState {
  themeMode: ThemeMode;
  language: string;
  notifications: NotificationPreferences;
  printer: PrinterConfig;
  payment: PaymentSettings;
  isHydrated: boolean;
  lastUpdated: string | null;
}

// Initial state
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
  },
  payment: {
    merchantUpiId: '',
    merchantName: '',
  },
  isHydrated: false,
  lastUpdated: null,
};

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    // Theme actions
    setThemeMode(state, action: PayloadAction<ThemeMode>) {
      state.themeMode = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    // Language actions
    setLanguage(state, action: PayloadAction<string>) {
      state.language = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    // Notification actions
    setNotificationsEnabled(state, action: PayloadAction<boolean>) {
      state.notifications.enabled = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    updateNotificationPreference(
      state,
      action: PayloadAction<{
        key: keyof Omit<NotificationPreferences, 'enabled'>;
        value: boolean;
      }>
    ) {
      const { key, value } = action.payload;
      state.notifications[key] = value;
      state.lastUpdated = new Date().toISOString();
    },

    // Printer actions
    setPrinterEnabled(state, action: PayloadAction<boolean>) {
      state.printer.enabled = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    setPrinterConnectionType(state, action: PayloadAction<PrinterConnectionType>) {
      state.printer.connectionType = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    setSelectedPrinter(
      state,
      action: PayloadAction<{ id: string; name: string; address: string } | null>
    ) {
      if (action.payload) {
        state.printer.selectedPrinterId = action.payload.id;
        state.printer.selectedPrinterName = action.payload.name;
        state.printer.selectedPrinterAddress = action.payload.address;
      } else {
        state.printer.selectedPrinterId = null;
        state.printer.selectedPrinterName = null;
        state.printer.selectedPrinterAddress = null;
      }
      state.lastUpdated = new Date().toISOString();
    },

    setPrinterConnectionStatus(
      state,
      action: PayloadAction<PrinterConnectionStatus>
    ) {
      state.printer.connectionStatus = action.payload;
      if (action.payload === 'connected') {
        state.printer.lastConnectedAt = new Date().toISOString();
      }
      state.lastUpdated = new Date().toISOString();
    },

    setAutoPrint(state, action: PayloadAction<boolean>) {
      state.printer.autoPrint = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    setPaperSize(state, action: PayloadAction<PaperSize>) {
      state.printer.paperSize = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    setPrintFormat(state, action: PayloadAction<PrintFormat>) {
      state.printer.printFormat = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    // Payment actions
    setMerchantUpiId(state, action: PayloadAction<string>) {
      state.payment.merchantUpiId = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    setMerchantName(state, action: PayloadAction<string>) {
      state.payment.merchantName = action.payload;
      state.lastUpdated = new Date().toISOString();
    },

    setPaymentSettings(state, action: PayloadAction<Partial<PaymentSettings>>) {
      state.payment = { ...state.payment, ...action.payload };
      state.lastUpdated = new Date().toISOString();
    },

    // Hydration action (load from storage)
    hydrateSettings(state, action: PayloadAction<Partial<SettingsState>>) {
      const payload = action.payload;
      if (payload.themeMode !== undefined) {
        state.themeMode = payload.themeMode;
      }
      if (payload.language !== undefined) {
        state.language = payload.language;
      }
      if (payload.notifications !== undefined) {
        state.notifications = { ...state.notifications, ...payload.notifications };
      }
      if (payload.printer !== undefined) {
        state.printer = { ...state.printer, ...payload.printer };
      }
      if (payload.payment !== undefined) {
        state.payment = { ...state.payment, ...payload.payment };
      }
      state.isHydrated = true;
    },

    // Reset to defaults
    resetSettings(state) {
      return {
        ...initialState,
        isHydrated: state.isHydrated, // Preserve hydration status
      };
    },
  },
});

export const {
  setThemeMode,
  setLanguage,
  setNotificationsEnabled,
  updateNotificationPreference,
  setPrinterEnabled,
  setPrinterConnectionType,
  setSelectedPrinter,
  setPrinterConnectionStatus,
  setAutoPrint,
  setPaperSize,
  setPrintFormat,
  setMerchantUpiId,
  setMerchantName,
  setPaymentSettings,
  hydrateSettings,
  resetSettings,
} = settingsSlice.actions;

export default settingsSlice.reducer;

// Selectors
export const selectThemeMode = (state: { settings: SettingsState }) =>
  state.settings.themeMode;

export const selectLanguage = (state: { settings: SettingsState }) =>
  state.settings.language;

export const selectNotifications = (state: { settings: SettingsState }) =>
  state.settings.notifications;

export const selectPrinter = (state: { settings: SettingsState }) =>
  state.settings.printer;

export const selectPaymentSettings = (state: { settings: SettingsState }) =>
  state.settings.payment;

export const selectMerchantUpiId = (state: { settings: SettingsState }) =>
  state.settings.payment.merchantUpiId;

export const selectMerchantName = (state: { settings: SettingsState }) =>
  state.settings.payment.merchantName;

export const selectIsSettingsHydrated = (state: { settings: SettingsState }) =>
  state.settings.isHydrated;

export const selectSettings = (state: { settings: SettingsState }) =>
  state.settings;

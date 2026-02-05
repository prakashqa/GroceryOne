/**
 * User Settings API
 * RTK Query endpoints for user settings management
 */

import { baseApi } from './baseApi';

// Types
export type ThemeMode = 'light' | 'dark' | 'system';
export type PrinterConnectionType = 'bluetooth' | 'network' | 'none';
export type PaperSize = '80mm' | '58mm';
export type PrintFormat = 'receipt' | 'detailed' | 'compact';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface NotificationSettings {
  enabled: boolean;
  orderUpdates: boolean;
  promotions: boolean;
  reminders: boolean;
  sound: boolean;
  vibration: boolean;
}

export interface PrinterSettings {
  enabled: boolean;
  connectionType: PrinterConnectionType;
  selectedPrinterId: string | null;
  selectedPrinterName: string | null;
  selectedPrinterAddress: string | null;
  paperSize: PaperSize;
  printFormat: PrintFormat;
  connectionStatus: ConnectionStatus;
  lastConnectedAt: string | null;
  autoPrint: boolean;
}

export interface UserSettings {
  id: string;
  userId?: string;
  deviceId?: string;
  themeMode: ThemeMode;
  language: string;
  notifications: NotificationSettings;
  printer: PrinterSettings;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserSettingsDto {
  userId?: string;
  deviceId?: string;
  themeMode?: ThemeMode;
  language?: string;
  notifications?: Partial<NotificationSettings>;
  printer?: Partial<PrinterSettings>;
}

export interface UpdateUserSettingsDto {
  themeMode?: ThemeMode;
  language?: string;
  notifications?: Partial<NotificationSettings>;
  printer?: Partial<PrinterSettings>;
}

// Inject endpoints into the base API
export const userSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Get or create settings for user/device
    getUserSettings: builder.query<UserSettings, { userId?: string; deviceId?: string }>({
      query: ({ userId, deviceId }) => ({
        url: '/users/settings',
        params: { userId, deviceId },
      }),
      providesTags: (result) => (result ? [{ type: 'User', id: result.id }] : []),
    }),

    // Get settings by ID
    getUserSettingsById: builder.query<UserSettings, string>({
      query: (id) => `/users/settings/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),

    // Create settings
    createUserSettings: builder.mutation<UserSettings, CreateUserSettingsDto>({
      query: (body) => ({
        url: '/users/settings',
        method: 'POST',
        body,
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),

    // Update settings by ID
    updateUserSettings: builder.mutation<UserSettings, { id: string; data: UpdateUserSettingsDto }>({
      query: ({ id, data }) => ({
        url: `/users/settings/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: 'User', id }],
    }),

    // Update settings by user ID (upsert)
    updateUserSettingsByUserId: builder.mutation<UserSettings, { userId: string; data: UpdateUserSettingsDto }>({
      query: ({ userId, data }) => ({
        url: `/users/settings/user/${userId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result) => (result ? [{ type: 'User', id: result.id }] : []),
    }),

    // Update settings by device ID (upsert)
    updateUserSettingsByDeviceId: builder.mutation<UserSettings, { deviceId: string; data: UpdateUserSettingsDto }>({
      query: ({ deviceId, data }) => ({
        url: `/users/settings/device/${deviceId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result) => (result ? [{ type: 'User', id: result.id }] : []),
    }),

    // Delete settings
    deleteUserSettings: builder.mutation<void, string>({
      query: (id) => ({
        url: `/users/settings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
  }),
  overrideExisting: false,
});

// Export hooks
export const {
  useGetUserSettingsQuery,
  useGetUserSettingsByIdQuery,
  useCreateUserSettingsMutation,
  useUpdateUserSettingsMutation,
  useUpdateUserSettingsByUserIdMutation,
  useUpdateUserSettingsByDeviceIdMutation,
  useDeleteUserSettingsMutation,
} = userSettingsApi;

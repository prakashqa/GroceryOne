/**
 * User Settings API (shared)
 */

import { baseApi } from './baseApi';

export type ThemeMode = 'light' | 'dark' | 'system';
export type PrinterConnectionType = 'bluetooth' | 'network' | 'usb' | 'none';
export type PaperSize = '80mm' | '58mm';
export type PrintFormat = 'receipt' | 'detailed' | 'compact';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export interface NotificationSettings {
  enabled: boolean; orderUpdates: boolean; promotions: boolean;
  reminders: boolean; sound: boolean; vibration: boolean;
}

export interface PrinterSettings {
  enabled: boolean; connectionType: PrinterConnectionType;
  selectedPrinterId: string | null; selectedPrinterName: string | null;
  selectedPrinterAddress: string | null; paperSize: PaperSize;
  printFormat: PrintFormat; connectionStatus: ConnectionStatus;
  lastConnectedAt: string | null; autoPrint: boolean;
}

export interface UserSettings {
  id: string; userId?: string; deviceId?: string;
  themeMode: ThemeMode; language: string;
  notifications: NotificationSettings; printer: PrinterSettings;
  createdAt: string; updatedAt: string;
}

export interface CreateUserSettingsDto {
  userId?: string; deviceId?: string; themeMode?: ThemeMode; language?: string;
  notifications?: Partial<NotificationSettings>; printer?: Partial<PrinterSettings>;
}

export interface UpdateUserSettingsDto {
  themeMode?: ThemeMode; language?: string;
  notifications?: Partial<NotificationSettings>; printer?: Partial<PrinterSettings>;
}

export const userSettingsApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getUserSettings: builder.query<UserSettings, { userId?: string; deviceId?: string }>({
      query: ({ userId, deviceId }) => ({ url: '/users/settings', params: { userId, deviceId } }),
      providesTags: (result) => (result ? [{ type: 'User', id: result.id }] : []),
    }),
    getUserSettingsById: builder.query<UserSettings, string>({
      query: (id) => `/users/settings/${id}`,
      providesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
    createUserSettings: builder.mutation<UserSettings, CreateUserSettingsDto>({
      query: (body) => ({ url: '/users/settings', method: 'POST', body }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    updateUserSettings: builder.mutation<UserSettings, { id: string; data: UpdateUserSettingsDto }>({
      query: ({ id, data }) => ({ url: `/users/settings/${id}`, method: 'PUT', body: data }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'User', id }],
    }),
    updateUserSettingsByUserId: builder.mutation<UserSettings, { userId: string; data: UpdateUserSettingsDto }>({
      query: ({ userId, data }) => ({ url: `/users/settings/user/${userId}`, method: 'PUT', body: data }),
      invalidatesTags: (result) => (result ? [{ type: 'User', id: result.id }] : []),
    }),
    updateUserSettingsByDeviceId: builder.mutation<UserSettings, { deviceId: string; data: UpdateUserSettingsDto }>({
      query: ({ deviceId, data }) => ({ url: `/users/settings/device/${deviceId}`, method: 'PUT', body: data }),
      invalidatesTags: (result) => (result ? [{ type: 'User', id: result.id }] : []),
    }),
    deleteUserSettings: builder.mutation<void, string>({
      query: (id) => ({ url: `/users/settings/${id}`, method: 'DELETE' }),
      invalidatesTags: (_r, _e, id) => [{ type: 'User', id }],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetUserSettingsQuery, useGetUserSettingsByIdQuery,
  useCreateUserSettingsMutation, useUpdateUserSettingsMutation,
  useUpdateUserSettingsByUserIdMutation, useUpdateUserSettingsByDeviceIdMutation,
  useDeleteUserSettingsMutation,
} = userSettingsApi;

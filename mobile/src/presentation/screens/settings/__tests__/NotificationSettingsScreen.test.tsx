/**
 * NotificationSettingsScreen Tests
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import NotificationSettingsScreen from '../NotificationSettingsScreen';

describe('NotificationSettingsScreen', () => {
  it('should render master notification toggle', () => {
    const { getByText, getByTestId } = renderWithProviders(
      <NotificationSettingsScreen />
    );

    expect(getByText('Enable Notifications')).toBeTruthy();
    expect(getByTestId('notification-master-toggle-switch')).toBeTruthy();
  });

  it('should render individual notification toggles', () => {
    const { getByText } = renderWithProviders(<NotificationSettingsScreen />);

    expect(getByText('Order Updates')).toBeTruthy();
    expect(getByText('Promotions & Offers')).toBeTruthy();
    expect(getByText('Reminders')).toBeTruthy();
  });

  it('should render sound and vibration toggles', () => {
    const { getByText } = renderWithProviders(<NotificationSettingsScreen />);

    expect(getByText('Sound')).toBeTruthy();
    expect(getByText('Vibration')).toBeTruthy();
  });

  it('should toggle master notification setting', () => {
    const { getByTestId, store } = renderWithProviders(
      <NotificationSettingsScreen />
    );

    const toggle = getByTestId('notification-master-toggle-switch');
    fireEvent(toggle, 'valueChange', false);

    const state = store.getState() as { settings: { notifications: { enabled: boolean } } };
    expect(state.settings.notifications.enabled).toBe(false);
  });

  it('should toggle individual notification preference', () => {
    const { getByTestId, store } = renderWithProviders(
      <NotificationSettingsScreen />
    );

    const promotionsToggle = getByTestId('notification-promotions-toggle-switch');
    fireEvent(promotionsToggle, 'valueChange', true);

    const state = store.getState() as { settings: { notifications: { promotions: boolean } } };
    expect(state.settings.notifications.promotions).toBe(true);
  });

  it('should have correct initial values', () => {
    const { getByTestId } = renderWithProviders(<NotificationSettingsScreen />);

    const masterToggle = getByTestId('notification-master-toggle-switch');
    expect(masterToggle.props.value).toBe(true);

    const promotionsToggle = getByTestId('notification-promotions-toggle-switch');
    expect(promotionsToggle.props.value).toBe(false);

    const orderUpdatesToggle = getByTestId('notification-orderUpdates-toggle-switch');
    expect(orderUpdatesToggle.props.value).toBe(true);
  });
});

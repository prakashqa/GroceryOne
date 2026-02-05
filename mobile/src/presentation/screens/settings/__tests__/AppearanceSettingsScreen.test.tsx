/**
 * AppearanceSettingsScreen Tests
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import AppearanceSettingsScreen from '../AppearanceSettingsScreen';

describe('AppearanceSettingsScreen', () => {
  it('should render theme options', () => {
    const { getByText } = renderWithProviders(<AppearanceSettingsScreen />);

    expect(getByText('Light')).toBeTruthy();
    expect(getByText('Dark')).toBeTruthy();
    expect(getByText('System Default')).toBeTruthy();
  });

  it('should have system default selected by default', () => {
    const { getByTestId } = renderWithProviders(<AppearanceSettingsScreen />);

    const systemOption = getByTestId('theme-option-system');
    expect(systemOption.props.accessibilityState.selected).toBe(true);
  });

  it('should select light theme when tapped', () => {
    const { getByTestId, store } = renderWithProviders(
      <AppearanceSettingsScreen />
    );

    fireEvent.press(getByTestId('theme-option-light'));

    const state = store.getState() as { settings: { themeMode: string } };
    expect(state.settings.themeMode).toBe('light');
  });

  it('should select dark theme when tapped', () => {
    const { getByTestId, store } = renderWithProviders(
      <AppearanceSettingsScreen />
    );

    fireEvent.press(getByTestId('theme-option-dark'));

    const state = store.getState() as { settings: { themeMode: string } };
    expect(state.settings.themeMode).toBe('dark');
  });

  it('should update UI immediately when theme changes', () => {
    const { getByTestId } = renderWithProviders(<AppearanceSettingsScreen />);

    fireEvent.press(getByTestId('theme-option-dark'));

    const darkOption = getByTestId('theme-option-dark');
    expect(darkOption.props.accessibilityState.selected).toBe(true);
  });

  it('should render theme section title', () => {
    const { getByText } = renderWithProviders(<AppearanceSettingsScreen />);

    expect(getByText('Theme')).toBeTruthy();
  });
});

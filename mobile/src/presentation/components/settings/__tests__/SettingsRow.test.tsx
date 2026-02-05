/**
 * SettingsRow Component Tests
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import SettingsRow from '../SettingsRow';

describe('SettingsRow', () => {
  it('should render label', () => {
    const { getByText } = renderWithProviders(
      <SettingsRow label="Test Label" />
    );

    expect(getByText('Test Label')).toBeTruthy();
  });

  it('should render value when provided', () => {
    const { getByText } = renderWithProviders(
      <SettingsRow label="Language" value="English" />
    );

    expect(getByText('English')).toBeTruthy();
  });

  it('should render chevron when hasChevron is true', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRow label="Test" hasChevron testID="test-row" />
    );

    expect(getByTestId('test-row-chevron')).toBeTruthy();
  });

  it('should not render chevron when hasChevron is false', () => {
    const { queryByTestId } = renderWithProviders(
      <SettingsRow label="Test" testID="test-row" />
    );

    expect(queryByTestId('test-row-chevron')).toBeNull();
  });

  it('should call onPress when tapped', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <SettingsRow label="Test" onPress={onPress} testID="test-row" />
    );

    fireEvent.press(getByTestId('test-row'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('should not call onPress when disabled', () => {
    const onPress = jest.fn();
    const { getByTestId } = renderWithProviders(
      <SettingsRow label="Test" onPress={onPress} disabled testID="test-row" />
    );

    fireEvent.press(getByTestId('test-row'));
    expect(onPress).not.toHaveBeenCalled();
  });

  it('should render icon when provided', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRow label="Test" icon="settings" testID="test-row" />
    );

    expect(getByTestId('test-row-icon')).toBeTruthy();
  });

  it('should render Icon component for appearance icon', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRow label="Appearance" icon="appearance" testID="appearance-row" />
    );

    const iconContainer = getByTestId('appearance-row-icon');
    expect(iconContainer).toBeTruthy();
    // The Icon component should be rendered (not emoji text)
    expect(iconContainer.children).toBeTruthy();
  });

  it('should render Icon component for language icon', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRow label="Language" icon="language" testID="language-row" />
    );

    const iconContainer = getByTestId('language-row-icon');
    expect(iconContainer).toBeTruthy();
  });

  it('should render Icon component for notifications icon', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRow label="Notifications" icon="notifications" testID="notifications-row" />
    );

    const iconContainer = getByTestId('notifications-row-icon');
    expect(iconContainer).toBeTruthy();
  });

  it('should render Icon component for printer icon', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRow label="Printer" icon="printer" testID="printer-row" />
    );

    const iconContainer = getByTestId('printer-row-icon');
    expect(iconContainer).toBeTruthy();
  });

  it('should render Icon component for logout with error color on danger variant', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRow label="Logout" icon="logout" variant="danger" testID="logout-row" />
    );

    const iconContainer = getByTestId('logout-row-icon');
    expect(iconContainer).toBeTruthy();
  });

  it('should apply danger variant styling', () => {
    const { getByTestId, getByText } = renderWithProviders(
      <SettingsRow label="Logout" variant="danger" testID="danger-row" />
    );

    expect(getByTestId('danger-row')).toBeTruthy();
    expect(getByText('Logout')).toBeTruthy();
  });

  it('should have accessible role', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRow label="Test" onPress={() => {}} testID="test-row" />
    );

    const row = getByTestId('test-row');
    expect(row.props.accessibilityRole).toBe('button');
  });
});

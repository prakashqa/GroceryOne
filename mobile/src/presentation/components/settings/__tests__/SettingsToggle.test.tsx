/**
 * SettingsToggle Component Tests
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import SettingsToggle from '../SettingsToggle';

describe('SettingsToggle', () => {
  it('should render label', () => {
    const { getByText } = renderWithProviders(
      <SettingsToggle
        label="Enable Notifications"
        value={false}
        onValueChange={() => {}}
      />
    );

    expect(getByText('Enable Notifications')).toBeTruthy();
  });

  it('should render description when provided', () => {
    const { getByText } = renderWithProviders(
      <SettingsToggle
        label="Dark Mode"
        description="Enable dark theme for the app"
        value={false}
        onValueChange={() => {}}
      />
    );

    expect(getByText('Enable dark theme for the app')).toBeTruthy();
  });

  it('should render switch component', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsToggle
        label="Test"
        value={false}
        onValueChange={() => {}}
        testID="test-toggle"
      />
    );

    expect(getByTestId('test-toggle-switch')).toBeTruthy();
  });

  it('should call onValueChange when toggled', () => {
    const onValueChange = jest.fn();
    const { getByTestId } = renderWithProviders(
      <SettingsToggle
        label="Test"
        value={false}
        onValueChange={onValueChange}
        testID="test-toggle"
      />
    );

    fireEvent(getByTestId('test-toggle-switch'), 'valueChange', true);
    expect(onValueChange).toHaveBeenCalledWith(true);
  });

  it('should reflect current value', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsToggle
        label="Test"
        value={true}
        onValueChange={() => {}}
        testID="test-toggle"
      />
    );

    const switchComponent = getByTestId('test-toggle-switch');
    expect(switchComponent.props.value).toBe(true);
  });

  it('should be disabled when disabled prop is true', () => {
    const onValueChange = jest.fn();
    const { getByTestId } = renderWithProviders(
      <SettingsToggle
        label="Test"
        value={false}
        onValueChange={onValueChange}
        disabled
        testID="test-toggle"
      />
    );

    const switchComponent = getByTestId('test-toggle-switch');
    expect(switchComponent.props.disabled).toBe(true);
  });

  it('should render icon when provided', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsToggle
        label="Test"
        icon="notifications"
        value={false}
        onValueChange={() => {}}
        testID="test-toggle"
      />
    );

    expect(getByTestId('test-toggle-icon')).toBeTruthy();
  });
});

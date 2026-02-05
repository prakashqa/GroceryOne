/**
 * SettingsRadioGroup Component Tests
 */

import React from 'react';
import { fireEvent } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import SettingsRadioGroup from '../SettingsRadioGroup';

const themeOptions = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System Default' },
];

describe('SettingsRadioGroup', () => {
  it('should render all options', () => {
    const { getByText } = renderWithProviders(
      <SettingsRadioGroup
        options={themeOptions}
        selectedValue="light"
        onSelect={() => {}}
      />
    );

    expect(getByText('Light')).toBeTruthy();
    expect(getByText('Dark')).toBeTruthy();
    expect(getByText('System Default')).toBeTruthy();
  });

  it('should show selected option', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRadioGroup
        options={themeOptions}
        selectedValue="dark"
        onSelect={() => {}}
        testID="theme-radio"
      />
    );

    const darkOption = getByTestId('theme-radio-option-dark');
    expect(darkOption.props.accessibilityState.selected).toBe(true);
  });

  it('should call onSelect when option is pressed', () => {
    const onSelect = jest.fn();
    const { getByTestId } = renderWithProviders(
      <SettingsRadioGroup
        options={themeOptions}
        selectedValue="light"
        onSelect={onSelect}
        testID="theme-radio"
      />
    );

    fireEvent.press(getByTestId('theme-radio-option-dark'));
    expect(onSelect).toHaveBeenCalledWith('dark');
  });

  it('should render option description when provided', () => {
    const optionsWithDescription = [
      { value: 'light', label: 'Light', description: 'Use light colors' },
      { value: 'dark', label: 'Dark', description: 'Use dark colors' },
    ];

    const { getByText } = renderWithProviders(
      <SettingsRadioGroup
        options={optionsWithDescription}
        selectedValue="light"
        onSelect={() => {}}
      />
    );

    expect(getByText('Use light colors')).toBeTruthy();
    expect(getByText('Use dark colors')).toBeTruthy();
  });

  it('should render title when provided', () => {
    const { getByText } = renderWithProviders(
      <SettingsRadioGroup
        title="Theme"
        options={themeOptions}
        selectedValue="light"
        onSelect={() => {}}
      />
    );

    expect(getByText('Theme')).toBeTruthy();
  });

  it('should have accessible role for radio buttons', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRadioGroup
        options={themeOptions}
        selectedValue="light"
        onSelect={() => {}}
        testID="theme-radio"
      />
    );

    const option = getByTestId('theme-radio-option-light');
    expect(option.props.accessibilityRole).toBe('radio');
  });

  it('should mark only selected option as selected', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsRadioGroup
        options={themeOptions}
        selectedValue="system"
        onSelect={() => {}}
        testID="theme-radio"
      />
    );

    expect(
      getByTestId('theme-radio-option-light').props.accessibilityState.selected
    ).toBe(false);
    expect(
      getByTestId('theme-radio-option-dark').props.accessibilityState.selected
    ).toBe(false);
    expect(
      getByTestId('theme-radio-option-system').props.accessibilityState.selected
    ).toBe(true);
  });
});

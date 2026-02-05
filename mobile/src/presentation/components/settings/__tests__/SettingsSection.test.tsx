/**
 * SettingsSection Component Tests
 */

import React from 'react';
import { Text } from 'react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import SettingsSection from '../SettingsSection';

describe('SettingsSection', () => {
  it('should render section title', () => {
    const { getByText } = renderWithProviders(
      <SettingsSection title="Account">
        <Text>Content</Text>
      </SettingsSection>
    );

    expect(getByText('Account')).toBeTruthy();
  });

  it('should render children', () => {
    const { getByText } = renderWithProviders(
      <SettingsSection title="Test Section">
        <Text>Child Content</Text>
      </SettingsSection>
    );

    expect(getByText('Child Content')).toBeTruthy();
  });

  it('should render multiple children', () => {
    const { getByText } = renderWithProviders(
      <SettingsSection title="Test Section">
        <Text>First Child</Text>
        <Text>Second Child</Text>
      </SettingsSection>
    );

    expect(getByText('First Child')).toBeTruthy();
    expect(getByText('Second Child')).toBeTruthy();
  });

  it('should have testID when provided', () => {
    const { getByTestId } = renderWithProviders(
      <SettingsSection title="Test Section" testID="test-section">
        <Text>Content</Text>
      </SettingsSection>
    );

    expect(getByTestId('test-section')).toBeTruthy();
  });
});

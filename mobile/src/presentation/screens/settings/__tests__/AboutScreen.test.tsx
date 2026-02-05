/**
 * AboutScreen Tests
 */

import React from 'react';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import AboutScreen from '../AboutScreen';

describe('AboutScreen', () => {
  it('should render app name', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);

    expect(getByText('GroceryOne')).toBeTruthy();
  });

  it('should render app description', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);

    expect(getByText(/grocery management/i)).toBeTruthy();
  });

  it('should render version number', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);

    expect(getByText(/1\.0\.0/)).toBeTruthy();
  });

  it('should render app icon', () => {
    const { getByTestId } = renderWithProviders(<AboutScreen />);

    expect(getByTestId('app-icon')).toBeTruthy();
  });

  it('should render legal section', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);

    expect(getByText('Terms of Service')).toBeTruthy();
    expect(getByText('Privacy Policy')).toBeTruthy();
  });

  it('should render made with love text', () => {
    const { getByText } = renderWithProviders(<AboutScreen />);

    expect(getByText(/Made with/)).toBeTruthy();
  });
});

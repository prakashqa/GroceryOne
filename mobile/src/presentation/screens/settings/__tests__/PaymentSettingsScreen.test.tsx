/**
 * PaymentSettingsScreen Telugu Translation Integration Tests
 * Verifies that the Payment Settings screen renders correctly in Telugu language
 */

import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import PaymentSettingsScreen from '../PaymentSettingsScreen';
import i18n from '../../../../i18n/i18n.config';

describe('PaymentSettingsScreen', () => {
  describe('Telugu locale', () => {
  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('te');
  });

  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  it('should render UPI section header in Telugu', async () => {
    const { getByText } = renderWithProviders(<PaymentSettingsScreen />);

    await waitFor(() => {
      expect(getByText('UPI చెల్లింపు సెట్టింగ్స్')).toBeTruthy();
    });
  });

  it('should render merchant UPI ID label in Telugu', async () => {
    const { getByText } = renderWithProviders(<PaymentSettingsScreen />);

    await waitFor(() => {
      expect(getByText('మర్చంట్ UPI ID')).toBeTruthy();
    });
  });

  it('should render merchant name label in Telugu', async () => {
    const { getByText } = renderWithProviders(<PaymentSettingsScreen />);

    await waitFor(() => {
      expect(getByText('మర్చంట్ పేరు')).toBeTruthy();
    });
  });

  it('should render UPI ID helper text in Telugu', async () => {
    const { getByText } = renderWithProviders(<PaymentSettingsScreen />);

    await waitFor(() => {
      expect(getByText('ఈ UPI ID చెల్లింపు కోసం QR కోడ్\u200cలను రూపొందించడానికి ఉపయోగించబడుతుంది')).toBeTruthy();
    });
  });

  it('should render merchant name helper text in Telugu', async () => {
    const { getByText } = renderWithProviders(<PaymentSettingsScreen />);

    await waitFor(() => {
      expect(getByText('కస్టమర్ QR స్కాన్ చేసినప్పుడు UPI యాప్\u200cలలో చూపించబడే ప్రదర్శన పేరు')).toBeTruthy();
    });
  });

  it('should render info text in Telugu', async () => {
    const { getByText } = renderWithProviders(<PaymentSettingsScreen />);

    await waitFor(() => {
      expect(getByText(/QR కోడ్ చెల్లింపులను ఎనేబుల్ చేయడానికి/)).toBeTruthy();
    });
  });

  it('should not contain English fallback text', async () => {
    const { queryByText } = renderWithProviders(<PaymentSettingsScreen />);

    await waitFor(() => {
      expect(queryByText('UPI Payment Settings')).toBeNull();
      expect(queryByText('This UPI ID will be used to generate QR codes for payment')).toBeNull();
      expect(queryByText('Display name shown in UPI apps when customer scans QR')).toBeNull();
    });
  });
  });
});

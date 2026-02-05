/**
 * LanguageSettingsScreen Tests
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import LanguageSettingsScreen from '../LanguageSettingsScreen';

describe('LanguageSettingsScreen', () => {
  it('should render language options', () => {
    const { getByText } = renderWithProviders(<LanguageSettingsScreen />);

    expect(getByText('English')).toBeTruthy();
    expect(getByText('తెలుగు')).toBeTruthy();
  });

  it('should have English selected by default', () => {
    const { getByTestId } = renderWithProviders(<LanguageSettingsScreen />);

    const englishOption = getByTestId('language-option-en');
    expect(englishOption.props.accessibilityState.selected).toBe(true);
  });

  it('should select Telugu when tapped', async () => {
    const { getByTestId, store } = renderWithProviders(
      <LanguageSettingsScreen />
    );

    fireEvent.press(getByTestId('language-option-te'));

    await waitFor(() => {
      const state = store.getState() as { settings: { language: string } };
      expect(state.settings.language).toBe('te');
    });
  });

  it('should update UI immediately when language changes', async () => {
    const { getByTestId } = renderWithProviders(<LanguageSettingsScreen />);

    fireEvent.press(getByTestId('language-option-te'));

    await waitFor(() => {
      const teluguOption = getByTestId('language-option-te');
      expect(teluguOption.props.accessibilityState.selected).toBe(true);
    });
  });

  it('should render language section title', () => {
    const { queryByText } = renderWithProviders(<LanguageSettingsScreen />);

    // Section title could be in English or Telugu depending on i18n state
    const hasEnglishTitle = queryByText('Language') !== null;
    const hasTeluguTitle = queryByText('భాష') !== null;
    expect(hasEnglishTitle || hasTeluguTitle).toBe(true);
  });
});

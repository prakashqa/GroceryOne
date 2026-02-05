/**
 * CreateCartModal Telugu Translation Integration Tests
 * Verifies that the Create Cart modal renders correctly in Telugu language
 */

import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import CreateCartModal from '../CreateCartModal';
import i18n from '../../../../i18n/i18n.config';

describe('CreateCartModal - Telugu Translation Integration', () => {
  const mockOnClose = jest.fn();
  const mockOnCreate = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    // Set language to Telugu before each test
    await i18n.changeLanguage('te');
  });

  afterAll(async () => {
    // Reset to English after all tests
    await i18n.changeLanguage('en');
  });

  it('should render modal title in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    await waitFor(() => {
      expect(getByText('కొత్త కార్ట్ సృష్టించండి')).toBeTruthy(); // Create New Cart
    });
  });

  it('should render input label in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    await waitFor(() => {
      expect(getByText('కార్ట్ పేరు')).toBeTruthy(); // Cart Name
    });
  });

  it('should render placeholder text in Telugu', async () => {
    const { getByPlaceholderText } = renderWithProviders(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    await waitFor(() => {
      expect(getByPlaceholderText('కార్ట్ పేరు నమోదు చేయండి')).toBeTruthy(); // Enter cart name
    });
  });

  it('should render button text in Telugu', async () => {
    const { getByText } = renderWithProviders(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    await waitFor(() => {
      expect(getByText('సృష్టించు')).toBeTruthy(); // Create
      expect(getByText('రద్దు')).toBeTruthy(); // Cancel
    });
  });

  it('should show duplicate name error in Telugu', async () => {
    const { getByText, getByPlaceholderText } = renderWithProviders(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
        existingNames={['Test Cart']}
      />
    );

    const input = getByPlaceholderText('కార్ట్ పేరు నమోదు చేయండి');
    fireEvent.changeText(input, 'Test Cart');

    await waitFor(() => {
      expect(getByText('ఈ పేరుతో కార్ట్ ఇప్పటికే ఉంది')).toBeTruthy(); // Cart with this name already exists
    });
  });

  it('should not contain English text for modal elements', async () => {
    const { queryByText } = renderWithProviders(
      <CreateCartModal
        visible={true}
        onClose={mockOnClose}
        onCreateCart={mockOnCreate}
      />
    );

    await waitFor(() => {
      expect(queryByText('Create New Cart')).toBeNull();
      expect(queryByText('Cart Name')).toBeNull();
      expect(queryByText('Create')).toBeNull();
      // Cancel should be in Telugu, not English
      expect(queryByText('Cancel')).toBeNull();
    });
  });
});

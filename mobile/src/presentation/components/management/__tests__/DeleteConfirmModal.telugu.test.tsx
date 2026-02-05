/**
 * DeleteConfirmModal Telugu Translation Integration Tests
 * Verifies that the Delete Confirm modal renders correctly in Telugu language
 */

import React from 'react';
import { waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../../../../__tests__/testUtils';
import DeleteConfirmModal from '../DeleteConfirmModal';
import i18n from '../../../../i18n/i18n.config';

describe('DeleteConfirmModal - Telugu Translation Integration', () => {
  const mockOnClose = jest.fn();
  const mockOnConfirm = jest.fn();

  beforeEach(async () => {
    jest.clearAllMocks();
    await i18n.changeLanguage('te');
  });

  afterAll(async () => {
    await i18n.changeLanguage('en');
  });

  describe('Item deletion', () => {
    it('should render delete item title in Telugu', async () => {
      const { getByText } = renderWithProviders(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="item"
          itemName="బాస్మతి బియ్యం"
        />
      );

      await waitFor(() => {
        expect(getByText('వస్తువును తొలగించు')).toBeTruthy();
      });
    });

    it('should render confirm message in Telugu', async () => {
      const { getByText } = renderWithProviders(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="item"
          itemName="బాస్మతి బియ్యం"
        />
      );

      await waitFor(() => {
        expect(getByText(/మీరు తొలగించాలనుకుంటున్నారా/)).toBeTruthy();
      });
    });

    it('should render cart warning in Telugu', async () => {
      const { getByText } = renderWithProviders(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="item"
          itemName="బాస్మతి బియ్యం"
        />
      );

      await waitFor(() => {
        expect(getByText('ఈ వస్తువు ఏవైనా షాపింగ్ కార్ట్\u200cల నుండి కూడా తొలగించబడుతుంది.')).toBeTruthy();
      });
    });

    it('should render buttons in Telugu', async () => {
      const { getByText } = renderWithProviders(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="item"
          itemName="బాస్మతి బియ్యం"
        />
      );

      await waitFor(() => {
        expect(getByText('రద్దు')).toBeTruthy(); // Cancel
        expect(getByText('తొలగించు')).toBeTruthy(); // Delete
      });
    });

    it('should not contain English text for item deletion', async () => {
      const { queryByText } = renderWithProviders(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="item"
          itemName="బాస్మతి బియ్యం"
        />
      );

      await waitFor(() => {
        expect(queryByText('Delete Item')).toBeNull();
        expect(queryByText('Are you sure you want to delete')).toBeNull();
        expect(queryByText('This item will also be removed from any shopping carts.')).toBeNull();
        expect(queryByText('Cancel')).toBeNull();
        expect(queryByText('Delete')).toBeNull();
      });
    });
  });

  describe('Category deletion with items', () => {
    const availableCategories = [
      { id: 'cat-1', name: 'కూరగాయలు', icon: '🥬', sortOrder: 0 },
    ];

    it('should render delete category title in Telugu', async () => {
      const { getByText } = renderWithProviders(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="category"
          itemName="మసాలాలు"
          itemCount={25}
          availableCategories={availableCategories}
        />
      );

      await waitFor(() => {
        expect(getByText('కేటగిరీని తొలగించు')).toBeTruthy();
      });
    });

    it('should render category items question in Telugu', async () => {
      const { getByText } = renderWithProviders(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="category"
          itemName="మసాలాలు"
          itemCount={25}
          availableCategories={availableCategories}
        />
      );

      await waitFor(() => {
        expect(getByText(/కేటగిరీలో.*వస్తువులు/)).toBeTruthy();
      });
    });

    it('should render delete all items option in Telugu', async () => {
      const { getByText } = renderWithProviders(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="category"
          itemName="మసాలాలు"
          itemCount={25}
          availableCategories={availableCategories}
        />
      );

      await waitFor(() => {
        expect(getByText('ఈ కేటగిరీలోని అన్ని వస్తువులను తొలగించు')).toBeTruthy();
      });
    });

    it('should render move items option in Telugu', async () => {
      const { getByText } = renderWithProviders(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="category"
          itemName="మసాలాలు"
          itemCount={25}
          availableCategories={availableCategories}
        />
      );

      await waitFor(() => {
        expect(getByText('వస్తువులను మరొక కేటగిరీకి తరలించు')).toBeTruthy();
      });
    });

    it('should not contain English text for category deletion', async () => {
      const { queryByText } = renderWithProviders(
        <DeleteConfirmModal
          visible={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          type="category"
          itemName="మసాలాలు"
          itemCount={25}
          availableCategories={availableCategories}
        />
      );

      await waitFor(() => {
        expect(queryByText('Delete Category')).toBeNull();
        expect(queryByText('Delete all items in this category')).toBeNull();
        expect(queryByText('Move items to another category')).toBeNull();
      });
    });
  });
});

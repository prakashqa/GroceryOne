/**
 * DeleteConfirmModal Component
 * Modal for confirming deletion of categories or items
 * For categories with items, provides option to delete or move items
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { ModalContainer, Button } from '../common';
import { Category } from '../../../domain/types/picking';

type DeleteType = 'category' | 'item';

interface DeleteConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (options?: { moveItemsTo?: string; deleteItems?: boolean }) => void;
  type: DeleteType;
  itemName: string;
  itemCount?: number; // For categories, number of items in the category
  availableCategories?: Category[]; // For moving items to another category
  testID?: string;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  type,
  itemName,
  itemCount = 0,
  availableCategories = [],
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [selectedOption, setSelectedOption] = useState<'delete' | 'move'>('delete');
  const [moveToCategory, setMoveToCategory] = useState<string>('');

  const hasItems = type === 'category' && itemCount > 0;
  const canMoveItems = hasItems && availableCategories.length > 0;

  const handleConfirm = () => {
    if (type === 'item') {
      onConfirm();
    } else if (type === 'category') {
      if (hasItems && selectedOption === 'move' && moveToCategory) {
        onConfirm({ moveItemsTo: moveToCategory });
      } else {
        onConfirm({ deleteItems: true });
      }
    }
    onClose();
  };

  const handleCancel = () => {
    setSelectedOption('delete');
    setMoveToCategory('');
    onClose();
  };

  const isConfirmDisabled = selectedOption === 'move' && !moveToCategory;

  return (
    <ModalContainer
      visible={visible}
      onClose={handleCancel}
      title={type === 'category' ? t('deleteConfirmModal.deleteCategory') : t('deleteConfirmModal.deleteItem')}
      icon="🗑️"
      variant="danger"
      testID={testID}
    >
      {/* Message */}
      <Text
        style={[
          styles.message,
          {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.lg,
            marginBottom: theme.spacing.sm,
          },
        ]}
      >
        {t('deleteConfirmModal.confirmDelete')}{' '}
        <Text style={styles.itemName}>"{itemName}"</Text>?
      </Text>

      {/* Warning for items in carts */}
      {type === 'item' && (
        <Text
          style={[
            styles.warning,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.md,
              marginBottom: theme.spacing.md,
            },
          ]}
        >
          {t('deleteConfirmModal.cartWarning')}
        </Text>
      )}

      {/* Category with items - show options */}
      {hasItems && (
        <View style={[styles.optionsContainer, { marginTop: theme.spacing.md }]}>
          <Text
            style={[
              styles.optionsLabel,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            {t('deleteConfirmModal.categoryItemsQuestion', { count: itemCount })}
          </Text>

          {/* Delete items option */}
          <TouchableOpacity
            style={[
              styles.optionRow,
              {
                borderColor:
                  selectedOption === 'delete'
                    ? theme.colors.error
                    : theme.colors.border,
                backgroundColor:
                  selectedOption === 'delete'
                    ? theme.colors.iconDanger
                    : 'transparent',
                borderRadius: theme.borderRadius.md,
                padding: theme.spacing.md,
                marginBottom: theme.spacing.sm,
              },
            ]}
            onPress={() => setSelectedOption('delete')}
            testID={testID ? `${testID}-delete-option` : undefined}
          >
            <View
              style={[
                styles.radio,
                {
                  borderColor:
                    selectedOption === 'delete'
                      ? theme.colors.error
                      : theme.colors.border,
                },
              ]}
            >
              {selectedOption === 'delete' && (
                <View
                  style={[
                    styles.radioInner,
                    { backgroundColor: theme.colors.error },
                  ]}
                />
              )}
            </View>
            <Text
              style={[
                styles.optionText,
                {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.md,
                },
              ]}
            >
              {t('deleteConfirmModal.deleteAllItems')}
            </Text>
          </TouchableOpacity>

          {/* Move items option */}
          {canMoveItems && (
            <>
              <TouchableOpacity
                style={[
                  styles.optionRow,
                  {
                    borderColor:
                      selectedOption === 'move'
                        ? theme.colors.primary
                        : theme.colors.border,
                    backgroundColor:
                      selectedOption === 'move'
                        ? theme.colors.iconMuted
                        : 'transparent',
                    borderRadius: theme.borderRadius.md,
                    padding: theme.spacing.md,
                    marginBottom: theme.spacing.sm,
                  },
                ]}
                onPress={() => setSelectedOption('move')}
                testID={testID ? `${testID}-move-option` : undefined}
              >
                <View
                  style={[
                    styles.radio,
                    {
                      borderColor:
                        selectedOption === 'move'
                          ? theme.colors.primary
                          : theme.colors.border,
                    },
                  ]}
                >
                  {selectedOption === 'move' && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    {
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                    },
                  ]}
                >
                  {t('deleteConfirmModal.moveItemsToAnother')}
                </Text>
              </TouchableOpacity>

              {/* Category picker for move option */}
              {selectedOption === 'move' && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={[styles.categoryScroll, { marginLeft: theme.spacing.xl }]}
                >
                  {availableCategories.map((cat) => (
                    <TouchableOpacity
                      key={cat.id}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor:
                            moveToCategory === cat.id
                              ? theme.colors.primary
                              : theme.colors.inputBackground,
                          borderColor:
                            moveToCategory === cat.id
                              ? theme.colors.primary
                              : theme.colors.border,
                          borderRadius: theme.borderRadius.full,
                          paddingHorizontal: theme.spacing.md,
                          paddingVertical: theme.spacing.sm,
                          marginRight: theme.spacing.sm,
                        },
                      ]}
                      onPress={() => setMoveToCategory(cat.id)}
                      testID={testID ? `${testID}-category-${cat.id}` : undefined}
                    >
                      <Text style={styles.categoryIcon}>{cat.icon}</Text>
                      <Text
                        style={[
                          styles.categoryName,
                          {
                            color:
                              moveToCategory === cat.id
                                ? theme.colors.buttonPrimaryText
                                : theme.colors.text,
                            fontSize: theme.typography.fontSize.md,
                          },
                        ]}
                        numberOfLines={1}
                      >
                        {cat.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </>
          )}
        </View>
      )}

      {/* Buttons */}
      <View style={[styles.buttonContainer, { marginTop: theme.spacing.lg, gap: theme.spacing.md }]}>
        <View style={styles.buttonWrapper}>
          <Button
            title={t('cancel')}
            onPress={handleCancel}
            variant="ghost"
            fullWidth
            testID={testID ? `${testID}-cancel-button` : undefined}
          />
        </View>
        <View style={styles.buttonWrapper}>
          <Button
            title={selectedOption === 'move' ? t('deleteConfirmModal.moveAndDelete') : t('delete')}
            onPress={handleConfirm}
            variant="danger"
            disabled={isConfirmDisabled}
            fullWidth
            testID={testID ? `${testID}-confirm-button` : undefined}
          />
        </View>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  message: {
    textAlign: 'center',
  },
  itemName: {
    fontWeight: '600',
  },
  warning: {
    textAlign: 'center',
    fontStyle: 'italic',
  },
  optionsContainer: {
    marginBottom: 8,
  },
  optionsLabel: {
    fontWeight: '400',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  optionText: {
    flex: 1,
  },
  categoryScroll: {
    maxHeight: 50,
    marginTop: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  categoryName: {
    fontWeight: '500',
    maxWidth: 100,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  buttonWrapper: {
    flex: 1,
  },
});

export default DeleteConfirmModal;

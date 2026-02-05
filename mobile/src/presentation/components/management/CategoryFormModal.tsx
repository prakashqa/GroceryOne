/**
 * CategoryFormModal Component
 * Modal for creating or editing a category
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { ModalContainer } from '../common';
import { Button } from '../common';
import { Category } from '../../../domain/types/picking';

// Common emoji icons for categories
const EMOJI_OPTIONS = [
  '🌾', '🫘', '🫒', '☕', '🍪', '🧴', '💄', '🧺', '👶',
  '🥬', '🍎', '🥛', '🍞', '🧀', '🍖', '🐟', '🥚', '🍝',
  '🍫', '🧊', '🧹', '💊', '🎁', '📦', '🏷️', '📁',
];

interface CategoryFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string; icon: string }) => void;
  existingNames: string[];
  editCategory?: Category | null;
  testID?: string;
}

const CategoryFormModal: React.FC<CategoryFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  existingNames,
  editCategory,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📁');
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editCategory;

  // Reset state when modal opens/closes or editCategory changes
  useEffect(() => {
    if (visible) {
      if (editCategory) {
        setName(editCategory.name);
        setIcon(editCategory.icon);
      } else {
        setName('');
        setIcon('📁');
      }
      setError(null);
    }
  }, [visible, editCategory]);

  // Check for duplicate names
  useEffect(() => {
    const trimmedName = name.trim();
    if (trimmedName) {
      const isDuplicate = existingNames.some(
        (existingName) =>
          existingName.toLowerCase() === trimmedName.toLowerCase() &&
          existingName.toLowerCase() !== editCategory?.name.toLowerCase()
      );
      if (isDuplicate) {
        setError(t('manageCategories.duplicateName'));
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  }, [name, existingNames, editCategory, t]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    if (!trimmedName || error) {
      return;
    }
    onSubmit({ name: trimmedName, icon });
    onClose();
  };

  const handleCancel = () => {
    setName('');
    setIcon('📁');
    setError(null);
    onClose();
  };

  const isSubmitDisabled = !name.trim() || !!error;

  return (
    <ModalContainer
      visible={visible}
      onClose={handleCancel}
      title={isEditMode ? t('manageCategories.editCategory') : t('manageCategories.addCategory')}
      icon="📁"
      testID={testID}
    >
      {/* Name Input */}
      <View style={styles.inputContainer}>
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.md,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          {t('manageCategories.categoryName')}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              backgroundColor: theme.colors.inputBackground,
              color: theme.colors.text,
              borderColor: error ? theme.colors.error : theme.colors.border,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.lg,
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.md - 2,
            },
          ]}
          placeholder={t('manageCategories.enterCategoryName')}
          placeholderTextColor={theme.colors.placeholder}
          value={name}
          onChangeText={setName}
          autoFocus
          maxLength={50}
          testID={testID ? `${testID}-name-input` : undefined}
        />
        {error && (
          <Text
            style={[
              styles.errorText,
              {
                color: theme.colors.error,
                fontSize: theme.typography.fontSize.sm,
                marginTop: theme.spacing.xs,
              },
            ]}
          >
            {error}
          </Text>
        )}
      </View>

      {/* Icon Picker */}
      <View style={[styles.inputContainer, { marginBottom: theme.spacing.lg }]}>
        <Text
          style={[
            styles.label,
            {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.md,
              marginBottom: theme.spacing.sm,
            },
          ]}
        >
          {t('manageCategories.icon')}
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.emojiScroll}
        >
          <View style={styles.emojiContainer}>
            {EMOJI_OPTIONS.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={[
                  styles.emojiButton,
                  {
                    backgroundColor:
                      icon === emoji
                        ? theme.colors.iconMuted
                        : theme.colors.inputBackground,
                    borderColor:
                      icon === emoji ? theme.colors.primary : theme.colors.border,
                    borderRadius: theme.borderRadius.md,
                    marginRight: theme.spacing.sm,
                  },
                ]}
                onPress={() => setIcon(emoji)}
              >
                <Text style={styles.emoji}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
        <View style={[styles.selectedIconContainer, { marginTop: theme.spacing.md }]}>
          <Text
            style={[
              styles.selectedLabel,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.md,
                marginRight: theme.spacing.sm,
              },
            ]}
          >
            {t('manageCategories.selected')}
          </Text>
          <Text style={styles.selectedIcon}>{icon}</Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={[styles.buttonContainer, { gap: theme.spacing.md }]}>
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
            title={isEditMode ? t('save') : t('picking.add')}
            onPress={handleSubmit}
            variant="primary"
            disabled={isSubmitDisabled}
            fullWidth
            testID={testID ? `${testID}-submit-button` : undefined}
          />
        </View>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
  },
  errorText: {
    fontWeight: '400',
  },
  emojiScroll: {
    maxHeight: 56,
  },
  emojiContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderWidth: 1.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emoji: {
    fontSize: 24,
  },
  selectedIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedLabel: {
    fontWeight: '400',
  },
  selectedIcon: {
    fontSize: 28,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  buttonWrapper: {
    flex: 1,
  },
});

export default CategoryFormModal;

/**
 * AddQuantityModal Component
 * Modal for selecting quantity when adding items to cart
 * Supports unit toggle (kg/gm, L/ml) for weight and volume items
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';

import { Item } from '../../../domain/types/picking';
import { getTranslatedCategoryName } from '../../../domain/utils/itemTranslations';
import {
  isConvertibleUnit,
  getAlternateUnit,
  normalizeToBaseUnit,
  getPresetQuantitiesForUnit,
  type ItemUnit,
} from '../../../domain/utils/unitConversion';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { useResponsiveStyles } from '../../../hooks';

interface AddQuantityModalProps {
  visible: boolean;
  item: Item | null;
  onClose: () => void;
  onAddToCart: (item: Item, quantity: number, displayUnit?: ItemUnit) => void;
}

// Get category display name for title
const getCategoryDisplayName = (categoryId: string): string => {
  const translatedName = getTranslatedCategoryName(categoryId);
  if (translatedName === categoryId) return 'Item';
  // Get first word of category name
  return translatedName.split(',')[0].split(' ')[0];
};

const AddQuantityModal: React.FC<AddQuantityModalProps> = ({
  visible,
  item,
  onClose,
  onAddToCart,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [customQuantity, setCustomQuantity] = useState('');
  const [isCustomSelected, setIsCustomSelected] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<ItemUnit>('kg');

  // Theme-aware colors for special states
  const selectedBgColor = theme.colors.successBackground;

  // Responsive dynamic styles for tablet optimization
  const dynamicStyles = {
    modalContainer: {
      borderRadius: responsiveStyles.cardBorderRadius + 8,
      padding: responsiveStyles.componentPadding + 4,
      width: responsiveStyles.modalWidth,
      maxWidth: responsiveStyles.modalWidth,
    },
    title: {
      fontSize: Math.round(theme.typography.fontSize['2xl'] * responsiveStyles.fontScale),
      fontWeight: theme.typography.fontWeight.bold,
    },
    closeButton: {
      width: Math.max(responsiveStyles.touchTargetMinSize, 44),
      height: Math.max(responsiveStyles.touchTargetMinSize, 44),
      borderRadius: theme.borderRadius.full,
    },
    closeButtonText: {
      fontSize: Math.round(24 * responsiveStyles.fontScale),
    },
    unitToggleButton: {
      paddingVertical: Math.round(10 * responsiveStyles.fontScale),
      paddingHorizontal: Math.round(16 * responsiveStyles.fontScale),
      borderRadius: theme.borderRadius.sm,
      minHeight: responsiveStyles.touchTargetMinSize - 4,
    },
    unitToggleText: {
      fontSize: Math.round(16 * responsiveStyles.fontScale),
      fontWeight: theme.typography.fontWeight.semibold,
    },
    selectLabel: {
      fontSize: Math.round(14 * responsiveStyles.fontScale),
      marginBottom: theme.spacing.smd,
    },
    quantityOption: {
      paddingVertical: Math.round(12 * responsiveStyles.fontScale),
      paddingHorizontal: Math.round(20 * responsiveStyles.fontScale),
      borderRadius: theme.borderRadius.sm,
      minWidth: Math.round(60 * responsiveStyles.fontScale),
      minHeight: responsiveStyles.touchTargetMinSize - 4,
    },
    quantityOptionText: {
      fontSize: Math.round(16 * responsiveStyles.fontScale),
      fontWeight: theme.typography.fontWeight.semibold,
    },
    customOptionText: {
      fontSize: Math.round(14 * responsiveStyles.fontScale),
      fontWeight: theme.typography.fontWeight.semibold,
    },
    customInput: {
      fontSize: Math.round(16 * responsiveStyles.fontScale),
      fontWeight: theme.typography.fontWeight.semibold,
    },
    customUnit: {
      fontSize: Math.round(12 * responsiveStyles.fontScale),
    },
    addToCartButton: {
      borderRadius: theme.borderRadius.md,
      paddingVertical: Math.round(14 * responsiveStyles.fontScale),
      paddingHorizontal: Math.round(24 * responsiveStyles.fontScale),
      minHeight: responsiveStyles.touchTargetMinSize,
    },
    cartIcon: {
      fontSize: Math.round(18 * responsiveStyles.fontScale),
    },
    addToCartText: {
      fontSize: Math.round(16 * responsiveStyles.fontScale),
      fontWeight: theme.typography.fontWeight.bold,
      color: theme.colors.textInverse,
    },
  };

  // Check if unit toggle should be shown (only for weight/volume units)
  const showUnitToggle = item && isConvertibleUnit(item.unit);
  const alternateUnit = item ? getAlternateUnit(item.unit) : null;

  // Reset state when modal opens or item changes
  useEffect(() => {
    if (visible && item) {
      setSelectedUnit(item.unit);
      setSelectedQuantity(null); // Clear selection, user must choose
      setCustomQuantity('');
      setIsCustomSelected(false);
    }
  }, [visible, item]);

  // Get presets for currently selected unit
  const presetQuantities = getPresetQuantitiesForUnit(selectedUnit);

  const handleUnitChange = useCallback((unit: ItemUnit) => {
    setSelectedUnit(unit);
    // Clear selection when unit changes
    setSelectedQuantity(null);
    setCustomQuantity('');
    setIsCustomSelected(false);
  }, []);

  const handlePresetSelect = useCallback((quantity: number) => {
    setSelectedQuantity(quantity);
    setIsCustomSelected(false);
    setCustomQuantity('');
  }, []);

  const handleCustomSelect = useCallback(() => {
    setIsCustomSelected(true);
    setSelectedQuantity(null);
  }, []);

  const handleCustomChange = useCallback((text: string) => {
    // Allow decimal input for kg/L units, integers only for gm/ml/pcs
    const allowDecimal = selectedUnit === 'kg' || selectedUnit === 'L';
    const pattern = allowDecimal ? /[^0-9.]/g : /[^0-9]/g;
    let sanitizedText = text.replace(pattern, '');

    // Ensure only one decimal point
    if (allowDecimal) {
      const parts = sanitizedText.split('.');
      if (parts.length > 2) {
        sanitizedText = parts[0] + '.' + parts.slice(1).join('');
      }
    }

    setCustomQuantity(sanitizedText);
  }, [selectedUnit]);

  const handleAddToCart = useCallback(() => {
    if (!item) return;

    let quantity: number;
    if (isCustomSelected) {
      quantity = parseFloat(customQuantity);
      if (isNaN(quantity) || quantity <= 0) {
        // Don't add if custom quantity is invalid
        return;
      }
    } else {
      if (selectedQuantity === null) {
        // No quantity selected
        return;
      }
      quantity = selectedQuantity;
    }

    // Normalize to base unit if convertible (gm->kg, ml->L)
    const { quantity: normalizedQty } = normalizeToBaseUnit(quantity, selectedUnit);

    onAddToCart(item, normalizedQty, selectedUnit);
    onClose();
  }, [item, selectedQuantity, isCustomSelected, customQuantity, selectedUnit, onAddToCart, onClose]);

  // Don't render if item is null
  if (!item) {
    return null;
  }

  const categoryName = getCategoryDisplayName(item.categoryId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose} testID="modal-backdrop">
        <View style={[styles.backdrop, { backgroundColor: theme.colors.modalOverlay }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            style={styles.keyboardView}
          >
            <TouchableWithoutFeedback>
              <View style={[styles.modalContainer, { borderRadius: theme.borderRadius.xl, padding: responsiveStyles.componentPadding }, dynamicStyles.modalContainer, { backgroundColor: theme.colors.surface }]}>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={[styles.title, dynamicStyles.title, { color: theme.colors.text }]}>{t('picking.add')} {categoryName}</Text>
                  <TouchableOpacity
                    onPress={onClose}
                    style={[styles.closeButton, dynamicStyles.closeButton, { backgroundColor: theme.colors.background }]}
                    testID="close-button"
                  >
                    <Text style={[styles.closeButtonText, dynamicStyles.closeButtonText, { color: theme.colors.textSecondary }]}>×</Text>
                  </TouchableOpacity>
                </View>

                {/* Unit Toggle (for kg/gm and L/ml) */}
                {showUnitToggle && alternateUnit && (
                  <View style={styles.unitToggleContainer}>
                    <TouchableOpacity
                      style={[
                        styles.unitToggleButton,
                        dynamicStyles.unitToggleButton,
                        { borderColor: theme.colors.border },
                        selectedUnit === item.unit && {
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                        },
                      ]}
                      onPress={() => handleUnitChange(item.unit)}
                      testID={`unit-toggle-${item.unit}`}
                    >
                      <Text
                        style={[
                          styles.unitToggleText,
                          dynamicStyles.unitToggleText,
                          { color: theme.colors.text },
                          selectedUnit === item.unit && { color: theme.colors.textInverse },
                        ]}
                      >
                        {item.unit}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.unitToggleButton,
                        dynamicStyles.unitToggleButton,
                        { borderColor: theme.colors.border },
                        selectedUnit === alternateUnit && {
                          backgroundColor: theme.colors.primary,
                          borderColor: theme.colors.primary,
                        },
                      ]}
                      onPress={() => handleUnitChange(alternateUnit)}
                      testID={`unit-toggle-${alternateUnit}`}
                    >
                      <Text
                        style={[
                          styles.unitToggleText,
                          dynamicStyles.unitToggleText,
                          { color: theme.colors.text },
                          selectedUnit === alternateUnit && { color: theme.colors.textInverse },
                        ]}
                      >
                        {alternateUnit}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Quantity Label */}
                <Text style={[styles.selectLabel, dynamicStyles.selectLabel, { color: theme.colors.textSecondary }]}>{t('picking.selectQuantity')}</Text>

                {/* Quantity Options */}
                <View style={[styles.quantityOptions, { gap: theme.spacing.smd }]}>
                  {presetQuantities.map((quantity) => (
                    <TouchableOpacity
                      key={quantity}
                      style={[
                        styles.quantityOption,
                        dynamicStyles.quantityOption,
                        { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                        selectedQuantity === quantity &&
                          !isCustomSelected && {
                            borderColor: theme.colors.primary,
                            backgroundColor: selectedBgColor,
                          },
                      ]}
                      onPress={() => handlePresetSelect(quantity)}
                      testID={`quantity-option-${quantity}`}
                      accessibilityState={{
                        selected: selectedQuantity === quantity && !isCustomSelected,
                      }}
                    >
                      <Text
                        style={[
                          styles.quantityOptionText,
                          dynamicStyles.quantityOptionText,
                          { color: theme.colors.text },
                          selectedQuantity === quantity &&
                            !isCustomSelected && { color: theme.colors.primary },
                        ]}
                      >
                        {quantity}
                      </Text>
                    </TouchableOpacity>
                  ))}

                  {/* Custom Quantity Option */}
                  <TouchableOpacity
                    style={[
                      styles.quantityOption,
                      styles.customOption,
                      dynamicStyles.quantityOption,
                      { borderColor: theme.colors.border, backgroundColor: theme.colors.surface },
                      isCustomSelected && {
                        borderColor: theme.colors.primary,
                        backgroundColor: selectedBgColor,
                      },
                    ]}
                    onPress={handleCustomSelect}
                    testID="custom-quantity-option"
                    accessibilityState={{ selected: isCustomSelected }}
                  >
                    {isCustomSelected ? (
                      <View style={styles.customInputContainer}>
                        <TextInput
                          style={[styles.customInput, dynamicStyles.customInput, { color: theme.colors.primary }]}
                          value={customQuantity}
                          onChangeText={handleCustomChange}
                          keyboardType="decimal-pad"
                          placeholder="0"
                          placeholderTextColor={theme.colors.textLight}
                          testID="custom-quantity-input"
                          autoFocus
                        />
                        <Text
                          style={[styles.customUnit, dynamicStyles.customUnit, { color: theme.colors.primary }]}
                          testID="custom-quantity-display"
                        >
                          {customQuantity || '0'} {selectedUnit}
                        </Text>
                      </View>
                    ) : (
                      <Text style={[styles.customOptionText, dynamicStyles.customOptionText, { color: theme.colors.textSecondary }]}>
                        {selectedUnit === 'gm' || selectedUnit === 'ml' ? '1000' : item.defaultQuantity} {selectedUnit} +
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>

                {/* Add to Cart Button */}
                <TouchableOpacity
                  style={[styles.addToCartButton, dynamicStyles.addToCartButton, { backgroundColor: theme.colors.primary }]}
                  onPress={handleAddToCart}
                  testID="add-to-cart-button"
                >
                  <Text style={[styles.cartIcon, dynamicStyles.cartIcon]}>🛒</Text>
                  <Text style={[styles.addToCartText, dynamicStyles.addToCartText]}>{t('picking.addToCart')}</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    maxWidth: 350,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
  },
  closeButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    lineHeight: 26,
  },
  unitToggleContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  unitToggleButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  unitToggleText: {
    fontSize: 16,
  },
  selectLabel: {
    fontSize: 14,
  },
  quantityOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  quantityOption: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderWidth: 1.5,
    minWidth: 60,
    alignItems: 'center',
  },
  quantityOptionText: {
    fontSize: 16,
  },
  customOption: {
    minWidth: 80,
  },
  customOptionText: {
    fontSize: 14,
  },
  customInputContainer: {
    alignItems: 'center',
  },
  customInput: {
    fontSize: 16,
    textAlign: 'center',
    minWidth: 40,
    padding: 0,
  },
  customUnit: {
    fontSize: 12,
    marginTop: 2,
  },
  addToCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  cartIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  addToCartText: {
    fontSize: 16,
  },
});

export default AddQuantityModal;

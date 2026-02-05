/**
 * QuantityEditModal Component
 * Modal for editing item quantity in scan results
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../../presentation/theme';
import { useTranslation } from 'react-i18next';
import { Item } from '../../../domain/types/picking';
import { getTranslatedItemName } from '../../../domain/utils/itemTranslations';

interface QuantityEditModalProps {
  visible: boolean;
  item: Item | null;
  currentQuantity: number;
  onClose: () => void;
  onSave: (quantity: number) => void;
}

export const QuantityEditModal: React.FC<QuantityEditModalProps> = ({
  visible,
  item,
  currentQuantity,
  onClose,
  onSave,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [quantity, setQuantity] = useState(currentQuantity.toString());

  useEffect(() => {
    setQuantity(currentQuantity.toString());
  }, [currentQuantity, visible]);

  const handleSave = () => {
    const parsedQuantity = parseFloat(quantity);
    if (!isNaN(parsedQuantity) && parsedQuantity > 0) {
      onSave(parsedQuantity);
    }
  };

  const handleIncrement = () => {
    const current = parseFloat(quantity) || 0;
    const increment = item?.defaultQuantity || 1;
    setQuantity((current + increment).toString());
  };

  const handleDecrement = () => {
    const current = parseFloat(quantity) || 0;
    const decrement = item?.defaultQuantity || 1;
    const newValue = Math.max(decrement, current - decrement);
    setQuantity(newValue.toString());
  };

  if (!item) return null;

  const itemName = getTranslatedItemName(item.id);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={[styles.modal, {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.lg,
          padding: theme.spacing.lg,
        }]}>
          <View style={[styles.header, { marginBottom: theme.spacing.sm }]}>
            <Text style={[styles.title, {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
            }]}>
              {t('picking.selectQuantity')}
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeButton, {
                color: theme.colors.textLight,
                fontSize: theme.typography.fontSize['2xl'],
                padding: theme.spacing.xs,
              }]}>
                ✕
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.itemName, {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.md,
            marginBottom: theme.spacing.lg,
          }]}>
            {itemName}
          </Text>

          <View style={[styles.quantityContainer, { marginBottom: theme.spacing.md }]}>
            <TouchableOpacity
              style={[styles.quantityButton, {
                backgroundColor: theme.colors.background,
                borderRadius: theme.borderRadius.md,
              }]}
              onPress={handleDecrement}
            >
              <Text style={[styles.quantityButtonText, {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.semibold,
              }]}>
                -
              </Text>
            </TouchableOpacity>

            <View style={[styles.inputContainer, { marginHorizontal: theme.spacing.md }]}>
              <TextInput
                style={[
                  styles.quantityInput,
                  {
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                    fontSize: theme.typography.fontSize.xxl,
                    fontWeight: theme.typography.fontWeight.bold,
                    borderRadius: theme.borderRadius.sm,
                    paddingHorizontal: theme.spacing.smd,
                    paddingVertical: theme.spacing.sm,
                  },
                ]}
                value={quantity}
                onChangeText={setQuantity}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={[styles.unitLabel, {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.lg,
                marginLeft: theme.spacing.sm,
              }]}>
                {item.unit}
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.quantityButton, {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.md,
              }]}
              onPress={handleIncrement}
            >
              <Text style={[styles.quantityButtonText, {
                color: theme.colors.buttonPrimaryText,
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.semibold,
              }]}>
                +
              </Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.presetRow, { marginBottom: theme.spacing.lg }]}>
            {[1, 2, 5, 10].map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[styles.presetButton, {
                  borderColor: theme.colors.border,
                  paddingHorizontal: theme.spacing.smd,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                }]}
                onPress={() => setQuantity((preset * (item.defaultQuantity || 1)).toString())}
              >
                <Text style={[styles.presetText, {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                }]}>
                  {preset * (item.defaultQuantity || 1)} {item.unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity
            style={[styles.saveButton, {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.md,
              paddingVertical: theme.spacing.md,
            }]}
            onPress={handleSave}
          >
            <Text style={[styles.saveButtonText, {
              color: theme.colors.buttonPrimaryText,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.bold,
            }]}>
              {t('save')}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modal: {
    width: '85%',
    // borderRadius, padding applied inline via theme tokens
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // marginBottom applied inline via theme tokens
  },
  title: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  closeButton: {
    // fontSize, padding applied inline via theme tokens
  },
  itemName: {
    // fontSize, marginBottom applied inline via theme tokens
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom applied inline via theme tokens
  },
  quantityButton: {
    width: 48,
    height: 48,
    // borderRadius applied inline via theme tokens
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityButtonText: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginHorizontal applied inline via theme tokens
  },
  quantityInput: {
    // fontSize, fontWeight, borderRadius, paddingHorizontal, paddingVertical applied inline via theme tokens
    textAlign: 'center',
    minWidth: 80,
    borderWidth: 1,
  },
  unitLabel: {
    // fontSize, marginLeft applied inline via theme tokens
  },
  presetRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    // marginBottom applied inline via theme tokens
  },
  presetButton: {
    // paddingHorizontal, paddingVertical, borderRadius applied inline via theme tokens
    borderWidth: 1,
  },
  presetText: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  saveButton: {
    // borderRadius, paddingVertical applied inline via theme tokens
    alignItems: 'center',
  },
  saveButtonText: {
    // fontSize, fontWeight applied inline via theme tokens
  },
});

export default QuantityEditModal;

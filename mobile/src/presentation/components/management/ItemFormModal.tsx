/**
 * ItemFormModal Component
 * Modal for creating or editing an item
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
import { ModalContainer, Button } from '../common';
import { Category, Item } from '../../../domain/types/picking';

const UNIT_OPTIONS: { value: Item['unit']; label: string }[] = [
  { value: 'kg', label: 'Kilogram (kg)' },
  { value: 'gm', label: 'Gram (gm)' },
  { value: 'L', label: 'Litre (L)' },
  { value: 'ml', label: 'Millilitre (ml)' },
  { value: 'pcs', label: 'Pieces (pcs)' },
];

interface ItemFormModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    categoryId: string;
    unit: Item['unit'];
    defaultQuantity: number;
    mrp: number;
    salePrice?: number;
  }) => void;
  categories: Category[];
  editItem?: Item | null;
  initialCategoryId?: string;
  testID?: string;
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  categories,
  editItem,
  initialCategoryId,
  testID,
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState<Item['unit']>('pcs');
  const [defaultQuantity, setDefaultQuantity] = useState('1');
  const [mrp, setMrp] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isEditMode = !!editItem;

  // Calculate discount percentage
  const discountPercent = React.useMemo(() => {
    const mrpNum = parseFloat(mrp);
    const salePriceNum = parseFloat(salePrice);
    if (!isNaN(mrpNum) && !isNaN(salePriceNum) && mrpNum > 0 && salePriceNum > 0 && mrpNum > salePriceNum) {
      return Math.round(((mrpNum - salePriceNum) / mrpNum) * 100);
    }
    return null;
  }, [mrp, salePrice]);

  // Reset state when modal opens/closes or editItem changes
  useEffect(() => {
    if (visible) {
      if (editItem) {
        setName(editItem.name);
        setCategoryId(editItem.categoryId);
        setUnit(editItem.unit);
        setDefaultQuantity(editItem.defaultQuantity.toString());
        setMrp(editItem.mrp?.toString() || '');
        setSalePrice(editItem.price?.toString() || '');
      } else {
        setName('');
        setCategoryId(initialCategoryId || categories[0]?.id || '');
        setUnit('pcs');
        setDefaultQuantity('1');
        setMrp('');
        setSalePrice('');
      }
      setError(null);
    }
  }, [visible, editItem, initialCategoryId, categories]);

  // Validate inputs
  useEffect(() => {
    const trimmedName = name.trim();
    const qty = parseFloat(defaultQuantity);
    const mrpNum = parseFloat(mrp);
    const salePriceNum = parseFloat(salePrice);

    if (trimmedName && !categoryId) {
      setError(t('validation.selectCategory'));
    } else if (defaultQuantity && (isNaN(qty) || qty <= 0)) {
      setError(t('validation.positiveQuantity'));
    } else if (trimmedName && categoryId && (!mrp || isNaN(mrpNum) || mrpNum <= 0)) {
      setError(t('validation.mrpRequired'));
    } else if (mrp && salePrice && !isNaN(mrpNum) && !isNaN(salePriceNum) && salePriceNum > mrpNum) {
      setError(t('validation.salePriceExceedsMrp'));
    } else {
      setError(null);
    }
  }, [name, categoryId, defaultQuantity, mrp, salePrice, t]);

  const handleSubmit = () => {
    const trimmedName = name.trim();
    const qty = parseFloat(defaultQuantity) || 1;
    const mrpNum = parseFloat(mrp);
    const salePriceNum = parseFloat(salePrice);

    if (!trimmedName || !categoryId || !mrp || isNaN(mrpNum) || mrpNum <= 0 || error) {
      return;
    }

    onSubmit({
      name: trimmedName,
      categoryId,
      unit,
      defaultQuantity: qty,
      mrp: mrpNum,
      ...(salePrice && !isNaN(salePriceNum) && { salePrice: salePriceNum }),
    });
    onClose();
  };

  const handleCancel = () => {
    setName('');
    setCategoryId('');
    setUnit('pcs');
    setDefaultQuantity('1');
    setMrp('');
    setSalePrice('');
    setError(null);
    onClose();
  };

  const mrpNum = parseFloat(mrp);
  const isSubmitDisabled = !name.trim() || !categoryId || !mrp || isNaN(mrpNum) || mrpNum <= 0 || !!error;

  return (
    <ModalContainer
      visible={visible}
      onClose={handleCancel}
      title={isEditMode ? t('manageItems.editItem') : t('manageItems.addItem')}
      icon="📦"
      testID={testID}
    >
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Name Input */}
        <View style={[styles.inputContainer, { marginBottom: theme.spacing.md }]}>
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
            {t('manageItems.itemName')}
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.lg,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.md - 2,
              },
            ]}
            placeholder={t('manageItems.enterItemName')}
            placeholderTextColor={theme.colors.placeholder}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={100}
            testID={testID ? `${testID}-name-input` : undefined}
          />
        </View>

        {/* Category Picker */}
        <View style={[styles.inputContainer, { marginBottom: theme.spacing.md }]}>
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
            {t('manageItems.selectCategory')}
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryScroll}
          >
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[
                  styles.categoryChip,
                  {
                    backgroundColor:
                      categoryId === cat.id
                        ? theme.colors.primary
                        : theme.colors.inputBackground,
                    borderColor:
                      categoryId === cat.id
                        ? theme.colors.primary
                        : theme.colors.border,
                    borderRadius: theme.borderRadius.full,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                    marginRight: theme.spacing.sm,
                  },
                ]}
                onPress={() => setCategoryId(cat.id)}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text
                  style={[
                    styles.categoryName,
                    {
                      color:
                        categoryId === cat.id
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
        </View>

        {/* Unit Picker */}
        <View style={[styles.inputContainer, { marginBottom: theme.spacing.md }]}>
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
            {t('manageItems.selectUnit')}
          </Text>
          <View style={[styles.unitContainer, { gap: theme.spacing.sm }]}>
            {UNIT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.unitChip,
                  {
                    backgroundColor:
                      unit === option.value
                        ? theme.colors.primary
                        : theme.colors.inputBackground,
                    borderColor:
                      unit === option.value
                        ? theme.colors.primary
                        : theme.colors.border,
                    borderRadius: theme.borderRadius.full,
                    paddingHorizontal: theme.spacing.md,
                    paddingVertical: theme.spacing.sm,
                  },
                ]}
                onPress={() => setUnit(option.value)}
              >
                <Text
                  style={[
                    styles.unitText,
                    {
                      color:
                        unit === option.value
                          ? theme.colors.buttonPrimaryText
                          : theme.colors.text,
                      fontSize: theme.typography.fontSize.md,
                    },
                  ]}
                >
                  {option.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Default Quantity */}
        <View style={[styles.inputContainer, { marginBottom: theme.spacing.md }]}>
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
            {t('manageItems.defaultQuantity')}
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.quantityInput,
              {
                backgroundColor: theme.colors.inputBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.lg,
                paddingHorizontal: theme.spacing.md,
                paddingVertical: theme.spacing.md - 2,
              },
            ]}
            placeholder="1"
            placeholderTextColor={theme.colors.placeholder}
            value={defaultQuantity}
            onChangeText={setDefaultQuantity}
            keyboardType="decimal-pad"
            maxLength={10}
            testID={testID ? `${testID}-quantity-input` : undefined}
          />
        </View>

        {/* Price Fields - MRP and Sale Price */}
        <View style={[styles.priceContainer, { marginBottom: theme.spacing.md, gap: theme.spacing.md }]}>
          {/* MRP */}
          <View style={styles.priceInputWrapper}>
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
              {t('manageItems.mrp')} *
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.priceInput,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.lg,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.md - 2,
                },
              ]}
              placeholder={t('manageItems.enterMrp')}
              placeholderTextColor={theme.colors.placeholder}
              value={mrp}
              onChangeText={setMrp}
              keyboardType="decimal-pad"
              maxLength={10}
              testID={testID ? `${testID}-mrp-input` : undefined}
            />
          </View>

          {/* Sale Price */}
          <View style={styles.priceInputWrapper}>
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
              {t('manageItems.salePrice')}
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.priceInput,
                {
                  backgroundColor: theme.colors.inputBackground,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                  borderRadius: theme.borderRadius.md,
                  fontSize: theme.typography.fontSize.lg,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.md - 2,
                },
              ]}
              placeholder={t('manageItems.enterSalePrice')}
              placeholderTextColor={theme.colors.placeholder}
              value={salePrice}
              onChangeText={setSalePrice}
              keyboardType="decimal-pad"
              maxLength={10}
              testID={testID ? `${testID}-sale-price-input` : undefined}
            />
          </View>
        </View>

        {/* Discount Badge */}
        {discountPercent !== null && discountPercent > 0 && (
          <View style={[styles.discountContainer, { marginBottom: theme.spacing.md }]}>
            <View
              style={[
                styles.discountBadge,
                {
                  backgroundColor: theme.colors.primary,
                  borderRadius: theme.borderRadius.full,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.xs,
                },
              ]}
            >
              <Text
                style={[
                  styles.discountText,
                  {
                    color: theme.colors.buttonPrimaryText,
                    fontSize: theme.typography.fontSize.sm,
                  },
                ]}
              >
                {t('manageItems.percentOff', { percent: discountPercent })}
              </Text>
            </View>
          </View>
        )}

        {/* Error */}
        {error && (
          <Text
            style={[
              styles.errorText,
              {
                color: theme.colors.error,
                fontSize: theme.typography.fontSize.sm,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            {error}
          </Text>
        )}

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
      </ScrollView>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  inputContainer: {},
  label: {
    fontWeight: '500',
  },
  input: {
    borderWidth: 1.5,
  },
  quantityInput: {
    width: 120,
  },
  priceContainer: {
    flexDirection: 'row',
  },
  priceInputWrapper: {
    flex: 1,
  },
  priceInput: {
    width: '100%',
  },
  discountContainer: {
    flexDirection: 'row',
  },
  discountBadge: {
    alignSelf: 'flex-start',
  },
  discountText: {
    fontWeight: '600',
  },
  categoryScroll: {
    maxHeight: 50,
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
  unitContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  unitChip: {
    borderWidth: 1,
  },
  unitText: {
    fontWeight: '500',
  },
  errorText: {
    fontWeight: '400',
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  buttonWrapper: {
    flex: 1,
  },
});

export default ItemFormModal;

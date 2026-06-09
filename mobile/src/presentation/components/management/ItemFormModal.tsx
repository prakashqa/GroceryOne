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
    mrp?: number;
    salePrice?: number;
    costPrice?: number;
    stockQuantity?: number;
    lowStockThreshold?: number;
    trackInventory?: boolean;
  }) => void;
  categories: Category[];
  editItem?: Item | null;
  initialCategoryId?: string;
  testID?: string;
  mode?: 'order' | 'inventory';
}

const ItemFormModal: React.FC<ItemFormModalProps> = ({
  visible,
  onClose,
  onSubmit,
  categories,
  editItem,
  initialCategoryId,
  testID,
  mode = 'order',
}) => {
  const { t } = useTranslation();
  const theme = useTheme();
  // Unified form: pricing + an optional Stock section are always shown, so the
  // old mutually-exclusive "inventory mode" is retired. `mode` only affects the
  // title for backward compatibility.
  void mode;
  const isInventoryMode = false;
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [unit, setUnit] = useState<Item['unit']>('pcs');
  const [defaultQuantity, setDefaultQuantity] = useState('1');
  const [mrp, setMrp] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
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
        setCostPrice(editItem.costPrice != null ? editItem.costPrice.toString() : '');
        setStockQuantity(editItem.stockQuantity != null ? editItem.stockQuantity.toString() : '');
        setLowStockThreshold(editItem.lowStockThreshold != null ? editItem.lowStockThreshold.toString() : '');
      } else {
        setName('');
        setCategoryId(initialCategoryId || categories[0]?.id || '');
        setUnit('pcs');
        setDefaultQuantity('1');
        setMrp('');
        setSalePrice('');
        setCostPrice('');
        setStockQuantity('');
        setLowStockThreshold('');
      }
      setError(null);
    }
  }, [visible, editItem, initialCategoryId, categories]);

  // Validate inputs. Pricing (MRP) is always required; stock fields are optional.
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

    if (!trimmedName || !categoryId || error) {
      return;
    }
    if (!mrp || isNaN(mrpNum) || mrpNum <= 0) {
      return;
    }

    // Optional stock fields. An opening quantity auto-enables inventory
    // tracking; the backend records it as an 'initial'/'correction' txn.
    const opening = stockQuantity !== '' ? parseFloat(stockQuantity) : undefined;
    const costPriceNum = costPrice !== '' ? parseFloat(costPrice) : undefined;
    const threshold = lowStockThreshold !== '' ? parseFloat(lowStockThreshold) : undefined;

    onSubmit({
      name: trimmedName,
      categoryId,
      unit,
      defaultQuantity: qty,
      mrp: mrpNum,
      ...(salePrice && !isNaN(salePriceNum) && { salePrice: salePriceNum }),
      ...(costPriceNum != null && !isNaN(costPriceNum) && { costPrice: costPriceNum }),
      ...(threshold != null && !isNaN(threshold) && { lowStockThreshold: threshold }),
      ...(opening != null && !isNaN(opening) && { stockQuantity: opening }),
      ...(opening != null && !isNaN(opening) && opening > 0 && { trackInventory: true }),
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
    setCostPrice('');
    setStockQuantity('');
    setLowStockThreshold('');
    setError(null);
    onClose();
  };

  const mrpNum = parseFloat(mrp);
  const isSubmitDisabled = !name.trim() || !categoryId || !mrp || isNaN(mrpNum) || mrpNum <= 0 || !!error;

  return (
    <ModalContainer
      visible={visible}
      onClose={handleCancel}
      title={
        isEditMode
          ? (isInventoryMode ? t('manageItems.editInventoryItem', 'Edit Inventory Item') : t('manageItems.editItem'))
          : (isInventoryMode ? t('manageItems.addInventoryItem', 'Add Inventory Item') : t('manageItems.addItem'))
      }
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

        {/* Conditional Fields: Price (order mode) or Stock (inventory mode) */}
        {isInventoryMode ? (
          <>
            {/* Inventory Mode: Stock Quantity and Low Stock Threshold */}
            <View style={[styles.priceContainer, { marginBottom: theme.spacing.md, gap: theme.spacing.md }]}>
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
                  {t('inventory.stock', 'Stock Quantity')}
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
                  placeholder="0"
                  placeholderTextColor={theme.colors.placeholder}
                  value={stockQuantity}
                  onChangeText={setStockQuantity}
                  keyboardType="decimal-pad"
                  maxLength={10}
                  testID={testID ? `${testID}-stock-quantity-input` : undefined}
                />
              </View>

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
                  {t('inventory.threshold', 'Low Stock Threshold')}
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
                  placeholder="10"
                  placeholderTextColor={theme.colors.placeholder}
                  value={lowStockThreshold}
                  onChangeText={setLowStockThreshold}
                  keyboardType="decimal-pad"
                  maxLength={10}
                  testID={testID ? `${testID}-low-stock-threshold-input` : undefined}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            {/* Order Mode: Price Fields - MRP and Sale Price */}
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
          </>
        )}

        {/* Stock (optional) — opening quantity wires the item into Inventory */}
        <View style={{ marginBottom: theme.spacing.md }}>
          <Text
            style={[
              styles.label,
              { color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.md, marginBottom: theme.spacing.sm },
            ]}
          >
            {t('manageItems.tabStock', 'Stock')}
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
                marginBottom: theme.spacing.sm,
              },
            ]}
            placeholder={t('manageItems.openingQuantity', 'Opening Quantity')}
            placeholderTextColor={theme.colors.placeholder}
            value={stockQuantity}
            onChangeText={setStockQuantity}
            keyboardType="decimal-pad"
            maxLength={10}
            testID={testID ? `${testID}-opening-quantity-input` : undefined}
          />
          <View style={[styles.priceContainer, { gap: theme.spacing.md }]}>
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
                  flex: 1,
                },
              ]}
              placeholder={t('manageItems.atPrice', 'At Price (cost)')}
              placeholderTextColor={theme.colors.placeholder}
              value={costPrice}
              onChangeText={setCostPrice}
              keyboardType="decimal-pad"
              maxLength={10}
              testID={testID ? `${testID}-cost-price-input` : undefined}
            />
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
                  flex: 1,
                },
              ]}
              placeholder={t('manageItems.minStock', 'Min Stock To Maintain')}
              placeholderTextColor={theme.colors.placeholder}
              value={lowStockThreshold}
              onChangeText={setLowStockThreshold}
              keyboardType="decimal-pad"
              maxLength={10}
              testID={testID ? `${testID}-low-stock-threshold-input` : undefined}
            />
          </View>
        </View>

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

/**
 * Cart Screen
 * Review cart items and print picking list
 */

import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { CartItemState } from '../../../domain/types/picking';
import {
  getTranslatedItemName,
  getTranslatedCategoryName,
} from '../../../domain/utils/itemTranslations';
import { formatQuantityWithUnit } from '../../../domain/utils/unitConversion';
import { selectCategories, selectItems } from '../../../store/slices/catalogSlice';
import {
  generatePickingListReceipt,
  ReceiptItem,
} from '../../../domain/utils/receiptGenerator';
import i18n from '../../../i18n/i18n.config';
import {
  selectActiveCart,
  selectActiveCartItems,
  selectActiveCartItemCount,
  selectActiveCartTotalQuantity,
  selectActiveCartGrandTotal,
  selectActiveCartHasPrices,
  selectActiveCartIsPaid,
  selectCanMarkPayment,
  incrementItemInActiveCart,
  decrementItemInActiveCart,
  removeItemFromActiveCart,
  clearActiveCart,
  refreshActiveCartPrices,
  markActiveCartAsPaid,
} from '../../../store/slices/multiCartSlice';
import { selectPrinter } from '../../../store/slices/settingsSlice';
import {
  bluetoothPrinterService,
  networkPrinterService,
} from '../../../services/printer';
import { useTheme, useIsDarkMode, Theme } from '../../theme';
import { useTranslation } from 'react-i18next';
import ReceiptPreviewModal from '../../components/picking/ReceiptPreviewModal';
import PaymentModal from '../../components/picking/PaymentModal';
import { FadeInView } from '../../components/common';
import type { PaymentInfo, CashPaymentDetails } from '../../../domain/types/payment';
import { useResponsiveStyles, ResponsiveStyles } from '../../../hooks';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Format a number as currency (INR) for display
 */
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Format a number as compact currency (no symbol, no decimals) for buttons
 * e.g. 21333 → "21,333"
 */
const formatCurrencyCompact = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/**
 * Get unit multiplier for price calculation
 * For 'gm' and 'ml' units, prices are stored per-KG/per-L, so multiply by 0.001
 * For 'kg', 'L', 'pcs' units, no conversion needed (multiplier = 1)
 */
const getUnitMultiplier = (unit: string): number => {
  if (unit === 'gm' || unit === 'ml') return 0.001;
  return 1;
};

const CartScreen: React.FC = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const styles = useMemo(() => createStyles(theme, responsiveStyles), [theme, responsiveStyles]);
  const insets = useSafeAreaInsets();
  const activeCart = useSelector(selectActiveCart);
  const cartItems = useSelector(selectActiveCartItems);
  const totalItems = useSelector(selectActiveCartTotalQuantity);
  const itemCount = useSelector(selectActiveCartItemCount);
  const grandTotal = useSelector(selectActiveCartGrandTotal);
  const hasPrices = useSelector(selectActiveCartHasPrices);
  const isPaid = useSelector(selectActiveCartIsPaid);
  const canMarkPayment = useSelector(selectCanMarkPayment);
  const printerSettings = useSelector(selectPrinter);
  const categories = useSelector(selectCategories);
  const catalogItems = useSelector(selectItems);

  // Known default cart names in all supported languages
  const DEFAULT_CART_NAMES = ['Default Cart', 'డిఫాల్ట్ కార్ట్'];

  // Get active cart name for display
  // If the cart name matches any known default cart name, show the translated version
  const getTranslatedCartName = useCallback((name: string | undefined): string => {
    if (!name) return t('picking.defaultCart');
    // Check if the name matches any known default cart name
    if (DEFAULT_CART_NAMES.includes(name)) {
      return t('picking.defaultCart');
    }
    return name;
  }, [t]);

  const activeCartName = getTranslatedCartName(activeCart?.name);

  // Helper to get category by ID from Redux store
  const getCategoryById = useCallback(
    (categoryId: string) => categories.find((c) => c.id === categoryId),
    [categories]
  );

  const [isPrinting, setIsPrinting] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [currentPickingList, setCurrentPickingList] = useState('');
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // Blinking animation for printer indicator
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (printerSettings.connectionStatus === 'connected') {
      const blinkAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(blinkAnim, {
            toValue: 0.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(blinkAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      blinkAnimation.start();
      return () => blinkAnimation.stop();
    } else {
      blinkAnim.setValue(1);
    }
  }, [printerSettings.connectionStatus, blinkAnim]);

  // Auto-refresh prices when cart screen loads
  useEffect(() => {
    dispatch(refreshActiveCartPrices(catalogItems));
  }, [dispatch, catalogItems]);

  // Theme-aware colors for special states
  const summaryCardBgColor = theme.colors.inCartBackground;
  const summaryDividerColor = theme.colors.inCartBorder;
  const categoryIconBgColor = theme.colors.successBackground;
  const emptyIconBgColor = theme.colors.inCartBackground;
  const errorLightColor = theme.colors.errorBackground;

  const groupedItems = useMemo(() => {
    const groups: Record<string, CartItemState[]> = {};
    cartItems.forEach((cartItem) => {
      const categoryId = cartItem.item.categoryId;
      if (!groups[categoryId]) {
        groups[categoryId] = [];
      }
      groups[categoryId].push(cartItem);
    });
    return groups;
  }, [cartItems]);

  const categoryCount = useMemo(
    () => Object.keys(groupedItems).length,
    [groupedItems]
  );

  const handleIncrement = useCallback(
    (itemId: string) => {
      dispatch(incrementItemInActiveCart(itemId));
    },
    [dispatch]
  );

  const handleDecrement = useCallback(
    (itemId: string) => {
      dispatch(decrementItemInActiveCart(itemId));
    },
    [dispatch]
  );

  const handleRemove = useCallback(
    (itemId: string, itemName: string) => {
      Alert.alert(
        t('picking.removeItem'),
        t('picking.removeConfirm', { name: itemName }),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('picking.remove'),
            style: 'destructive',
            onPress: () => dispatch(removeItemFromActiveCart(itemId)),
          },
        ]
      );
    },
    [dispatch, t]
  );

  const handleClearCart = useCallback(() => {
    Alert.alert(
      t('picking.clearList'),
      t('picking.clearConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('picking.clearAll'),
          style: 'destructive',
          onPress: () => {
            dispatch(clearActiveCart());
            navigation.goBack();
          },
        },
      ]
    );
  }, [dispatch, navigation, t]);

  const generatePickingList = useCallback(() => {
    // Transform cart items to receipt items with translated names and prices
    const receiptItems: ReceiptItem[] = cartItems.map((cartItem) => {
      const category = getCategoryById(cartItem.item.categoryId);
      const price = cartItem.priceSnapshot;
      const multiplier = getUnitMultiplier(cartItem.item.unit);
      const itemTotal = price ? price * cartItem.quantity * multiplier : undefined;
      // Format quantity for display using user's selected unit
      const { value: displayQty, unit: displayUnit } = formatQuantityWithUnit(
        cartItem.quantity,
        cartItem.item.unit,
        cartItem.displayUnit
      );
      return {
        name: getTranslatedItemName(cartItem.item),
        quantity: displayQty,
        unit: displayUnit,
        categoryId: cartItem.item.categoryId,
        categoryName: category ? getTranslatedCategoryName(category) : cartItem.item.categoryId,
        categoryIcon: category?.icon || '📦',
        price, // Include price if available
        itemTotal, // Include item total if price available
      };
    });

    // Get locale for date/time formatting based on current language
    const locale = i18n.language === 'te' ? 'te-IN' : 'en-US';

    // Get translated merchant info
    const merchantInfo = {
      name: t('picking.receipt.merchantName'),
      address: t('picking.receipt.merchantAddress'),
    };

    // Generate professional receipt with merchant info
    // Use paper size from printer settings
    // Pass cart name to display instead of "PICKING LIST"
    // Locale determines which hardcoded translation to use
    // Include payment status if cart is paid
    return generatePickingListReceipt({
      merchantInfo,
      items: receiptItems,
      paperWidth: printerSettings.paperSize,
      locale,
      cartName: activeCartName,
      paymentStatus: activeCart?.status === 'paid' ? 'paid' : undefined,
      paidAt: activeCart?.paidAt,
    });
  }, [cartItems, printerSettings.paperSize, t, activeCartName, getCategoryById, activeCart?.status, activeCart?.paidAt]);

  const handlePrint = useCallback(() => {
    const pickingList = generatePickingList();
    setCurrentPickingList(pickingList);
    setShowPreviewModal(true);
  }, [generatePickingList]);

  const handleClosePreview = useCallback(() => {
    setShowPreviewModal(false);
    setCurrentPickingList('');
  }, []);

  const handleConfirmPrint = useCallback(async () => {
    // Check if printer is enabled and connected
    const isPrinterReady =
      printerSettings.enabled &&
      printerSettings.connectionStatus === 'connected' &&
      printerSettings.selectedPrinterId;

    if (isPrinterReady) {
      // Send to actual printer based on connection type
      setIsPrinting(true);
      try {
        let printJob;
        if (printerSettings.connectionType === 'bluetooth') {
          printJob = await bluetoothPrinterService.print(currentPickingList);
        } else if (printerSettings.connectionType === 'network') {
          // Pass printer info explicitly to ensure print works even if service state is lost
          const printerInfo = printerSettings.selectedPrinterAddress && printerSettings.selectedPrinterName
            ? {
                ipAddress: printerSettings.selectedPrinterAddress,
                name: printerSettings.selectedPrinterName,
              }
            : undefined;
          printJob = await networkPrinterService.print(currentPickingList, printerInfo);
        } else {
          throw new Error('No printer connection type selected');
        }

        if (printJob.status === 'completed') {
          setShowPreviewModal(false);
          Alert.alert(
            t('picking.sentToPrinter'),
            t('picking.printerSuccess'),
            [{ text: t('done') }]
          );
        } else {
          Alert.alert(
            t('picking.printFailed', 'Print Failed'),
            printJob.error ||
              t('picking.printError', 'An error occurred while printing.'),
            [{ text: t('done') }]
          );
        }
      } catch (error: any) {
        Alert.alert(
          t('picking.printError', 'Print Error'),
          error.message ||
            t('picking.printErrorMessage', 'Could not print the picking list.'),
          [{ text: t('done') }]
        );
      } finally {
        setIsPrinting(false);
      }
    } else {
      // No printer connected - show info message
      setShowPreviewModal(false);
      Alert.alert(
        t('picking.noPrinter', 'No Printer Connected'),
        t(
          'picking.noPrinterMessage',
          'To print, please connect a printer in Settings > Printer Settings.'
        ),
        [
          { text: t('cancel'), style: 'cancel' },
          {
            text: t('picking.goToSettings', 'Go to Settings'),
            onPress: () => {
              // Navigate to printer settings
              // @ts-expect-error - navigation type not fully typed
              navigation.navigate('PrinterSettings');
            },
          },
        ]
      );
    }
  }, [currentPickingList, printerSettings, t, navigation]);

  const handleShare = useCallback(() => {
    // Picking list is available via generatePickingList() for future share functionality
    Alert.alert(t('picking.share'), t('picking.shareMessage'), [
      { text: t('done') },
    ]);
  }, [t]);

  // Payment handlers
  const handleMarkPaymentDone = useCallback(() => {
    setShowPaymentModal(true);
  }, []);

  const handleConfirmPayment = useCallback(
    (paymentInfo: PaymentInfo) => {
      dispatch(markActiveCartAsPaid({ amount: grandTotal, paymentInfo }));
      setShowPaymentModal(false);
    },
    [dispatch, grandTotal]
  );

  const handleCancelPayment = useCallback(() => {
    setShowPaymentModal(false);
  }, []);

  // Format time for paid status display
  const formatPaidTime = useCallback((isoString: string): string => {
    const date = new Date(isoString);
    return date.toLocaleTimeString(i18n.language === 'te' ? 'te-IN' : 'en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }, []);

  const renderCartItem = useCallback(
    (item: CartItemState, isLast: boolean) => {
      const category = getCategoryById(item.item.categoryId);
      const hasPrice = item.priceSnapshot !== undefined && item.priceSnapshot > 0;
      const multiplier = getUnitMultiplier(item.item.unit);
      const itemTotal = hasPrice ? item.priceSnapshot * item.quantity * multiplier : 0;

      return (
        <View
          key={item.item.id}
          style={[
            styles.cartItem,
            { borderBottomColor: theme.colors.border },
            isLast && styles.cartItemLast,
          ]}
        >
          <View style={[styles.itemIconContainer, { backgroundColor: theme.colors.background }]}>
            <Text style={styles.itemIcon}>{category?.icon || '📦'}</Text>
          </View>

          <View style={styles.itemDetails}>
            <Text style={[styles.itemName, { color: theme.colors.text }]} numberOfLines={1}>
              {getTranslatedItemName(item.item)}
            </Text>
            <Text style={[styles.itemUnit, { color: theme.colors.primaryLight }]}>
              {formatQuantityWithUnit(item.quantity, item.item.unit, item.displayUnit).formatted}
            </Text>
            {/* Price display - shown below quantity when price is available */}
            {hasPrice && (
              <View style={styles.itemPriceRow}>
                <Text style={[styles.itemUnitPrice, { color: theme.colors.textSecondary }]}>
                  {formatCurrency(item.priceSnapshot!)}{item.item.unit === 'gm' ? '/kg' : item.item.unit === 'ml' ? '/L' : ''} × {item.quantity}{item.item.unit === 'gm' || item.item.unit === 'ml' ? ` ${item.item.unit}` : ''}
                </Text>
                <Text style={[styles.itemTotalPrice, { color: theme.colors.primary }]}>
                  {formatCurrency(itemTotal)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.itemActions}>
            {!isPaid && (
              <>
                <View style={[styles.quantityControls, { backgroundColor: theme.colors.background }]}>
                  <TouchableOpacity
                    style={[styles.quantityBtn, { backgroundColor: theme.colors.surface }]}
                    onPress={() => handleDecrement(item.item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quantityBtnText, { color: theme.colors.text }]}>−</Text>
                  </TouchableOpacity>

                  <Text style={[styles.quantityValue, { color: theme.colors.text }]}>{item.quantity}</Text>

                  <TouchableOpacity
                    style={[styles.quantityBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => handleIncrement(item.item.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.quantityBtnText, { color: theme.colors.textInverse }]}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  style={styles.removeBtn}
                  onPress={() => handleRemove(item.item.id, getTranslatedItemName(item.item))}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.removeBtnText, { color: theme.colors.error }]}>{t('picking.remove')}</Text>
                </TouchableOpacity>
              </>
            )}
            {isPaid && (
              <Text style={[styles.quantityValue, { color: theme.colors.text }]}>{item.quantity}</Text>
            )}
          </View>
        </View>
      );
    },
    [handleDecrement, handleIncrement, handleRemove, theme.colors, t, getCategoryById, isPaid, styles]
  );

  const renderCategorySection = useCallback(
    ([categoryId, items]: [string, CartItemState[]]) => {
      const category = getCategoryById(categoryId);
      const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);

      return (
        <View key={categoryId} style={styles.categorySection}>
          <View style={styles.categoryHeader}>
            <View style={styles.categoryLeft}>
              <View style={[styles.categoryIconBg, { backgroundColor: categoryIconBgColor }]}>
                <Text style={styles.categoryIcon}>{category?.icon}</Text>
              </View>
              <View>
                <Text style={[styles.categoryName, { color: theme.colors.text }]}>{category ? getTranslatedCategoryName(category) : categoryId}</Text>
                <Text style={[styles.categoryMeta, { color: theme.colors.textSecondary }]}>
                  {items.length} {t('picking.items')} • {totalQty} qty
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.categoryItems, { backgroundColor: theme.colors.surface }]}>
            {items.map((item, idx) =>
              renderCartItem(item, idx === items.length - 1)
            )}
          </View>
        </View>
      );
    },
    [renderCartItem, theme.colors, categoryIconBgColor, styles]
  );

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <StatusBar
          barStyle={isDarkMode ? 'light-content' : 'dark-content'}
          backgroundColor={theme.colors.background}
        />
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIconBg, { backgroundColor: emptyIconBgColor }]}>
            <Text style={styles.emptyIcon}>🛒</Text>
          </View>
          <Text
            style={[styles.emptyCartName, { color: theme.colors.primary }]}
            numberOfLines={1}
            testID="empty-cart-name"
          >
            {activeCartName}
          </Text>
          <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>{t('picking.cartEmpty')}</Text>
          <Text style={[styles.emptySubtitle, { color: theme.colors.textSecondary }]}>
            {t('picking.startAdding')}
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => {
              // Replace the current Cart screen with Picking screen
              // This ensures users can add items to the cart they selected
              // @ts-expect-error - navigation type not fully typed
              navigation.replace('Picking');
            }}
            activeOpacity={0.8}
          >
            <Text style={[styles.emptyButtonText, { color: theme.colors.textInverse }]}>{t('picking.browseItems')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar
        barStyle={isDarkMode ? 'light-content' : 'dark-content'}
        backgroundColor={theme.colors.surface}
      />

      {/* Summary Header */}
      <View style={[
        styles.summaryContainer,
        {
          backgroundColor: theme.colors.surface,
          borderBottomColor: theme.colors.border,
          paddingHorizontal: responsiveStyles.contentPadding,
        },
      ]}>
        {/* Header Row: Cart Name + Clear All / Paid Status */}
        <View style={styles.headerRow}>
          <Text
            style={[styles.cartNameHeader, { color: theme.colors.text }]}
            numberOfLines={1}
            testID="cart-name-header"
          >
            {activeCartName}
          </Text>
          {!isPaid && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={handleClearCart}
              activeOpacity={0.7}
            >
              <Text style={[styles.clearButtonText, { color: theme.colors.error }]}>{t('picking.clearAll')}</Text>
            </TouchableOpacity>
          )}
          {isPaid && (
            <View style={[styles.paidBadge, { backgroundColor: `${theme.colors.success}20` }]}>
              <Text style={[styles.paidBadgeText, { color: theme.colors.success }]}>
                {t('dashboard.paid', 'Paid')}
              </Text>
            </View>
          )}
        </View>
        <View style={[styles.summaryCard, { backgroundColor: summaryCardBgColor }]}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{categoryCount}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>{t('picking.categories')}</Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: summaryDividerColor }]} />
            <View style={styles.summaryItem}>
              <Text style={[styles.summaryValue, { color: theme.colors.primary }]}>{itemCount}</Text>
              <Text style={[styles.summaryLabel, { color: theme.colors.textSecondary }]}>{t('picking.uniqueItems')}</Text>
            </View>
          </View>
        </View>

        {/* Grand Total - only shown when cart has priced items */}
        {hasPrices && (
          <View style={[
            styles.grandTotalContainer,
            {
              backgroundColor: theme.colors.surface,
              borderColor: isPaid ? theme.colors.success + '40' : theme.colors.primary + '40',
            },
            theme.shadows.md,
          ]}>
            <Text style={[styles.grandTotalLabel, { color: theme.colors.textSecondary }]}>
              {t('picking.grandTotal', 'Grand Total')}
            </Text>
            <Text style={[styles.grandTotalValue, { color: isPaid ? theme.colors.success : theme.colors.primary }]}>
              {formatCurrency(isPaid && activeCart?.paidAmount ? activeCart.paidAmount : grandTotal)}
            </Text>
          </View>
        )}

        {/* Paid Status Indicator - shown when cart is paid */}
        {isPaid && activeCart?.paidAt && (
          <View
            style={[
              styles.paidIndicator,
              { backgroundColor: `${theme.colors.success}15` },
            ]}
            testID="paid-indicator"
          >
            <Text style={styles.paidCheckmark}>✅</Text>
            <View style={styles.paidTextContainer}>
              <Text style={[styles.paidLabel, { color: theme.colors.success }]}>
                {t('picking.paymentReceived', 'Payment Received')}
              </Text>
              <Text style={[styles.paidTime, { color: theme.colors.textSecondary }]}>
                {t('picking.paidAt', 'Paid at {{time}}', { time: formatPaidTime(activeCart.paidAt) })}
              </Text>
              {activeCart.paymentInfo?.method === 'cash' &&
               (activeCart.paymentInfo.details as CashPaymentDetails).changeGiven != null &&
               (activeCart.paymentInfo.details as CashPaymentDetails).changeGiven! > 0 && (
                <Text
                  style={[styles.paidChange, { color: theme.colors.success }]}
                  testID="paid-change-amount"
                >
                  {t('payment.changeGiven', 'Change: {{amount}}', {
                    amount: formatCurrency((activeCart.paymentInfo.details as CashPaymentDetails).changeGiven!),
                  })}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      {/* Items List */}
      <ScrollView
        style={styles.listContainer}
        contentContainerStyle={[
          styles.listContent,
          { paddingHorizontal: responsiveStyles.contentPadding },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {Object.entries(groupedItems).map(renderCategorySection)}
      </ScrollView>

      {/* Footer Actions - Side by Side Buttons */}
      <View style={[styles.footer, { backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border, paddingBottom: Math.max(insets.bottom, 8) }]}>
        <View style={styles.footerButtonsRow}>
          {/* Payment Button - shown when cart can be marked as paid */}
          {!isPaid && canMarkPayment && (
            <TouchableOpacity
              style={[
                styles.footerPaymentButton,
                { backgroundColor: theme.colors.success },
                theme.shadows.md,
              ]}
              onPress={handleMarkPaymentDone}
              activeOpacity={0.85}
              testID="mark-payment-done-button"
            >
              <Text style={styles.footerPaymentIcon}>💵</Text>
              <Text testID="footer-payment-text" style={[styles.footerPaymentText, { color: theme.colors.textInverse }]}>
                {t('picking.payment', 'Payment')} {formatCurrencyCompact(grandTotal)}
              </Text>
            </TouchableOpacity>
          )}

          {/* Print Button */}
          <TouchableOpacity
            style={[
              styles.printButton,
              // Full width when Payment button is hidden
              (!canMarkPayment || isPaid) && styles.printButtonFullWidth,
              {
                backgroundColor: isPrinting ? theme.colors.disabled : theme.colors.primary,
              },
              theme.shadows.lg,
            ]}
            onPress={handlePrint}
            activeOpacity={0.85}
            disabled={isPrinting}
          >
            {isPrinting ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} style={styles.printSpinner} />
            ) : (
              <View style={styles.printIconContainer}>
                <Text style={styles.printIcon}>🖨️</Text>
                {printerSettings.connectionStatus === 'connected' && (
                  <Animated.View
                    testID="printer-blink-indicator"
                    style={[
                      styles.connectedDot,
                      {
                        opacity: blinkAnim,
                        backgroundColor: theme.colors.success,
                        borderColor: theme.colors.surface,
                      },
                    ]}
                  />
                )}
              </View>
            )}
            <Text testID="footer-print-text" style={[styles.printButtonText, { color: theme.colors.textInverse }]}>
              {isPrinting ? t('picking.printing', 'Printing...') : t('picking.printList')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Receipt Preview Modal */}
      <ReceiptPreviewModal
        visible={showPreviewModal}
        receiptText={currentPickingList}
        title={t('picking.listPreview')}
        onClose={handleClosePreview}
        onPrint={handleConfirmPrint}
        isPrinting={isPrinting}
        printButtonText={t('picking.printNow')}
        cancelButtonText={t('cancel')}
      />

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        amount={grandTotal}
        onConfirm={handleConfirmPayment}
        onCancel={handleCancelPayment}
        testID="payment-modal"
      />
    </View>
  );
};

const createStyles = (theme: Theme, responsiveStyles: ResponsiveStyles) =>
  StyleSheet.create({
    container: {
      flex: 1,
    },
    summaryContainer: {
      // paddingHorizontal applied dynamically via responsiveStyles
      paddingTop: theme.spacing.sm,
      paddingBottom: theme.spacing.sm,
      borderBottomWidth: 1,
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: theme.spacing.sm,
    },
    cartNameHeader: {
      fontSize: theme.textStyles.subtitle.fontSize,
      fontWeight: theme.typography.fontWeight.bold,
      flex: 1,
    },
    summaryCard: {
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.sm,
    },
    summaryRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    summaryItem: {
      alignItems: 'center',
      paddingHorizontal: theme.spacing.lg,
    },
    summaryDivider: {
      width: 1,
      height: theme.spacing.xl,
    },
    summaryValue: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.bold,
      marginBottom: 2,
    },
    summaryLabel: {
      fontSize: theme.textStyles.overline.fontSize,
      fontWeight: theme.typography.fontWeight.medium,
      textTransform: 'uppercase',
      letterSpacing: theme.letterSpacing.wider,
    },
    grandTotalContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: theme.spacing.sm,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      borderWidth: 1.5,
    },
    grandTotalLabel: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    grandTotalValue: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.bold,
    },
    clearButton: {
      paddingVertical: 6,
      paddingHorizontal: theme.spacing.smd,
    },
    clearButtonText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
    },
    listContainer: {
      flex: 1,
    },
    listContent: {
      // paddingHorizontal applied dynamically via responsiveStyles
      paddingTop: theme.spacing.md,
      paddingBottom: 100,
    },
    categorySection: {
      marginBottom: 20,
    },
    categoryHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: theme.spacing.smd,
    },
    categoryLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    categoryIconBg: {
      width: responsiveStyles.iconContainerSize,
      height: responsiveStyles.iconContainerSize,
      borderRadius: theme.borderRadius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.smd,
    },
    categoryIcon: {
      fontSize: theme.typography.fontSize.xxl,
    },
    categoryName: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      marginBottom: 2,
    },
    categoryMeta: {
      fontSize: theme.typography.fontSize.sm,
    },
    categoryItems: {
      borderRadius: theme.borderRadius.lg,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: theme.spacing.sm,
      elevation: 3,
    },
    cartItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: theme.spacing.md,
      borderBottomWidth: 1,
    },
    cartItemLast: {
      borderBottomWidth: 0,
    },
    itemIconContainer: {
      width: responsiveStyles.iconContainerSize,
      height: responsiveStyles.iconContainerSize,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: theme.spacing.smd,
    },
    itemIcon: {
      fontSize: theme.typography.fontSize['2xl'],
    },
    itemDetails: {
      flex: 1,
      marginRight: theme.spacing.sm,
    },
    itemName: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      marginBottom: 2,
    },
    itemUnit: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
    },
    itemPriceRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    itemUnitPrice: {
      fontSize: theme.typography.fontSize.sm,
    },
    itemTotalPrice: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    itemActions: {
      alignItems: 'flex-end',
    },
    quantityControls: {
      flexDirection: 'row',
      alignItems: 'center',
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.xs,
      marginBottom: 6,
    },
    quantityBtn: {
      width: 34,
      height: 34,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    quantityBtnText: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.semibold,
      lineHeight: theme.typography.fontSize['2xl'],
    },
    quantityValue: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      minWidth: theme.spacing.xl,
      textAlign: 'center',
    },
    removeBtn: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
    },
    removeBtnText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.medium,
    },
    footer: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingHorizontal: theme.spacing.sm,
      paddingTop: theme.spacing.xs,
      // paddingBottom applied dynamically via safe area insets
      borderTopWidth: 1,
    },
    footerButtonsRow: {
      flexDirection: 'row',
      gap: theme.spacing.sm,
    },
    footerPaymentButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.smd,
      minHeight: theme.buttonHeights.md,
    },
    footerPaymentIcon: {
      fontSize: theme.typography.fontSize.xl,
      marginRight: 6,
    },
    footerPaymentText: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
    },
    printButton: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.smd,
      minHeight: theme.buttonHeights.md,
    },
    printButtonFullWidth: {
      flex: 1,
    },
    printIconContainer: {
      position: 'relative',
      marginRight: theme.spacing.smd,
    },
    printIcon: {
      fontSize: theme.typography.fontSize.xxl,
    },
    printSpinner: {
      marginRight: theme.spacing.smd,
    },
    connectedDot: {
      position: 'absolute',
      top: -2,
      right: -2,
      width: 10,
      height: 10,
      borderRadius: theme.borderRadius.full,
      borderWidth: 2,
      // Colors now applied dynamically via style prop
    },
    printButtonText: {
      fontSize: theme.typography.fontSize.xl,
      fontWeight: theme.typography.fontWeight.bold,
      // Color applied dynamically via style prop
    },
    emptyContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: theme.spacing.xl,
    },
    emptyIconBg: {
      width: 120,
      height: 120,
      borderRadius: theme.borderRadius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.lg,
    },
    emptyIcon: {
      fontSize: 56,
    },
    emptyCartName: {
      fontSize: theme.textStyles.subtitle.fontSize,
      fontWeight: theme.typography.fontWeight.bold,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptyTitle: {
      fontSize: theme.typography.fontSize.xxl,
      fontWeight: theme.typography.fontWeight.bold,
      marginBottom: theme.spacing.sm,
      textAlign: 'center',
    },
    emptySubtitle: {
      fontSize: theme.typography.fontSize.lg,
      marginBottom: theme.spacing.xl,
      textAlign: 'center',
      lineHeight: theme.spacing.lg,
    },
    emptyButton: {
      borderRadius: theme.borderRadius.md,
      paddingVertical: theme.spacing.md,
      paddingHorizontal: theme.spacing.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: theme.spacing.sm,
      elevation: 4,
    },
    emptyButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
      // Color applied dynamically via style prop
    },
    // Payment-related styles
    paidBadge: {
      paddingVertical: theme.spacing.xs,
      paddingHorizontal: theme.spacing.sm,
      borderRadius: theme.borderRadius.sm,
    },
    paidBadgeText: {
      fontSize: theme.typography.fontSize.sm,
      fontWeight: theme.typography.fontWeight.semibold,
    },
    paymentButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: theme.spacing.md,
      paddingHorizontal: 20,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.smd,
    },
    paymentButtonIcon: {
      fontSize: theme.typography.fontSize['2xl'],
      marginRight: theme.spacing.sm,
    },
    paymentButtonText: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.bold,
    },
    paidIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.smd,
      paddingHorizontal: theme.spacing.md,
      borderRadius: theme.borderRadius.md,
      marginTop: theme.spacing.smd,
    },
    paidCheckmark: {
      fontSize: theme.typography.fontSize.xxl,
      marginRight: theme.spacing.smd,
    },
    paidTextContainer: {
      flex: 1,
    },
    paidLabel: {
      fontSize: theme.typography.fontSize.lg,
      fontWeight: theme.typography.fontWeight.semibold,
      marginBottom: 2,
    },
    paidTime: {
      fontSize: theme.typography.fontSize.sm,
    },
    paidChange: {
      fontSize: theme.typography.fontSize.md,
      fontWeight: theme.typography.fontWeight.semibold,
      marginTop: 2,
    },
  });

export default CartScreen;

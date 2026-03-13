/**
 * InventoryItemDetailScreen
 * Detail view for a single inventory item with stock adjustments,
 * settings, and transaction history
 */

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Switch,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';
import { selectTenant } from '../../../store/slices/tenantSlice';
import { selectIsAuthenticated } from '../../../store/slices/authSlice';
import { Button } from '../../components/common';
import {
  useGetStockLevelQuery,
  useAdjustStockMutation,
  useSetStockMutation,
  useUpdateInventorySettingsMutation,
  useGetTransactionHistoryQuery,
} from '../../../data/api/inventoryApi';
import type { AdjustStockDto, InventoryTransaction } from '../../../data/api/inventoryApi';

type ParamList = {
  InventoryItemDetail: { itemId: string };
};

function formatStock(value: number | null | undefined): string {
  return (value ?? 0).toFixed(2);
}

const InventoryItemDetailScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const navigation = useNavigation<NativeStackNavigationProp<ParamList>>();
  const route = useRoute<RouteProp<ParamList, 'InventoryItemDetail'>>();
  const { itemId } = route.params;

  const tenant = useSelector(selectTenant);
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const skipQuery = !tenant?.slug || !isAuthenticated;

  // Queries
  const {
    data: stockLevel,
    isLoading: stockLoading,
    isError: stockError,
    refetch: refetchStock,
  } = useGetStockLevelQuery(itemId, { skip: skipQuery });

  const {
    data: txnData,
    isLoading: txnLoading,
  } = useGetTransactionHistoryQuery({ itemId, limit: 20, offset: 0 }, { skip: skipQuery });

  // Mutations
  const [adjustStock, { isLoading: adjusting }] = useAdjustStockMutation();
  const [setStock, { isLoading: settingStock }] = useSetStockMutation();
  const [updateSettings, { isLoading: updatingSettings }] = useUpdateInventorySettingsMutation();

  // Local state for adjustment modal
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustType, setAdjustType] = useState<AdjustStockDto['type']>('restock');
  const [adjustQty, setAdjustQty] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  // Local state for set stock
  const [showSetStock, setShowSetStock] = useState(false);
  const [setStockQty, setSetStockQty] = useState('');
  const [setStockReason, setSetStockReason] = useState('');

  // Local state for settings
  const [thresholdInput, setThresholdInput] = useState('');
  const [thresholdEditing, setThresholdEditing] = useState(false);

  const isLoading = skipQuery || stockLoading;

  // Compute stock-after preview
  const stockAfterPreview = useMemo(() => {
    const current = stockLevel?.stockQuantity ?? 0;
    const qty = parseFloat(adjustQty) || 0;
    if (adjustType === 'restock' || adjustType === 'return') {
      return current + qty;
    }
    return current - qty;
  }, [stockLevel, adjustQty, adjustType]);

  const isAdjustValid = useMemo(() => {
    const qty = parseFloat(adjustQty);
    if (!qty || qty <= 0) return false;
    if ((adjustType === 'damage' || adjustType === 'correction') && qty > (stockLevel?.stockQuantity ?? 0)) return false;
    return true;
  }, [adjustQty, adjustType, stockLevel]);

  const isSetStockValid = useMemo(() => {
    const qty = parseFloat(setStockQty);
    return qty !== undefined && qty >= 0 && !isNaN(qty) && setStockQty.trim() !== '';
  }, [setStockQty]);

  const handleAdjustSubmit = useCallback(async () => {
    if (!isAdjustValid) return;
    try {
      await adjustStock({
        itemId,
        quantity: parseFloat(adjustQty),
        type: adjustType,
        reason: adjustReason.trim() || undefined,
      }).unwrap();
      setShowAdjustModal(false);
      setAdjustQty('');
      setAdjustReason('');
      Alert.alert(t('inventory.detail.adjustSuccess', 'Stock adjusted successfully'));
    } catch {
      Alert.alert(t('inventory.detail.adjustError', 'Failed to adjust stock'));
    }
  }, [isAdjustValid, adjustStock, itemId, adjustQty, adjustType, adjustReason, t]);

  const handleSetStockSubmit = useCallback(async () => {
    if (!isSetStockValid) return;
    try {
      await setStock({
        itemId,
        quantity: parseFloat(setStockQty),
        reason: setStockReason.trim() || undefined,
      }).unwrap();
      setShowSetStock(false);
      setSetStockQty('');
      setSetStockReason('');
      Alert.alert(t('inventory.detail.adjustSuccess', 'Stock adjusted successfully'));
    } catch {
      Alert.alert(t('inventory.detail.adjustError', 'Failed to adjust stock'));
    }
  }, [isSetStockValid, setStock, itemId, setStockQty, setStockReason, t]);

  const handleSaveThreshold = useCallback(async () => {
    const value = parseFloat(thresholdInput);
    if (isNaN(value) || value < 0) return;
    try {
      await updateSettings({ itemId, data: { lowStockThreshold: value } }).unwrap();
      setThresholdEditing(false);
      Alert.alert(t('inventory.detail.settingsSuccess', 'Settings updated'));
    } catch {
      Alert.alert(t('inventory.detail.adjustError', 'Failed to update settings'));
    }
  }, [thresholdInput, updateSettings, itemId, t]);

  const handleToggleTracking = useCallback(async (value: boolean) => {
    try {
      await updateSettings({ itemId, data: { trackInventory: value } }).unwrap();
    } catch {
      Alert.alert(t('inventory.detail.adjustError', 'Failed to update settings'));
    }
  }, [updateSettings, itemId, t]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.centerContainer} testID="detail-loading">
          <ActivityIndicator size="large" color={theme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (stockError) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top', 'bottom']}>
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: theme.colors.error }]}>
            {t('inventory.error', 'Failed to load inventory')}
          </Text>
          <TouchableOpacity
            onPress={refetchStock}
            style={[styles.retryButton, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, marginTop: theme.spacing.md, paddingHorizontal: theme.spacing.lg, paddingVertical: theme.spacing.sm }]}
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600' }}>{t('inventory.retry', 'Retry')}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const transactions = txnData?.transactions ?? [];

  const ADJUST_TYPES: { value: AdjustStockDto['type']; label: string }[] = [
    { value: 'restock', label: t('inventory.detail.restock', 'Restock') },
    { value: 'correction', label: t('inventory.detail.correction', 'Correction') },
    { value: 'damage', label: t('inventory.detail.damage', 'Damage') },
    { value: 'return', label: t('inventory.detail.return', 'Return') },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary, paddingTop: Platform.OS === 'ios' ? 0 : StatusBar.currentHeight || 0, paddingHorizontal: theme.spacing.md, paddingBottom: theme.spacing.md }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} testID="detail-back-btn">
            <Text style={{ color: '#FFFFFF', fontSize: 28 }}>{'\u2190'}</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: '#FFFFFF', fontSize: theme.typography.fontSize.xl, fontWeight: theme.typography.fontWeight.bold, marginLeft: theme.spacing.sm, flex: 1 }]} numberOfLines={1}>
            {t('inventory.detail.stockLevel', 'Stock Level')}
          </Text>
        </View>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.content, { padding: responsiveStyles.contentPadding || 16 }]} showsVerticalScrollIndicator={false}>

        {/* Stock Level Card */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.lg, marginBottom: theme.spacing.md }]} testID="stock-level-card">
          <View style={styles.stockRow}>
            <Text style={[styles.stockQty, { color: stockLevel?.isLowStock ? theme.colors.warning : theme.colors.success, fontSize: 36, fontWeight: '700' }]} testID="stock-quantity">
              {formatStock(stockLevel?.stockQuantity)}
            </Text>
            {stockLevel?.isLowStock && (
              <View style={[styles.lowBadge, { backgroundColor: theme.colors.warning, borderRadius: theme.borderRadius.sm, paddingHorizontal: 8, paddingVertical: 2 }]} testID="detail-low-badge">
                <Text style={{ color: '#FFFFFF', fontSize: 11, fontWeight: '700' }}>LOW</Text>
              </View>
            )}
          </View>
          <Text style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.sm, marginTop: 4 }} testID="stock-threshold">
            {t('inventory.detail.threshold', 'Low Stock Threshold')}: {formatStock(stockLevel?.lowStockThreshold)}
          </Text>
          <View style={[styles.trackingBadge, { backgroundColor: stockLevel?.trackInventory ? theme.colors.success + '20' : theme.colors.textSecondary + '20', borderRadius: theme.borderRadius.sm, paddingHorizontal: 8, paddingVertical: 3, marginTop: 8, alignSelf: 'flex-start' }]} testID="tracking-badge">
            <Text style={{ color: stockLevel?.trackInventory ? theme.colors.success : theme.colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
              {stockLevel?.trackInventory ? t('inventory.detail.trackingEnabled', 'Tracking') : t('inventory.detail.trackingDisabled', 'Not Tracking')}
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.actionsRow, { marginBottom: theme.spacing.md }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, flex: 1, marginRight: 6 }]}
            onPress={() => { setAdjustType('restock'); setShowAdjustModal(true); }}
            testID="restock-btn"
          >
            <Text style={{ color: '#FFFFFF', fontWeight: '600', textAlign: 'center' }}>{t('inventory.detail.restock', 'Restock')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, flex: 1, marginHorizontal: 3 }]}
            onPress={() => { setAdjustType('correction'); setShowAdjustModal(true); }}
            testID="correction-btn"
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600', textAlign: 'center' }}>{t('inventory.detail.correction', 'Correction')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.sm, flex: 1, marginLeft: 6 }]}
            onPress={() => setShowSetStock(true)}
            testID="set-stock-btn"
          >
            <Text style={{ color: theme.colors.text, fontWeight: '600', textAlign: 'center' }}>{t('inventory.detail.setStock', 'Set Stock')}</Text>
          </TouchableOpacity>
        </View>

        {/* Adjust Stock Inline Panel */}
        {showAdjustModal && (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.md }]} testID="adjust-panel">
            <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: theme.typography.fontSize.md, marginBottom: theme.spacing.sm }}>
              {t('inventory.detail.adjustStock', 'Adjust Stock')}
            </Text>

            {/* Type chips */}
            <View style={styles.chipRow}>
              {ADJUST_TYPES.map((at) => (
                <TouchableOpacity
                  key={at.value}
                  style={[styles.chip, { backgroundColor: adjustType === at.value ? theme.colors.primary : theme.colors.surface, borderRadius: theme.borderRadius.sm, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 }]}
                  onPress={() => setAdjustType(at.value)}
                  testID={`adjust-type-${at.value}`}
                >
                  <Text style={{ color: adjustType === at.value ? '#FFFFFF' : theme.colors.text, fontSize: 12, fontWeight: '600' }}>{at.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.borderRadius.sm, padding: theme.spacing.sm, marginTop: theme.spacing.sm }]}
              placeholder={t('inventory.detail.quantity', 'Quantity')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
              value={adjustQty}
              onChangeText={setAdjustQty}
              testID="adjust-qty-input"
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.borderRadius.sm, padding: theme.spacing.sm, marginTop: theme.spacing.xs }]}
              placeholder={t('inventory.detail.reason', 'Reason (optional)')}
              placeholderTextColor={theme.colors.textSecondary}
              value={adjustReason}
              onChangeText={setAdjustReason}
              testID="adjust-reason-input"
            />

            {adjustQty.trim() !== '' && (
              <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 4 }} testID="stock-after-preview">
                {t('inventory.detail.stockAfter', 'Stock after')}: {formatStock(stockAfterPreview)}
              </Text>
            )}

            <View style={[styles.btnRow, { marginTop: theme.spacing.sm }]}>
              <TouchableOpacity onPress={() => { setShowAdjustModal(false); setAdjustQty(''); setAdjustReason(''); }} style={{ marginRight: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.textSecondary }}>{t('inventory.detail.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleAdjustSubmit}
                disabled={!isAdjustValid || adjusting}
                style={[styles.submitBtn, { backgroundColor: isAdjustValid ? theme.colors.primary : theme.colors.surface, borderRadius: theme.borderRadius.sm, paddingHorizontal: 16, paddingVertical: 8 }]}
                testID="adjust-submit-btn"
              >
                <Text style={{ color: isAdjustValid ? '#FFFFFF' : theme.colors.textSecondary, fontWeight: '600' }}>
                  {adjusting ? '...' : t('inventory.detail.submit', 'Submit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Set Stock Inline Panel */}
        {showSetStock && (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.md }]} testID="set-stock-panel">
            <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: theme.typography.fontSize.md, marginBottom: theme.spacing.sm }}>
              {t('inventory.detail.setStock', 'Set Stock')}
            </Text>

            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.borderRadius.sm, padding: theme.spacing.sm }]}
              placeholder={t('inventory.detail.quantity', 'Quantity')}
              placeholderTextColor={theme.colors.textSecondary}
              keyboardType="decimal-pad"
              value={setStockQty}
              onChangeText={setSetStockQty}
              testID="set-stock-qty-input"
            />

            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.borderRadius.sm, padding: theme.spacing.sm, marginTop: theme.spacing.xs }]}
              placeholder={t('inventory.detail.reason', 'Reason (optional)')}
              placeholderTextColor={theme.colors.textSecondary}
              value={setStockReason}
              onChangeText={setSetStockReason}
              testID="set-stock-reason-input"
            />

            <View style={[styles.btnRow, { marginTop: theme.spacing.sm }]}>
              <TouchableOpacity onPress={() => { setShowSetStock(false); setSetStockQty(''); setSetStockReason(''); }} style={{ marginRight: theme.spacing.sm }}>
                <Text style={{ color: theme.colors.textSecondary }}>{t('inventory.detail.cancel', 'Cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleSetStockSubmit}
                disabled={!isSetStockValid || settingStock}
                style={[styles.submitBtn, { backgroundColor: isSetStockValid ? theme.colors.primary : theme.colors.surface, borderRadius: theme.borderRadius.sm, paddingHorizontal: 16, paddingVertical: 8 }]}
                testID="set-stock-submit-btn"
              >
                <Text style={{ color: isSetStockValid ? '#FFFFFF' : theme.colors.textSecondary, fontWeight: '600' }}>
                  {settingStock ? '...' : t('inventory.detail.submit', 'Submit')}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Settings Section */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.md }]} testID="settings-section">
          <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: theme.typography.fontSize.md, marginBottom: theme.spacing.sm }}>
            {t('inventory.detail.settings', 'Settings')}
          </Text>

          {/* Threshold */}
          <View style={styles.settingRow}>
            <Text style={{ color: theme.colors.text, flex: 1 }}>{t('inventory.detail.threshold', 'Low Stock Threshold')}</Text>
            {thresholdEditing ? (
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TextInput
                  style={[styles.thresholdInput, { backgroundColor: theme.colors.surface, color: theme.colors.text, borderRadius: theme.borderRadius.sm, paddingHorizontal: 8, paddingVertical: 4, width: 70, textAlign: 'center' }]}
                  keyboardType="decimal-pad"
                  value={thresholdInput}
                  onChangeText={setThresholdInput}
                  testID="threshold-input"
                />
                <TouchableOpacity onPress={handleSaveThreshold} style={{ marginLeft: 8 }} testID="threshold-save-btn">
                  <Text style={{ color: theme.colors.primary, fontWeight: '600' }}>{t('inventory.detail.saveSettings', 'Save')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity onPress={() => { setThresholdInput(formatStock(stockLevel?.lowStockThreshold)); setThresholdEditing(true); }} testID="threshold-edit-btn">
                <Text style={{ color: theme.colors.primary }}>{formatStock(stockLevel?.lowStockThreshold)}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Tracking toggle */}
          <View style={[styles.settingRow, { marginTop: theme.spacing.sm }]}>
            <Text style={{ color: theme.colors.text, flex: 1 }}>{t('inventory.detail.tracking', 'Inventory Tracking')}</Text>
            <Switch
              value={stockLevel?.trackInventory ?? false}
              onValueChange={handleToggleTracking}
              trackColor={{ false: theme.colors.surface, true: theme.colors.primary + '60' }}
              thumbColor={stockLevel?.trackInventory ? theme.colors.primary : theme.colors.textSecondary}
              testID="tracking-toggle"
            />
          </View>
        </View>

        {/* Transaction History */}
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderRadius: theme.borderRadius.md, padding: theme.spacing.md, marginBottom: theme.spacing.lg }]} testID="transaction-history">
          <Text style={{ color: theme.colors.text, fontWeight: '600', fontSize: theme.typography.fontSize.md, marginBottom: theme.spacing.sm }}>
            {t('inventory.detail.transactionHistory', 'Transaction History')}
          </Text>

          {transactions.length === 0 ? (
            <Text style={{ color: theme.colors.textSecondary, textAlign: 'center', paddingVertical: theme.spacing.md }} testID="no-transactions">
              {t('inventory.detail.noTransactions', 'No transactions yet')}
            </Text>
          ) : (
            transactions.map((txn: InventoryTransaction) => (
              <View key={txn.id} style={[styles.txnRow, { borderBottomColor: theme.colors.surface, borderBottomWidth: 1, paddingVertical: theme.spacing.xs }]} testID={`txn-${txn.id}`}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <View style={[styles.typeBadge, { backgroundColor: txn.quantity >= 0 ? theme.colors.success + '20' : theme.colors.error + '20', borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2, marginRight: 8 }]}>
                      <Text style={{ color: txn.quantity >= 0 ? theme.colors.success : theme.colors.error, fontSize: 11, fontWeight: '600' }}>
                        {txn.type.toUpperCase()}
                      </Text>
                    </View>
                    <Text style={{ color: txn.quantity >= 0 ? theme.colors.success : theme.colors.error, fontWeight: '600' }}>
                      {txn.quantity >= 0 ? '+' : ''}{formatStock(txn.quantity)}
                    </Text>
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginLeft: 8 }}>
                      {'\u2192'} {formatStock(txn.stockAfter)}
                    </Text>
                  </View>
                  {txn.reason && (
                    <Text style={{ color: theme.colors.textSecondary, fontSize: 12, marginTop: 2 }}>{txn.reason}</Text>
                  )}
                </View>
                <Text style={{ color: theme.colors.textSecondary, fontSize: 11 }}>
                  {new Date(txn.createdAt).toLocaleDateString()}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  errorText: { textAlign: 'center', fontSize: 16 },
  retryButton: {},
  header: {},
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerTitle: {},
  scrollView: { flex: 1 },
  content: {},
  card: {},
  stockRow: { flexDirection: 'row', alignItems: 'center' },
  stockQty: {},
  lowBadge: { marginLeft: 12 },
  trackingBadge: {},
  actionsRow: { flexDirection: 'row' },
  actionBtn: {},
  chipRow: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: {},
  input: {},
  btnRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center' },
  submitBtn: {},
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  thresholdInput: {},
  txnRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  typeBadge: {},
});

export default InventoryItemDetailScreen;

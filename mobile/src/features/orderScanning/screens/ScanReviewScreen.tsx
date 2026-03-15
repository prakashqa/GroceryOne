/**
 * ScanReviewScreen
 * Screen for reviewing and confirming scanned items before adding to cart
 */

import React, { useState, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../../presentation/theme';
import { useTranslation } from 'react-i18next';
import {
  selectCurrentSession,
  selectMatchResults,
  updateMatchResult,
  updateMatchQuantity,
  removeMatch,
  selectCart,
  setSessionStatus,
  clearSession,
} from '../store/scanSlice';
import {
  selectAllCarts,
  selectActiveCartId,
  addItemToActiveCart,
  setActiveCart,
  createCart,
} from '../../../store/slices/multiCartSlice';
import { selectItems } from '../../../store/slices/catalogSlice';
import { ScannedItemRow } from '../components/ScannedItemRow';
import { QuantityEditModal } from '../components/QuantityEditModal';
import { MatchResult } from '../types/scanning.types';
import { Item } from '../../../domain/types/picking';
import { getTranslatedItemName } from '../../../domain/utils/itemTranslations';
import { normalizeToBaseUnit } from '../../../domain/utils/unitConversion';

type RootStackParamList = {
  CameraCapture: undefined;
  ScanReview: undefined;
  Picking: undefined;
  Order: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const ScanReviewScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const currentSession = useSelector(selectCurrentSession);
  const matchResults = useSelector(selectMatchResults);
  const allCarts = useSelector(selectAllCarts);
  const activeCartId = useSelector(selectActiveCartId);
  const catalogItems = useSelector(selectItems);

  // Filter out paid/completed carts — only show editable carts in selector
  const editableCarts = useMemo(() => {
    return allCarts.filter((c) => c.status !== 'paid' && c.status !== 'completed');
  }, [allCarts]);

  // Auto-create a default cart if no editable carts exist (once per mount only)
  const hasAutoCreatedCartRef = useRef(false);
  React.useEffect(() => {
    if (editableCarts.length === 0 && !hasAutoCreatedCartRef.current) {
      hasAutoCreatedCartRef.current = true;
      dispatch(createCart({ name: t('picking.defaultCart') }));
    }
  }, [editableCarts.length, dispatch, t]);

  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedMatchIndex, setSelectedMatchIndex] = useState<number | null>(null);
  const [itemSelectorVisible, setItemSelectorVisible] = useState(false);
  const [itemSearchQuery, setItemSearchQuery] = useState('');

  // Calculate stats
  const stats = useMemo(() => {
    const total = matchResults.length;
    const exact = matchResults.filter((m) => m.confidence === 'exact' && !m.isSkipped).length;
    const matched = matchResults.filter(
      (m) => m.matchedItem && !m.isSkipped
    ).length;
    const skipped = matchResults.filter((m) => m.isSkipped).length;
    const notFound = matchResults.filter(
      (m) => !m.matchedItem && !m.isSkipped
    ).length;

    return { total, exact, matched, skipped, notFound };
  }, [matchResults]);

  // Get items ready to add (matched, not skipped, and not low confidence)
  const itemsToAdd = useMemo(() => {
    return matchResults.filter(
      (m) => m.matchedItem && !m.isSkipped && m.confidence !== 'low' && m.confidence !== 'none'
    );
  }, [matchResults]);

  // Filtered catalog items for item selector search
  const filteredCatalogItems = useMemo(() => {
    if (!itemSearchQuery.trim()) return catalogItems;
    const q = itemSearchQuery.toLowerCase();
    return catalogItems.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        getTranslatedItemName(item.id).includes(itemSearchQuery)
    );
  }, [catalogItems, itemSearchQuery]);

  // Translate default cart name if it matches the English default
  const getTranslatedCartName = useCallback((name: string): string => {
    if (name === 'Default Cart') {
      return t('picking.defaultCart');
    }
    return name;
  }, [t]);

  const handleBack = useCallback(() => {
    Alert.alert(
      t('cancel'),
      t('scan.discardConfirm'),
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('confirm'),
          style: 'destructive',
          onPress: () => {
            navigation.goBack();
            // Delay clearing session to avoid re-render crash with null state
            setTimeout(() => dispatch(clearSession()), 100);
          },
        },
      ]
    );
  }, [dispatch, navigation, t]);

  const handleSelectItem = useCallback((index: number) => {
    setSelectedMatchIndex(index);
    setItemSelectorVisible(true);
  }, []);

  const handleEditQuantity = useCallback((index: number) => {
    setSelectedMatchIndex(index);
    setQuantityModalVisible(true);
  }, []);

  const handleSkip = useCallback(
    (index: number) => {
      dispatch(removeMatch(index));
    },
    [dispatch]
  );

  const handleQuantitySave = useCallback(
    (quantity: number) => {
      if (selectedMatchIndex !== null) {
        dispatch(updateMatchQuantity({ index: selectedMatchIndex, quantity }));
      }
      setQuantityModalVisible(false);
      setSelectedMatchIndex(null);
    },
    [dispatch, selectedMatchIndex]
  );

  const handleItemSelect = useCallback(
    (item: Item) => {
      if (selectedMatchIndex !== null) {
        dispatch(
          updateMatchResult({
            index: selectedMatchIndex,
            matchedItem: item,
            confidence: 'exact',
            confidenceScore: 100,
          })
        );
      }
      setItemSelectorVisible(false);
      setSelectedMatchIndex(null);
      setItemSearchQuery('');
    },
    [dispatch, selectedMatchIndex]
  );

  const handleAddToCart = useCallback(() => {
    if (itemsToAdd.length === 0) {
      Alert.alert(t('error'), t('scan.noItemsToAdd'));
      return;
    }

    // Validate active cart exists and is editable
    if (!activeCartId) {
      Alert.alert(t('error'), t('scan.noActiveCart'));
      return;
    }
    const activeCart = allCarts.find((c) => c.id === activeCartId);
    if (!activeCart || activeCart.status === 'paid' || activeCart.status === 'completed') {
      Alert.alert(t('error'), t('scan.cartNotEditable'));
      return;
    }

    // Deduplicate: keep only the highest-confidence match per catalog item
    const deduped = new Map<string, MatchResult>();
    itemsToAdd.forEach((matchResult) => {
      if (matchResult.matchedItem) {
        const itemId = matchResult.matchedItem.id;
        const existing = deduped.get(itemId);
        if (!existing || matchResult.confidenceScore > (existing.confidenceScore ?? 0)) {
          deduped.set(itemId, matchResult);
        }
      }
    });

    // Add each deduplicated item to the active cart
    deduped.forEach((matchResult) => {
      if (matchResult.matchedItem) {
        const rawQuantity =
          matchResult.userOverride?.selectedQuantity ||
          matchResult.parsedItem.quantity ||
          matchResult.matchedItem.defaultQuantity;

        // Normalize quantity to base unit (e.g., 500gm → 0.5kg)
        const parsedUnit = matchResult.parsedItem.unit || matchResult.matchedItem.unit;
        const { quantity: baseQty } = normalizeToBaseUnit(rawQuantity, parsedUnit);

        dispatch(
          addItemToActiveCart({
            item: matchResult.matchedItem,
            quantity: baseQty,
            displayUnit: parsedUnit,
          })
        );
      }
    });

    // Mark session as completed
    dispatch(setSessionStatus('completed'));

    // Show success and navigate
    Alert.alert(
      t('confirm'),
      t('scan.addedToCart', { count: itemsToAdd.length }),
      [
        {
          text: t('picking.viewCart'),
          onPress: () => {
            dispatch(clearSession());
            navigation.navigate('Order');
          },
        },
        {
          text: t('done'),
          onPress: () => {
            dispatch(clearSession());
            navigation.navigate('Picking');
          },
        },
      ]
    );
  }, [dispatch, navigation, itemsToAdd, t, activeCartId, allCarts]);

  const handleCreateNewCart = useCallback(() => {
    const newCartName = `Scan ${new Date().toLocaleDateString()}`;
    dispatch(createCart({ name: newCartName }));
  }, [dispatch]);

  const handleSelectCart = useCallback(
    (cartId: string) => {
      dispatch(setActiveCart(cartId));
      dispatch(selectCart(cartId));
    },
    [dispatch]
  );

  const renderMatchResult = useCallback(
    ({ item, index }: { item: MatchResult; index: number }) => (
      <ScannedItemRow
        matchResult={item}
        index={index}
        onSelectItem={handleSelectItem}
        onEditQuantity={handleEditQuantity}
        onSkip={handleSkip}
      />
    ),
    [handleSelectItem, handleEditQuantity, handleSkip]
  );

  const selectedMatch =
    selectedMatchIndex !== null ? matchResults[selectedMatchIndex] : null;

  if (!currentSession) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <Text style={{ color: theme.colors.text }}>{t('error')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.headerBackground} />

      {/* Header */}
      <View style={[styles.header, {
        backgroundColor: theme.colors.headerBackground,
        paddingBottom: theme.spacing.smd,
      }]}>
        <SafeAreaView edges={['top']}>
          <View style={[styles.headerContent, {
            paddingHorizontal: theme.spacing.md,
            paddingTop: theme.spacing.sm,
          }]}>
            <TouchableOpacity style={[styles.headerButton, { padding: theme.spacing.sm }]} onPress={handleBack}>
              <Text style={[styles.headerButtonText, {
                fontSize: theme.typography.fontSize.xxl,
                color: theme.colors.textInverse,
              }]}>←</Text>
            </TouchableOpacity>
            <Text style={[styles.headerTitle, {
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.textInverse,
            }]}>{t('scan.review')}</Text>
            <View style={[styles.headerButton, { padding: theme.spacing.sm }]} />
          </View>
        </SafeAreaView>
      </View>

      {/* Summary */}
      <View style={[styles.summary, {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.sm,
      }]}>
        <View style={[styles.summaryRow, { marginBottom: theme.spacing.smd }]}>
          {currentSession.imageUri && (
            <Image
              source={{ uri: currentSession.imageUri }}
              style={[styles.thumbnail, {
                borderRadius: theme.borderRadius.sm,
                marginRight: theme.spacing.smd,
              }]}
            />
          )}
          <View style={styles.summaryText}>
            <Text style={[styles.summaryTitle, {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.xl,
              fontWeight: theme.typography.fontWeight.bold,
              marginBottom: theme.spacing.xs,
            }]}>
              {t('scan.detected', { count: stats.total })}
            </Text>
            <Text style={[styles.summarySubtitle, {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.md,
            }]}>
              {currentSession.ocrResult?.detectedLanguage === 'te'
                ? 'Telugu'
                : currentSession.ocrResult?.detectedLanguage === 'mixed'
                ? 'Telugu + English'
                : 'English'}
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {
              color: '#4CAF50',
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
            }]}>{stats.exact}</Text>
            <Text style={[styles.statLabel, {
              color: theme.colors.textLight,
              fontSize: theme.typography.fontSize.sm,
            }]}>
              {t('scan.exact')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {
              color: '#2196F3',
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
            }]}>
              {stats.matched - stats.exact}
            </Text>
            <Text style={[styles.statLabel, {
              color: theme.colors.textLight,
              fontSize: theme.typography.fontSize.sm,
            }]}>
              {t('scan.likely')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {
              color: '#F44336',
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
            }]}>{stats.notFound}</Text>
            <Text style={[styles.statLabel, {
              color: theme.colors.textLight,
              fontSize: theme.typography.fontSize.sm,
            }]}>
              {t('scan.notFound')}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, {
              color: theme.colors.textLight,
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
            }]}>
              {stats.skipped}
            </Text>
            <Text style={[styles.statLabel, {
              color: theme.colors.textLight,
              fontSize: theme.typography.fontSize.sm,
            }]}>
              {t('scan.skip')}
            </Text>
          </View>
        </View>
      </View>

      {/* Results List */}
      <FlatList
        data={matchResults}
        renderItem={renderMatchResult}
        keyExtractor={(_, index) => `match-${index}`}
        contentContainerStyle={[styles.listContent, {
          padding: theme.spacing.md,
        }]}
        showsVerticalScrollIndicator={false}
      />

      {/* Cart Selector & Add Button */}
      <View style={[styles.footer, {
        backgroundColor: theme.colors.surface,
        padding: theme.spacing.md,
        paddingBottom: theme.spacing.xl,
      }]}>
        {/* Cart Selector */}
        <View style={[styles.cartSelector, { marginBottom: theme.spacing.smd }]}>
          <Text style={[styles.cartLabel, {
            color: theme.colors.textSecondary,
            fontSize: theme.typography.fontSize.sm,
            marginBottom: theme.spacing.sm,
          }]}>
            {t('scan.selectCart')}:
          </Text>
          <View style={[styles.cartButtons, { gap: theme.spacing.sm }]}>
            {editableCarts.slice(0, 2).map((cart) => (
              <TouchableOpacity
                key={cart.id}
                style={[
                  styles.cartOption,
                  {
                    borderColor: theme.colors.border,
                    paddingHorizontal: theme.spacing.smd,
                    paddingVertical: theme.spacing.sm,
                    borderRadius: theme.borderRadius.sm,
                  },
                  cart.id === activeCartId && {
                    backgroundColor: theme.colors.primary,
                    borderColor: theme.colors.primary,
                  },
                ]}
                onPress={() => handleSelectCart(cart.id)}
              >
                <Text
                  style={[
                    styles.cartOptionText,
                    {
                      color: theme.colors.text,
                      fontSize: theme.typography.fontSize.sm,
                      fontWeight: theme.typography.fontWeight.medium,
                    },
                    cart.id === activeCartId && { color: theme.colors.buttonPrimaryText },
                  ]}
                  numberOfLines={1}
                >
                  {getTranslatedCartName(cart.name)}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.cartOption, styles.newCartOption, {
                borderColor: theme.colors.border,
                paddingHorizontal: theme.spacing.smd,
                paddingVertical: theme.spacing.sm,
                borderRadius: theme.borderRadius.sm,
              }]}
              onPress={handleCreateNewCart}
            >
              <Text style={[styles.cartOptionText, {
                color: theme.colors.primary,
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
              }]}>
                + {t('scan.newCart')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Add to Cart Button */}
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: theme.colors.primary,
              borderRadius: theme.borderRadius.md,
              paddingVertical: theme.spacing.md,
            },
            itemsToAdd.length === 0 && styles.addButtonDisabled,
          ]}
          onPress={handleAddToCart}
          disabled={itemsToAdd.length === 0}
        >
          <Text style={[styles.addButtonText, {
            color: theme.colors.buttonPrimaryText,
            fontSize: theme.typography.fontSize.lg,
            fontWeight: theme.typography.fontWeight.bold,
          }]}>
            {t('scan.addToCart')} ({itemsToAdd.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Quantity Edit Modal */}
      <QuantityEditModal
        visible={quantityModalVisible}
        item={selectedMatch?.matchedItem || null}
        currentQuantity={
          selectedMatch?.userOverride?.selectedQuantity ||
          selectedMatch?.parsedItem.quantity ||
          selectedMatch?.matchedItem?.defaultQuantity ||
          1
        }
        onClose={() => {
          setQuantityModalVisible(false);
          setSelectedMatchIndex(null);
        }}
        onSave={handleQuantitySave}
      />

      {/* Item Selector Modal (simplified - shows catalog items) */}
      {itemSelectorVisible && (
        <View style={styles.itemSelectorOverlay}>
          <TouchableOpacity
            style={styles.itemSelectorBackdrop}
            activeOpacity={1}
            onPress={() => {
              setItemSelectorVisible(false);
              setItemSearchQuery('');
            }}
          />
          <View style={[styles.itemSelectorModal, {
            backgroundColor: theme.colors.surface,
            borderTopLeftRadius: theme.borderRadius.xl,
            borderTopRightRadius: theme.borderRadius.xl,
            paddingTop: theme.spacing.md,
          }]}>
            <View style={[styles.itemSelectorHeader, {
              paddingHorizontal: theme.spacing.md,
              marginBottom: theme.spacing.smd,
            }]}>
              <Text style={[styles.itemSelectorTitle, {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.xl,
                fontWeight: theme.typography.fontWeight.bold,
              }]}>
                {t('scan.selectItem')}
              </Text>
              <TouchableOpacity onPress={() => {
                setItemSelectorVisible(false);
                setItemSearchQuery('');
              }}>
                <Text style={[styles.itemSelectorClose, {
                  color: theme.colors.textLight,
                  fontSize: theme.typography.fontSize['2xl'],
                  padding: theme.spacing.xs,
                }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[styles.itemSearchInput, {
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.md,
                paddingHorizontal: theme.spacing.smd,
                paddingVertical: theme.spacing.sm,
                marginHorizontal: theme.spacing.md,
                marginBottom: theme.spacing.smd,
                borderRadius: theme.borderRadius.sm,
                borderColor: theme.colors.border,
              }]}
              placeholder={t('scan.searchItems')}
              placeholderTextColor={theme.colors.textLight}
              value={itemSearchQuery}
              onChangeText={setItemSearchQuery}
              autoFocus
            />
            <FlatList
              data={filteredCatalogItems}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.itemOption, {
                    borderBottomColor: theme.colors.border,
                    paddingVertical: theme.spacing.md,
                  }]}
                  onPress={() => handleItemSelect(item)}
                >
                  <Text style={[styles.itemOptionText, {
                    color: theme.colors.text,
                    fontSize: theme.typography.fontSize.lg,
                  }]}>
                    {getTranslatedItemName(item.id)}
                  </Text>
                  <Text style={[styles.itemOptionUnit, {
                    color: theme.colors.textLight,
                    fontSize: theme.typography.fontSize.sm,
                    marginLeft: theme.spacing.smd,
                  }]}>
                    {item.defaultQuantity} {item.unit}
                  </Text>
                </TouchableOpacity>
              )}
              style={[styles.itemSelectorList, { paddingHorizontal: theme.spacing.md }]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    // paddingBottom applied inline via theme tokens
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingHorizontal, paddingTop applied inline via theme tokens
  },
  headerButton: {
    // padding applied inline via theme tokens
    width: 44,
  },
  headerButtonText: {
    // fontSize, color applied inline via theme tokens
  },
  headerTitle: {
    // fontSize, fontWeight, color applied inline via theme tokens
  },
  summary: {
    // padding, marginBottom applied inline via theme tokens
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginBottom applied inline via theme tokens
  },
  thumbnail: {
    width: 60,
    height: 80,
    // borderRadius, marginRight applied inline via theme tokens
  },
  summaryText: {
    flex: 1,
  },
  summaryTitle: {
    // fontSize, fontWeight, marginBottom applied inline via theme tokens
  },
  summarySubtitle: {
    // fontSize applied inline via theme tokens
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  statLabel: {
    // fontSize applied inline via theme tokens
    marginTop: 2,
  },
  listContent: {
    // padding applied inline via theme tokens
    paddingBottom: 200,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    // padding, paddingBottom applied inline via theme tokens
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  cartSelector: {
    // marginBottom applied inline via theme tokens
  },
  cartLabel: {
    // fontSize, marginBottom applied inline via theme tokens
  },
  cartButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap applied inline via theme tokens
  },
  cartOption: {
    // paddingHorizontal, paddingVertical, borderRadius applied inline via theme tokens
    borderWidth: 1,
    maxWidth: '45%',
  },
  newCartOption: {
    borderStyle: 'dashed',
  },
  cartOptionText: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  addButton: {
    // borderRadius, paddingVertical applied inline via theme tokens
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  itemSelectorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  itemSelectorBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  itemSelectorModal: {
    maxHeight: '70%',
    // borderTopLeftRadius, borderTopRightRadius, paddingTop applied inline via theme tokens
  },
  itemSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingHorizontal, marginBottom applied inline via theme tokens
  },
  itemSelectorTitle: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  itemSelectorClose: {
    // fontSize, padding applied inline via theme tokens
  },
  itemSearchInput: {
    // backgroundColor, color, fontSize, padding, margin, borderRadius, borderColor applied inline via theme tokens
    borderWidth: 1,
  },
  itemSelectorList: {
    // paddingHorizontal applied inline via theme tokens
  },
  itemOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingVertical applied inline via theme tokens
    borderBottomWidth: 1,
  },
  itemOptionText: {
    // fontSize applied inline via theme tokens
    flex: 1,
  },
  itemOptionUnit: {
    // fontSize, marginLeft applied inline via theme tokens
  },
});

export default ScanReviewScreen;

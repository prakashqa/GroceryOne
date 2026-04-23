/**
 * Barcode Scanner Screen
 * Scans product barcodes and auto-adds items to active cart
 */

import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import {
  selectItems, selectActiveCart,
  addItemToActiveCart, createCart,
} from '@groceryone/store';
import type { DomainTypes } from '@groceryone/store';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/ThemeContext';

export function BarcodeScannerScreen() {
  const { t } = useTranslation('common');
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const allItems = useSelector(selectItems);
  const activeCart = useSelector(selectActiveCart);

  const [permission, requestPermission] = useCameraPermissions();
  const [scannedItem, setScannedItem] = useState<DomainTypes.Item | null>(null);
  const [notFound, setNotFound] = useState(false);
  const isProcessing = useRef(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const showOverlay = useCallback((duration: number) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(duration),
      Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim]);

  const handleBarcodeScanned = useCallback(({ data }: { data: string }) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    // Offline-first: look up in local Redux store
    const item = allItems.find((i) => i.barcode === data);

    if (item) {
      setScannedItem(item);
      setNotFound(false);
      showOverlay(1500);

      // Auto-add to cart
      if (!activeCart || activeCart.status === 'paid') {
        const name = `Order ${new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })}`;
        dispatch(createCart({ name }));
      }
      dispatch(addItemToActiveCart({ item, quantity: item.defaultQuantity }));

      // Reset after 2 seconds
      setTimeout(() => {
        setScannedItem(null);
        isProcessing.current = false;
      }, 2000);
    } else {
      setNotFound(true);
      setScannedItem(null);
      showOverlay(2000);

      setTimeout(() => {
        setNotFound(false);
        isProcessing.current = false;
      }, 2500);
    }
  }, [allItems, activeCart, dispatch, showOverlay]);

  // Permission handling
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.message, { color: colors.text }]}>{t('loading')}</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Ionicons name="camera-outline" size={64} color={colors.textSecondary} />
        <Text style={[styles.message, { color: colors.text }]}>Camera permission required</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={[styles.backText, { color: colors.primary }]}>{t('back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.fullScreen}>
      <CameraView
        style={StyleSheet.absoluteFill}
        barcodeScannerSettings={{
          barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
        }}
        onBarcodeScanned={handleBarcodeScanned}
      />

      {/* Header overlay */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={28} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scan.title', 'Scan Barcode')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Scan guide */}
      <View style={styles.guideContainer}>
        <View style={styles.scanGuide}>
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />
        </View>
        <Text style={styles.guideText}>{t('scan.tips', 'Point camera at a barcode')}</Text>
      </View>

      {/* Result overlay */}
      <Animated.View style={[styles.resultOverlay, { opacity: fadeAnim }]} pointerEvents="none">
        {scannedItem && (
          <View style={[styles.resultCard, { backgroundColor: '#22c55e' }]}>
            <Ionicons name="checkmark-circle" size={40} color="white" />
            <Text style={styles.resultTitle}>{scannedItem.name}</Text>
            <Text style={styles.resultSubtitle}>
              {t('picking.add', 'Added')} — {scannedItem.defaultQuantity} {scannedItem.unit}
            </Text>
          </View>
        )}
        {notFound && (
          <View style={[styles.resultCard, { backgroundColor: '#f97316' }]}>
            <Ionicons name="alert-circle" size={40} color="white" />
            <Text style={styles.resultTitle}>{t('picking.noItemsFound', 'Item not found')}</Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    gap: 16,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: 'black',
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 12,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  backButton: {
    marginTop: 12,
  },
  backText: {
    fontSize: 14,
    fontWeight: '500',
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanGuide: {
    width: 280,
    height: 150,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: 'white',
  },
  topLeft: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3 },
  topRight: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3 },
  bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3 },
  bottomRight: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3 },
  guideText: {
    color: 'white',
    fontSize: 14,
    marginTop: 16,
    textAlign: 'center',
    opacity: 0.8,
  },
  resultOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultCard: {
    paddingHorizontal: 32,
    paddingVertical: 24,
    borderRadius: 16,
    alignItems: 'center',
    gap: 8,
  },
  resultTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: '700',
  },
  resultSubtitle: {
    color: 'white',
    fontSize: 14,
    opacity: 0.9,
  },
});

export default BarcodeScannerScreen;

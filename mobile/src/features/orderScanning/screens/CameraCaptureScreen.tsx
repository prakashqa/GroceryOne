/**
 * CameraCaptureScreen
 * Screen for capturing paper order images
 */

import React, { useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDispatch, useSelector } from 'react-redux';
import { useTheme } from '../../../presentation/theme';
import { useTranslation } from 'react-i18next';
import {
  startSession,
  setProcessing,
  setOcrResult,
  setMatchResults,
  setScanError,
  setRetryState,
  clearSession,
  selectIsProcessing,
  selectProcessingStep,
  selectScanError,
  selectRetryAttempt,
  selectMaxRetries,
} from '../store/scanSlice';
import { SCAN_ERROR_CONFIG, ScanErrorType } from '../types/scanning.types';
import { selectItems } from '../../../store/slices/catalogSlice';
import { OcrService } from '../services/OcrService';
import { TextParser } from '../services/TextParser';
import { FuzzyMatcher } from '../services/FuzzyMatcher';
import { getTeluguItemName } from '../../../domain/utils/itemTranslations';
import teCommon from '../../../i18n/locales/te/common.json';
import Constants from 'expo-constants';

// Get API key from environment
const GOOGLE_VISION_API_KEY =
  Constants.expoConfig?.extra?.googleVisionApiKey || '';

type RootStackParamList = {
  CameraCapture: undefined;
  ScanReview: undefined;
  Picking: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export const CameraCaptureScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const navigation = useNavigation<NavigationProp>();
  const dispatch = useDispatch();

  const cameraRef = useRef<CameraView>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastImageUriRef = useRef<string | null>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [flashEnabled, setFlashEnabled] = useState(false);

  const isProcessing = useSelector(selectIsProcessing);
  const processingStep = useSelector(selectProcessingStep);
  const scanError = useSelector(selectScanError);
  const retryAttempt = useSelector(selectRetryAttempt);
  const maxRetries = useSelector(selectMaxRetries);
  const catalogItems = useSelector(selectItems);

  const processImage = useCallback(
    async (imageUri: string) => {
      lastImageUriRef.current = imageUri;
      const controller = new AbortController();
      abortControllerRef.current = controller;

      try {
        // Start session
        dispatch(startSession(imageUri));

        // OCR Processing with retry + timeout + offline detection
        dispatch(setProcessing('ocr'));
        const ocrService = new OcrService(GOOGLE_VISION_API_KEY, {
          timeoutMs: 30000,
          maxRetries: 2,
          initialDelayMs: 1000,
          onRetry: (attempt, max) => {
            dispatch(setRetryState({ attempt, maxRetries: max }));
            dispatch(setProcessing('retrying'));
          },
        });

        const ocrResult = await ocrService.processImageWithRetry(
          imageUri,
          controller.signal
        );

        if (!ocrResult.success) {
          const errorType: ScanErrorType = ocrResult.errorType || 'unknown';
          const errorConfig = SCAN_ERROR_CONFIG[errorType];
          dispatch(setScanError({
            type: errorType,
            message: t(`scan.errors.${errorType}`, { defaultValue: errorConfig.defaultMessage }),
            retryable: errorConfig.retryable,
          }));
          return;
        }

        dispatch(setOcrResult(ocrResult));

        // Text Parsing
        dispatch(setProcessing('parsing'));
        const textParser = new TextParser();
        const parsedItems = textParser.parseLines(
          ocrResult.lines,
          ocrResult.detectedLanguage
        );

        if (parsedItems.length === 0) {
          dispatch(setScanError({
            type: 'no_items',
            message: t('scan.errors.no_items', { defaultValue: SCAN_ERROR_CONFIG.no_items.defaultMessage }),
            retryable: false,
          }));
          return;
        }

        // Fuzzy Matching
        dispatch(setProcessing('matching'));
        const getTeluguSynonyms = (itemId: string): string[] => {
          const synonyms = (teCommon as Record<string, unknown>).itemSynonyms as
            | Record<string, string[]>
            | undefined;
          return synonyms?.[itemId] ?? [];
        };
        const fuzzyMatcher = new FuzzyMatcher(
          catalogItems,
          getTeluguItemName,
          getTeluguSynonyms
        );

        const matchResults = parsedItems.map((parsedItem) => {
          const matchResult = fuzzyMatcher.match(
            parsedItem.itemName,
            parsedItem.language
          );
          return {
            ...matchResult,
            parsedItem,
          };
        });

        dispatch(setMatchResults(matchResults));

        // Navigate to review screen
        navigation.navigate('ScanReview');
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        dispatch(setScanError({
          type: 'unknown',
          message: errorMessage,
          retryable: true,
        }));
      }
    },
    [dispatch, navigation, catalogItems, t]
  );

  const handleCancel = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  const handleRetry = useCallback(() => {
    if (lastImageUriRef.current) {
      processImage(lastImageUriRef.current);
    }
  }, [processImage]);

  const handleDismissError = useCallback(() => {
    dispatch(clearSession());
  }, [dispatch]);

  const handleCapture = useCallback(async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        base64: false,
      });

      if (photo?.uri) {
        await processImage(photo.uri);
      }
    } catch (error) {
      Alert.alert(t('error'), t('scan.captureError'));
    }
  }, [isProcessing, processImage, t]);

  const handlePickImage = useCallback(async () => {
    if (isProcessing) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await processImage(result.assets[0].uri);
    }
  }, [isProcessing, processImage]);

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const toggleFlash = useCallback(() => {
    setFlashEnabled((prev) => !prev);
  }, []);

  // Handle permissions
  if (!permission) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <SafeAreaView style={[styles.permissionContainer, { padding: theme.spacing.xl }]}>
          <Text style={[styles.permissionText, {
            color: theme.colors.text,
            fontSize: theme.typography.fontSize.lg,
            marginBottom: theme.spacing.lg,
          }]}>
            {t('scan.cameraPermissionRequired')}
          </Text>
          <TouchableOpacity
            style={[styles.permissionButton, {
              backgroundColor: theme.colors.primary,
              paddingHorizontal: theme.spacing.lg,
              paddingVertical: theme.spacing.smd,
              borderRadius: theme.borderRadius.sm,
            }]}
            onPress={requestPermission}
          >
            <Text style={[styles.permissionButtonText, {
              color: theme.colors.buttonPrimaryText,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
            }]}>
              {t('scan.grantPermission')}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const getProcessingText = () => {
    switch (processingStep) {
      case 'ocr':
        return t('scan.detecting');
      case 'parsing':
        return t('scan.processing');
      case 'matching':
        return t('scan.matching');
      case 'retrying':
        return t('scan.retrying', { attempt: retryAttempt, max: maxRetries });
      default:
        return t('scan.processing');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />

      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flashEnabled ? 'on' : 'off'}
      >
        {/* Header */}
        <SafeAreaView style={[styles.header, {
          paddingHorizontal: theme.spacing.md,
          paddingTop: theme.spacing.sm,
        }]}>
          <TouchableOpacity style={[styles.headerButton, { padding: theme.spacing.smd }]} onPress={handleBack}>
            <Text style={[styles.headerButtonText, {
              fontSize: theme.typography.fontSize.xxl,
              color: theme.colors.textInverse,
            }]}>←</Text>
          </TouchableOpacity>
          <Text style={[styles.headerTitle, {
            fontSize: theme.typography.fontSize.xl,
            fontWeight: theme.typography.fontWeight.semibold,
            color: theme.colors.textInverse,
          }]}>{t('scan.title')}</Text>
          <TouchableOpacity style={[styles.headerButton, { padding: theme.spacing.smd }]} onPress={toggleFlash}>
            <Text style={[styles.headerButtonText, {
              fontSize: theme.typography.fontSize.xxl,
              color: theme.colors.textInverse,
            }]}>
              {flashEnabled ? '⚡' : '✨'}
            </Text>
          </TouchableOpacity>
        </SafeAreaView>

        {/* Alignment Guide */}
        <View style={[styles.guideContainer, { padding: theme.spacing.xl }]}>
          <View style={styles.guide}>
            <View style={[styles.corner, styles.topLeft]} />
            <View style={[styles.corner, styles.topRight]} />
            <View style={[styles.corner, styles.bottomLeft]} />
            <View style={[styles.corner, styles.bottomRight]} />
          </View>
          <Text style={[styles.guideText, {
            marginTop: theme.spacing.md,
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.textInverse,
            paddingHorizontal: theme.spacing.md,
            paddingVertical: theme.spacing.sm,
            borderRadius: theme.borderRadius.sm,
          }]}>{t('scan.alignPaper')}</Text>
        </View>

        {/* Processing Overlay */}
        {isProcessing && (
          <View style={styles.processingOverlay}>
            <ActivityIndicator size="large" color={theme.colors.textInverse} />
            <Text style={[styles.processingText, {
              marginTop: theme.spacing.md,
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.textInverse,
            }]}>{getProcessingText()}</Text>
            {retryAttempt > 0 && (
              <Text style={[styles.retryText, {
                marginTop: theme.spacing.sm,
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.textInverse,
              }]}>
                {t('scan.retrying', { attempt: retryAttempt, max: maxRetries })}
              </Text>
            )}
            <TouchableOpacity
              style={[styles.cancelButton, {
                marginTop: theme.spacing.lg,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.smd,
                borderRadius: theme.borderRadius.sm,
              }]}
              onPress={handleCancel}
            >
              <Text style={[styles.cancelText, {
                fontSize: theme.typography.fontSize.lg,
                color: theme.colors.textInverse,
              }]}>{t('scan.cancelScan')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Error Overlay */}
        {!isProcessing && scanError && (
          <View style={styles.errorOverlay}>
            <Text style={[styles.errorIcon, { fontSize: 48 }]}>
              {scanError.type === 'offline' ? '📡' : '⚠️'}
            </Text>
            <Text style={[styles.errorMessage, {
              marginTop: theme.spacing.md,
              fontSize: theme.typography.fontSize.lg,
              color: theme.colors.textInverse,
              paddingHorizontal: theme.spacing.xl,
            }]}>{scanError.message}</Text>
            {scanError.retryable && (
              <TouchableOpacity
                style={[styles.retryButton, {
                  marginTop: theme.spacing.lg,
                  paddingHorizontal: theme.spacing.xl,
                  paddingVertical: theme.spacing.smd,
                  borderRadius: theme.borderRadius.sm,
                  backgroundColor: theme.colors.primary,
                }]}
                onPress={handleRetry}
              >
                <Text style={[styles.retryButtonText, {
                  fontSize: theme.typography.fontSize.lg,
                  fontWeight: theme.typography.fontWeight.semibold,
                  color: theme.colors.buttonPrimaryText,
                }]}>{t('scan.retry')}</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.goBackButton, {
                marginTop: theme.spacing.md,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.sm,
              }]}
              onPress={handleDismissError}
            >
              <Text style={[styles.goBackText, {
                fontSize: theme.typography.fontSize.md,
                color: theme.colors.textInverse,
              }]}>{t('goBack')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Bottom Controls */}
        <View style={[styles.controls, {
          paddingVertical: theme.spacing.xl,
          paddingHorizontal: theme.spacing.md,
        }]}>
          <TouchableOpacity
            style={[styles.galleryButton, { borderRadius: theme.borderRadius.xl }]}
            onPress={handlePickImage}
            disabled={isProcessing}
          >
            <Text style={[styles.galleryIcon, { fontSize: theme.typography.fontSize.xxl }]}>🖼️</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.captureButton,
              isProcessing && styles.captureButtonDisabled,
            ]}
            onPress={handleCapture}
            disabled={isProcessing}
          >
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>

          <View style={styles.placeholderButton} />
        </View>
      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // paddingHorizontal, paddingTop applied inline via theme tokens
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerButton: {
    // padding applied inline via theme tokens
  },
  headerButtonText: {
    // fontSize, color applied inline via theme tokens
  },
  headerTitle: {
    // fontSize, fontWeight, color applied inline via theme tokens
  },
  guideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // padding applied inline via theme tokens
  },
  guide: {
    width: '100%',
    aspectRatio: 0.75,
    maxHeight: '60%',
    position: 'relative',
  },
  // Camera-specific geometric values kept as-is
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
  },
  guideText: {
    // marginTop, fontSize, color, paddingHorizontal, paddingVertical, borderRadius applied inline via theme tokens
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    // marginTop, fontSize, color applied inline via theme tokens
  },
  retryText: {
    // marginTop, fontSize, color applied inline via theme tokens
    opacity: 0.8,
  },
  cancelButton: {
    // marginTop, paddingHorizontal, paddingVertical, borderRadius applied inline via theme tokens
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
  },
  cancelText: {
    // fontSize, color applied inline via theme tokens
    textAlign: 'center',
  },
  errorOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorIcon: {
    // fontSize applied inline
  },
  errorMessage: {
    // marginTop, fontSize, color, paddingHorizontal applied inline via theme tokens
    textAlign: 'center',
  },
  retryButton: {
    // marginTop, paddingHorizontal, paddingVertical, borderRadius, backgroundColor applied inline via theme tokens
  },
  retryButtonText: {
    // fontSize, fontWeight, color applied inline via theme tokens
    textAlign: 'center',
  },
  goBackButton: {
    // marginTop, paddingHorizontal, paddingVertical applied inline via theme tokens
  },
  goBackText: {
    // fontSize, color applied inline via theme tokens
    textAlign: 'center',
    textDecorationLine: 'underline',
    opacity: 0.7,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    // paddingVertical, paddingHorizontal applied inline via theme tokens
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  // Camera-specific button sizes kept as-is
  galleryButton: {
    width: 48,
    height: 48,
    // borderRadius applied inline via theme tokens
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  galleryIcon: {
    // fontSize applied inline via theme tokens
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
  },
  placeholderButton: {
    width: 48,
    height: 48,
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    // padding applied inline via theme tokens
  },
  permissionText: {
    // fontSize, marginBottom applied inline via theme tokens
    textAlign: 'center',
  },
  permissionButton: {
    // paddingHorizontal, paddingVertical, borderRadius applied inline via theme tokens
  },
  permissionButtonText: {
    // fontSize, fontWeight applied inline via theme tokens
  },
});

export default CameraCaptureScreen;

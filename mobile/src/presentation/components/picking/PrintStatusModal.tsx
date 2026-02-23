/**
 * PrintStatusModal Component
 * Displays print status feedback with animated states:
 * printing (spinner), success (auto-dismiss), failed (retry), no-printer (go to settings)
 *
 * Replaces plain Alert.alert() with a polished modal experience
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';
import { useTranslation } from 'react-i18next';
import { ModalContainer } from '../common/ModalContainer';
import { Button } from '../common/Button';

export type PrintStatus = 'idle' | 'printing' | 'success' | 'failed' | 'no-printer';

export interface PrintStatusModalProps {
  visible: boolean;
  status: PrintStatus;
  errorMessage?: string;
  printerName?: string;
  onClose: () => void;
  onRetry?: () => void;
  onGoToSettings?: () => void;
  testID?: string;
}

const PrintStatusModal: React.FC<PrintStatusModalProps> = ({
  visible,
  status,
  errorMessage,
  printerName,
  onClose,
  onRetry,
  onGoToSettings,
  testID = 'print-status-modal',
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();
  const { t } = useTranslation('common');
  const autoDismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-dismiss on success after 2 seconds
  useEffect(() => {
    if (status === 'success') {
      autoDismissTimer.current = setTimeout(() => {
        onClose();
      }, 2000);
    }

    return () => {
      if (autoDismissTimer.current) {
        clearTimeout(autoDismissTimer.current);
        autoDismissTimer.current = null;
      }
    };
  }, [status, onClose]);

  // Don't render when idle or not visible
  if (!visible || status === 'idle') {
    return null;
  }

  const getIcon = (): string => {
    switch (status) {
      case 'printing':
        return '🖨️';
      case 'success':
        return '✅';
      case 'failed':
        return '❌';
      case 'no-printer':
        return '🔌';
      default:
        return '🖨️';
    }
  };

  const getTitle = (): string => {
    switch (status) {
      case 'printing':
        return t('picking.printStatus.sending');
      case 'success':
        return t('picking.printStatus.success');
      case 'failed':
        return t('picking.printStatus.failed');
      case 'no-printer':
        return t('picking.printStatus.noPrinter');
      default:
        return '';
    }
  };

  const getVariant = (): 'default' | 'danger' => {
    return status === 'failed' || status === 'no-printer' ? 'danger' : 'default';
  };

  const getBodyText = (): string => {
    switch (status) {
      case 'printing':
        return printerName
          ? t('picking.printStatus.sendingTo', { printerName })
          : t('picking.printStatus.sendingGeneric');
      case 'success':
        return t('picking.printStatus.successMessage');
      case 'failed':
        return errorMessage || t('picking.printStatus.failedGeneric');
      case 'no-printer':
        return t('picking.printStatus.noPrinterMessage');
      default:
        return '';
    }
  };

  // Printing state: non-dismissable (no close on backdrop)
  const handleBackdropClose = () => {
    if (status !== 'printing') {
      onClose();
    }
  };

  return (
    <ModalContainer
      visible={visible}
      onClose={handleBackdropClose}
      title={getTitle()}
      icon={getIcon()}
      variant={getVariant()}
      testID={testID}
    >
      <View style={styles.body}>
        {/* Spinner for printing state */}
        {status === 'printing' && (
          <View style={styles.spinnerRow}>
            <ActivityIndicator
              size="large"
              color={theme.colors.primary}
              testID={`${testID}-spinner`}
            />
          </View>
        )}

        {/* Body text */}
        <Text
          style={[
            styles.bodyText,
            {
              color: theme.colors.textSecondary,
              fontSize: Math.round(theme.typography.fontSize.md * responsiveStyles.fontScale),
              marginTop: status === 'printing' ? theme.spacing.md : 0,
            },
          ]}
        >
          {getBodyText()}
        </Text>

        {/* Action Buttons */}
        <View style={[styles.actions, { marginTop: theme.spacing.lg }]}>
          {/* Success: Done button */}
          {status === 'success' && (
            <Button
              title={t('picking.printStatus.done')}
              onPress={onClose}
              variant="primary"
              size="md"
              fullWidth
              testID={`${testID}-done-btn`}
            />
          )}

          {/* Failed: Retry + Close */}
          {status === 'failed' && (
            <>
              <Button
                title={t('picking.printStatus.retry')}
                onPress={onRetry || onClose}
                variant="primary"
                size="md"
                fullWidth
                testID={`${testID}-retry-btn`}
              />
              <View style={{ height: theme.spacing.sm }} />
              <Button
                title={t('cancel')}
                onPress={onClose}
                variant="ghost"
                size="md"
                fullWidth
                testID={`${testID}-close-btn`}
              />
            </>
          )}

          {/* No Printer: Go to Settings + Close */}
          {status === 'no-printer' && (
            <>
              <Button
                title={t('picking.printStatus.goToSettings')}
                onPress={onGoToSettings || onClose}
                variant="primary"
                size="md"
                fullWidth
                testID={`${testID}-settings-btn`}
              />
              <View style={{ height: theme.spacing.sm }} />
              <Button
                title={t('cancel')}
                onPress={onClose}
                variant="ghost"
                size="md"
                fullWidth
                testID={`${testID}-close-btn`}
              />
            </>
          )}
        </View>
      </View>
    </ModalContainer>
  );
};

const styles = StyleSheet.create({
  body: {
    alignItems: 'center',
  },
  spinnerRow: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  bodyText: {
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    width: '100%',
  },
});

export default PrintStatusModal;

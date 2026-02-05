/**
 * NewCartConfirmModal Component
 * Confirmation modal for starting a new cart when current cart has items
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';

interface NewCartConfirmModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  itemCount: number;
  testID?: string;
}

const NewCartConfirmModal: React.FC<NewCartConfirmModalProps> = ({
  visible,
  onClose,
  onConfirm,
  itemCount,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={[styles.overlay, { backgroundColor: theme.colors.modalOverlay }]}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={styles.keyboardAvoidingView}
            >
              <View
                style={[
                  styles.container,
                  {
                    backgroundColor: theme.colors.surface,
                    borderRadius: theme.borderRadius.xl,
                  },
                  theme.shadows.xl,
                ]}
              >
                {/* Header with Icon */}
                <View style={styles.header}>
                  <View
                    style={[
                      styles.iconContainer,
                      { backgroundColor: theme.colors.warning + '20' },
                    ]}
                  >
                    <Text style={styles.icon}>⚠️</Text>
                  </View>
                  <Text
                    style={[
                      styles.title,
                      {
                        color: theme.colors.text,
                        fontSize: theme.typography.fontSize.xxl,
                      },
                    ]}
                  >
                    {t('picking.newCartConfirmTitle')}
                  </Text>
                </View>

                {/* Accent Line */}
                <View
                  style={[
                    styles.accentLine,
                    { backgroundColor: theme.colors.warning },
                  ]}
                />

                {/* Content Section */}
                <View style={styles.content}>
                  <Text
                    style={[
                      styles.message,
                      {
                        color: theme.colors.textSecondary,
                        fontSize: theme.typography.fontSize.md,
                      },
                    ]}
                  >
                    {t('picking.newCartConfirmMessage', { count: itemCount })}
                  </Text>

                  {/* Buttons */}
                  <View style={styles.buttonContainer}>
                    <View style={styles.buttonWrapper}>
                      <Button
                        title={t('picking.keepCurrent')}
                        variant="ghost"
                        onPress={onClose}
                        fullWidth
                        testID={testID ? `${testID}-keep-button` : undefined}
                      />
                    </View>
                    <View style={styles.buttonSpacer} />
                    <View style={styles.buttonWrapper}>
                      <Button
                        title={t('picking.startNewCart')}
                        variant="primary"
                        onPress={onConfirm}
                        fullWidth
                        testID={testID ? `${testID}-confirm-button` : undefined}
                      />
                    </View>
                  </View>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  keyboardAvoidingView: {
    width: '100%',
    maxWidth: 400,
  },
  container: {
    width: '100%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  icon: {
    fontSize: 26,
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  accentLine: {
    height: 3,
    marginHorizontal: 24,
    borderRadius: 2,
    opacity: 0.3,
  },
  content: {
    padding: 24,
    paddingTop: 20,
  },
  message: {
    lineHeight: 22,
    marginBottom: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 24,
  },
  buttonWrapper: {
    flex: 1,
  },
  buttonSpacer: {
    width: 12,
  },
});

export default NewCartConfirmModal;

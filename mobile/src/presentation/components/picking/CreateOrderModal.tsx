/**
 * CreateCartModal Component
 * Redesigned modal for creating a new cart with improved UI/UX
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface CreateCartModalProps {
  visible: boolean;
  onClose: () => void;
  onCreateCart: (name: string) => void;
  existingNames?: string[];
  testID?: string;
}

const CreateOrderModal: React.FC<CreateCartModalProps> = ({
  visible,
  onClose,
  onCreateCart,
  existingNames = [],
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [cartName, setCartName] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!visible) {
      setCartName('');
      setError(null);
    }
  }, [visible]);

  // Check for duplicate names
  useEffect(() => {
    const trimmedName = cartName.trim();
    if (trimmedName && existingNames.some(
      (name) => name.toLowerCase() === trimmedName.toLowerCase()
    )) {
      setError(t('picking.duplicateName'));
    } else {
      setError(null);
    }
  }, [cartName, existingNames, t]);

  const handleCreate = () => {
    const trimmedName = cartName.trim();
    if (!trimmedName || error) {
      return;
    }
    onCreateCart(trimmedName);
    setCartName('');
    onClose();
  };

  const handleCancel = () => {
    setCartName('');
    setError(null);
    onClose();
  };

  const isCreateDisabled = !cartName.trim() || !!error;

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
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
                      { backgroundColor: theme.colors.iconMuted },
                    ]}
                  >
                    <Text style={[styles.icon, { color: theme.colors.primary }]}>
                      🛒
                    </Text>
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
                    {t('picking.createCart')}
                  </Text>
                </View>

                {/* Accent Line */}
                <View
                  style={[
                    styles.accentLine,
                    { backgroundColor: theme.colors.primary },
                  ]}
                />

                {/* Input Section */}
                <View style={styles.content}>
                  <Input
                    value={cartName}
                    onChangeText={setCartName}
                    label={t('picking.cartName')}
                    placeholder={t('picking.enterCartName')}
                    error={error || undefined}
                    maxLength={50}
                    autoFocus
                    testID={testID ? `${testID}-input` : undefined}
                  />

                  {/* Buttons */}
                  <View style={styles.buttonContainer}>
                    <View style={styles.buttonWrapper}>
                      <Button
                        title={t('cancel')}
                        variant="ghost"
                        onPress={handleCancel}
                        fullWidth
                        testID={testID ? `${testID}-cancel-button` : undefined}
                      />
                    </View>
                    <View style={styles.buttonSpacer} />
                    <View style={styles.buttonWrapper}>
                      <Button
                        title={t('picking.create')}
                        variant="primary"
                        onPress={handleCreate}
                        disabled={isCreateDisabled}
                        fullWidth
                        testID={testID ? `${testID}-create-button` : undefined}
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

export default CreateOrderModal;

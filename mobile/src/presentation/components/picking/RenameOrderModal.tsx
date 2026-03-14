/**
 * RenameCartModal Component
 * Redesigned modal for renaming an existing cart
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useTranslation } from 'react-i18next';
import { Button } from '../common/Button';
import { Input } from '../common/Input';

interface RenameCartModalProps {
  visible: boolean;
  currentName: string;
  cartId: string;
  onClose: () => void;
  onRename: (cartId: string, newName: string) => void;
  existingNames?: string[];
  testID?: string;
}

const RenameOrderModal: React.FC<RenameCartModalProps> = ({
  visible,
  currentName,
  cartId,
  onClose,
  onRename,
  existingNames = [],
  testID = 'rename-cart-modal',
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const [cartName, setCartName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);

  // Reset state when modal opens with new cart
  useEffect(() => {
    if (visible) {
      setCartName(currentName);
      setError(null);
    }
  }, [visible, currentName]);

  // Check for duplicate names (excluding current name)
  useEffect(() => {
    const trimmedName = cartName.trim();
    if (trimmedName && trimmedName.toLowerCase() !== currentName.toLowerCase()) {
      if (existingNames.some(
        (name) => name.toLowerCase() === trimmedName.toLowerCase()
      )) {
        setError(t('manageCarts.duplicateName'));
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  }, [cartName, existingNames, currentName, t]);

  const handleSave = () => {
    const trimmedName = cartName.trim();
    if (!trimmedName || error) {
      return;
    }
    // Don't save if name hasn't changed
    if (trimmedName === currentName) {
      onClose();
      return;
    }
    onRename(cartId, trimmedName);
    onClose();
  };

  const handleCancel = () => {
    setCartName(currentName);
    setError(null);
    onClose();
  };

  const isSaveDisabled = !cartName.trim() || !!error;

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
                      { backgroundColor: 'rgba(46, 125, 50, 0.1)' },
                    ]}
                  >
                    <Text style={[styles.icon, { color: theme.colors.primary }]}>
                      ✏️
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
                    {t('manageCarts.renameCart')}
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
                    label={t('manageCarts.cartName')}
                    placeholder={t('manageCarts.enterCartName')}
                    error={error || undefined}
                    maxLength={50}
                    autoFocus
                    selectTextOnFocus
                    testID={`${testID}-input`}
                  />

                  {/* Buttons */}
                  <View style={styles.buttonContainer}>
                    <View style={styles.buttonWrapper}>
                      <Button
                        title={t('cancel')}
                        variant="ghost"
                        onPress={handleCancel}
                        fullWidth
                        testID={`${testID}-cancel-button`}
                      />
                    </View>
                    <View style={styles.buttonSpacer} />
                    <View style={styles.buttonWrapper}>
                      <Button
                        title={t('save')}
                        variant="primary"
                        onPress={handleSave}
                        disabled={isSaveDisabled}
                        fullWidth
                        testID={`${testID}-save-button`}
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

export default RenameOrderModal;

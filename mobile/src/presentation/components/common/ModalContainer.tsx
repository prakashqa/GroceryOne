/**
 * ModalContainer Component
 * Reusable modal wrapper with consistent styling and header
 */

import React from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTheme } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';

export type ModalVariant = 'default' | 'danger';

export interface ModalContainerProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  icon?: string;
  variant?: ModalVariant;
  showCloseButton?: boolean;
  children: React.ReactNode;
  testID?: string;
}

export const ModalContainer: React.FC<ModalContainerProps> = ({
  visible,
  onClose,
  title,
  icon,
  variant = 'default',
  showCloseButton = false,
  children,
  testID,
}) => {
  const theme = useTheme();
  const responsiveStyles = useResponsiveStyles();

  if (!visible) {
    return null;
  }

  const getAccentColor = () => {
    return variant === 'danger' ? theme.colors.error : theme.colors.primary;
  };

  const getIconBackgroundColor = () => {
    if (variant === 'danger') {
      return theme.colors.iconDanger;
    }
    return theme.colors.iconMuted;
  };

  const accentColor = getAccentColor();
  const iconBgColor = getIconBackgroundColor();

  // Dynamic responsive styles
  const dynamicStyles = {
    overlay: {
      backgroundColor: theme.colors.modalOverlay,
      padding: theme.spacing.md,
    },
    container: {
      backgroundColor: theme.colors.surface,
      borderRadius: responsiveStyles.cardBorderRadius,
      width: responsiveStyles.modalWidth,
      maxWidth: responsiveStyles.modalWidth,
    },
    header: {
      paddingHorizontal: responsiveStyles.componentPadding,
      paddingTop: responsiveStyles.componentPadding,
      paddingBottom: theme.spacing.md,
    },
    iconContainer: {
      backgroundColor: iconBgColor,
      marginRight: theme.spacing.md,
      width: responsiveStyles.iconContainerSize,
      height: responsiveStyles.iconContainerSize,
      borderRadius: responsiveStyles.iconContainerSize / 2,
    },
    icon: {
      color: accentColor,
      fontSize: Math.round(22 * responsiveStyles.fontScale),
    },
    title: {
      color: theme.colors.text,
      fontSize: Math.round(theme.textStyles.h2.fontSize * responsiveStyles.fontScale),
    },
    closeIcon: {
      color: theme.colors.textSecondary,
    },
    accentLine: {
      backgroundColor: accentColor,
      marginHorizontal: theme.spacing.lg,
    },
    content: {
      padding: responsiveStyles.componentPadding,
      paddingTop: theme.spacing.md + theme.spacing.xs,
    },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose} testID={testID ? `${testID}-backdrop` : undefined}>
        <View style={[styles.overlay, dynamicStyles.overlay]}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
              <View
                style={[
                  styles.container,
                  dynamicStyles.container,
                  theme.shadows.xl,
                ]}
                testID={testID ? `${testID}-container` : undefined}
              >
                {/* Header */}
                <View style={[styles.header, dynamicStyles.header]}>
                  <View style={styles.headerContent}>
                    {icon && (
                      <View
                        style={[
                          styles.iconContainer,
                          dynamicStyles.iconContainer,
                        ]}
                      >
                        <Text style={[styles.icon, dynamicStyles.icon]}>
                          {icon}
                        </Text>
                      </View>
                    )}
                    <Text
                      style={[styles.title, dynamicStyles.title]}
                      numberOfLines={1}
                      adjustsFontSizeToFit
                      minimumFontScale={0.8}
                    >
                      {title}
                    </Text>
                  </View>

                  {showCloseButton && (
                    <TouchableOpacity
                      style={styles.closeButton}
                      onPress={onClose}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      testID={testID ? `${testID}-close-button` : undefined}
                    >
                      <Text style={[styles.closeIcon, dynamicStyles.closeIcon]}>
                        ✕
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* Accent Line */}
                <View style={[styles.accentLine, dynamicStyles.accentLine]} />

                {/* Content */}
                <View style={[styles.content, dynamicStyles.content]}>
                  {children}
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
    // padding is set dynamically via theme.spacing.lg
  },
  container: {
    overflow: 'hidden',
    // width and maxWidth are set dynamically based on screen size
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // padding is set dynamically via theme.spacing
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    flexShrink: 1,
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    // width, height, borderRadius set dynamically
    // marginRight is set dynamically via theme.spacing.md
  },
  icon: {
    // fontSize set dynamically
  },
  title: {
    fontWeight: '700',
    flexShrink: 1,
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 20,
    fontWeight: '600',
  },
  accentLine: {
    height: 3,
    borderRadius: 2,
    opacity: 0.3,
    // marginHorizontal is set dynamically via theme.spacing.lg
  },
  content: {
    // padding is set dynamically via theme.spacing
  },
});

export default ModalContainer;

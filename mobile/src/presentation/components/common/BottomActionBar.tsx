/**
 * BottomActionBar Component
 * Sticky bottom action bar with primary and optional secondary actions
 */

import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { Button, ButtonVariant } from './Button';

export interface BottomActionBarProps {
  primaryLabel: string;
  onPrimaryPress: () => void;
  primaryVariant?: ButtonVariant;
  primaryDisabled?: boolean;
  primaryLoading?: boolean;
  secondaryLabel?: string;
  onSecondaryPress?: () => void;
  secondaryVariant?: ButtonVariant;
  secondaryDisabled?: boolean;
  absolute?: boolean;
  shadow?: boolean;
  showBorder?: boolean;
  testID?: string;
}

export const BottomActionBar: React.FC<BottomActionBarProps> = ({
  primaryLabel,
  onPrimaryPress,
  primaryVariant = 'primary',
  primaryDisabled = false,
  primaryLoading = false,
  secondaryLabel,
  onSecondaryPress,
  secondaryVariant = 'ghost',
  secondaryDisabled = false,
  absolute = true,
  shadow = true,
  showBorder = false,
  testID,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const containerStyle: ViewStyle[] = [
    styles.container,
    {
      backgroundColor: theme.colors.surface,
      paddingHorizontal: theme.spacing.md,
      paddingTop: theme.spacing.md,
      paddingBottom: Math.max(theme.spacing.md, insets.bottom),
    },
  ];

  if (absolute) {
    containerStyle.push(styles.absolute);
  }

  if (shadow) {
    containerStyle.push(theme.shadows.lg as ViewStyle);
  }

  if (showBorder) {
    containerStyle.push({
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    });
  }

  const hasSecondary = secondaryLabel && onSecondaryPress;

  return (
    <View style={containerStyle} testID={testID}>
      <View style={[styles.buttonContainer, hasSecondary && styles.buttonContainerDual]}>
        {hasSecondary && (
          <View style={styles.secondaryWrapper}>
            <Button
              title={secondaryLabel}
              onPress={onSecondaryPress}
              variant={secondaryVariant}
              disabled={secondaryDisabled}
              fullWidth
              testID={testID ? `${testID}-secondary` : undefined}
            />
          </View>
        )}
        <View style={hasSecondary ? styles.primaryWrapper : styles.primaryWrapperFull}>
          <Button
            title={primaryLabel}
            onPress={onPrimaryPress}
            variant={primaryVariant}
            disabled={primaryDisabled}
            loading={primaryLoading}
            fullWidth
            testID={testID ? `${testID}-primary` : undefined}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    left: 0,
    right: 0,
  },
  absolute: {
    position: 'absolute',
    bottom: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  buttonContainerDual: {
    gap: 12,
  },
  secondaryWrapper: {
    flex: 1,
  },
  primaryWrapper: {
    flex: 1.5,
  },
  primaryWrapperFull: {
    flex: 1,
  },
});

export default BottomActionBar;

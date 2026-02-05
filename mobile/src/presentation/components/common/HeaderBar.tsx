/**
 * HeaderBar Component
 * Reusable header bar with back button, title, and optional search.
 * Guarantees proper touch target sizes for accessibility.
 */

import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useTheme, useIsDarkMode } from '../../theme';
import { useResponsiveStyles } from '../../../hooks';
import { Icon } from './Icon';
import { Text } from './Text';

export interface HeaderBarProps {
  /** Screen title displayed in the header */
  title: string;
  /** Callback when back button is pressed; omit to hide back button */
  onBack?: () => void;
  /** Current search query; provide to show the search input */
  searchQuery?: string;
  /** Callback when search text changes */
  onSearchChange?: (query: string) => void;
  /** Placeholder text for the search input */
  searchPlaceholder?: string;
  /** Optional content rendered on the right side of the header row */
  rightAction?: React.ReactNode;
  /** Test ID for testing */
  testID?: string;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  title,
  onBack,
  searchQuery,
  onSearchChange,
  searchPlaceholder = '',
  rightAction,
  testID,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const responsiveStyles = useResponsiveStyles();

  const backButtonSize = Math.max(responsiveStyles.touchTargetMinSize, 44);
  const showSearch = searchQuery !== undefined && onSearchChange !== undefined;

  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: theme.colors.primary,
          paddingHorizontal: responsiveStyles.contentPadding,
          borderBottomLeftRadius: theme.borderRadius.xl,
          borderBottomRightRadius: theme.borderRadius.xl,
        },
      ]}
      testID={testID}
    >
      <StatusBar
        barStyle="light-content"
        backgroundColor={theme.colors.primary}
      />

      {/* Header Row */}
      <View style={[styles.headerRow, { marginBottom: theme.spacing.smd }]}>
        {onBack && (
          <TouchableOpacity
            style={[
              styles.backButton,
              {
                width: backButtonSize,
                height: backButtonSize,
                borderRadius: theme.borderRadius.md,
                backgroundColor: theme.colors.surfaceOverlay,
              },
            ]}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            testID={testID ? `${testID}-back-button` : 'header-back-button'}
          >
            <Icon name="back" size="md" color="textInverse" />
          </TouchableOpacity>
        )}
        <Text
          variant="h2"
          color="inverse"
          style={[
            styles.title,
            { marginLeft: onBack ? theme.spacing.smd : 0 },
          ]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {rightAction && <View style={styles.rightAction}>{rightAction}</View>}
      </View>

      {/* Search Bar */}
      {showSearch && (
        <View
          style={[
            styles.searchContainer,
            {
              backgroundColor: theme.colors.surfaceOverlay,
              borderWidth: 1,
              borderColor: isDarkMode
                ? 'rgba(255,255,255,0.1)'
                : 'rgba(255,255,255,0.3)',
              paddingHorizontal: theme.spacing.md,
              paddingVertical: theme.spacing.smd,
              borderRadius: theme.borderRadius.md,
            },
          ]}
        >
          <Icon name="search" size="sm" color="textInverse" />
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.colors.headerText,
                fontSize: theme.typography.fontSize.md,
                marginLeft: theme.spacing.sm,
              },
            ]}
            placeholder={searchPlaceholder}
            placeholderTextColor={theme.colors.headerTextMuted}
            value={searchQuery}
            onChangeText={onSearchChange}
            testID={testID ? `${testID}-search-input` : 'header-search-input'}
          />
          {searchQuery && searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => onSearchChange?.('')}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              testID={
                testID ? `${testID}-search-clear` : 'header-search-clear'
              }
            >
              <Icon name="close" size="sm" color="textInverse" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
  },
  rightAction: {
    marginLeft: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    padding: 0,
    fontWeight: '500',
  },
});

export default HeaderBar;

/**
 * PickingHeader Component
 * Header section with greeting, store info, search bar and scan button
 */

import React from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { useResponsiveStyles, useDeviceType } from '../../../hooks';

interface PickingHeaderProps {
  storeName: string;
  currentDate: string;
  searchQuery: string;
  onSearchChange: (text: string) => void;
  onScanPress: () => void;
  testID?: string;
}

export const PickingHeader: React.FC<PickingHeaderProps> = ({
  storeName,
  currentDate,
  searchQuery,
  onSearchChange,
  onScanPress,
  testID,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');
  const responsiveStyles = useResponsiveStyles();
  const { isTablet } = useDeviceType();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.headerBackground,
          paddingBottom: theme.spacing.md,
        },
      ]}
      testID={testID}
    >
      <SafeAreaView edges={['top']}>
        <View
          style={[
            styles.content,
            {
              paddingHorizontal: responsiveStyles.contentPadding,
            },
          ]}
        >
          {/* Greeting and Store Info */}
          <View
            style={[
              styles.greetingSection,
              {
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            <Text
              style={[
                styles.greetingText,
                {
                  color: theme.colors.headerText,
                  fontSize: isTablet
                    ? theme.typography.fontSize['2xl']
                    : theme.typography.fontSize.xl,
                  fontWeight: theme.typography.fontWeight.bold,
                },
              ]}
            >
              {t('picking.greeting')}
            </Text>
            <Text
              style={[
                styles.storeInfo,
                {
                  color: theme.colors.headerTextMuted,
                  fontSize: isTablet
                    ? theme.typography.fontSize.lg
                    : theme.typography.fontSize.md,
                  fontWeight: theme.typography.fontWeight.regular,
                  marginTop: theme.spacing.xs,
                },
              ]}
              numberOfLines={1}
            >
              {storeName} {'\u2022'} {currentDate}
            </Text>
          </View>

          {/* Search Bar with Scan Button */}
          <View style={styles.searchRow}>
            <View
              style={[
                styles.searchContainer,
                {
                  backgroundColor: theme.colors.inputBackground,
                  borderRadius: theme.borderRadius.lg,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.smd,
                  flex: 1,
                  marginRight: theme.spacing.sm,
                },
              ]}
            >
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[
                  styles.searchInput,
                  {
                    color: theme.colors.headerText,
                    fontSize: isTablet
                      ? theme.typography.fontSize.lg
                      : theme.typography.fontSize.md,
                    marginLeft: theme.spacing.sm,
                  },
                ]}
                placeholder={t('picking.searchItems')}
                placeholderTextColor={theme.colors.headerTextMuted}
                value={searchQuery}
                onChangeText={onSearchChange}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
            </View>

            <TouchableOpacity
              style={[
                styles.scanButton,
                {
                  backgroundColor: theme.colors.buttonPrimary,
                  borderRadius: theme.borderRadius.lg,
                  paddingHorizontal: theme.spacing.md,
                  paddingVertical: theme.spacing.smd,
                },
              ]}
              onPress={onScanPress}
              activeOpacity={0.8}
              testID={testID ? `${testID}-scan-button` : undefined}
            >
              <Text style={styles.scanIcon}>📷</Text>
              <Text
                style={[
                  styles.scanText,
                  {
                    color: theme.colors.buttonPrimaryText,
                    fontSize: isTablet
                      ? theme.typography.fontSize.lg
                      : theme.typography.fontSize.md,
                    fontWeight: theme.typography.fontWeight.semibold,
                    marginLeft: theme.spacing.xs,
                  },
                ]}
              >
                {t('picking.scan')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {},
  content: {},
  greetingSection: {},
  greetingText: {},
  storeInfo: {},
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchIcon: {
    fontSize: 16,
  },
  searchInput: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanIcon: {
    fontSize: 16,
  },
  scanText: {},
});

export default PickingHeader;

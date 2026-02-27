/**
 * About Screen
 * App information and legal links
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme';
import { SettingsSection, SettingsRow } from '../../components/settings';

// App information
const APP_NAME = 'GroOne';
const APP_VERSION = '1.0.0';
const APP_DESCRIPTION = 'Your grocery management solution for efficient picking lists and inventory tracking.';

const AboutScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation('profile');

  const handleTermsPress = useCallback(() => {
    // Placeholder - would open terms URL
    Alert.alert(
      t('about.termsOfService', 'Terms of Service'),
      t('about.termsMessage', 'Terms of Service will be available soon.'),
      [{ text: t('common:ok', 'OK') }]
    );
  }, [t]);

  const handlePrivacyPress = useCallback(() => {
    // Placeholder - would open privacy URL
    Alert.alert(
      t('about.privacyPolicy', 'Privacy Policy'),
      t('about.privacyMessage', 'Privacy Policy will be available soon.'),
      [{ text: t('common:ok', 'OK') }]
    );
  }, [t]);

  const handleLicensesPress = useCallback(() => {
    // Placeholder - would open licenses screen
    Alert.alert(
      t('about.licenses', 'Open Source Licenses'),
      t('about.licensesMessage', 'License information will be available soon.'),
      [{ text: t('common:ok', 'OK') }]
    );
  }, [t]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      edges={['bottom']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: theme.spacing.md }]}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info Header */}
        <View style={[styles.header, { paddingVertical: theme.spacing.xl, marginBottom: theme.spacing.md }]}>
          <View
            style={[
              styles.iconContainer,
              {
                backgroundColor: theme.colors.primary,
                borderRadius: theme.borderRadius.xl,
                marginBottom: theme.spacing.md,
              },
            ]}
            testID="app-icon"
          >
            <Text style={[styles.iconText, {
              fontSize: theme.typography.fontSize.xxxl + 8,
              fontWeight: theme.typography.fontWeight.bold,
              color: theme.colors.textInverse,
            }]}>G</Text>
          </View>
          <Text
            style={[
              styles.appName,
              {
                color: theme.colors.text,
                fontSize: theme.typography.fontSize.xxl,
                fontWeight: theme.typography.fontWeight.bold,
              },
            ]}
          >
            {APP_NAME}
          </Text>
          <Text
            style={[
              styles.version,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.md,
                marginBottom: theme.spacing.md,
              },
            ]}
          >
            {t('about.version', 'Version')} {APP_VERSION}
          </Text>
          <Text
            style={[
              styles.description,
              {
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.md,
                paddingHorizontal: theme.spacing.lg,
              },
            ]}
          >
            {t('about.description', APP_DESCRIPTION)}
          </Text>
        </View>

        {/* Legal Section */}
        <SettingsSection title={t('about.legal', 'Legal')}>
          <SettingsRow
            label={t('about.termsOfService', 'Terms of Service')}
            onPress={handleTermsPress}
            hasChevron
            testID="about-terms-row"
          />
          <SettingsRow
            label={t('about.privacyPolicy', 'Privacy Policy')}
            onPress={handlePrivacyPress}
            hasChevron
            testID="about-privacy-row"
          />
          <SettingsRow
            label={t('about.licenses', 'Open Source Licenses')}
            onPress={handleLicensesPress}
            hasChevron
            testID="about-licenses-row"
          />
        </SettingsSection>

        {/* Footer */}
        <View style={[styles.footer, { paddingVertical: theme.spacing.lg, marginTop: theme.spacing.md }]}>
          <Text
            style={[
              styles.footerText,
              {
                color: theme.colors.textLight,
                fontSize: theme.typography.fontSize.sm,
              },
            ]}
          >
            Made with {'❤️'} in India
          </Text>
          <Text
            style={[
              styles.copyright,
              {
                color: theme.colors.textLight,
                fontSize: theme.typography.fontSize.xs,
              },
            ]}
          >
            {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    // padding applied via theme.spacing.md inline
  },
  header: {
    alignItems: 'center',
    // paddingVertical and marginBottom applied via theme tokens inline
  },
  iconContainer: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    // marginBottom applied via theme.spacing.md inline
  },
  iconText: {
    // fontSize, fontWeight, color applied via theme tokens inline
  },
  appName: {
    // fontWeight applied via theme.typography.fontWeight.bold inline
    marginBottom: 4,
  },
  version: {
    // marginBottom applied via theme.spacing.md inline
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    // paddingHorizontal applied via theme.spacing.lg inline
  },
  footer: {
    alignItems: 'center',
    // paddingVertical and marginTop applied via theme tokens inline
  },
  footerText: {
    marginBottom: 4,
  },
  copyright: {
    textAlign: 'center',
  },
});

export default AboutScreen;

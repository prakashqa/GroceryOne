/**
 * Language Settings Screen
 * Language selection screen
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../theme';
import { SettingsSection, SettingsRadioGroup } from '../../components/settings';
import { selectLanguage, setLanguage } from '../../../store/slices/settingsSlice';
import {
  changeLanguage,
  AVAILABLE_LANGUAGES,
} from '../../../i18n/i18n.config';
import { saveLanguage } from '../../../utils/storage/settingsStorage';
import { selectTenant } from '../../../store/slices/tenantSlice';

const LanguageSettingsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation('profile');
  const currentLanguage = useSelector(selectLanguage);
  const tenant = useSelector(selectTenant);

  // Convert available languages to radio options
  const languageOptions = AVAILABLE_LANGUAGES.map((lang) => ({
    value: lang.code,
    label: lang.nativeName,
    description: lang.name !== lang.nativeName ? lang.name : undefined,
  }));

  const handleLanguageSelect = useCallback(
    async (value: string) => {
      // Update Redux state
      dispatch(setLanguage(value));

      // Change i18n language
      await changeLanguage(value as 'en' | 'te');

      // Persist to storage
      try {
        if (tenant?.slug) {
          await saveLanguage(value, tenant.slug);
        }
      } catch (error) {
        console.error('Failed to save language:', error);
      }
    },
    [dispatch, tenant]
  );

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
        <SettingsSection title={t('settings.language.title', 'Language')}>
          <SettingsRadioGroup<string>
            options={languageOptions}
            selectedValue={currentLanguage}
            onSelect={handleLanguageSelect}
            testID="language"
          />
        </SettingsSection>
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
});

export default LanguageSettingsScreen;

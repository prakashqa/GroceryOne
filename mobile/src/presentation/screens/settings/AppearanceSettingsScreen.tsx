/**
 * Appearance Settings Screen
 * Theme selection screen
 */

import React, { useCallback } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { useTheme, ThemeMode } from '../../theme';
import { SettingsSection, SettingsRadioGroup } from '../../components/settings';
import {
  selectThemeMode,
  setThemeMode,
} from '../../../store/slices/settingsSlice';
import { saveThemeMode } from '../../../utils/storage/settingsStorage';
import { selectTenant } from '../../../store/slices/tenantSlice';

const themeOptions: Array<{
  value: ThemeMode;
  label: string;
  icon: string;
  description: string;
}> = [
  {
    value: 'light',
    label: 'Light',
    icon: '☀️',
    description: 'Always use light theme',
  },
  {
    value: 'dark',
    label: 'Dark',
    icon: '🌙',
    description: 'Always use dark theme',
  },
  {
    value: 'system',
    label: 'System Default',
    icon: '📱',
    description: 'Follow system settings',
  },
];

const AppearanceSettingsScreen: React.FC = () => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { t } = useTranslation('profile');
  const currentThemeMode = useSelector(selectThemeMode);
  const tenant = useSelector(selectTenant);

  const handleThemeSelect = useCallback(
    async (value: ThemeMode) => {
      dispatch(setThemeMode(value));
      // Persist to storage
      try {
        if (tenant?.slug) {
          await saveThemeMode(value, tenant.slug);
        }
      } catch (error) {
        console.error('Failed to save theme mode:', error);
      }
    },
    [dispatch, tenant]
  );

  // Translate theme options
  const translatedOptions = themeOptions.map((option) => ({
    ...option,
    label: t(`settings.appearance.${option.value}`, option.label),
  }));

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
        <SettingsSection title={t('settings.appearance.theme', 'Theme')}>
          <SettingsRadioGroup<ThemeMode>
            options={translatedOptions}
            selectedValue={currentThemeMode}
            onSelect={handleThemeSelect}
            testID="theme"
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

export default AppearanceSettingsScreen;

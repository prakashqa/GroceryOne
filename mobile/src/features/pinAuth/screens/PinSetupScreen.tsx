/**
 * PinSetupScreen
 * First step of PIN setup - enter new PIN
 */

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, SafeAreaView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import { PinInput } from '../components';

export const PinSetupScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation('auth');
  const [pin, setPin] = useState('');

  const handlePinChange = useCallback((value: string) => {
    setPin(value);
  }, []);

  const handlePinComplete = useCallback(
    (completedPin: string) => {
      // Navigate to confirm screen with the PIN
      navigation.navigate('PinConfirm', { pin: completedPin });
      // Clear local state for when user comes back
      setPin('');
    },
    [navigation]
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.content, { paddingHorizontal: theme.spacing.lg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.stepIndicator, { color: theme.colors.textLight, fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.medium, marginBottom: theme.spacing.md }]}>
            {t('pin.step', 'Step')} 1 / 2
          </Text>
          <Text style={[styles.title, { color: theme.colors.text, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.sm }]}>
            {t('pin.setupTitle', 'Create Your PIN')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textLight, fontSize: theme.typography.fontSize.lg }]}>
            {t('pin.setupSubtitle', 'Create a 4-digit PIN for quick access')}
          </Text>
        </View>

        {/* PIN Input */}
        <View style={styles.pinContainer}>
          <PinInput
            value={pin}
            onChange={handlePinChange}
            onComplete={handlePinComplete}
            secure={true}
            testID="pin-setup-input"
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingTop: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 48,
  },
  stepIndicator: {},
  title: {
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 24,
  },
  pinContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
});

export default PinSetupScreen;

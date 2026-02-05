/**
 * PinConfirmScreen
 * Second step of PIN setup - confirm the PIN matches
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import { useAppSelector } from '../../../core/hooks/useAppDispatch';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { PinInput } from '../components';
import { usePinAuth } from '../hooks';
import { PinSecureStorage } from '../services/PinSecureStorage';

type RouteParams = {
  pin: string;
};

export const PinConfirmScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute();
  const { t } = useTranslation('auth');
  const { pin: originalPin } = route.params as RouteParams;
  const user = useAppSelector(selectCurrentUser);
  const { setupPin, pinState } = usePinAuth();

  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePinChange = useCallback((value: string) => {
    setConfirmPin(value);
    // Clear error when user starts typing again
    if (error) {
      setError(null);
    }
  }, [error]);

  /**
   * Resolve user ID for PIN storage association.
   * In a PIN-first auth flow, the Redux user may not exist yet (no backend login).
   * Falls back to: Redux user → previously stored SecureStore user → new device-local ID.
   */
  const resolveUserId = useCallback(async (): Promise<string> => {
    // 1. Try Redux auth state (available after backend login)
    if (user?.id) return user.id;

    // 2. Try previously stored user ID from SecureStore (returning user after PIN reset)
    const storedUserId = await PinSecureStorage.getUserId();
    if (storedUserId) return storedUserId;

    // 3. Generate a device-local ID for first-time setup (before any backend login)
    return `device-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
  }, [user]);

  const handlePinComplete = useCallback(
    async (enteredPin: string) => {
      // Check if PINs match
      if (enteredPin !== originalPin) {
        setError(t('pin.mismatchError', 'PINs do not match. Please try again.'));
        setConfirmPin('');
        return;
      }

      // PINs match - save the PIN
      setIsSubmitting(true);
      try {
        const userId = await resolveUserId();
        const success = await setupPin(enteredPin, userId);
        setIsSubmitting(false);

        if (success) {
          // PIN setup successful - RootNavigator will automatically navigate to Main
          // based on the updated Redux state (isPinVerified = true)
        } else {
          setError(pinState.error || 'Failed to save PIN');
          setConfirmPin('');
        }
      } catch (err) {
        setIsSubmitting(false);
        setError('Failed to save PIN');
        setConfirmPin('');
      }
    },
    [originalPin, resolveUserId, setupPin, pinState.error, t]
  );

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.content, { paddingHorizontal: theme.spacing.lg, paddingTop: theme.spacing.md }]}>
        {/* Back button */}
        <TouchableOpacity
          style={[styles.backButton, { paddingVertical: theme.spacing.sm, marginBottom: theme.spacing.md }]}
          onPress={handleGoBack}
          accessibilityLabel="Go back"
          accessibilityRole="button"
        >
          <Text style={[styles.backButtonText, { color: theme.colors.primary, fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.medium }]}>
            ← {t('common.back', 'Back')}
          </Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.stepIndicator, { color: theme.colors.textLight, fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.medium, marginBottom: theme.spacing.md }]}>
            {t('pin.step', 'Step')} 2 / 2
          </Text>
          <Text style={[styles.title, { color: theme.colors.text, fontWeight: theme.typography.fontWeight.bold, marginBottom: theme.spacing.sm }]}>
            {t('pin.confirmTitle', 'Confirm Your PIN')}
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.textLight, fontSize: theme.typography.fontSize.lg }]}>
            {t('pin.confirmSubtitle', 'Enter the same PIN again to confirm')}
          </Text>
        </View>

        {/* PIN Input */}
        <View style={styles.pinContainer}>
          <PinInput
            value={confirmPin}
            onChange={handlePinChange}
            onComplete={handlePinComplete}
            error={error || undefined}
            disabled={isSubmitting}
            secure={true}
            testID="pin-confirm-input"
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
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  backButtonText: {},
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

export default PinConfirmScreen;

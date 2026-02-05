/**
 * PinLoginScreen
 * PIN entry for returning users
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  useWindowDimensions,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import { useAppSelector } from '../../../core/hooks/useAppDispatch';
import { selectCurrentUser } from '../../../store/slices/authSlice';
import { PinInput } from '../components';
import { usePinAuth } from '../hooks';
import { PIN_CONFIG } from '../constants';
import { Alert } from 'react-native';

export const PinLoginScreen: React.FC = () => {
  const theme = useTheme();
  const { t } = useTranslation('auth');
  const user = useAppSelector(selectCurrentUser);
  const { verifyPin, resetPin, pinState, checkLockoutStatus } = usePinAuth();

  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;

  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null);
  const [lockoutRemaining, setLockoutRemaining] = useState<string | null>(null);

  // Check lockout status on mount and periodically
  useEffect(() => {
    checkLockoutStatus();

    if (pinState.isLocked && pinState.lockoutUntil) {
      const interval = setInterval(() => {
        checkLockoutStatus();
        updateLockoutTimer();
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [pinState.isLocked, pinState.lockoutUntil, checkLockoutStatus]);

  const updateLockoutTimer = useCallback(() => {
    if (!pinState.lockoutUntil) {
      setLockoutRemaining(null);
      return;
    }

    const lockoutTime = new Date(pinState.lockoutUntil).getTime();
    const now = Date.now();
    const remaining = lockoutTime - now;

    if (remaining <= 0) {
      setLockoutRemaining(null);
      return;
    }

    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    setLockoutRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
  }, [pinState.lockoutUntil]);

  useEffect(() => {
    updateLockoutTimer();
  }, [updateLockoutTimer]);

  const handlePinChange = useCallback((value: string) => {
    setPin(value);
    if (error) {
      setError(null);
      setRemainingAttempts(null);
    }
  }, [error]);

  const handlePinComplete = useCallback(
    async (enteredPin: string) => {
      const result = await verifyPin(enteredPin);

      if (result.success) {
        // PIN verified - RootNavigator will automatically navigate to Main
        // based on the updated Redux state (isPinVerified = true)
      } else {
        setError(result.error || t('pin.wrongPin', 'Incorrect PIN'));
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
        setPin('');
      }
    },
    [verifyPin, t]
  );

  const handleForgotPin = useCallback(() => {
    // Show confirmation dialog before resetting PIN
    Alert.alert(
      t('pin.resetPinTitle', 'Reset PIN'),
      t('pin.resetPinMessage', 'This will clear your current PIN and allow you to set up a new one. Continue?'),
      [
        {
          text: t('common.cancel', 'Cancel'),
          style: 'cancel',
        },
        {
          text: t('common.reset', 'Reset'),
          style: 'destructive',
          onPress: async () => {
            if (__DEV__) {
              console.log('[PinLoginScreen] Resetting PIN...');
            }
            await resetPin();
            // RootNavigator will automatically show PinSetup since isPinSet becomes false
          },
        },
      ]
    );
  }, [resetPin, t]);

  const userName = user?.firstName || user?.email?.split('@')[0] || '';
  const isDisabled = pinState.isLocked || pinState.isLoading;

  const headerContent = (
    <>
      {/* Header */}
      <View style={[styles.header, { marginBottom: isLandscape ? theme.spacing.md : theme.spacing.xl }]}>
        <Text style={[styles.greeting, { color: theme.colors.textLight, fontSize: theme.typography.fontSize.lg, marginBottom: theme.spacing.xs }]}>
          {t('pin.welcomeBack', 'Welcome back')}
        </Text>
        {userName && (
          <Text style={[styles.userName, { color: theme.colors.text, fontSize: isLandscape ? theme.typography.fontSize.xl : theme.typography.fontSize.xxl, fontWeight: theme.typography.fontWeight.semibold, marginBottom: theme.spacing.md }]}>
            {userName}
          </Text>
        )}
        <Text style={[styles.title, { color: theme.colors.text, fontSize: isLandscape ? theme.typography.fontSize.lg : theme.typography.fontSize['2xl'], fontWeight: theme.typography.fontWeight.medium }]}>
          {t('pin.loginTitle', 'Enter Your PIN')}
        </Text>
      </View>

      {/* Lockout warning */}
      {pinState.isLocked && (
        <View style={[styles.lockoutContainer, { backgroundColor: theme.colors.error + '15', padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.lg }]}>
          <Text style={[styles.lockoutText, { color: theme.colors.error, fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.semibold }]}>
            {t('pin.accountLocked', 'Account locked')}
          </Text>
          {lockoutRemaining && (
            <Text style={[styles.lockoutTimer, { color: theme.colors.error, fontSize: theme.typography.fontSize.xxxl, fontWeight: theme.typography.fontWeight.bold, marginTop: theme.spacing.sm }]}>
              {lockoutRemaining}
            </Text>
          )}
        </View>
      )}

      {/* Remaining attempts warning */}
      {remainingAttempts !== null && remainingAttempts < PIN_CONFIG.MAX_ATTEMPTS && !pinState.isLocked && (
        <View style={[styles.warningContainer, { marginBottom: theme.spacing.md }]}>
          <Text style={[styles.warningText, { color: theme.colors.error, fontSize: theme.typography.fontSize.md, fontWeight: theme.typography.fontWeight.medium }]}>
            {remainingAttempts} {t('pin.attemptsRemaining', 'attempts remaining')}
          </Text>
        </View>
      )}
    </>
  );

  const pinContent = (
    <>
      {/* PIN Input */}
      <View style={isLandscape ? styles.pinContainerLandscape : styles.pinContainer}>
        <PinInput
          value={pin}
          onChange={handlePinChange}
          onComplete={handlePinComplete}
          error={error || undefined}
          disabled={isDisabled}
          secure={true}
          testID="pin-login-input"
        />
      </View>

      {/* Forgot PIN link */}
      <TouchableOpacity
        style={[styles.forgotPinButton, { paddingVertical: isLandscape ? theme.spacing.sm : theme.spacing.md, marginBottom: isLandscape ? theme.spacing.sm : theme.spacing.xl }]}
        onPress={handleForgotPin}
        accessibilityRole="button"
      >
        <Text style={[styles.forgotPinText, { color: theme.colors.primary, fontSize: theme.typography.fontSize.lg, fontWeight: theme.typography.fontWeight.medium }]}>
          {t('pin.forgotPin', 'Forgot PIN?')}
        </Text>
      </TouchableOpacity>
    </>
  );

  if (isLandscape) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
      >
        <View style={[styles.landscapeContent, { paddingHorizontal: theme.spacing.lg }]}>
          <View style={styles.landscapeLeft}>
            {headerContent}
          </View>
          <ScrollView
            style={styles.landscapeRight}
            contentContainerStyle={styles.landscapeRightContent}
            showsVerticalScrollIndicator={false}
          >
            {pinContent}
          </ScrollView>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <View style={[styles.content, { paddingHorizontal: theme.spacing.lg }]}>
        {headerContent}
        {pinContent}
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
  landscapeContent: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 8,
  },
  landscapeLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  landscapeRight: {
    flex: 1,
  },
  landscapeRightContent: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
  },
  greeting: {},
  userName: {},
  title: {},
  lockoutContainer: {
    alignItems: 'center',
  },
  lockoutText: {},
  lockoutTimer: {},
  warningContainer: {
    alignItems: 'center',
  },
  warningText: {},
  pinContainer: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  pinContainerLandscape: {
    justifyContent: 'center',
  },
  forgotPinButton: {
    alignItems: 'center',
  },
  forgotPinText: {},
});

export default PinLoginScreen;

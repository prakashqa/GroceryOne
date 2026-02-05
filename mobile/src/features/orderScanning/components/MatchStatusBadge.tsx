/**
 * MatchStatusBadge Component
 * Displays a color-coded confidence indicator for item matches
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../presentation/theme';
import { MatchConfidence } from '../types/scanning.types';

interface MatchStatusBadgeProps {
  confidence: MatchConfidence;
  score?: number;
  showScore?: boolean;
}

const BADGE_CONFIG: Record<
  MatchConfidence,
  { labelKey: string; emoji: string }
> = {
  exact: { labelKey: 'scan.exact', emoji: '✓' },
  high: { labelKey: 'scan.likely', emoji: '≈' },
  medium: { labelKey: 'scan.uncertain', emoji: '?' },
  low: { labelKey: 'scan.uncertain', emoji: '?' },
  none: { labelKey: 'scan.notFound', emoji: '✕' },
};

export const MatchStatusBadge: React.FC<MatchStatusBadgeProps> = ({
  confidence,
  score,
  showScore = false,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');

  const config = BADGE_CONFIG[confidence];

  const getBadgeColors = () => {
    switch (confidence) {
      case 'exact':
        return {
          backgroundColor: '#E8F5E9',
          borderColor: '#4CAF50',
          textColor: '#2E7D32',
        };
      case 'high':
        return {
          backgroundColor: '#E3F2FD',
          borderColor: '#2196F3',
          textColor: '#1565C0',
        };
      case 'medium':
        return {
          backgroundColor: '#FFF8E1',
          borderColor: '#FFC107',
          textColor: '#F57F17',
        };
      case 'low':
        return {
          backgroundColor: '#FFF3E0',
          borderColor: '#FF9800',
          textColor: '#E65100',
        };
      case 'none':
        return {
          backgroundColor: '#FFEBEE',
          borderColor: '#F44336',
          textColor: '#C62828',
        };
    }
  };

  const colors = getBadgeColors();

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: colors.backgroundColor,
          borderColor: colors.borderColor,
          paddingHorizontal: theme.spacing.sm,
          paddingVertical: theme.spacing.xs,
          borderRadius: theme.borderRadius.md,
        },
      ]}
    >
      <Text style={[styles.emoji, {
        color: colors.textColor,
        fontSize: theme.typography.fontSize.sm,
        marginRight: theme.spacing.xs,
      }]}>
        {config.emoji}
      </Text>
      <Text style={[styles.label, {
        color: colors.textColor,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
      }]}>
        {t(config.labelKey)}
      </Text>
      {showScore && score !== undefined && (
        <Text style={[styles.score, {
          color: colors.textColor,
          fontSize: theme.typography.fontSize.xs,
          marginLeft: theme.spacing.xs,
        }]}>
          {score}%
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal, paddingVertical, borderRadius applied inline via theme tokens
    borderWidth: 1,
  },
  emoji: {
    // fontSize, marginRight applied inline via theme tokens
  },
  label: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  score: {
    // fontSize, marginLeft applied inline via theme tokens
    opacity: 0.8,
  },
});

export default MatchStatusBadge;

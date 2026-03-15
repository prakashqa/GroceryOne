/**
 * ScannedItemRow Component
 * Displays a single scanned item with match status and controls
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../../../presentation/theme';
import { useTranslation } from 'react-i18next';
import { MatchResult } from '../types/scanning.types';
import { MatchStatusBadge } from './MatchStatusBadge';
import { getTranslatedItemName } from '../../../domain/utils/itemTranslations';

interface ScannedItemRowProps {
  matchResult: MatchResult;
  index: number;
  onSelectItem: (index: number) => void;
  onEditQuantity: (index: number) => void;
  onSkip: (index: number) => void;
}

export const ScannedItemRow: React.FC<ScannedItemRowProps> = ({
  matchResult,
  index,
  onSelectItem,
  onEditQuantity,
  onSkip,
}) => {
  const theme = useTheme();
  const { t } = useTranslation('common');

  const {
    parsedItem,
    matchedItem,
    confidence,
    confidenceScore,
    userOverride,
    isSkipped,
  } = matchResult;

  // Get display values
  const displayQuantity =
    userOverride?.selectedQuantity ?? parsedItem.quantity ?? matchedItem?.defaultQuantity ?? 1;
  const displayUnit = parsedItem.unit ?? matchedItem?.unit ?? 'pcs';
  const displayItemName = matchedItem
    ? getTranslatedItemName(matchedItem.id)
    : parsedItem.itemName;

  if (isSkipped) {
    return (
      <View style={[styles.container, styles.skippedContainer, {
        backgroundColor: theme.colors.surface,
        borderRadius: theme.borderRadius.md,
        padding: theme.spacing.md,
        marginBottom: theme.spacing.smd,
      }]}>
        <View style={styles.skippedContent}>
          <Text style={[styles.skippedText, {
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.md,
          }]}>
            {parsedItem.rawText}
          </Text>
          <Text style={[styles.skippedLabel, {
            color: theme.colors.textLight,
            fontSize: theme.typography.fontSize.sm,
            marginLeft: theme.spacing.sm,
          }]}>
            ({t('scan.skip')})
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
          padding: theme.spacing.md,
          marginBottom: theme.spacing.smd,
        },
        confidence === 'none' && styles.notFoundContainer,
      ]}
    >
      {/* Status Badge */}
      <View style={[styles.statusRow, { marginBottom: theme.spacing.sm }]}>
        <MatchStatusBadge
          confidence={confidence}
          score={confidenceScore}
          showScore={confidence !== 'exact' && confidence !== 'none'}
        />
        {confidence !== 'exact' && confidence !== 'none' && (
          <TouchableOpacity
            style={[styles.changeButton, { padding: theme.spacing.xs }]}
            onPress={() => onSelectItem(index)}
          >
            <Text style={[styles.changeButtonText, {
              color: theme.colors.primary,
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.semibold,
            }]}>
              {t('scan.change')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Original Text */}
      <Text style={[styles.originalText, {
        color: theme.colors.textLight,
        fontSize: theme.typography.fontSize.sm,
        marginBottom: theme.spacing.sm,
      }]}>
        &quot;{parsedItem.rawText}&quot;
      </Text>

      {/* Main Content */}
      <View style={[styles.mainContent, { marginBottom: theme.spacing.sm }]}>
        {matchedItem ? (
          <>
            <Text style={[styles.itemName, {
              color: theme.colors.text,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.sm,
            }]}>
              {displayItemName}
            </Text>
            <View style={styles.quantityRow}>
              <TouchableOpacity
                style={[styles.quantityButton, {
                  backgroundColor: theme.colors.background,
                  paddingHorizontal: theme.spacing.smd,
                  paddingVertical: theme.spacing.sm,
                  borderRadius: theme.borderRadius.sm,
                }]}
                onPress={() => onEditQuantity(index)}
              >
                <Text style={[styles.quantityText, {
                  color: theme.colors.text,
                  fontSize: theme.typography.fontSize.md,
                  fontWeight: theme.typography.fontWeight.medium,
                  marginRight: theme.spacing.sm,
                }]}>
                  {displayQuantity} {displayUnit}
                </Text>
                <Text style={[styles.editIcon, {
                  color: theme.colors.primary,
                  fontSize: theme.typography.fontSize.md,
                }]}>
                  ✎
                </Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.notFoundContent}>
            <Text style={[styles.notFoundText, {
              color: theme.colors.textSecondary,
              fontSize: theme.typography.fontSize.md,
              marginBottom: theme.spacing.smd,
            }]}>
              {parsedItem.itemName || parsedItem.rawText}
            </Text>
            <TouchableOpacity
              style={[styles.selectButton, {
                backgroundColor: theme.colors.primary,
                paddingHorizontal: theme.spacing.lg,
                paddingVertical: theme.spacing.smd,
                borderRadius: theme.borderRadius.sm,
              }]}
              onPress={() => onSelectItem(index)}
            >
              <Text style={[styles.selectButtonText, {
                color: theme.colors.buttonPrimaryText,
                fontSize: theme.typography.fontSize.md,
                fontWeight: theme.typography.fontWeight.semibold,
              }]}>
                {t('scan.selectItem')}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Skip Button */}
      <TouchableOpacity
        style={[styles.skipButton, { padding: theme.spacing.xs }]}
        onPress={() => onSkip(index)}
      >
        <Text style={[styles.skipButtonText, {
          color: theme.colors.textLight,
          fontSize: theme.typography.fontSize.sm,
        }]}>
          {t('scan.skip')}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // borderRadius, padding, marginBottom applied inline via theme tokens
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  skippedContainer: {
    opacity: 0.5,
  },
  notFoundContainer: {
    borderWidth: 1,
    borderColor: '#FFCDD2',
    borderStyle: 'dashed',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    // marginBottom applied inline via theme tokens
  },
  changeButton: {
    // padding applied inline via theme tokens
  },
  changeButtonText: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  originalText: {
    // fontSize, marginBottom applied inline via theme tokens
    fontStyle: 'italic',
  },
  mainContent: {
    // marginBottom applied inline via theme tokens
  },
  itemName: {
    // fontSize, fontWeight, marginBottom applied inline via theme tokens
  },
  quantityRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    // paddingHorizontal, paddingVertical, borderRadius applied inline via theme tokens
  },
  quantityText: {
    // fontSize, fontWeight, marginRight applied inline via theme tokens
  },
  editIcon: {
    // fontSize applied inline via theme tokens
  },
  notFoundContent: {
    alignItems: 'center',
  },
  notFoundText: {
    // fontSize, marginBottom applied inline via theme tokens
    textAlign: 'center',
  },
  selectButton: {
    // paddingHorizontal, paddingVertical, borderRadius applied inline via theme tokens
  },
  selectButtonText: {
    // fontSize, fontWeight applied inline via theme tokens
  },
  skipButton: {
    alignSelf: 'flex-end',
    // padding applied inline via theme tokens
  },
  skipButtonText: {
    // fontSize applied inline via theme tokens
  },
  skippedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  skippedText: {
    // fontSize applied inline via theme tokens
    textDecorationLine: 'line-through',
  },
  skippedLabel: {
    // fontSize, marginLeft applied inline via theme tokens
  },
});

export default ScannedItemRow;

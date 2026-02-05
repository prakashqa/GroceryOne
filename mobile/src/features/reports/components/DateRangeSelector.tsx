/**
 * DateRangeSelector Component
 * Horizontal preset selector for date range filtering with custom date picker
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme, useIsDarkMode } from '../../../presentation/theme';
import { DateRangeSelectorProps, DateRangePreset } from '../types/reports.types';
import { getDateRangeForPreset, createCustomDateRange } from '../utils/dateRangeUtils';

interface PresetOption {
  preset: DateRangePreset;
  labelKey: string;
}

const PRESET_OPTIONS: PresetOption[] = [
  { preset: 'today', labelKey: 'reports.today' },
  { preset: 'yesterday', labelKey: 'reports.yesterday' },
  { preset: 'last30days', labelKey: 'reports.last30days' },
];

export const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  selectedRange,
  onRangeChange,
  testID,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');

  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [fromDate, setFromDate] = useState<Date>(new Date());

  const handlePresetPress = (preset: DateRangePreset) => {
    const newRange = getDateRangeForPreset(preset);
    onRangeChange(newRange);
  };

  const isSelected = (preset: DateRangePreset): boolean => {
    return selectedRange.preset === preset;
  };

  const handleCustomPress = () => {
    setShowFromPicker(true);
  };

  const handleFromDateChange = (_event: unknown, date?: Date) => {
    setShowFromPicker(Platform.OS === 'ios');
    if (date) {
      setFromDate(date);
      setShowToPicker(true);
    }
  };

  const handleToDateChange = (_event: unknown, date?: Date) => {
    setShowToPicker(Platform.OS === 'ios');
    if (date) {
      const customRange = createCustomDateRange(fromDate, date);
      onRangeChange(customRange);
    }
  };

  const getCustomLabel = (): string => {
    if (selectedRange.preset === 'custom') {
      const start = new Date(selectedRange.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const end = new Date(selectedRange.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      return `${start} - ${end}`;
    }
    return t('reports.pickDateRange', 'Custom');
  };

  const isCustomSelected = selectedRange.preset === 'custom';

  return (
    <View style={[styles.container, { marginVertical: theme.spacing.sm }]} testID={testID}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, {
          paddingHorizontal: theme.spacing.md,
          gap: theme.spacing.sm,
        }]}
      >
        {PRESET_OPTIONS.map((option) => {
          const selected = isSelected(option.preset);
          return (
            <TouchableOpacity
              key={option.preset}
              testID={`preset-${option.preset}`}
              onPress={() => handlePresetPress(option.preset)}
              style={[
                styles.presetButton,
                {
                  paddingVertical: theme.spacing.sm,
                  paddingHorizontal: theme.spacing.md,
                  borderRadius: theme.borderRadius.xl,
                  backgroundColor: selected
                    ? theme.colors.primary
                    : isDarkMode
                    ? theme.colors.surface
                    : theme.colors.background,
                  borderColor: selected
                    ? theme.colors.primary
                    : theme.colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.presetText,
                  {
                    fontSize: theme.typography.fontSize.sm,
                    color: selected
                      ? theme.colors.textInverse
                      : theme.colors.text,
                    fontWeight: selected
                      ? theme.typography.fontWeight.semibold
                      : theme.typography.fontWeight.medium,
                  },
                ]}
              >
                {t(option.labelKey, option.preset)}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Custom Date Range Button */}
        <TouchableOpacity
          testID="preset-custom"
          onPress={handleCustomPress}
          style={[
            styles.presetButton,
            styles.customButton,
            {
              paddingVertical: theme.spacing.sm,
              paddingHorizontal: theme.spacing.md,
              borderRadius: theme.borderRadius.xl,
              backgroundColor: isCustomSelected
                ? theme.colors.primary
                : isDarkMode
                ? theme.colors.surface
                : theme.colors.background,
              borderColor: isCustomSelected
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.calendarIcon}>📅</Text>
          <Text
            style={[
              styles.presetText,
              {
                fontSize: theme.typography.fontSize.sm,
                color: isCustomSelected
                  ? theme.colors.textInverse
                  : theme.colors.text,
                fontWeight: isCustomSelected
                  ? theme.typography.fontWeight.semibold
                  : theme.typography.fontWeight.medium,
              },
            ]}
          >
            {getCustomLabel()}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {showFromPicker && (
        <DateTimePicker
          value={fromDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleFromDateChange}
          maximumDate={new Date()}
          testID="from-date-picker"
        />
      )}
      {showToPicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleToDateChange}
          minimumDate={fromDate}
          maximumDate={new Date()}
          testID="to-date-picker"
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // marginVertical applied inline via theme tokens
  },
  scrollContent: {
    // paddingHorizontal, gap applied inline via theme tokens
  },
  presetButton: {
    // paddingVertical, paddingHorizontal, borderRadius applied inline via theme tokens
    borderWidth: 1,
  },
  customButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  presetText: {
    // fontSize applied inline via theme tokens
  },
  calendarIcon: {
    fontSize: 14,
  },
});

export default DateRangeSelector;

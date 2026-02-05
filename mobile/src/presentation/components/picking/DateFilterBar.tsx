/**
 * DateFilterBar Component
 * Quick filter bar for filtering carts by date (Today, Yesterday, Pick Date)
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, useIsDarkMode } from '../../theme';

export type DateFilter = 'today' | 'yesterday' | 'custom' | 'all';

interface DateFilterBarProps {
  selectedFilter: DateFilter;
  selectedDate?: Date;
  onFilterChange: (filter: DateFilter) => void;
  onDatePick: () => void;
  showAll?: boolean;
  contentPadding?: number;
  testID?: string;
}

interface FilterOption {
  filter: DateFilter;
  labelKey: string;
  icon?: string;
}

const formatDate = (date: Date): string => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
};

export const DateFilterBar: React.FC<DateFilterBarProps> = ({
  selectedFilter,
  selectedDate,
  onFilterChange,
  onDatePick,
  showAll = false,
  contentPadding,
  testID,
}) => {
  const theme = useTheme();
  const isDarkMode = useIsDarkMode();
  const { t } = useTranslation('common');

  const filterOptions: FilterOption[] = [
    { filter: 'today', labelKey: 'manageCarts.today' },
    { filter: 'yesterday', labelKey: 'manageCarts.yesterday' },
  ];

  if (showAll) {
    filterOptions.push({ filter: 'all', labelKey: 'manageCarts.allCarts' });
  }

  const handleFilterPress = (filter: DateFilter) => {
    onFilterChange(filter);
  };

  const handleDatePickPress = () => {
    onDatePick();
  };

  const isSelected = (filter: DateFilter): boolean => {
    return selectedFilter === filter;
  };

  const getCustomLabel = (): string => {
    if (selectedFilter === 'custom' && selectedDate) {
      return formatDate(selectedDate);
    }
    return t('manageCarts.pickDate');
  };

  return (
    <View style={styles.container} testID={testID}>
      <View
        style={[
          styles.filterRow,
          contentPadding != null && { paddingHorizontal: contentPadding },
        ]}
      >
        {filterOptions.map((option) => {
          const selected = isSelected(option.filter);
          return (
            <TouchableOpacity
              key={option.filter}
              testID={`filter-${option.filter}`}
              onPress={() => handleFilterPress(option.filter)}
              style={[
                styles.filterButton,
                {
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
                  styles.filterText,
                  {
                    color: selected
                      ? '#FFFFFF'
                      : theme.colors.text,
                    fontWeight: selected ? '600' : '500',
                  },
                ]}
              >
                {t(option.labelKey, option.filter)}
              </Text>
            </TouchableOpacity>
          );
        })}

        {/* Date Picker Button */}
        <TouchableOpacity
          testID="filter-custom"
          onPress={handleDatePickPress}
          style={[
            styles.filterButton,
            {
              backgroundColor: selectedFilter === 'custom'
                ? theme.colors.primary
                : isDarkMode
                ? theme.colors.surface
                : theme.colors.background,
              borderColor: selectedFilter === 'custom'
                ? theme.colors.primary
                : theme.colors.border,
            },
          ]}
          activeOpacity={0.7}
        >
          <Text style={styles.calendarIcon}>📅</Text>
          <Text
            style={[
              styles.filterText,
              {
                color: selectedFilter === 'custom'
                  ? '#FFFFFF'
                  : theme.colors.text,
                fontWeight: selectedFilter === 'custom' ? '600' : '500',
              },
            ]}
          >
            {getCustomLabel()}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    rowGap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  filterText: {
    fontSize: 13,
  },
  calendarIcon: {
    fontSize: 14,
  },
});

export default DateFilterBar;

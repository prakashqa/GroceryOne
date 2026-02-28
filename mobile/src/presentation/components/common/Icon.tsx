/**
 * Icon Component
 * Unified icon system using MaterialCommunityIcons from @expo/vector-icons
 */

import React from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../../theme';

// Icon name mapping from semantic names to MaterialCommunityIcons names
const ICON_MAP = {
  // Navigation & Actions
  cart: 'cart-outline',
  'cart-filled': 'cart',
  edit: 'pencil-outline',
  delete: 'delete-outline',
  settings: 'cog-outline',
  search: 'magnify',
  close: 'close',
  back: 'arrow-left',
  forward: 'arrow-right',
  up: 'chevron-up',
  down: 'chevron-down',
  left: 'chevron-left',
  right: 'chevron-right',

  // Actions
  add: 'plus',
  remove: 'minus',
  check: 'check',
  refresh: 'refresh',
  share: 'share-variant',
  copy: 'content-copy',

  // Status
  info: 'information-outline',
  warning: 'alert-outline',
  error: 'alert-circle-outline',
  success: 'check-circle-outline',

  // Objects
  category: 'folder-outline',
  item: 'package-variant',
  receipt: 'receipt',
  printer: 'printer-outline',
  camera: 'camera',
  image: 'image-outline',
  payment: 'credit-card-outline',
  cash: 'cash',
  upi: 'qrcode',
  card: 'credit-card',

  // User & Settings
  user: 'account-outline',
  language: 'translate',
  theme: 'brightness-6',
  notification: 'bell-outline',
  about: 'information-outline',
  logout: 'logout',
  chevron: 'chevron-right',

  // Misc
  empty: 'inbox-outline',
  list: 'format-list-bulleted',
  grid: 'view-grid-outline',
  filter: 'filter-variant',
  sort: 'sort',
  more: 'dots-vertical',
  menu: 'menu',
} as const;

export type IconName = keyof typeof ICON_MAP;
export type IconSize = 'sm' | 'md' | 'lg' | 'xl';
export type IconColor = 'icon' | 'primary' | 'secondary' | 'error' | 'warning' | 'success' | 'text' | 'textInverse' | 'onPrimary';

const SIZE_MAP: Record<IconSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
  xl: 40,
};

export interface IconProps {
  name: IconName;
  size?: IconSize;
  color?: IconColor;
  accessibilityLabel?: string;
  testID?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 'md',
  color = 'icon',
  accessibilityLabel,
  testID,
}) => {
  const theme = useTheme();

  const getColor = (): string => {
    switch (color) {
      case 'primary':
        return theme.colors.primary;
      case 'secondary':
        return theme.colors.iconSecondary;
      case 'error':
        return theme.colors.error;
      case 'warning':
        return theme.colors.warning;
      case 'success':
        return theme.colors.success;
      case 'text':
        return theme.colors.text;
      case 'textInverse':
        return theme.colors.textInverse;
      case 'onPrimary':
        return '#FFFFFF'; // Always white — Material Design FAB standard
      case 'icon':
      default:
        return theme.colors.icon;
    }
  };

  const iconName = ICON_MAP[name];
  const iconSize = SIZE_MAP[size];
  const iconColor = getColor();

  return (
    <MaterialCommunityIcons
      name={iconName}
      size={iconSize}
      color={iconColor}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
    />
  );
};

export default Icon;

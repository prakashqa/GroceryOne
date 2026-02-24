/**
 * Shared responsive styles mock for component tests.
 * Superset of all responsive style properties used across 15+ component test files.
 */

export const mockResponsiveStyles = {
  fontScale: 1,
  touchTargetMinSize: 48,
  componentPadding: 16,
  horizontalPadding: 16,
  iconContainerSize: 44,
  cardBorderRadius: 12,
  buttonBorderRadius: 12,
  modalWidth: 600,
  sectionSpacing: 24,
  isSmallScreen: false,
  isMediumScreen: true,
  isLargeScreen: false,
};

export const mockUseResponsiveStyles = () => mockResponsiveStyles;

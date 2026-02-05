/**
 * User display formatting utilities
 */

/**
 * Format a user role string for display.
 * Converts 'super_admin' to 'Super Admin', 'admin' to 'Admin', etc.
 */
export function formatUserRole(role: string): string {
  if (!role) return '';
  return role
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

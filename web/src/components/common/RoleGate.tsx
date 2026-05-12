'use client';

/**
 * RoleGate (web)
 *
 * Renders children only when the current user's role is in the allowed list.
 * Mirrors the mobile RoleGate. The Sidebar already hides admin-only routes
 * from non-admins, but typing the URL directly (e.g. /reports for a cashier)
 * must show the "Access restricted" panel — not the actual page content.
 * Real security lives on the backend role guards.
 */

import React from 'react';
import { useSelector } from 'react-redux';
import { selectUserRole } from '@groceryone/store';
import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';

interface RoleGateProps {
  roles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ roles, children, fallback }: RoleGateProps) {
  const role = useSelector(selectUserRole);
  const { t } = useTranslation('common');

  if (role && roles.includes(role)) {
    return <>{children}</>;
  }

  if (fallback !== undefined) {
    return <>{fallback}</>;
  }

  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center min-h-[50vh] px-6 text-center"
    >
      <AlertTriangle size={56} className="text-amber-500" />
      <h2 className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
        {t('errors.unauthorized', 'Access restricted')}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-gray-500 dark:text-gray-400">
        {t(
          'errors.unauthorizedDescription',
          'This area is only available to the business owner.',
        )}
      </p>
    </div>
  );
}

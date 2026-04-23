'use client';

import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectTenant, selectCurrentUser } from '@groceryone/store';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Phone, Building2, Calendar, Shield, Globe } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { t } = useTranslation(['profile', 'common']);
  const tenant = useAppSelector(selectTenant);
  const user = useAppSelector(selectCurrentUser);

  const initial = (tenant?.name?.charAt(0) || user?.firstName?.charAt(0) || 'G').toUpperCase();
  const displayName = tenant?.name || t('common:appName');
  const displaySubtitle = tenant?.slug ? `@${tenant.slug}` : '';

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/dashboard" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">{t('profile:title', 'Profile')}</h1>
      </div>

      {/* Profile Card */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-r from-primary/20 via-emerald-400/20 to-teal-400/20" />

        {/* Avatar + basic info */}
        <div className="px-6 pb-6 -mt-12">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-4 ring-white dark:ring-surface-dark flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-primary dark:text-primary-light">
              {initial}
            </span>
          </div>
          <h2 className="text-xl font-bold">{displayName}</h2>
          {displaySubtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{displaySubtitle}</p>
          )}
        </div>
      </div>

      {/* Store Details */}
      <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('profile:settings.title', 'Store Information')}
          </h3>
        </div>
        <div className="divide-y divide-gray-50 dark:divide-gray-800">
          <div className="px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Building2 size={18} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Store Name</p>
              <p className="text-sm font-medium truncate">{tenant?.name || '—'}</p>
            </div>
          </div>

          <div className="px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
              <Shield size={18} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Store Slug</p>
              <p className="text-sm font-medium font-mono truncate">{tenant?.slug || '—'}</p>
            </div>
          </div>

          <div className="px-5 py-3 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
              <Globe size={18} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-500 dark:text-gray-400">Language</p>
              <p className="text-sm font-medium">{tenant?.defaultLanguage === 'te' ? 'తెలుగు (Telugu)' : 'English'}</p>
            </div>
          </div>

          {tenant?.currency && (
            <div className="px-5 py-3 flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center flex-shrink-0">
                <span className="text-base font-bold text-amber-600 dark:text-amber-400">₹</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 dark:text-gray-400">Currency</p>
                <p className="text-sm font-medium">{tenant.currency}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* User Details (if available) */}
      {user && (
        <div className="bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account</h3>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-gray-800">
            {(user.firstName || user.lastName) && (
              <div className="px-5 py-3 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-sm font-semibold text-primary dark:text-primary-light">
                    {(user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '')}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Name</p>
                  <p className="text-sm font-medium truncate">
                    {[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
                  </p>
                </div>
              </div>
            )}

            {user.email && (
              <div className="px-5 py-3 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                  <Mail size={18} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                  <p className="text-sm font-medium truncate">{user.email}</p>
                </div>
              </div>
            )}

            {user.phone && (
              <div className="px-5 py-3 flex items-center gap-4">
                <div className="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center flex-shrink-0">
                  <Phone size={18} className="text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Phone</p>
                  <p className="text-sm font-medium">{user.phone}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          href="/settings"
          className="flex items-center gap-3 p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t('common:more.settings')}</p>
            <p className="text-xs text-gray-500 truncate">Manage preferences</p>
          </div>
        </Link>

        <Link
          href="/settings/language"
          className="flex items-center gap-3 p-4 bg-white dark:bg-surface-dark rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary/50 hover:shadow-md transition-all"
        >
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
            <Globe size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">{t('profile:settings.language.title', 'Language')}</p>
            <p className="text-xs text-gray-500 truncate">Change app language</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

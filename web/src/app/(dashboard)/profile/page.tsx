'use client';

import type { ReactNode } from 'react';
import { useAppSelector } from '@/hooks/useAppDispatch';
import { selectTenant, selectCurrentUser } from '@groceryone/store';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Mail, Phone, Building2, Calendar, Shield, Globe } from 'lucide-react';
import Link from 'next/link';

function InfoRow({ icon, halo, label, value, mono }: { icon: ReactNode; halo: string; label: string; value: ReactNode; mono?: boolean }) {
  return (
    <div className="px-5 py-3.5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${halo}`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
        <p className={`text-sm font-medium text-gray-900 dark:text-gray-100 truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { t } = useTranslation(['profile', 'common']);
  const tenant = useAppSelector(selectTenant);
  const user = useAppSelector(selectCurrentUser);

  const initial = (tenant?.name?.charAt(0) || user?.firstName?.charAt(0) || 'G').toUpperCase();
  const displayName = tenant?.name || t('common:appName');
  const displaySubtitle = tenant?.slug ? `@${tenant.slug}` : '';

  return (
    <div className="page max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard" className="btn-icon" aria-label="Back">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="page-title">{t('profile:title', 'Profile')}</h1>
      </div>

      {/* Profile Card */}
      <div className="card overflow-hidden mb-6">
        {/* Gradient banner */}
        <div className="h-24 bg-gradient-to-r from-primary/20 via-emerald-400/20 to-teal-400/20" />

        {/* Avatar + basic info */}
        <div className="px-6 pb-6 -mt-12">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 dark:bg-primary/20 ring-4 ring-white dark:ring-surface-dark flex items-center justify-center mb-4">
            <span className="text-4xl font-bold text-primary dark:text-primary-light">
              {initial}
            </span>
          </div>
          <h2 className="text-xl font-semibold tracking-tight text-gray-900 dark:text-gray-100">{displayName}</h2>
          {displaySubtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{displaySubtitle}</p>
          )}
        </div>
      </div>

      {/* Store Details */}
      <div className="card overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-line dark:border-line-dark">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {t('profile:settings.title', 'Store Information')}
          </h3>
        </div>
        <div className="row-divider">
          <InfoRow halo="bg-primary/10 dark:bg-primary/15" icon={<Building2 size={18} className="text-primary dark:text-primary-light" />} label="Store Name" value={tenant?.name || '—'} />
          <InfoRow halo="bg-blue-50 dark:bg-blue-900/20" icon={<Shield size={18} className="text-blue-600 dark:text-blue-400" />} label="Store Slug" value={tenant?.slug || '—'} mono />
          <InfoRow halo="bg-purple-50 dark:bg-purple-900/20" icon={<Globe size={18} className="text-purple-600 dark:text-purple-400" />} label="Language" value={tenant?.defaultLanguage === 'te' ? 'తెలుగు (Telugu)' : 'English'} />
          {tenant?.currency && (
            <InfoRow halo="bg-amber-50 dark:bg-amber-900/20" icon={<span className="text-base font-bold text-amber-600 dark:text-amber-400">₹</span>} label="Currency" value={tenant.currency} />
          )}
        </div>
      </div>

      {/* User Details (if available) */}
      {user && (
        <div className="card overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-line dark:border-line-dark">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Account</h3>
          </div>
          <div className="row-divider">
            {(user.firstName || user.lastName) && (
              <InfoRow
                halo="bg-primary/10 dark:bg-primary/15"
                icon={<span className="text-sm font-semibold text-primary dark:text-primary-light">{(user.firstName?.charAt(0) || '') + (user.lastName?.charAt(0) || '')}</span>}
                label="Name"
                value={[user.firstName, user.lastName].filter(Boolean).join(' ') || '—'}
              />
            )}
            {user.email && (
              <InfoRow halo="bg-blue-50 dark:bg-blue-900/20" icon={<Mail size={18} className="text-blue-600 dark:text-blue-400" />} label="Email" value={user.email} />
            )}
            {user.phone && (
              <InfoRow halo="bg-green-50 dark:bg-green-900/20" icon={<Phone size={18} className="text-green-600 dark:text-green-400" />} label="Phone" value={user.phone} />
            )}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link href="/settings" className="card-interactive p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 dark:bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Calendar size={18} className="text-primary dark:text-primary-light" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('common:more.settings')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Manage preferences</p>
          </div>
        </Link>

        <Link href="/settings/language" className="card-interactive p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
            <Globe size={18} className="text-purple-600 dark:text-purple-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('profile:settings.language.title', 'Language')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">Change app language</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

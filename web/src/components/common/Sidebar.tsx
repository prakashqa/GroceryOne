'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Receipt, ListChecks,
  BarChart3, Package, Settings2, Camera, Settings, FolderOpen,
  ChevronLeft, ChevronRight, LogOut, X, Users, KeyRound, ScanLine,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { selectIsAdmin } from '@groceryone/store';
import { useSidebar } from '@/hooks/useSidebar';
import { useTranslation } from 'react-i18next';
import { performLogout } from '@/lib/auth/logoutClient';

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { isOpen, setIsOpen, collapsed, setCollapsed } = useSidebar();
  const { t } = useTranslation('common');
  // Owner (role='admin') sees Reports + Employees; cashiers do not.
  // Backend additionally enforces role on those endpoints.
  const isAdmin = useSelector(selectIsAdmin);

  // Build the nav list, filtering admin-only items by role. `adminOnly`
  // entries are skipped for non-admins so the URLs never appear in the
  // sidebar; the corresponding pages still self-guard (defence in depth).
  const navigation = [
    { name: t('navigation.dashboard'), href: '/dashboard', icon: LayoutDashboard },
    { name: t('navigation.picking'), href: '/picking', icon: ShoppingCart },
    { name: t('navigation.scanBarcode', 'Scan Barcode'), href: '/scan-barcode', icon: ScanLine },
    { name: t('navigation.carts'), href: '/orders', icon: Receipt },
    { name: t('navigation.items'), href: '/items', icon: ListChecks },
    { name: t('navigation.reports'), href: '/reports', icon: BarChart3, adminOnly: true },
    { name: t('navigation.inventory'), href: '/inventory', icon: Package },
    { name: t('navigation.scan'), href: '/scan/upload', icon: Camera },
  ].filter((item) => !item.adminOnly || isAdmin);

  const managementNav = [
    { name: t('navigation.categories'), href: '/management/categories', icon: FolderOpen },
    { name: t('navigation.productList'), href: '/management/items', icon: ListChecks },
    { name: t('navigation.employees', 'Employees'), href: '/management/employees', icon: Users, adminOnly: true },
    { name: t('navigation.licenses', 'Desktop licenses'), href: '/admin/licenses', icon: KeyRound, adminOnly: true },
  ].filter((item) => !item.adminOnly || isAdmin);

  const handleLogout = () => performLogout(dispatch, router);

  const sidebarContent = (
    <>
      {/* Brand row */}
      <div className="flex items-center justify-between px-4 h-14 border-b border-line dark:border-line-dark">
        {!collapsed && (
          <span className="text-lg font-semibold tracking-tight text-primary dark:text-primary-light">
            {t('appName', 'GroOne')}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="btn-icon hidden md:inline-flex"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="btn-icon md:hidden"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <ul className="space-y-0.5 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href} className="relative">
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary dark:bg-primary-light"
                  />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/[0.04] dark:hover:text-gray-200'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Management section */}
        {!collapsed && (
          <div className="mt-5 mb-1 px-4">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              {t('more.sections.management')}
            </p>
          </div>
        )}
        {collapsed && <div className="my-3 mx-3 border-t border-line dark:border-line-dark" />}
        <ul className="space-y-0.5 px-2">
          {managementNav.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href} className="relative">
                {isActive && (
                  <span
                    aria-hidden
                    className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-r-full bg-primary dark:bg-primary-light"
                  />
                )}
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/[0.04] dark:hover:text-gray-200'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon size={18} className="flex-shrink-0" />
                  {!collapsed && <span className="truncate">{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-line dark:border-line-dark p-2 space-y-0.5">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
            pathname.startsWith('/settings')
              ? 'bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary-light'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/[0.04] dark:hover:text-gray-200'
          )}
        >
          <Settings size={18} className="flex-shrink-0" />
          {!collapsed && <span className="truncate">{t('more.settings')}</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-error/10 hover:text-error dark:hover:bg-error/15 dark:hover:text-red-400 transition-colors w-full"
        >
          <LogOut size={18} className="flex-shrink-0" />
          {!collapsed && <span className="truncate">{t('more.logout')}</span>}
        </button>
      </div>
    </>
  );

  return (
    <>
      <div
        className={cn(
          'fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 md:hidden',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setIsOpen(false)}
      />
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-surface-dark',
          'border-r border-line dark:border-line-dark',
          'transition-transform duration-200 ease-out w-64',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:translate-x-0 md:z-auto md:transition-[width] md:duration-200',
          collapsed ? 'md:w-16' : 'md:w-60'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

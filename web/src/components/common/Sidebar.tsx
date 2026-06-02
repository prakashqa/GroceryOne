'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, ShoppingCart, Receipt, ListChecks,
  BarChart3, Package, Settings2, Camera, Settings, FolderOpen,
  ChevronLeft, ChevronRight, LogOut, X, Users, KeyRound,
} from 'lucide-react';
import { useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/hooks/useAppDispatch';
import { logout, clearTenant, selectIsAdmin } from '@groceryone/store';
import { useSidebar } from '@/hooks/useSidebar';
import { useTranslation } from 'react-i18next';

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

  const handleLogout = () => {
    dispatch(logout());
    dispatch(clearTenant());
    const keysToRemove = Object.keys(localStorage).filter(
      (k) => k.startsWith('@tenant') || k.startsWith('@catalog') ||
             k.startsWith('@multicart') || k.startsWith('@settings') ||
             k.startsWith('@groone') || k === 'i18nextLng'
    );
    keysToRemove.forEach((k) => localStorage.removeItem(k));
    router.push('/pin-login');
  };

  const sidebarContent = (
    <>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        {!collapsed && (
          <span className="text-xl font-bold text-primary dark:text-primary-light">
            {t('appName', 'GroOne')}
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:block p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
        <button
          onClick={() => setIsOpen(false)}
          className="md:hidden p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary-light/10 dark:text-primary-light'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Management section */}
        {!collapsed && (
          <div className="mt-4 px-4">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              {t('more.sections.management')}
            </p>
          </div>
        )}
        <ul className="space-y-1 px-2">
          {managementNav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary/10 text-primary dark:bg-primary-light/10 dark:text-primary-light'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                  )}
                  title={collapsed ? item.name : undefined}
                >
                  <item.icon size={20} className="flex-shrink-0" />
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 dark:border-gray-800 p-2">
        <Link
          href="/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors',
            pathname.startsWith('/settings') && 'bg-primary/10 text-primary dark:text-primary-light'
          )}
        >
          <Settings size={20} className="flex-shrink-0" />
          {!collapsed && <span>{t('more.settings')}</span>}
        </Link>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 transition-colors w-full"
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!collapsed && <span>{t('more.logout')}</span>}
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
          'fixed inset-y-0 left-0 z-50 flex flex-col bg-white dark:bg-surface-dark border-r border-gray-200 dark:border-gray-800 transition-transform duration-200 w-60',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          'md:relative md:translate-x-0 md:z-auto md:transition-all',
          collapsed ? 'md:w-16' : 'md:w-60'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}

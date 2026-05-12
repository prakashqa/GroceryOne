/**
 * ReportsScreenGated
 *
 * Thin wrapper that enforces role-based access at the screen level.
 * If a non-admin (cashier/employee) reaches this route — via deep link,
 * saved navigation state, or programmatic navigate() — they see the
 * RoleGate fallback instead of the actual reports content.
 *
 * The bottom tab in BottomTabNavigator is also hidden for non-admins;
 * this is the defence-in-depth layer for the navigation path that
 * bypasses the tab bar.
 */

import React from 'react';
import { RoleGate } from '../../../presentation/navigation/RoleGate';
import { ReportsScreen as ReportsScreenInternal } from './ReportsScreen';

export const ReportsScreen: React.FC = () => (
  <RoleGate roles={['admin']}>
    <ReportsScreenInternal />
  </RoleGate>
);

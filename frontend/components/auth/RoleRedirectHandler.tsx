'use client';

import { useEffect } from 'react';
import { useWallet } from '@/lib/wallet/WalletProvider';
import { usePathname, useRouter } from 'next/navigation';

/**
 * This component handles redirecting the user to:
 * 1. The role selection page if they are connected but have no role assigned
 * 2. Away from /select-role if they already have a role
 * 
 * It does NOT restrict access to general pages for logged-in users.
 */
export function RoleRedirectHandler() {
  const { selectedAccount, userRole, isLoadingRole, isConnected } = useWallet();
  const router = useRouter();
  const pathname = usePathname(); // Get current path

  // Map roles to their dashboard routes (for optional redirects)
  const getDashboardRoute = (role: string): string => {
    switch (role) {
      case 'NPO':
        return '/npo/dashboard';
      case 'Auditor':
        return '/auditor/dashboard';
      case 'Donor':
        return '/donor/dashboard';
      case 'NPO Team Member':
        return '/npo-team/dashboard';
      default:
        return '/';
    }
  };

  useEffect(() => {
    // Only run logic if connected, account selected, and role check is complete
    if (isConnected && selectedAccount && !isLoadingRole) {
      // Case 1: No role assigned and not on select-role page -> send to role selection
      if (userRole === null && pathname !== '/select-role') {
        console.log('Redirecting to /select-role');
        router.push('/select-role');
      }
      // Case 2: If on select-role but role already set, redirect to dashboard
      else if (userRole !== null && pathname === '/select-role') {
        console.log(`Already have role ${userRole}, redirecting to dashboard`);
        router.push(getDashboardRoute(userRole));
      }
      // NO automatic redirects from general site pages
    }
  }, [isConnected, selectedAccount, userRole, isLoadingRole, router, pathname]);

  // This component does not render anything visual
  return null;
}

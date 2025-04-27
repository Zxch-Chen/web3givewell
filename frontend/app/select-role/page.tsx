'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/lib/wallet/WalletProvider';
import { setUserRole } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Define the possible roles
type UserRole = 'NPO' | 'Auditor' | 'Donor' | 'NPO Team Member';

const ROLES: UserRole[] = ['NPO', 'Auditor', 'Donor', 'NPO Team Member'];

export default function SelectRolePage() {
  const { selectedAccount, signMessage, setUserRoleState } = useWallet();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  const handleRoleSelection = async (role: UserRole) => {
    if (!selectedAccount || !signMessage) {
      toast.error('Wallet not connected or signer not available.');
      return;
    }

    setIsLoading(true);
    setSelectedRole(role); // Keep track of which button is loading

    try {
      // 1. Create the message to sign
      const message = `Assign role: ${role} to address: ${selectedAccount.address}`;

      // 2. Sign the message
      const signatureResult = await signMessage(message);
      if (!signatureResult) {
        // Error is handled within signMessage via toast
        setIsLoading(false);
        setSelectedRole(null);
        return;
      }

      // 3. Call the backend API to set the role
      await setUserRole(selectedAccount.address, role, signatureResult.signature);

      // 4. Update local state and redirect
      setUserRoleState(role); // Update role in the context
      toast.success(`Role successfully set to ${role}!`);
      router.push('/'); // Redirect to homepage or a dashboard

    } catch (error) {
      console.error('Failed to set user role:', error);
      toast.error(`Failed to set role: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsLoading(false);
      setSelectedRole(null);
    }
    // No finally block for setIsLoading, as redirect happens on success
  };

  // Prevent access if wallet not connected (should be handled by redirector, but good practice)
  if (!selectedAccount) {
     return (
        <div className="flex justify-center items-center min-h-screen">
            <p>Please connect your wallet first.</p>
        </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12 flex justify-center items-center min-h-[calc(100vh-var(--header-height))]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Select Your Role</CardTitle>
          <CardDescription>
            Choose the role that best describes your interaction with ImpactChain.
            This helps us tailor your experience.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {ROLES.map((role) => (
            <Button
              key={role}
              variant="outline"
              className="w-full justify-start text-left h-auto py-3 px-4"
              onClick={() => handleRoleSelection(role)}
              disabled={isLoading}
            >
              {isLoading && selectedRole === role ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              <span className="font-medium">{role}</span>
              {/* Add descriptions later if needed */}
            </Button>
          ))}
          {isLoading && <p className="text-sm text-muted-foreground text-center">Please confirm in your wallet...</p>}
        </CardContent>
      </Card>
    </div>
  );
}

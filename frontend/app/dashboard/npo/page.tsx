'use client';

import React from 'react';
import { useWallet } from '@/lib/wallet/WalletProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function NPODashboard() {
  const { userRole, isLoadingRole, selectedAccount } = useWallet();
  const router = useRouter();

  // Protect this page - only NPOs should access it
  useEffect(() => {
    if (!isLoadingRole && userRole !== 'NPO') {
      router.push('/');
    }
  }, [userRole, isLoadingRole, router]);

  if (isLoadingRole) {
    return <div className="container mx-auto p-8">Loading...</div>;
  }

  if (userRole !== 'NPO') {
    return null; // Will redirect due to the effect above
  }

  return (
    <div className="container mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">NPO Dashboard</h1>
      <p className="text-lg text-muted-foreground">
        Welcome, {selectedAccount?.meta.name || 'NPO'}! Here you can manage your nonprofit organization's profile, milestones, and impact evidence.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Organization Profile</CardTitle>
            <CardDescription>Manage your NPO's information</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Edit Organization Profile</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestones</CardTitle>
            <CardDescription>Create and track funding milestones</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Create New Milestone</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Evidence</CardTitle>
            <CardDescription>Upload evidence of milestone completion</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>Upload Evidence</Button>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Donation History</CardTitle>
            <CardDescription>View donations to your organization</CardDescription>
          </CardHeader>
          <CardContent>
            <Button>View Donations</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

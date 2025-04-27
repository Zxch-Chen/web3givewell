"use client"

import { PageLayout } from "@/components/layout/page-layout"
import { AddFunds } from "@/components/wallet/add-funds"

export default function AuditorAddFundsPage() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Add Funds to Your Auditor Account</h1>
          <p className="text-muted-foreground mb-8">
            Add funds to your auditor account to cover transaction fees and stake for verifications.
          </p>

          <AddFunds userType="auditor" />
        </div>
      </div>
    </PageLayout>
  )
}

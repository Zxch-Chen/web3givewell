"use client"

import { PageLayout } from "@/components/layout/page-layout"
import { AddFunds } from "@/components/wallet/add-funds"

export default function DonorAddFundsPage() {
  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">Add Funds to Your Donor Account</h1>
          <p className="text-muted-foreground mb-8">
            Add funds to your donor account to support nonprofit projects and initiatives.
          </p>

          <AddFunds userType="donor" />
        </div>
      </div>
    </PageLayout>
  )
}

"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/layout/page-layout"
import { useToast } from "@/components/ui/use-toast"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics"
import { BarChart3, ListChecks, Wallet } from "lucide-react"
import Link from "next/link"

// Mock API functions
const fetchOpenMilestones = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return [
    {
      id: "m1",
      npoName: "Green Earth Initiative",
      npoAddress: "0x1234...5678",
      title: "Community Garden Setup",
      description: "Purchase tools and seeds for the community garden project",
      amount: 2500,
      amountRaised: 1200,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "m2",
      npoName: "Education For All",
      npoAddress: "0x5678...9012",
      title: "School Supplies Distribution",
      description: "Purchase and distribute school supplies to 100 children",
      amount: 1800,
      amountRaised: 900,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "m3",
      npoName: "Clean Water Project",
      npoAddress: "0x9012...3456",
      title: "Well Construction",
      description: "Complete construction of community well in rural village",
      amount: 3500,
      amountRaised: 2800,
      image: "/placeholder.svg?height=200&width=300",
    },
    {
      id: "m4",
      npoName: "Wildlife Conservation",
      npoAddress: "0x3456...7890",
      title: "Habitat Restoration",
      description: "Restore 5 acres of wildlife habitat in protected area",
      amount: 4200,
      amountRaised: 1500,
      image: "/placeholder.svg?height=200&width=300",
    },
  ]
}

const fetchDonorHistory = async (address: string) => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800))

  return [
    {
      id: "d1",
      milestoneId: "m1",
      milestoneName: "Community Garden Setup",
      npoName: "Green Earth Initiative",
      amount: 200,
      status: "completed",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "d2",
      milestoneId: "m2",
      milestoneName: "School Supplies Distribution",
      npoName: "Education For All",
      amount: 150,
      status: "in_progress",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "d3",
      milestoneId: "m3",
      milestoneName: "Well Construction",
      npoName: "Clean Water Project",
      amount: 300,
      status: "in_progress",
      date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

export default function DonorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [donationAmount, setDonationAmount] = useState<Record<string, string>>({})
  const [donatingTo, setDonatingTo] = useState<string | null>(null)
  const [ethEquivalent, setEthEquivalent] = useState<Record<string, string>>({})

  // Mock ETH price - in a real app, this would come from an API
  const ethPrice = 3500

  const { data: milestones, isLoading: isLoadingMilestones } = useQuery({
    queryKey: ["open-milestones"],
    queryFn: fetchOpenMilestones,
  })

  const { data: donationHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ["donation-history", user?.address],
    queryFn: () => fetchDonorHistory(user?.address || ""),
    enabled: !!user?.address,
  })

  const handleDonationAmountChange = (milestoneId: string, value: string) => {
    setDonationAmount({
      ...donationAmount,
      [milestoneId]: value,
    })

    // Calculate ETH equivalent
    if (value && !isNaN(Number.parseFloat(value))) {
      const eth = (Number.parseFloat(value) / ethPrice).toFixed(6)
      setEthEquivalent({
        ...ethEquivalent,
        [milestoneId]: eth,
      })
    } else {
      setEthEquivalent({
        ...ethEquivalent,
        [milestoneId]: "0",
      })
    }
  }

  const handleDonate = async (milestoneId: string) => {
    const amount = Number.parseFloat(donationAmount[milestoneId] || "0")

    if (!amount || amount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid donation amount",
        variant: "destructive",
      })
      return
    }

    setDonatingTo(milestoneId)

    try {
      // Simulate API call to get signed transaction
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Simulate sending transaction with Polkadot.js
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Donation successful",
        description: `You have donated $${amount.toFixed(2)} (${ethEquivalent[milestoneId]} ETH) to this milestone`,
      })

      // Reset donation amount
      setDonationAmount({
        ...donationAmount,
        [milestoneId]: "",
      })
      setEthEquivalent({
        ...ethEquivalent,
        [milestoneId]: "0",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to process donation. Please try again.",
        variant: "destructive",
      })
    } finally {
      setDonatingTo(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      completed: { color: "bg-green-100 text-green-800", label: "Completed" },
      in_progress: { color: "bg-blue-100 text-blue-800", label: "In Progress" },
      failed: { color: "bg-red-100 text-red-800", label: "Failed" },
    }

    const { color, label } = statusMap[status] || { color: "bg-gray-100 text-gray-800", label: status }

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${color}`}>
        {label}
      </span>
    )
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-primary-50 rounded-lg p-6 mb-8 border border-primary-100 web3-bg">
          <div className="absolute inset-0 hexagon-grid opacity-10"></div>
          <h1 className="text-2xl font-bold text-primary-800 mb-2">Donor Dashboard</h1>
          <p className="text-primary-700">Browse open milestones, make donations, and track your impact.</p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href="/donor/add-funds">
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                Add Funds
              </Button>
            </Link>
          </div>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="projects" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <PerformanceMetrics userType="donor" />
          </TabsContent>

          <TabsContent value="projects">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Milestone Gallery */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Open Milestones</h2>

                  {isLoadingMilestones ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  ) : milestones && milestones.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {milestones.map((milestone) => {
                        const percentFunded = (milestone.amountRaised / milestone.amount) * 100

                        return (
                          <div
                            key={milestone.id}
                            className="border border-gray-200 rounded-lg overflow-hidden reactive-card"
                          >
                            <img
                              src={milestone.image || "/placeholder.svg"}
                              alt={milestone.title}
                              className="w-full h-40 object-cover"
                            />

                            <div className="p-4">
                              <div className="flex justify-between items-start mb-2">
                                <h3 className="font-semibold text-lg">{milestone.title}</h3>
                                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  ${milestone.amount.toLocaleString()}
                                </span>
                              </div>

                              <p className="text-sm text-foreground/70 mb-2">By {milestone.npoName}</p>

                              <p className="text-sm mb-4">{milestone.description}</p>

                              <div className="mb-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>${milestone.amountRaised.toLocaleString()} raised</span>
                                  <span>{percentFunded.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-primary-500 h-2 rounded-full"
                                    style={{ width: `${percentFunded}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-center space-x-2">
                                  <input
                                    type="number"
                                    value={donationAmount[milestone.id] || ""}
                                    onChange={(e) => handleDonationAmountChange(milestone.id, e.target.value)}
                                    placeholder="Amount"
                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                    min="1"
                                    step="1"
                                  />
                                  <Button
                                    onClick={() => handleDonate(milestone.id)}
                                    disabled={donatingTo === milestone.id}
                                    size="sm"
                                    className="whitespace-nowrap"
                                  >
                                    {donatingTo === milestone.id ? "Processing..." : "Donate"}
                                  </Button>
                                </div>
                                <div className="text-xs text-muted-foreground">
                                  ETH Equivalent: {ethEquivalent[milestone.id] || "0"} ETH
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-foreground/70">
                      <p>No open milestones available at the moment.</p>
                      <p className="mt-1">Check back later for new opportunities to make an impact.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Donation History */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Donations</h2>

                  {isLoadingHistory ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  ) : donationHistory && donationHistory.length > 0 ? (
                    <div className="space-y-4">
                      {donationHistory.map((donation) => (
                        <div key={donation.id} className="border border-gray-200 rounded-lg p-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <h3 className="font-medium text-sm">{donation.milestoneName}</h3>
                              <p className="text-xs text-foreground/70">{donation.npoName}</p>
                            </div>
                            <div className="text-right">
                              <div className="font-bold">${donation.amount}</div>
                              <div className="mt-1">{getStatusBadge(donation.status)}</div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-foreground/60">
                            {new Date(donation.date).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-foreground/70">
                      <p>You haven't made any donations yet.</p>
                      <p className="mt-1">Start donating to make an impact!</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}

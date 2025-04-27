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
const fetchAvailableBounties = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return [
    {
      id: "b1",
      npoName: "Green Earth Initiative",
      npoAddress: "0x1234...5678",
      milestone: {
        id: "m1",
        title: "Community Garden Setup",
        description: "Purchase tools and seeds for the community garden project",
        amount: 2500,
        evidenceCid: "Qm123...abc",
      },
    },
    {
      id: "b2",
      npoName: "Education For All",
      npoAddress: "0x5678...9012",
      milestone: {
        id: "m2",
        title: "School Supplies Distribution",
        description: "Purchase and distribute school supplies to 100 children",
        amount: 1800,
        evidenceCid: "Qm456...def",
      },
    },
    {
      id: "b3",
      npoName: "Clean Water Project",
      npoAddress: "0x9012...3456",
      milestone: {
        id: "m3",
        title: "Well Construction",
        description: "Complete construction of community well in rural village",
        amount: 3500,
        evidenceCid: "Qm789...ghi",
      },
    },
  ]
}

const fetchAuditorStatus = async (address: string) => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800))

  return {
    pending: 3,
    inDispute: 1,
    resolved: 5,
    totalEarned: 450,
  }
}

export default function AuditorDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [votingBounty, setVotingBounty] = useState<string | null>(null)
  const [evidenceNote, setEvidenceNote] = useState("")

  const { data: bounties, isLoading: isLoadingBounties } = useQuery({
    queryKey: ["bounties"],
    queryFn: fetchAvailableBounties,
  })

  const { data: statusData, isLoading: isLoadingStatus } = useQuery({
    queryKey: ["auditor-status", user?.address],
    queryFn: () => fetchAuditorStatus(user?.address || ""),
    enabled: !!user?.address,
  })

  const handleVote = async (bountyId: string, vote: "pass" | "fail") => {
    setVotingBounty(bountyId)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Vote submitted",
        description: `You have ${vote === "pass" ? "approved" : "rejected"} the milestone evidence`,
      })

      setEvidenceNote("")
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setVotingBounty(null)
    }
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-primary-50 rounded-lg p-6 mb-8 border border-primary-100 web3-bg">
          <div className="absolute inset-0 hexagon-grid opacity-10"></div>
          <h1 className="text-2xl font-bold text-primary-800 mb-2">Auditor Dashboard</h1>
          <p className="text-primary-700">
            Review milestone evidence and help ensure transparency and accountability in the ecosystem.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Link href="/auditor/add-funds">
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
            <TabsTrigger value="bounties" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              Available Bounties
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <PerformanceMetrics userType="auditor" />
          </TabsContent>

          <TabsContent value="bounties">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Status Panel */}
              <div className="lg:col-span-1">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Your Status</h2>

                  {isLoadingStatus ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  ) : statusData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                          <div className="text-sm text-blue-700">Pending</div>
                          <div className="text-2xl font-bold text-blue-800">{statusData.pending}</div>
                        </div>
                        <div className="bg-yellow-50 p-4 rounded-lg">
                          <div className="text-sm text-yellow-700">In Dispute</div>
                          <div className="text-2xl font-bold text-yellow-800">{statusData.inDispute}</div>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                          <div className="text-sm text-green-700">Resolved</div>
                          <div className="text-2xl font-bold text-green-800">{statusData.resolved}</div>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                          <div className="text-sm text-purple-700">Earned (USD)</div>
                          <div className="text-2xl font-bold text-purple-800">${statusData.totalEarned}</div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-gray-200">
                        <h3 className="text-sm font-medium mb-2">Your Auditor Address</h3>
                        <div className="bg-gray-100 p-2 rounded text-sm font-mono break-all">
                          {user?.address || "Not connected"}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-foreground/70">
                      <p>Could not load status data.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Bounty List */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Available Bounties</h2>

                  {isLoadingBounties ? (
                    <div className="flex justify-center items-center h-64">
                      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                    </div>
                  ) : bounties && bounties.length > 0 ? (
                    <div className="space-y-6">
                      {bounties.map((bounty) => (
                        <div key={bounty.id} className="border border-gray-200 rounded-lg p-4 reactive-card">
                          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                            <div>
                              <div className="flex items-center">
                                <h3 className="font-semibold text-lg">{bounty.milestone.title}</h3>
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                  ${bounty.milestone.amount.toLocaleString()}
                                </span>
                              </div>
                              <p className="text-sm text-foreground/70 mt-1">
                                By {bounty.npoName} ({bounty.npoAddress.slice(0, 6)}...{bounty.npoAddress.slice(-4)})
                              </p>
                              <p className="mt-2">{bounty.milestone.description}</p>

                              <div className="mt-3">
                                <a
                                  href={`https://ipfs.io/ipfs/${bounty.milestone.evidenceCid}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                                >
                                  View Evidence on IPFS →
                                </a>
                              </div>
                            </div>

                            <div className="md:w-64 space-y-3">
                              <textarea
                                placeholder="Optional notes about evidence..."
                                value={evidenceNote}
                                onChange={(e) => setEvidenceNote(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                                rows={2}
                              />
                              <div className="flex space-x-2">
                                <Button
                                  onClick={() => handleVote(bounty.id, "pass")}
                                  disabled={votingBounty === bounty.id}
                                  className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                  {votingBounty === bounty.id ? "Submitting..." : "Pass"}
                                </Button>
                                <Button
                                  onClick={() => handleVote(bounty.id, "fail")}
                                  disabled={votingBounty === bounty.id}
                                  className="flex-1 bg-red-600 hover:bg-red-700"
                                >
                                  {votingBounty === bounty.id ? "Submitting..." : "Fail"}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-foreground/70">
                      <p>No bounties available at the moment.</p>
                      <p className="mt-1">Check back later for new verification opportunities.</p>
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

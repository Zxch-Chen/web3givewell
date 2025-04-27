"use client"

import type React from "react"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/layout/page-layout"
import { useToast } from "@/components/ui/use-toast"
import { useQuery } from "@tanstack/react-query"

// Mock API functions
const fetchProposals = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return [
    {
      id: "p1",
      title: "Redirect funds from Project A to Project B",
      description:
        "Due to evidence of mismanagement, we propose to redirect remaining funds to a similar project with better track record.",
      frozenMilestone: {
        id: "m1",
        title: "Community Center Construction",
        npoName: "Urban Development Initiative",
        amount: 5000,
        amountFrozen: 3200,
      },
      targetNpo: {
        id: "npo2",
        name: "City Improvement Fund",
      },
      votesFor: 24,
      votesAgainst: 8,
      status: "active",
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "p2",
      title: "Release insurance funds for drought victims",
      description: "Proposal to release emergency funds from the insurance pool to help drought-affected communities.",
      frozenMilestone: null,
      targetNpo: {
        id: "npo3",
        name: "Disaster Relief Network",
      },
      votesFor: 45,
      votesAgainst: 3,
      status: "passed",
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "p3",
      title: "Redirect funds from failed water project",
      description:
        "The water purification project has failed to meet its milestones. Propose to redirect funds to a similar initiative.",
      frozenMilestone: {
        id: "m3",
        title: "Water Purification System",
        npoName: "Clean Water Access",
        amount: 7500,
        amountFrozen: 4800,
      },
      targetNpo: {
        id: "npo4",
        name: "H2O for All",
      },
      votesFor: 12,
      votesAgainst: 18,
      status: "rejected",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

const fetchNpoList = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800))

  return [
    { id: "npo1", name: "Green Earth Initiative" },
    { id: "npo2", name: "City Improvement Fund" },
    { id: "npo3", name: "Disaster Relief Network" },
    { id: "npo4", name: "H2O for All" },
    { id: "npo5", name: "Education For All" },
    { id: "npo6", name: "Wildlife Conservation" },
  ]
}

const fetchFrozenMilestones = async () => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 800))

  return [
    {
      id: "m1",
      title: "Community Center Construction",
      npoName: "Urban Development Initiative",
      amount: 5000,
      amountFrozen: 3200,
    },
    {
      id: "m3",
      title: "Water Purification System",
      npoName: "Clean Water Access",
      amount: 7500,
      amountFrozen: 4800,
    },
  ]
}

export default function GovernancePage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [newProposal, setNewProposal] = useState({
    title: "",
    description: "",
    frozenMilestoneId: "",
    targetNpoId: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [votingOn, setVotingOn] = useState<string | null>(null)

  const { data: proposals, isLoading: isLoadingProposals } = useQuery({
    queryKey: ["proposals"],
    queryFn: fetchProposals,
  })

  const { data: npoList } = useQuery({
    queryKey: ["npo-list"],
    queryFn: fetchNpoList,
  })

  const { data: frozenMilestones } = useQuery({
    queryKey: ["frozen-milestones"],
    queryFn: fetchFrozenMilestones,
  })

  const handleProposalSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!newProposal.title || !newProposal.description || !newProposal.targetNpoId) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Proposal created",
        description: "Your proposal has been successfully created",
      })

      // Reset form
      setNewProposal({
        title: "",
        description: "",
        frozenMilestoneId: "",
        targetNpoId: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create proposal. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleVote = async (proposalId: string, vote: "support" | "oppose") => {
    setVotingOn(proposalId)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Vote submitted",
        description: `You have ${vote === "support" ? "supported" : "opposed"} the proposal`,
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit vote. Please try again.",
        variant: "destructive",
      })
    } finally {
      setVotingOn(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      active: { color: "bg-blue-100 text-blue-800", label: "Active" },
      passed: { color: "bg-green-100 text-green-800", label: "Passed" },
      rejected: { color: "bg-red-100 text-red-800", label: "Rejected" },
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
        <div className="bg-primary-50 rounded-lg p-6 mb-8 border border-primary-100">
          <h1 className="text-2xl font-bold text-primary-800 mb-2">Governance</h1>
          <p className="text-primary-700">
            Participate in community governance by proposing and voting on fund redirections and other important
            decisions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Proposal Form */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Create Proposal</h2>
              <form onSubmit={handleProposalSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1">Title</label>
                  <input
                    type="text"
                    value={newProposal.title}
                    onChange={(e) => setNewProposal({ ...newProposal, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Enter proposal title"
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1">Description</label>
                  <textarea
                    value={newProposal.description}
                    onChange={(e) => setNewProposal({ ...newProposal, description: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="Describe your proposal"
                    rows={4}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1">Frozen Milestone (Optional)</label>
                  <select
                    value={newProposal.frozenMilestoneId}
                    onChange={(e) => setNewProposal({ ...newProposal, frozenMilestoneId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Select a frozen milestone</option>
                    {frozenMilestones?.map((milestone) => (
                      <option key={milestone.id} value={milestone.id}>
                        {milestone.title} (${milestone.amountFrozen})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-foreground mb-1">Target NPO</label>
                  <select
                    value={newProposal.targetNpoId}
                    onChange={(e) => setNewProposal({ ...newProposal, targetNpoId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  >
                    <option value="">Select target NPO</option>
                    {npoList?.map((npo) => (
                      <option key={npo.id} value={npo.id}>
                        {npo.name}
                      </option>
                    ))}
                  </select>
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full" variant="gradient">
                  {isSubmitting ? "Creating..." : "Create Proposal"}
                </Button>
              </form>
            </div>
          </div>

          {/* Proposal List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Active Proposals</h2>

              {isLoadingProposals ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                </div>
              ) : proposals && proposals.length > 0 ? (
                <div className="space-y-6">
                  {proposals.map((proposal) => (
                    <div key={proposal.id} className="border border-gray-200 rounded-lg p-4 reactive-card">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-lg">{proposal.title}</h3>
                            {getStatusBadge(proposal.status)}
                          </div>
                          <p className="text-sm text-foreground/70 mt-1">
                            Created {new Date(proposal.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <p className="mt-3">{proposal.description}</p>

                      {proposal.frozenMilestone && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-md">
                          <h4 className="text-sm font-medium mb-1">Frozen Milestone</h4>
                          <p className="text-sm">
                            {proposal.frozenMilestone.title} by {proposal.frozenMilestone.npoName}
                          </p>
                          <p className="text-sm text-foreground/70">
                            ${proposal.frozenMilestone.amountFrozen.toLocaleString()} frozen out of $
                            {proposal.frozenMilestone.amount.toLocaleString()}
                          </p>
                        </div>
                      )}

                      <div className="mt-4 p-3 bg-gray-50 rounded-md">
                        <h4 className="text-sm font-medium mb-1">Target NPO</h4>
                        <p className="text-sm">{proposal.targetNpo.name}</p>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="text-sm">
                            <span className="font-medium text-green-600">{proposal.votesFor}</span> support
                          </div>
                          <div className="text-sm">
                            <span className="font-medium text-red-600">{proposal.votesAgainst}</span> oppose
                          </div>
                        </div>

                        {proposal.status === "active" && (
                          <div className="flex space-x-2">
                            <Button
                              onClick={() => handleVote(proposal.id, "support")}
                              disabled={votingOn === proposal.id}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              Support
                            </Button>
                            <Button
                              onClick={() => handleVote(proposal.id, "oppose")}
                              disabled={votingOn === proposal.id}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Oppose
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-foreground/70">
                  <p>No proposals available at the moment.</p>
                  <p className="mt-1">Create a new proposal to get started!</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/layout/page-layout"
import { useToast } from "@/components/ui/use-toast"
import { useQuery } from "@tanstack/react-query"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PerformanceMetrics } from "@/components/dashboard/performance-metrics"
import { CreateMilestoneForm } from "@/components/npo/create-milestone-form"
import { PlusCircle, BarChart3, ListChecks, Wallet } from "lucide-react"
import Link from "next/link"

// Mock API functions
const fetchMilestones = async (npoId: string) => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  return [
    {
      id: "m1",
      title: "Community Garden Setup",
      description: "Purchase tools and seeds for the community garden project",
      amount: 2500,
      status: "pending",
      createdAt: new Date().toISOString(),
    },
    {
      id: "m2",
      title: "Educational Workshop Series",
      description: "Host 5 workshops on sustainable gardening practices",
      amount: 1800,
      status: "funded",
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "m3",
      title: "Irrigation System Installation",
      description: "Install water-efficient irrigation system for the garden",
      amount: 3200,
      status: "evidence_submitted",
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: "m4",
      title: "Harvest Festival",
      description: "Organize community harvest festival to showcase garden produce",
      amount: 1500,
      status: "released",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ]
}

export default function NpoDashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadingEvidence, setUploadingEvidence] = useState<string | null>(null)
  const [showCreateForm, setShowCreateForm] = useState(false)

  const { data: milestones, isLoading } = useQuery({
    queryKey: ["milestones", user?.address],
    queryFn: () => fetchMilestones(user?.address || ""),
    enabled: !!user?.address,
  })

  const handleEvidenceUpload = async (milestoneId: string) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to upload",
        variant: "destructive",
      })
      return
    }

    setUploadingEvidence(milestoneId)

    try {
      // Simulate IPFS upload
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Simulate API call to submit evidence
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Evidence submitted",
        description: "Your evidence has been successfully uploaded and submitted",
      })

      setSelectedFile(null)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload evidence. Please try again.",
        variant: "destructive",
      })
    } finally {
      setUploadingEvidence(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { color: string; label: string }> = {
      pending: { color: "bg-yellow-100 text-yellow-800", label: "Pending" },
      funded: { color: "bg-blue-100 text-blue-800", label: "Funded" },
      evidence_submitted: { color: "bg-purple-100 text-purple-800", label: "Evidence Submitted" },
      released: { color: "bg-green-100 text-green-800", label: "Funds Released" },
      frozen: { color: "bg-red-100 text-red-800", label: "Frozen" },
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
          <h1 className="text-2xl font-bold text-primary-800 mb-2">
            Welcome, {user?.address ? `${user.address.slice(0, 6)}...${user.address.slice(-4)}` : "NPO"}!
          </h1>
          <p className="text-primary-700">
            Let's create impact together. Use this dashboard to manage your milestones and track your progress.
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              variant="gradient"
              size="sm"
              className="flex items-center gap-2"
              onClick={() => setShowCreateForm(true)}
            >
              <PlusCircle className="w-4 h-4" />
              Create Milestone
            </Button>
            <Link href="/npo/add-funds">
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
            <TabsTrigger value="milestones" className="flex items-center gap-2">
              <ListChecks className="w-4 h-4" />
              Milestones
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <PerformanceMetrics userType="npo" />
          </TabsContent>

          <TabsContent value="milestones">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Create Milestone Form */}
              {showCreateForm && (
                <div className="lg:col-span-1">
                  <CreateMilestoneForm />
                </div>
              )}

              {/* Milestone List */}
              <div className={showCreateForm ? "lg:col-span-2" : "lg:col-span-3"}>
                <Card>
                  <CardContent className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold">Your Milestones</h2>
                      {!showCreateForm && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex items-center gap-2"
                          onClick={() => setShowCreateForm(true)}
                        >
                          <PlusCircle className="w-4 h-4" />
                          Create New
                        </Button>
                      )}
                    </div>

                    {isLoading ? (
                      <div className="flex justify-center items-center h-64">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    ) : milestones && milestones.length > 0 ? (
                      <div className="space-y-6">
                        {milestones.map((milestone) => (
                          <div key={milestone.id} className="border border-gray-200 rounded-lg p-4 reactive-card">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-lg">{milestone.title}</h3>
                                <p className="text-foreground/70 mt-1">{milestone.description}</p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold">${milestone.amount.toLocaleString()}</div>
                                <div className="mt-1">{getStatusBadge(milestone.status)}</div>
                              </div>
                            </div>

                            {milestone.status === "funded" && (
                              <div className="mt-4 pt-4 border-t border-gray-200">
                                <h4 className="text-sm font-medium mb-2">Submit Evidence</h4>
                                <div className="flex items-center space-x-3">
                                  <input
                                    type="file"
                                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                                    className="text-sm text-foreground/70 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                                  />
                                  <Button
                                    onClick={() => handleEvidenceUpload(milestone.id)}
                                    disabled={!selectedFile || uploadingEvidence === milestone.id}
                                    size="sm"
                                  >
                                    {uploadingEvidence === milestone.id ? "Uploading..." : "Upload"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 text-foreground/70">
                        <p>You haven't created any milestones yet.</p>
                        <p className="mt-1">Create your first milestone to get started!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </PageLayout>
  )
}

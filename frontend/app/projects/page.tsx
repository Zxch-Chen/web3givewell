"use client"

import { useState } from "react"
import { PageLayout } from "@/components/layout/page-layout"
import { NonprofitCard } from "@/components/projects/nonprofit-card"
import { useQuery } from "@tanstack/react-query"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Search, Wallet } from "lucide-react"
import { useWallet } from "@/lib/wallet/WalletProvider"
import { Button } from "@/components/ui/button"

// Mock API function to fetch nonprofits
const fetchNonprofits = async (sortBy = "rating") => {
  // Simulate API call
  await new Promise((resolve) => setTimeout(resolve, 1000))

  const nonprofits = [
    {
      id: "npo1",
      name: "Green Earth Initiative",
      description: "Working to protect and restore natural habitats worldwide.",
      logo: "/placeholder.svg?height=80&width=80",
      category: "Environment",
      rating: 4.8,
      successRate: 96,
      fundingWithheld: 2,
      totalRaised: 125000,
      completedProjects: 18,
      activeMilestones: 3,
      location: "Global",
      tags: ["conservation", "sustainability", "climate"],
    },
    {
      id: "npo2",
      name: "Education For All",
      description: "Providing educational resources to underserved communities.",
      logo: "/placeholder.svg?height=80&width=80",
      category: "Education",
      rating: 4.7,
      successRate: 94,
      fundingWithheld: 3,
      totalRaised: 98000,
      completedProjects: 12,
      activeMilestones: 2,
      location: "Africa, Asia",
      tags: ["education", "children", "literacy"],
    },
    {
      id: "npo3",
      name: "Clean Water Project",
      description: "Building sustainable water solutions in developing regions.",
      logo: "/placeholder.svg?height=80&width=80",
      category: "Water",
      rating: 4.9,
      successRate: 98,
      fundingWithheld: 1,
      totalRaised: 215000,
      completedProjects: 24,
      activeMilestones: 5,
      location: "Africa, South America",
      tags: ["water", "sanitation", "health"],
    },
    {
      id: "npo4",
      name: "Urban Development Initiative",
      description: "Revitalizing urban spaces and building community infrastructure.",
      logo: "/placeholder.svg?height=80&width=80",
      category: "Infrastructure",
      rating: 4.5,
      successRate: 91,
      fundingWithheld: 5,
      totalRaised: 78000,
      completedProjects: 9,
      activeMilestones: 2,
      location: "North America, Europe",
      tags: ["urban", "community", "development"],
    },
    {
      id: "npo5",
      name: "Wildlife Conservation",
      description: "Protecting endangered species and preserving biodiversity.",
      logo: "/placeholder.svg?height=80&width=80",
      category: "Environment",
      rating: 4.6,
      successRate: 93,
      fundingWithheld: 4,
      totalRaised: 142000,
      completedProjects: 15,
      activeMilestones: 4,
      location: "Global",
      tags: ["wildlife", "conservation", "biodiversity"],
    },
    {
      id: "npo6",
      name: "Disaster Relief Network",
      description: "Providing immediate assistance to communities affected by natural disasters.",
      logo: "/placeholder.svg?height=80&width=80",
      category: "Disaster Relief",
      rating: 4.7,
      successRate: 95,
      fundingWithheld: 3,
      totalRaised: 320000,
      completedProjects: 28,
      activeMilestones: 2,
      location: "Global",
      tags: ["disaster", "emergency", "relief"],
    },
    {
      id: "npo7",
      name: "Hunger Solutions",
      description: "Fighting food insecurity through sustainable agriculture and distribution.",
      logo: "/placeholder.svg?height=80&width=80",
      category: "Food",
      rating: 4.4,
      successRate: 89,
      fundingWithheld: 7,
      totalRaised: 86000,
      completedProjects: 11,
      activeMilestones: 3,
      location: "Africa, Asia, South America",
      tags: ["hunger", "food", "agriculture"],
    },
    {
      id: "npo8",
      name: "Medical Access International",
      description: "Bringing healthcare services to remote and underserved regions.",
      logo: "/placeholder.svg?height=80&width=80",
      category: "Healthcare",
      rating: 4.8,
      successRate: 97,
      fundingWithheld: 2,
      totalRaised: 275000,
      completedProjects: 22,
      activeMilestones: 6,
      location: "Global",
      tags: ["medical", "healthcare", "access"],
    },
  ]

  // Sort nonprofits based on sortBy parameter
  return nonprofits.sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating
      case "successRate":
        return b.successRate - a.successRate
      case "fundingWithheld":
        return a.fundingWithheld - b.fundingWithheld
      case "totalRaised":
        return b.totalRaised - a.totalRaised
      case "completedProjects":
        return b.completedProjects - a.completedProjects
      default:
        return b.rating - a.rating
    }
  })
}

export default function ProjectsPage() {
  const [sortBy, setSortBy] = useState("rating")
  const [categoryFilter, setCategoryFilter] = useState("All")
  const [searchQuery, setSearchQuery] = useState("")
  
  // Use the wallet provider
  const { isConnected, isConnecting, connectWallet, selectedAccount } = useWallet()

  const { data: nonprofits, isLoading } = useQuery({
    queryKey: ["nonprofits", sortBy],
    queryFn: () => fetchNonprofits(sortBy),
  })

  // Filter nonprofits based on category and search query
  const filteredNonprofits = nonprofits?.filter((npo) => {
    const matchesCategory = categoryFilter === "All" || npo.category === categoryFilter
    const matchesSearch =
      searchQuery === "" ||
      npo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesCategory && matchesSearch
  })

  const categories = [
    "All",
    "Environment",
    "Education",
    "Water",
    "Infrastructure",
    "Disaster Relief",
    "Food",
    "Healthcare",
  ]

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-primary-50 rounded-lg p-6 mb-8 border border-primary-100 web3-bg relative overflow-hidden">
          <div className="absolute inset-0 hexagon-grid opacity-10"></div>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
            <div>
              <h1 className="text-2xl font-bold text-primary-800 mb-2">Explore Nonprofits</h1>
              <p className="text-primary-700">
                Discover and support transparent nonprofits making real impact. Ranked by reliability and success.
              </p>
            </div>
            
            {/* Wallet Connection Button */}
            {!isConnected ? (
              <Button 
                onClick={connectWallet} 
                disabled={isConnecting} 
                variant="gradient" 
                className="flex items-center gap-2 whitespace-nowrap md:self-start"
              >
                <Wallet className="w-4 h-4" />
                {isConnecting ? "Connecting..." : "Connect Wallet to Donate"}
              </Button>
            ) : (
              <div className="bg-primary-100 text-primary-800 px-3 py-2 rounded-lg text-sm flex flex-col md:self-start">
                <span className="font-medium">Connected: {selectedAccount?.meta.name || 'Account'}</span>
                <span className="text-xs truncate max-w-[200px]">{selectedAccount?.address.slice(0, 6)}...{selectedAccount?.address.slice(-4)}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-24">
              <h2 className="text-lg font-semibold mb-4">Filters</h2>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search nonprofits..."
                    className="pl-9"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-foreground mb-2">Category</label>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <div key={category} className="flex items-center">
                      <input
                        type="radio"
                        id={`category-${category}`}
                        name="category"
                        checked={categoryFilter === category}
                        onChange={() => setCategoryFilter(category)}
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500"
                      />
                      <label htmlFor={`category-${category}`} className="ml-2 text-sm text-foreground">
                        {category}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="rating">Auditor Rating</option>
                  <option value="successRate">Success Rate</option>
                  <option value="fundingWithheld">Least Funding Withheld</option>
                  <option value="totalRaised">Total Funds Raised</option>
                  <option value="completedProjects">Completed Projects</option>
                </select>
              </div>
            </div>
          </div>

          {/* Nonprofits List */}
          <div className="lg:col-span-3">
            <Tabs defaultValue="grid">
              <div className="flex justify-between items-center mb-6">
                <TabsList>
                  <TabsTrigger value="grid">Grid</TabsTrigger>
                  <TabsTrigger value="list">List</TabsTrigger>
                </TabsList>
                <div className="text-sm text-muted-foreground">{filteredNonprofits?.length || 0} nonprofits found</div>
              </div>

              <TabsContent value="grid" className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : filteredNonprofits && filteredNonprofits.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredNonprofits.map((nonprofit) => (
                      <NonprofitCard key={nonprofit.id} nonprofit={nonprofit} view="grid" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-foreground/70">
                    <p>No nonprofits match your filters.</p>
                    <p className="mt-1">Try adjusting your search criteria.</p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="list" className="mt-0">
                {isLoading ? (
                  <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-600"></div>
                  </div>
                ) : filteredNonprofits && filteredNonprofits.length > 0 ? (
                  <div className="space-y-4">
                    {filteredNonprofits.map((nonprofit) => (
                      <NonprofitCard key={nonprofit.id} nonprofit={nonprofit} view="list" />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-foreground/70">
                    <p>No nonprofits match your filters.</p>
                    <p className="mt-1">Try adjusting your search criteria.</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

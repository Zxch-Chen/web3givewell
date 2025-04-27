"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { useToast } from "@/components/ui/use-toast"
import { DonationModal } from "@/components/projects/donation-modal"
import { Star, AlertCircle, CheckCircle, TrendingUp } from "lucide-react"

interface Nonprofit {
  id: string
  name: string
  description: string
  logo: string
  category: string
  rating: number
  successRate: number
  fundingWithheld: number
  totalRaised: number
  completedProjects: number
  activeMilestones: number
  location: string
  tags: string[]
}

interface NonprofitCardProps {
  nonprofit: Nonprofit
  view: "grid" | "list"
}

export function NonprofitCard({ nonprofit, view }: NonprofitCardProps) {
  const { toast } = useToast()
  const [isDonationModalOpen, setIsDonationModalOpen] = useState(false)

  const handleFollow = () => {
    toast({
      title: "Following " + nonprofit.name,
      description: "You will now receive updates about this nonprofit.",
    })
  }

  return (
    <>
      <Card className={`overflow-hidden reactive-card ${view === "list" ? "flex flex-col md:flex-row" : ""}`}>
        <div className={view === "list" ? "md:w-1/4" : ""}>
          <div className={`${view === "list" ? "p-4" : "p-4 pb-0"}`}>
            <div className="flex items-center">
              <img
                src={nonprofit.logo || "/placeholder.svg"}
                alt={nonprofit.name}
                className="w-16 h-16 rounded-full object-cover border-2 border-primary-100"
              />
              <div className="ml-3">
                <h3 className="font-semibold text-lg">{nonprofit.name}</h3>
                <div className="flex items-center text-sm text-muted-foreground">
                  <span className="bg-primary-100 text-primary-800 text-xs px-2 py-0.5 rounded-full">
                    {nonprofit.category}
                  </span>
                  <span className="mx-2">•</span>
                  <span>{nonprofit.location}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <CardContent className={view === "list" ? "md:w-3/4 p-4" : "p-4"}>
          <p className="text-sm mb-4">{nonprofit.description}</p>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
            <div className="flex flex-col items-center p-2 bg-primary-50 rounded-md">
              <div className="flex items-center text-primary-700">
                <Star className="w-4 h-4 mr-1" />
                <span className="font-bold">{nonprofit.rating.toFixed(1)}</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">Auditor Rating</span>
            </div>

            <div className="flex flex-col items-center p-2 bg-green-50 rounded-md">
              <div className="flex items-center text-green-700">
                <CheckCircle className="w-4 h-4 mr-1" />
                <span className="font-bold">{nonprofit.successRate}%</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">Success Rate</span>
            </div>

            <div className="flex flex-col items-center p-2 bg-red-50 rounded-md">
              <div className="flex items-center text-red-700">
                <AlertCircle className="w-4 h-4 mr-1" />
                <span className="font-bold">{nonprofit.fundingWithheld}%</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">Funding Withheld</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-1 mb-4">
            {nonprofit.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs bg-gray-100 text-gray-800 px-2 py-0.5 rounded-full hover:bg-gray-200 cursor-pointer"
              >
                #{tag}
              </span>
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <TrendingUp className="w-4 h-4 mr-1" />
              <span>
                ${nonprofit.totalRaised.toLocaleString()} raised • {nonprofit.completedProjects} projects completed
              </span>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleFollow}>
                Follow
              </Button>
              <Button variant="gradient" size="sm" onClick={() => setIsDonationModalOpen(true)}>
                Donate
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <DonationModal nonprofit={nonprofit} isOpen={isDonationModalOpen} onClose={() => setIsDonationModalOpen(false)} />
    </>
  )
}

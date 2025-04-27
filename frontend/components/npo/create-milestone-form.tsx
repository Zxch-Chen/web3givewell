"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export function CreateMilestoneForm() {
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [milestone, setMilestone] = useState({
    title: "",
    description: "",
    amount: "",
  })

  // Mock ETH price - in a real app, this would come from an API
  const ethPrice = 3500

  const handleMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!milestone.title || !milestone.description || !milestone.amount) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1500))

      toast({
        title: "Milestone created",
        description: "Your milestone has been successfully created",
      })

      // Reset form
      setMilestone({
        title: "",
        description: "",
        amount: "",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create milestone. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Calculate ETH equivalent
  const ethAmount = milestone.amount ? (Number.parseFloat(milestone.amount) / ethPrice).toFixed(6) : "0"

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create New Milestone</CardTitle>
      </CardHeader>
      <form onSubmit={handleMilestoneSubmit}>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Title</label>
            <Input
              type="text"
              value={milestone.title}
              onChange={(e) => setMilestone({ ...milestone, title: e.target.value })}
              className="w-full"
              placeholder="Enter milestone title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <Textarea
              value={milestone.description}
              onChange={(e) => setMilestone({ ...milestone, description: e.target.value })}
              className="w-full"
              placeholder="Describe your milestone"
              rows={4}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Amount Needed (USD)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <Input
                type="number"
                value={milestone.amount}
                onChange={(e) => setMilestone({ ...milestone, amount: e.target.value })}
                className="pl-7"
                placeholder="Enter amount"
                min="0"
                step="0.01"
              />
            </div>
            <div className="flex justify-between mt-2 text-sm">
              <span className="text-muted-foreground">ETH Equivalent:</span>
              <span className="font-medium">{ethAmount} ETH</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">Based on current ETH price: ${ethPrice}</div>
          </div>
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isSubmitting} className="w-full" variant="gradient">
            {isSubmitting ? "Creating..." : "Create Milestone"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}

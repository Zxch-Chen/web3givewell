"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { Wallet, AlertCircle } from "lucide-react"

interface AddFundsProps {
  userType: "npo" | "auditor" | "donor"
}

export function AddFunds({ userType }: AddFundsProps) {
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [isConnecting, setIsConnecting] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [ethAmount, setEthAmount] = useState("0")

  // Mock ETH price - in a real app, this would come from an API
  const ethPrice = 3500

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
    // Calculate ETH equivalent
    if (value && !isNaN(Number.parseFloat(value))) {
      const eth = (Number.parseFloat(value) / ethPrice).toFixed(6)
      setEthAmount(eth)
    } else {
      setEthAmount("0")
    }
  }

  const connectWallet = async () => {
    setIsConnecting(true)

    try {
      // Simulate MetaMask connection
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Check if MetaMask is installed
      if (typeof window !== "undefined" && (window as any).ethereum) {
        toast({
          title: "Wallet connected",
          description: "MetaMask wallet connected successfully",
        })
        setIsConnected(true)
      } else {
        toast({
          title: "MetaMask not found",
          description: "Please install MetaMask to continue",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Connection failed",
        description: "Could not connect to MetaMask",
        variant: "destructive",
      })
    } finally {
      setIsConnecting(false)
    }
  }

  const addFunds = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Simulate transaction
      await new Promise((resolve) => setTimeout(resolve, 2000))

      toast({
        title: "Funds added",
        description: `Successfully added $${amount} (${ethAmount} ETH) to your account`,
      })

      // Reset form
      setAmount("")
      setEthAmount("0")
    } catch (error) {
      toast({
        title: "Transaction failed",
        description: "Could not process your transaction",
        variant: "destructive",
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-bold">Add Funds</CardTitle>
        <CardDescription>
          Add funds to your {userType === "npo" ? "nonprofit" : userType} account using MetaMask
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!isConnected ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium">Connect Your Wallet</h3>
                <p className="text-sm text-muted-foreground mt-1">Connect your MetaMask wallet to add funds</p>
              </div>
              <Button onClick={connectWallet} disabled={isConnecting} className="mt-2" variant="gradient">
                {isConnecting ? "Connecting..." : "Connect MetaMask"}
              </Button>
            </div>
          ) : (
            <>
              <Tabs defaultValue="usd" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="usd">USD</TabsTrigger>
                  <TabsTrigger value="eth">ETH</TabsTrigger>
                </TabsList>
                <TabsContent value="usd" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (USD)</label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="pl-7"
                        value={amount}
                        onChange={handleAmountChange}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">ETH Equivalent</span>
                      <span className="font-medium">{ethAmount} ETH</span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="eth" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (ETH)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={ethAmount}
                      onChange={(e) => {
                        setEthAmount(e.target.value)
                        if (e.target.value && !isNaN(Number.parseFloat(e.target.value))) {
                          const usd = (Number.parseFloat(e.target.value) * ethPrice).toFixed(2)
                          setAmount(usd)
                        } else {
                          setAmount("")
                        }
                      }}
                    />
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">USD Equivalent</span>
                      <span className="font-medium">${amount}</span>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="bg-primary-50 p-3 rounded-md flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-primary-800">
                  <p className="font-medium">Current ETH Price: ${ethPrice}</p>
                  <p className="mt-1">Gas fees may apply to your transaction.</p>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
      {isConnected && (
        <CardFooter>
          <Button
            onClick={addFunds}
            disabled={isProcessing || !amount || Number.parseFloat(amount) <= 0}
            className="w-full"
            variant="gradient"
          >
            {isProcessing ? "Processing..." : "Add Funds"}
          </Button>
        </CardFooter>
      )}
    </Card>
  )
}

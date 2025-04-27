"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Wallet, AlertCircle, ExternalLink, Check } from "lucide-react"
import { useWallet } from "@/lib/wallet/WalletProvider"
import { submitDonation } from "@/lib/api"
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button";

interface Nonprofit {
  id: string
  name: string
  logo: string
  // Other properties not needed for the modal
}

interface DonationModalProps {
  nonprofit: Nonprofit
  isOpen: boolean
  onClose: () => void
}

export function DonationModal({ nonprofit, isOpen, onClose }: DonationModalProps) {
  const { toast } = useToast()
  const [amount, setAmount] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [dotAmount, setDotAmount] = useState("0")
  const [donationSuccess, setDonationSuccess] = useState(false)
  const [transactionHash, setTransactionHash] = useState<string>("") 

  // Use our Polkadot wallet provider
  const { 
    isConnected, 
    isConnecting, 
    connectWallet, 
    selectedAccount,
    signMessage 
  } = useWallet()

  // Mock DOT price - in a real app, this would come from an API
  const dotPrice = 7.50 // Example price in USD

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      // Small delay before resetting the success state when closing
      const timer = setTimeout(() => {
        setDonationSuccess(false);
        setTransactionHash("");
      }, 300); // Delay matches the modal close animation
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setAmount(value)
    // Calculate DOT equivalent
    if (value && !isNaN(Number.parseFloat(value))) {
      const dot = (Number.parseFloat(value) / dotPrice).toFixed(4)
      setDotAmount(dot)
    } else {
      setDotAmount("0")
    }
  }

  const handleDonate = async () => {
    if (!amount || Number.parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount",
        variant: "destructive",
      })
      return
    }

    if (!selectedAccount || !signMessage) {
      toast({
        title: "Wallet not ready",
        description: "Please ensure your wallet is connected and an account is selected",
        variant: "destructive",
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create a donation message to sign (this would be verified on backend)
      const donationMessage = `I authorize a donation of ${dotAmount} DOT (${amount} USD) to ${nonprofit.name} (ID: ${nonprofit.id}) from account ${selectedAccount.address}`
      
      // Request signature from the user's wallet
      const signatureResult = await signMessage(donationMessage)
      
      if (!signatureResult) {
        throw new Error("Signature canceled or failed")
      }
      
      // Call the API to process the donation with the signature
      const donationResult = await submitDonation({
        npoId: nonprofit.id,
        amount: dotAmount,
        amountUsd: amount,
        donorAddress: selectedAccount.address,
        signature: signatureResult.signature,
        message: donationMessage,
      });
      
      if (!donationResult.success) {
        throw new Error(donationResult.message || "Donation failed");
      }
      
      // Set success state and store transaction hash
      setDonationSuccess(true);
      if (donationResult.transactionHash) {
        setTransactionHash(donationResult.transactionHash);
      }

      toast({
        title: "Donation successful",
        description: donationResult.message || `Thank you for donating ${dotAmount} DOT to ${nonprofit.name}!`,
      })

      // Reset form but don't close modal yet to show success state
      setAmount("")
      setDotAmount("0")
    } catch (error) {
      console.error("Donation failed:", error)
      toast({
        title: "Transaction failed",
        description: error instanceof Error ? error.message : "Could not process your donation",
        variant: "destructive",
      })
      setDonationSuccess(false);
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <img src={nonprofit.logo || "/placeholder.svg"} alt={nonprofit.name} className="w-8 h-8 rounded-full" />
            {donationSuccess ? "Donation Complete!" : `Donate to ${nonprofit.name}`}
          </DialogTitle>
          {!donationSuccess && (
            <DialogDescription>Support this nonprofit's mission and projects.</DialogDescription>
          )}
        </DialogHeader>

        <div className="space-y-4 py-4">
          {donationSuccess ? (
            <div className="flex flex-col items-center justify-center py-4 space-y-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium text-xl mb-2">Thank You!</h3>
                <p className="text-muted-foreground">
                  Your donation of <span className="font-medium">{dotAmount} DOT</span> to {nonprofit.name} has been processed.
                </p>
                {transactionHash && (
                  <div className="mt-4 bg-muted p-3 rounded-md">
                    <p className="text-sm font-medium mb-1">Transaction Hash:</p>
                    <p className="text-xs text-muted-foreground break-all font-mono">{transactionHash}</p>
                  </div>
                )}
              </div>
              <Button onClick={onClose} variant="outline" className="mt-4">Close</Button>
            </div>
          ) : !isConnected || !selectedAccount ? (
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center">
                <Wallet className="w-8 h-8 text-primary-600" />
              </div>
              <div className="text-center">
                <h3 className="font-medium">Connect Your Wallet</h3>
                <p className="text-sm text-muted-foreground mt-1">Connect your Polkadot wallet to donate</p>
              </div>
              <ConnectWalletButton 
                variant="gradient"
                size="sm"
                className="mt-2"
                fullWidth={false}
              />
              <p className="text-xs text-muted-foreground">
                Don't have the Polkadot.js extension?{" "}
                <a 
                  href="https://polkadot.js.org/extension/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary underline inline-flex items-center gap-0.5"
                >
                  Install it now <ExternalLink className="w-3 h-3" />
                </a>
              </p>
            </div>
          ) : (
            <>
              <div className="bg-muted p-3 rounded-md mb-3">
                <div className="font-medium text-sm">Connected Account:</div>
                <div className="text-sm truncate">{selectedAccount.meta.name || 'Account'}</div>
                <div className="text-xs text-muted-foreground truncate">{selectedAccount.address}</div>
              </div>
            
              <Tabs defaultValue="usd" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="usd">USD</TabsTrigger>
                  <TabsTrigger value="dot">DOT</TabsTrigger>
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
                      <span className="text-muted-foreground">DOT Equivalent</span>
                      <span className="font-medium">{dotAmount} DOT</span>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="dot" className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Amount (DOT)</label>
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={dotAmount}
                      onChange={(e) => {
                        setDotAmount(e.target.value)
                        if (e.target.value && !isNaN(Number.parseFloat(e.target.value))) {
                          const usd = (Number.parseFloat(e.target.value) * dotPrice).toFixed(2)
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
                <div className="text-sm">
                  <p className="text-primary-800">Your donation will be processed on the Polkadot blockchain.</p>
                  <p className="mt-1 text-muted-foreground">Funds will be held in escrow until milestones are completed.</p>
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          {!donationSuccess && (
            <>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              {isConnected && selectedAccount && (
                <Button onClick={handleDonate} disabled={isProcessing || !amount} variant="gradient">
                  {isProcessing ? "Processing..." : "Donate Now"}
                </Button>
              )}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

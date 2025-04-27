"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/layout/page-layout"
import Link from "next/link"

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const [selectedRole, setSelectedRole] = useState<"npo" | "auditor" | "donor" | null>(null)
  const [showInfo, setShowInfo] = useState(false)

  const handleLogin = async () => {
    if (!selectedRole) return
    await login(selectedRole)
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16 web3-bg">
        <div className="absolute inset-0 hexagon-grid opacity-30"></div>
        <div className="absolute inset-0 blockchain-nodes"></div>
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden gradient-border relative z-10">
          <div className="p-8 relative">
            <div className="absolute -top-48 -right-48 w-96 h-96 bg-green-radial opacity-40 pointer-events-none" />

            <h1 className="text-2xl font-bold text-center mb-6 bg-gradient-to-r from-primary-800 to-primary-500 bg-clip-text text-transparent">
              Login to ImpactChain
            </h1>

            <div className="mb-6">
              <label className="block text-sm font-medium text-foreground mb-2">Select Your Role</label>
              <div className="grid grid-cols-3 gap-3">
                <button
                  type="button"
                  className={`py-3 px-4 text-sm font-medium rounded-md border transition-all ${
                    selectedRole === "npo"
                      ? "bg-gradient-to-r from-primary-600 to-primary-400 border-primary-400 text-white shadow-lg shadow-primary-500/20"
                      : "border-gray-300 text-foreground/80 hover:bg-gray-50 hover:border-primary-400"
                  }`}
                  onClick={() => setSelectedRole("npo")}
                >
                  NPO
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 text-sm font-medium rounded-md border transition-all ${
                    selectedRole === "auditor"
                      ? "bg-gradient-to-r from-primary-600 to-primary-400 border-primary-400 text-white shadow-lg shadow-primary-500/20"
                      : "border-gray-300 text-foreground/80 hover:bg-gray-50 hover:border-primary-400"
                  }`}
                  onClick={() => setSelectedRole("auditor")}
                >
                  Auditor
                </button>
                <button
                  type="button"
                  className={`py-3 px-4 text-sm font-medium rounded-md border transition-all ${
                    selectedRole === "donor"
                      ? "bg-gradient-to-r from-primary-600 to-primary-400 border-primary-400 text-white shadow-lg shadow-primary-500/20"
                      : "border-gray-300 text-foreground/80 hover:bg-gray-50 hover:border-primary-400"
                  }`}
                  onClick={() => setSelectedRole("donor")}
                >
                  Donor
                </button>
              </div>
            </div>

            <Button
              onClick={handleLogin}
              disabled={!selectedRole || isLoading}
              className="w-full floating"
              variant="gradient"
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Connecting...
                </span>
              ) : (
                "Connect Wallet & Login"
              )}
            </Button>

            <div className="mt-4 text-center">
              <button
                onClick={() => setShowInfo(!showInfo)}
                className="text-xs text-primary-600 hover:text-primary-500 inline-flex items-center gap-1 dynamic-underline"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="10"></circle>
                  <path d="M12 16v-4"></path>
                  <path d="M12 8h.01"></path>
                </svg>
                How does login work?
              </button>

              {showInfo && (
                <div className="mt-3 p-3 bg-green-50 rounded-md text-xs text-green-800 animate-in fade-in">
                  This is a simulated login that mocks wallet connections. In a production app, it would integrate with
                  real blockchain wallets using libraries like ethers.js or Polkadot.js for SIWE (Sign-In With Ethereum)
                  or SIWP (Sign-In With Polkadot).
                </div>
              )}
            </div>

            <p className="mt-6 text-center text-sm text-foreground/70">
              Don't have an account?{" "}
              <Link href="/signup" className="text-primary-600 hover:text-primary-500 font-medium dynamic-underline">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

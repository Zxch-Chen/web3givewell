"use client"

import { useState } from "react"
import { useAuth } from "@/lib/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { PageLayout } from "@/components/layout/page-layout"
import Link from "next/link"

export default function SignupPage() {
  const { signup, isLoading } = useAuth()
  const [selectedRole, setSelectedRole] = useState<"npo" | "auditor" | "donor" | null>(null)
  const [metadataCid, setMetadataCid] = useState("")
  const [step, setStep] = useState(1)

  const handleContinue = () => {
    if (!selectedRole) return
    if (selectedRole === "npo") {
      setStep(2)
    } else {
      handleSignup()
    }
  }

  const handleSignup = async () => {
    if (!selectedRole) return
    await signup(selectedRole, selectedRole === "npo" ? metadataCid : undefined)
  }

  return (
    <PageLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-8">
            <h1 className="text-2xl font-bold text-center mb-6">Sign Up for ImpactChain</h1>

            {step === 1 ? (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">Select Your Role</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      className={`py-3 px-4 text-sm font-medium rounded-md border transition-colors ${
                        selectedRole === "npo"
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "border-gray-300 text-foreground/80 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedRole("npo")}
                    >
                      NPO
                    </button>
                    <button
                      type="button"
                      className={`py-3 px-4 text-sm font-medium rounded-md border transition-colors ${
                        selectedRole === "auditor"
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "border-gray-300 text-foreground/80 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedRole("auditor")}
                    >
                      Auditor
                    </button>
                    <button
                      type="button"
                      className={`py-3 px-4 text-sm font-medium rounded-md border transition-colors ${
                        selectedRole === "donor"
                          ? "bg-primary-50 border-primary-300 text-primary-700"
                          : "border-gray-300 text-foreground/80 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedRole("donor")}
                    >
                      Donor
                    </button>
                  </div>
                </div>

                <Button
                  onClick={handleContinue}
                  disabled={!selectedRole || isLoading}
                  className="w-full"
                  variant="gradient"
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-foreground mb-2">IPFS Metadata CID</label>
                  <input
                    type="text"
                    value={metadataCid}
                    onChange={(e) => setMetadataCid(e.target.value)}
                    placeholder="Enter your organization's IPFS metadata CID"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="mt-2 text-xs text-foreground/70">
                    This should be the CID of your organization's metadata stored on IPFS.
                  </p>
                </div>

                <div className="flex space-x-3">
                  <Button onClick={() => setStep(1)} variant="outline" className="flex-1">
                    Back
                  </Button>
                  <Button
                    onClick={handleSignup}
                    disabled={!metadataCid || isLoading}
                    className="flex-1"
                    variant="gradient"
                  >
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </div>
              </>
            )}

            <p className="mt-6 text-center text-sm text-foreground/70">
              Already have an account?{" "}
              <Link href="/login" className="text-primary-600 hover:text-primary-500 font-medium">
                Log in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </PageLayout>
  )
}

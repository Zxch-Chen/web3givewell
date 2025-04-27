"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type Role = "npo" | "auditor" | "donor" | null

interface User {
  address: string
  role: Role
}

interface AuthContextType {
  user: User | null
  isLoading: boolean
  connectWallet: () => Promise<string | null>
  login: (role: Role) => Promise<boolean>
  logout: () => void
  signup: (role: Role, metadataCid?: string) => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const { toast } = useToast()

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      try {
        const storedUser = localStorage.getItem("impactchain_user")
        if (storedUser) {
          setUser(JSON.parse(storedUser))
        }
      } catch (error) {
        console.error("Failed to restore auth state:", error)
      } finally {
        setIsLoading(false)
      }
    }

    checkAuth()
  }, [])

  const connectWallet = async (): Promise<string | null> => {
    try {
      // This is a placeholder for actual wallet connection logic
      // In a real implementation, you would use ethers.js, web3.js, or polkadot.js

      // Simulate wallet connection
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Return a mock address
      const mockAddress = "0x" + Math.random().toString(16).slice(2, 42)

      toast({
        title: "Wallet connected",
        description: `Connected to ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`,
      })

      return mockAddress
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast({
        title: "Connection failed",
        description: "Could not connect to wallet. Please try again.",
        variant: "destructive",
      })
      return null
    }
  }

  const signMessage = async (address: string, nonce: string): Promise<string> => {
    // This is a placeholder for actual signing logic
    // In a real implementation, you would use the wallet to sign the message

    // Simulate signing
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Return a mock signature
    return "0x" + Math.random().toString(16).slice(2, 130)
  }

  const login = async (role: Role): Promise<boolean> => {
    try {
      setIsLoading(true)

      // Connect wallet first
      const address = await connectWallet()
      if (!address) return false

      // Get nonce from backend
      // const nonceResponse = await fetch("/api/auth/nonce?address=" + address);
      // const { nonce } = await nonceResponse.json();
      const nonce = "random_nonce_" + Math.random().toString(16).slice(2, 10)

      // Sign the nonce
      const signature = await signMessage(address, nonce)

      // Verify signature with backend
      // const verifyResponse = await fetch("/api/auth/verify", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ address, nonce, signature, role }),
      // });

      // if (!verifyResponse.ok) throw new Error("Verification failed");

      // Simulate successful verification
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Set user state
      const newUser = { address, role }
      setUser(newUser)
      localStorage.setItem("impactchain_user", JSON.stringify(newUser))

      toast({
        title: "Login successful",
        description: `Logged in as ${role}`,
      })

      // Redirect to appropriate dashboard
      router.push(`/${role}/dashboard`)
      return true
    } catch (error) {
      console.error("Login failed:", error)
      toast({
        title: "Login failed",
        description: "Could not authenticate. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const signup = async (role: Role, metadataCid?: string): Promise<boolean> => {
    try {
      setIsLoading(true)

      // Connect wallet first
      const address = await connectWallet()
      if (!address) return false

      // Different signup endpoints based on role
      let endpoint = "/api/auth/signup"
      const body: any = { address, role }

      if (role === "npo" && metadataCid) {
        endpoint = "/api/npo"
        body.metadataCid = metadataCid
      }

      // Simulate API call
      // const response = await fetch(endpoint, {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify(body),
      // });

      // if (!response.ok) throw new Error("Signup failed");

      // Simulate successful signup
      await new Promise((resolve) => setTimeout(resolve, 1000))

      toast({
        title: "Signup successful",
        description: `Registered as ${role}`,
      })

      // Auto login after signup
      return await login(role)
    } catch (error) {
      console.error("Signup failed:", error)
      toast({
        title: "Signup failed",
        description: "Could not register. Please try again.",
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem("impactchain_user")
    router.push("/login")
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    })
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        connectWallet,
        login,
        logout,
        signup,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import dynamic from 'next/dynamic';
import { ThemeProvider } from "next-themes"
import React, { useState } from "react"
import { Toaster } from "@/components/ui/sonner"
import { AuthProvider } from "@/lib/auth/auth-provider"

// Dynamically import WalletProvider with SSR disabled
const WalletProvider = dynamic(
  () => import('@/lib/wallet/WalletProvider').then((mod) => mod.WalletProvider),
  {
    ssr: false,
    loading: () => (
      <div className="flex justify-center items-center h-screen">
        <p>Initializing Wallet...</p>
      </div>
    ), // Basic loading indicator
  }
);

// Dynamically import RoleRedirectHandler with SSR disabled
const RoleRedirectHandler = dynamic(
  () => import('@/components/auth/RoleRedirectHandler').then((mod) => mod.RoleRedirectHandler),
  { ssr: false }
  // No loading needed as it renders null
);

interface ProvidersProps {
  children: React.ReactNode
}

export function Providers({ children }: ProvidersProps) {
  // Ensure QueryClient is only created once per component lifecycle
  const [queryClient] = useState(() => new QueryClient())

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <WalletProvider appName="Web3GiveWell">
              <RoleRedirectHandler />
              {children}
              {/* Toaster can access context from providers above */}
              <Toaster richColors position="top-right" /> 
          </WalletProvider>
        </AuthProvider>
        {/* Devtools should be inside QueryClientProvider */}
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}

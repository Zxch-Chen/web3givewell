"use client"

import Link from "next/link"
// import { useAuth } from "@/lib/auth/auth-provider" // Keep for now, but wallet is primary
import { useWallet } from "@/lib/wallet/WalletProvider"; // Added wallet hook
import { Button } from "@/components/ui/button"
import { ConnectWalletButton } from "@/components/wallet/connect-wallet-button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname } from "next/navigation"
import { useState, useEffect } from "react"
import { Menu, X, User, LogOut, Copy, Check, Wallet } from "lucide-react"
import { toast } from "sonner"; // Assuming sonner is used for toasts

// Helper to truncate address
const truncateAddress = (address: string, chars = 4) => {
  if (!address) return "";
  return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
};

export function Header() {
  // const { user, logout } = useAuth() // Keep for potential future use
  const {
    accounts,
    selectedAccount,
    isConnected,
    isConnecting,
    error,
    connectWallet,
    disconnectWallet,
    selectAccount,
  } = useWallet();

  const pathname = usePathname()
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false);
  const [hasMounted, setHasMounted] = useState(false); // Added mounted state

  // Set mounted state only runs on the client
  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    if (error) {
        toast.error(`Wallet Error: ${error}`);
        // Optionally clear the error in the provider after showing it
    }
  }, [error]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const isActive = (path: string) => {
    return pathname === path
  }

  const renderWalletConnector = (isMobile = false) => {
    if (isConnected && selectedAccount) {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className={`w-full ${!isMobile ? 'md:w-auto' : ''}`}>
              <Wallet className="mr-2 h-4 w-4" />
              {truncateAddress(selectedAccount.address)}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="flex items-center">
                Account
                <Button variant="ghost" size="icon" className="ml-auto h-6 w-6" onClick={() => handleCopy(selectedAccount.address)}>
                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {accounts.length > 1 && (
                <DropdownMenuLabel>Switch Account</DropdownMenuLabel>
            )}
            {accounts.filter(acc => acc.address !== selectedAccount.address).map(account => (
                <DropdownMenuItem key={account.address} onClick={() => selectAccount(account)}>
                    {account.meta.name} ({truncateAddress(account.address)})
                </DropdownMenuItem>
            ))}
            {accounts.length > 1 && <DropdownMenuSeparator />}
            <DropdownMenuItem onClick={disconnectWallet} className="text-red-600 focus:text-red-700 focus:bg-red-50">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    } else if (isConnected && !selectedAccount) {
        // Connected, but no account selected (or needs selection confirmation)
        return (
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className={`w-full ${!isMobile ? 'md:w-auto' : ''}`}>
                        <User className="mr-2 h-4 w-4" /> Select Account
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Available Accounts</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {accounts.map(account => (
                        <DropdownMenuItem key={account.address} onClick={() => selectAccount(account)}>
                            {account.meta.name} ({truncateAddress(account.address)})
                        </DropdownMenuItem>
                    ))}
                    {accounts.length === 0 && <DropdownMenuItem disabled>No accounts found</DropdownMenuItem>}
                </DropdownMenuContent>
             </DropdownMenu>
        );
    } else {
      // Not connected
      return (
        <ConnectWalletButton
          variant={isMobile ? 'gradient' : 'default'}
          size="sm"
          className={`${isMobile ? 'w-full' : 'md:w-auto'}`}
        />
      );
    }
  };

  // Placeholder for wallet connector before mounting
  const renderWalletPlaceholder = (isMobile = false) => (
    <Button disabled variant={isMobile ? "gradient" : "default"} size="sm" className={`w-full ${!isMobile ? 'md:w-auto' : ''}`}>
      Loading Wallet...
    </Button>
  );

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-200 ${isScrolled ? "bg-background/80 backdrop-blur-md shadow-sm" : "bg-background" // Use theme background
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-primary/70 flex items-center justify-center"> {/* Use theme primary */} 
              <span className="text-primary-foreground font-bold">IC</span>
            </div>
            <span className="text-xl font-bold text-primary">ImpactChain</span> {/* Use theme primary */} 
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/") ? "text-primary" : "text-foreground/80"
              }`}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/about") ? "text-primary" : "text-foreground/80"
              }`}
            >
              About
            </Link>
            <Link
              href="/projects"
              className={`text-sm font-medium transition-colors hover:text-primary ${isActive("/projects") ? "text-primary" : "text-foreground/80"
              }`}
            >
              Projects
            </Link>
            {/* Wallet Connector replaces Login/Signup */}
            {/* Only render wallet UI after mounting */}
            {hasMounted ? renderWalletConnector() : renderWalletPlaceholder()} 
          </nav>

          {/* Mobile Menu Button */}
          <button className="md:hidden" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen ? (
              <X className="h-6 w-6 text-foreground" />
            ) : (
              <Menu className="h-6 w-6 text-foreground" />
            )}
          </button>
        </div>

        {/* Mobile Navigation */} 
        {isMobileMenuOpen && (
          <nav className="md:hidden pt-4 pb-2 space-y-4">
            <Link
              href="/"
              className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${isActive("/") ? "text-primary" : "text-foreground/80"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/about"
              className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${isActive("/about") ? "text-primary" : "text-foreground/80"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/projects"
              className={`block py-2 text-sm font-medium transition-colors hover:text-primary ${isActive("/projects") ? "text-primary" : "text-foreground/80"
              }`}
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Projects
            </Link>
             {/* Wallet Connector replaces Login/Signup */} 
            <div onClick={() => setIsMobileMenuOpen(false)}> {/* Close menu on action */} 
                 {/* Only render wallet UI after mounting */}
                {hasMounted ? renderWalletConnector(true) : renderWalletPlaceholder(true)}
            </div>
          </nav>
        )}
      </div>
    </header>
  )
}

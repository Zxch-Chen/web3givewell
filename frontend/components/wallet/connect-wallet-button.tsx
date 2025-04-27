"use client"

import React from "react";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/lib/wallet/WalletProvider";
import { Wallet } from "lucide-react";

interface ConnectWalletButtonProps {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link" | "gradient";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  fullWidth?: boolean;
}

/**
 * A shared button component for connecting to Polkadot wallet
 * This ensures consistent behavior across different parts of the application
 */
export function ConnectWalletButton({
  variant = "default",
  size = "sm",
  className = "",
  fullWidth = false
}: ConnectWalletButtonProps) {
  // Use the wallet context
  const {
    connectWallet,
    isConnecting,
  } = useWallet();

  // The actual onClick handler used in the header
  const handleConnect = () => {
    console.log("Connect wallet clicked - using shared component");
    connectWallet();
  };

  return (
    <Button
      onClick={handleConnect}
      disabled={isConnecting}
      variant={variant}
      size={size}
      className={`${fullWidth ? 'w-full' : ''} ${className}`}
    >
      <Wallet className="mr-2 h-4 w-4" />
      {isConnecting ? "Connecting..." : "Connect Wallet"}
    </Button>
  );
}

/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import React, { createContext, useState, useContext, useEffect, useCallback, ReactNode } from 'react';
import {
  web3Accounts,
  web3Enable,
  web3FromSource,
} from '@polkadot/extension-dapp';
import type {
  InjectedAccountWithMeta,
  InjectedExtension,
} from '@polkadot/extension-inject/types';
import type { Signer } from '@polkadot/types/types';
import { fetchUserRole } from '@/lib/api'; // Import API function

// Track global web3Enable state
let enablePromise: Promise<InjectedExtension[]> | null = null;

interface WalletContextState {
  accounts: InjectedAccountWithMeta[];
  selectedAccount: InjectedAccountWithMeta | null;
  signer: Signer | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  userRole: string | null; // Added user role
  isLoadingRole: boolean; // Added loading state for role
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  selectAccount: (account: InjectedAccountWithMeta) => Promise<void>;
  signMessage: (message: string) => Promise<{ signature: string } | null>;
  setUserRoleState: (role: string | null) => void; // Added function to set role state manually
}

const WalletContext = createContext<WalletContextState | undefined>(undefined);

interface WalletProviderProps {
  children: ReactNode;
  appName: string; // Name of your DApp
}

export const WalletProvider: React.FC<WalletProviderProps> = ({ children, appName }) => {
  const [accounts, setAccounts] = useState<InjectedAccountWithMeta[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<InjectedAccountWithMeta | null>(null);
  const [signer, setSigner] = useState<Signer | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null); // Added role state
  const [isLoadingRole, setIsLoadingRole] = useState<boolean>(false); // Added loading state

  const handleConnectionError = (err: unknown) => {
    console.error("Wallet Connection Error:", err);
    setError(err instanceof Error ? err.message : 'An unknown error occurred during wallet connection.');
    setIsConnected(false);
    setAccounts([]);
    setSelectedAccount(null);
    setSigner(null);
    setUserRole(null); // Reset role on disconnect
    setIsLoadingRole(false);
    setError(null);
    // Reset the global enable promise
    enablePromise = null;
  };

  const connectWallet = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Log connection attempts for debugging
      console.log('Attempting to connect wallet with appName:', appName);
      
      // Use or create a global enable promise to prevent multiple simultaneous connection attempts
      if (!enablePromise) {
        console.log('Creating new web3Enable promise');
        enablePromise = web3Enable(appName);
      } else {
        console.log('Using existing web3Enable promise');
      }
      
      // Wait for the enable promise to resolve
      const extensions = await enablePromise;
      console.log('Extensions enabled:', extensions.length > 0 ? 'Yes' : 'No');
      
      if (extensions.length === 0) {
        setError(
          'No wallet extension found. Please install a Polkadot compatible extension (e.g., Polkadot.js, Talisman).'
        );
        enablePromise = null; // Reset on failure
        setIsConnecting(false);
        return;
      }

      // Get all available accounts
      const allAccounts = await web3Accounts();
      console.log('Accounts found:', allAccounts.length);
      setAccounts(allAccounts);

      if (allAccounts.length > 0) {
        // Optionally auto-select the first account or load from local storage
        // For now, we just mark as connected and let the user select
        setIsConnected(true);
      } else {
        setError('No accounts found in the connected wallet. Please create or import an account in your extension.');
        enablePromise = null; // Reset on failure
      }
    } catch (err) {
      handleConnectionError(err);
      enablePromise = null; // Reset on error
    } finally {
      setIsConnecting(false);
    }
  }, [appName]);

  const disconnectWallet = useCallback(() => {
    setIsConnected(false);
    setAccounts([]);
    setSelectedAccount(null);
    setSigner(null);
    setUserRole(null); // Reset role on disconnect
    setIsLoadingRole(false);
    setError(null);
    // Reset the global enable promise
    enablePromise = null;
  }, []);

  // Function to manually update role state (e.g., after successful setting)
  const setUserRoleState = useCallback((role: string | null) => {
    setUserRole(role);
  }, []);

  const selectAccount = useCallback(async (account: InjectedAccountWithMeta) => {
    if (!isConnected) {
        setError('Wallet not connected.');
        return;
    }
    setSelectedAccount(account);
    setUserRole(null); // Reset role while loading new account info
    setIsLoadingRole(true); // Start loading role
    setError(null); // Clear previous errors

    try {
      const injector = await web3FromSource(account.meta.source);
      setSigner(injector.signer);
      // Optionally save selected account to local storage

      // Fetch user role after setting signer
      try {
        const roleData = await fetchUserRole(account.address);
        setUserRole(roleData.role); // Set role from API response
      } catch (roleError) {
          console.error("Failed to fetch user role:", roleError);
          setError('Failed to fetch user role information.');
          setUserRole(null); // Ensure role is null on fetch error
      }

    } catch (err) {
       console.error("Error getting signer:", err);
       setError(err instanceof Error ? err.message : 'Failed to get signer for the account.');
       setSelectedAccount(null); // Reset selection on error
       setSigner(null);
       setUserRole(null);
    } finally {
        setIsLoadingRole(false); // Stop loading role regardless of outcome
    }
  }, [isConnected]);

  const signMessage = useCallback(async (message: string): Promise<{ signature: string } | null> => {
    if (!signer || !selectedAccount) {
      setError('No account selected or signer not available.');
      console.error('Sign Message Error: No account selected or signer not available.');
      return null;
    }

    if (!signer.signRaw) {
        setError('The selected account does not support signing messages (signRaw).');
        console.error('Sign Message Error: signRaw not available on signer.');
        return null;
    }

    try {
      const { signature } = await signer.signRaw({
        address: selectedAccount.address,
        data: message, // Simple string message
        type: 'bytes', // Signing arbitrary bytes/string
      });
      setError(null); // Clear previous errors on success
      return { signature };
    } catch (err) {
      console.error('Error signing message:', err);
      setError(err instanceof Error ? err.message : 'Failed to sign message.');
      return null;
    }
  }, [signer, selectedAccount]);

  // Auto-initialize connection if window defined (client-side only)
  // Disabled for now - don't auto-reconnect on page refresh
  /*
  useEffect(() => {
    // Do nothing on server side
    if (typeof window === 'undefined') return;

    // Try to auto-connect without showing loading state
    const autoConnect = async () => {
      try {
        // Use a cached promise if exists
        if (!enablePromise) {
          enablePromise = web3Enable(appName);
        }
        
        const extensions = await enablePromise;
        if (extensions.length > 0) {
          const accounts = await web3Accounts();
          if (accounts.length > 0) {
            setAccounts(accounts);
            setIsConnected(true);
            // Optionally load selected account from local storage here
          }
        }
      } catch (err) {
        console.error('Auto-connect failed:', err);
        enablePromise = null; // Reset on error
      }
    };

    autoConnect();
  }, [appName]);
  */

  return (
    <WalletContext.Provider
      value={{
        accounts,
        selectedAccount,
        signer,
        isConnected,
        isConnecting,
        error,
        userRole, // Pass role state
        isLoadingRole, // Pass loading state
        connectWallet,
        disconnectWallet,
        selectAccount,
        signMessage,
        setUserRoleState, // Pass manual set function
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = (): WalletContextState => {
  const context = useContext(WalletContext);
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

'use client';

import { useEffect, useState } from 'react';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function GovernanceTokens() {
  const [loading, setLoading] = useState(false);
  const [tokens, setTokens] = useState<any[]>([]);
  const [account, setAccount] = useState('');

  useEffect(() => {
    // Initialize on component mount
    loadTokens();
  }, []);

  async function loadTokens() {
    try {
      setLoading(true);
      
      // Connect to wallet
      await web3Enable('ImpactChain');
      const accounts = await web3Accounts();
      
      if (accounts.length > 0) {
        setAccount(accounts[0].address);
        
        // Connect to Asset Hub
        const provider = new WsProvider('wss://rococo-asset-hub-rpc.polkadot.io');
        const api = await ApiPromise.create({ provider });
        
        // Get NPO's governance tokens - we'd need to query your contract to get token IDs
        // For demo, let's assume token IDs 1-5 are governance tokens
        const tokenIds = [1, 2, 3, 4, 5];
        const tokensData = [];
        
        for (const id of tokenIds) {
          // Check if this account has this token
          const accountData = await api.query.assets.account(id, accounts[0].address);
          const accountJson = accountData.toJSON();
          
          if (accountJson) {
            // Get token metadata
            const metadata = await api.query.assets.metadata(id);
            const metadataJson = metadata.toJSON();
            
            tokensData.push({
              id,
              balance: accountJson.balance,
              name: metadataJson.name ? new TextDecoder().decode(new Uint8Array(metadataJson.name)) : `Token ${id}`,
              symbol: metadataJson.symbol ? new TextDecoder().decode(new Uint8Array(metadataJson.symbol)) : 'GOV',
              decimals: metadataJson.decimals || 18
            });
          }
        }
        
        setTokens(tokensData);
        await api.disconnect();
      }
    } catch (error) {
      console.error('Error loading tokens:', error);
    } finally {
      setLoading(false);
    }
  }

  // Format balance with proper decimals
  function formatBalance(balance: number, decimals: number) {
    return (balance / Math.pow(10, decimals)).toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4
    });
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Governance Tokens</CardTitle>
            <CardDescription>Your governance positions and voting power</CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={loadTokens} 
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            <Skeleton className="h-[60px] w-full rounded-md" />
            <Skeleton className="h-[60px] w-full rounded-md" />
          </div>
        ) : tokens.length > 0 ? (
          <div className="space-y-3">
            {tokens.map(token => (
              <div key={token.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{token.name}</h3>
                    <Badge variant="outline">{token.symbol}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">ID: {token.id}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">
                    {formatBalance(token.balance, token.decimals)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {(token.balance * 100 / 1000000).toFixed(2)}% voting power
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/20 rounded-md">
            <p className="text-muted-foreground">No governance tokens found</p>
            <p className="text-sm text-muted-foreground mt-1">Register an NPO to receive governance tokens</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

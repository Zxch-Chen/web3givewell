'use client';

import { useState, useEffect } from 'react';
import { NPOGovernanceService } from '../services/npo-governance-service';
import { web3Accounts, web3Enable } from '@polkadot/extension-dapp';
import { ContractPromise } from '@polkadot/api-contract';
import { ApiPromise, WsProvider } from '@polkadot/api';

// This is a placeholder. You would replace this with your actual contract ABI
const NPO_CONTRACT_ABI = {
  "source": {
    "hash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "language": "ink! 4.3.0",
    "compiler": "rustc 1.75.0-nightly"
  },
  "contract": {
    "name": "npo_registry",
    "version": "0.1.0",
    "authors": [
      "ImpactChain Team"
    ]
  },
  "spec": {
    "constructors": [
      {
        "args": [
          {
            "label": "auditor_registry",
            "type": {
              "displayName": ["AccountId"],
              "type": 0
            }
          }
        ],
        "docs": ["Create a new NPO Registry contract"],
        "label": "new",
        "payable": false,
        "returnType": null,
        "selector": "0x9bae9d5e"
      }
    ],
    "docs": [],
    "events": [
      {
        "args": [
          {
            "docs": ["The account ID of the NPO"],
            "indexed": true,
            "label": "npo",
            "type": {
              "displayName": ["AccountId"],
              "type": 0
            }
          },
          {
            "docs": ["The ID of the governance token created"],
            "indexed": true,
            "label": "token_id",
            "type": {
              "displayName": ["u32"],
              "type": 4
            }
          },
          {
            "docs": ["Name of the NPO"],
            "indexed": false,
            "label": "name",
            "type": {
              "displayName": ["String"],
              "type": 10
            }
          }
        ],
        "docs": ["Event emitted when a new NPO is registered"],
        "label": "NPORegistered"
      },
      {
        "args": [
          {
            "docs": ["The ID of the governance token"],
            "indexed": true,
            "label": "token_id",
            "type": {
              "displayName": ["u32"],
              "type": 4
            }
          },
          {
            "docs": ["The NPO that received 75% of tokens"],
            "indexed": true,
            "label": "npo",
            "type": {
              "displayName": ["AccountId"],
              "type": 0
            }
          },
          {
            "docs": ["Amount of tokens distributed to the NPO"],
            "indexed": false,
            "label": "npo_amount",
            "type": {
              "displayName": ["Balance"],
              "type": 6
            }
          },
          {
            "docs": ["Number of auditors that received tokens"],
            "indexed": false,
            "label": "auditor_count",
            "type": {
              "displayName": ["u32"],
              "type": 4
            }
          },
          {
            "docs": ["Amount of tokens distributed per auditor"],
            "indexed": false,
            "label": "per_auditor_amount",
            "type": {
              "displayName": ["Balance"],
              "type": 6
            }
          }
        ],
        "docs": ["Event emitted when governance tokens are distributed"],
        "label": "TokensDistributed"
      }
    ],
    "messages": [
      {
        "args": [
          {
            "label": "name",
            "type": {
              "displayName": ["String"],
              "type": 10
            }
          },
          {
            "label": "description_cid",
            "type": {
              "displayName": ["String"],
              "type": 10
            }
          },
          {
            "label": "legal_id",
            "type": {
              "displayName": ["Option"],
              "type": 11
            }
          },
          {
            "label": "categories",
            "type": {
              "displayName": ["Vec"],
              "type": 12
            }
          },
          {
            "label": "country",
            "type": {
              "displayName": ["String"],
              "type": 10
            }
          },
          {
            "label": "token_name",
            "type": {
              "displayName": ["String"],
              "type": 10
            }
          },
          {
            "label": "token_symbol",
            "type": {
              "displayName": ["String"],
              "type": 10
            }
          },
          {
            "label": "token_description",
            "type": {
              "displayName": ["String"],
              "type": 10
            }
          },
          {
            "label": "token_icon_cid",
            "type": {
              "displayName": ["Option"],
              "type": 11
            }
          }
        ],
        "docs": ["Register a new NPO and create its governance token"],
        "label": "register_npo",
        "mutates": true,
        "payable": false,
        "returnType": {
          "displayName": ["Result"],
          "type": 7
        },
        "selector": "0x1de5c531"
      },
      {
        "args": [
          {
            "label": "npo",
            "type": {
              "displayName": ["AccountId"],
              "type": 0
            }
          }
        ],
        "docs": ["Get the details of an NPO"],
        "label": "get_npo",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": ["Option"],
          "type": 8
        },
        "selector": "0x3ca6267e"
      },
      {
        "args": [
          {
            "label": "token_id",
            "type": {
              "displayName": ["u32"],
              "type": 4
            }
          }
        ],
        "docs": ["Get the metadata for a token"],
        "label": "get_token_metadata",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": ["Option"],
          "type": 9
        },
        "selector": "0xa3e38695"
      },
      {
        "args": [],
        "docs": ["Get the total number of registered NPOs"],
        "label": "get_npo_count",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": ["u32"],
          "type": 4
        },
        "selector": "0x968f7280"
      },
      {
        "args": [
          {
            "label": "account",
            "type": {
              "displayName": ["AccountId"],
              "type": 0
            }
          }
        ],
        "docs": ["Check if an account is a registered NPO"],
        "label": "is_registered_npo",
        "mutates": false,
        "payable": false,
        "returnType": {
          "displayName": ["bool"],
          "type": 13
        },
        "selector": "0x34af6cf9"
      }
    ]
  },
  "types": [
    {
      "id": 0,
      "type": {
        "def": {
          "composite": {
            "fields": [
              {
                "type": 1,
                "typeName": "[u8; 32]"
              }
            ]
          }
        },
        "path": ["ink_primitives", "types", "AccountId"]
      }
    },
    // ...more type definitions
  ]
};

// Replace with your deployed contract address after deployment
let NPO_CONTRACT_ADDRESS = '';

export default function TestAssetHub() {
  const [service, setService] = useState<NPOGovernanceService | null>(null);
  const [account, setAccount] = useState('');
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');
  const [contractAddress, setContractAddress] = useState('');
  const [tokenId, setTokenId] = useState<number | null>(null);
  const [assetBalance, setAssetBalance] = useState<string | null>(null);

  // For NPO registration
  const [npoData, setNpoData] = useState({
    name: 'Test NPO',
    descriptionCid: 'QmTest123',
    legalId: '12345',
    categories: ['Environment', 'Education'],
    country: 'Global',
    tokenName: 'Test Governance Token',
    tokenSymbol: 'TGT',
    tokenDescription: 'Governance token for Test NPO',
    tokenIconCid: 'QmIconTest123'
  });

  // Connect to wallet and initialize service
  const connectWallet = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Enable the extension
      const injectedExtensions = await web3Enable('NPO Governance App');
      
      if (injectedExtensions.length === 0) {
        throw new Error('No wallet extension found. Please install Polkadot.js extension.');
      }
      
      // Get all accounts
      const allAccounts = await web3Accounts();
      setAccounts(allAccounts);
      
      if (allAccounts.length > 0) {
        // Set default account to first one
        setAccount(allAccounts[0].address);
      } else {
        throw new Error('No accounts found. Please create an account in the Polkadot.js extension.');
      }
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Initialize the service
  const initializeService = async () => {
    if (!contractAddress || !account) {
      setError('Please enter contract address and connect wallet first');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // Find the selected account in accounts array
      const selectedAccount = accounts.find(acc => acc.address === account);
      
      if (!selectedAccount) {
        throw new Error('Selected account not found');
      }
      
      // Initialize the service
      const service = new NPOGovernanceService();
      await service.initialize(
        'wss://rococo-contracts-rpc.polkadot.io',
        'wss://rococo-asset-hub-rpc.polkadot.io',
        contractAddress,
        NPO_CONTRACT_ABI
      );
      
      // Set the account
      service.setAccount(selectedAccount);
      setService(service);
      
      setResult('Service initialized successfully');
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Register a new NPO
  const registerNPO = async () => {
    if (!service) {
      setError('Service not initialized');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await service.registerNPO(npoData);
      setResult(result);
      
      if (result.tokenId) {
        setTokenId(result.tokenId);
      }
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Get NPO details
  const getNPODetails = async () => {
    if (!service) {
      setError('Service not initialized');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const npoDetails = await service.getNPODetails(account);
      setResult(npoDetails);
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Check token balance (direct Asset Hub call)
  const checkTokenBalance = async () => {
    if (!tokenId) {
      setError('No token ID available');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      // Create a direct connection to Asset Hub
      const provider = new WsProvider('wss://rococo-asset-hub-rpc.polkadot.io');
      const api = await ApiPromise.create({ provider });
      
      // Query the asset balance
      const balanceData = await api.query.assets.account(tokenId, account);
      const balanceJson = balanceData.toJSON();
      
      // Extract and display the balance
      setAssetBalance(balanceJson ? JSON.stringify(balanceJson) : 'No balance found');
      setResult({ tokenId, balanceData: balanceJson });
      
      // Clean up
      await api.disconnect();
    } catch (err: any) {
      setError(err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Handle input change for contract address
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setContractAddress(e.target.value);
  };

  // Handle input change for NPO data
  const handleNpoDataChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, field: string) => {
    if (field === 'categories') {
      // Split comma-separated values into array
      setNpoData({
        ...npoData,
        [field]: e.target.value.split(',')
      });
    } else {
      setNpoData({
        ...npoData,
        [field]: e.target.value
      });
    }
  };

  // Handle account selection
  const handleAccountChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAccount(e.target.value);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Asset Hub Integration Test</h1>
      
      {/* Step 1: Connect Wallet */}
      <div className="mb-8 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Step 1: Connect Wallet</h2>
        
        {accounts.length === 0 ? (
          <button 
            onClick={connectWallet}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            {loading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        ) : (
          <div>
            <p className="mb-2">Select Account:</p>
            <select 
              value={account} 
              onChange={handleAccountChange}
              className="w-full p-2 border rounded mb-2"
            >
              {accounts.map((acc) => (
                <option key={acc.address} value={acc.address}>
                  {acc.meta.name} ({acc.address.substring(0, 10)}...)
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-600 mt-2">Connected: {account}</p>
          </div>
        )}
      </div>
      
      {/* Step 2: Initialize Service */}
      <div className="mb-8 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Step 2: Enter Contract Address & Initialize</h2>
        
        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Contract Address:</label>
          <input
            type="text"
            value={contractAddress}
            onChange={handleAddressChange}
            placeholder="5GTh...7Udg"
            className="w-full p-2 border rounded"
          />
          <p className="text-sm text-gray-500 mt-1">This is the address of your deployed NPO Registry contract</p>
        </div>
        
        <button 
          onClick={initializeService}
          disabled={loading || !account || !contractAddress}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? 'Initializing...' : 'Initialize Service'}
        </button>
      </div>
      
      {/* Step 3: Register NPO */}
      <div className="mb-8 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Step 3: Register NPO & Create Token</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-1">NPO Name:</label>
            <input
              type="text"
              value={npoData.name}
              onChange={(e) => handleNpoDataChange(e, 'name')}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Legal ID:</label>
            <input
              type="text"
              value={npoData.legalId}
              onChange={(e) => handleNpoDataChange(e, 'legalId')}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Categories (comma-separated):</label>
            <input
              type="text"
              value={npoData.categories.join(',')}
              onChange={(e) => handleNpoDataChange(e, 'categories')}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Country:</label>
            <input
              type="text"
              value={npoData.country}
              onChange={(e) => handleNpoDataChange(e, 'country')}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Description CID:</label>
            <input
              type="text"
              value={npoData.descriptionCid}
              onChange={(e) => handleNpoDataChange(e, 'descriptionCid')}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Token Name:</label>
            <input
              type="text"
              value={npoData.tokenName}
              onChange={(e) => handleNpoDataChange(e, 'tokenName')}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Token Symbol:</label>
            <input
              type="text"
              value={npoData.tokenSymbol}
              onChange={(e) => handleNpoDataChange(e, 'tokenSymbol')}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium mb-1">Token Description:</label>
            <input
              type="text"
              value={npoData.tokenDescription}
              onChange={(e) => handleNpoDataChange(e, 'tokenDescription')}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <button 
          onClick={registerNPO}
          disabled={loading || !service}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
        >
          {loading ? 'Registering...' : 'Register NPO & Create Token'}
        </button>
      </div>
      
      {/* Step 4: Verify Results */}
      <div className="mb-8 p-6 border rounded-lg bg-gray-50">
        <h2 className="text-xl font-semibold mb-4">Step 4: Verify Results</h2>
        
        <div className="flex flex-wrap gap-2 mb-4">
          <button 
            onClick={getNPODetails}
            disabled={loading || !service}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Get NPO Details
          </button>
          
          <button 
            onClick={checkTokenBalance}
            disabled={loading || !tokenId}
            className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md disabled:opacity-50"
          >
            Check Token Balance
          </button>
        </div>
        
        {tokenId && (
          <div className="mb-4 p-3 bg-blue-50 rounded border border-blue-200">
            <p className="font-medium">Created Token ID: {tokenId}</p>
            {assetBalance && (
              <p className="mt-2">Token Balance: {assetBalance}</p>
            )}
          </div>
        )}
      </div>
      
      {/* Results and Error Display */}
      <div className="mt-8">
        {error && (
          <div className="p-4 bg-red-100 text-red-700 rounded mb-4">
            <h3 className="font-bold">Error:</h3>
            <p>{error}</p>
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-green-100 text-green-700 rounded">
            <h3 className="font-bold">Result:</h3>
            <pre className="mt-2 overflow-auto p-2 bg-white rounded">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

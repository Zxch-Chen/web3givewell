import { ApiPromise, WsProvider } from '@polkadot/api';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { web3FromSource } from '@polkadot/extension-dapp';

/**
 * Service for interacting with Polkadot Asset Hub
 */
export class AssetHubService {
  private api: ApiPromise | null = null;
  private connectedAccount: InjectedAccountWithMeta | null = null;

  /**
   * Initialize the connection to the Polkadot network
   * @param wsEndpoint WebSocket endpoint to connect to
   */
  async connect(wsEndpoint = 'wss://rococo-asset-hub-rpc.polkadot.io'): Promise<void> {
    try {
      const provider = new WsProvider(wsEndpoint);
      this.api = await ApiPromise.create({ provider });
      console.log('Connected to Asset Hub');
    } catch (error) {
      console.error('Failed to connect to Asset Hub:', error);
      throw error;
    }
  }

  /**
   * Set the account to use for transactions
   * @param account The account to use
   */
  setAccount(account: InjectedAccountWithMeta): void {
    this.connectedAccount = account;
  }

  /**
   * Create a new asset in Asset Hub
   * @param id Asset ID
   * @param admin Admin account address
   * @param minBalance Minimum balance 
   * @param metadata Asset metadata (name, symbol, etc.)
   */
  async createAsset(
    id: number,
    admin: string,
    minBalance: string | number | bigint,
    metadata: {
      name: string;
      symbol: string;
      decimals: number;
      isFrozen: boolean;
    }
  ): Promise<string> {
    if (!this.api || !this.connectedAccount) {
      throw new Error('API or account not initialized');
    }

    try {
      // Create the asset
      const createTx = this.api.tx.assets.create(id, admin, minBalance);
      
      // Set asset metadata
      const metadataTx = this.api.tx.assets.setMetadata(
        id,
        metadata.name,
        metadata.symbol,
        metadata.decimals
      );
      
      // Batch the transactions
      const batchTx = this.api.tx.utility.batchAll([createTx, metadataTx]);
      
      // Sign and send the transaction
      const injector = await web3FromSource(this.connectedAccount.meta.source);
      const txHash = await batchTx.signAndSend(this.connectedAccount.address, {
        signer: injector.signer
      });
      
      return txHash.toString();
    } catch (error) {
      console.error('Failed to create asset:', error);
      throw error;
    }
  }

  /**
   * Mint tokens to a recipient
   * @param id Asset ID
   * @param recipient Recipient address
   * @param amount Amount to mint
   */
  async mintTokens(id: number, recipient: string, amount: string | number | bigint): Promise<string> {
    if (!this.api || !this.connectedAccount) {
      throw new Error('API or account not initialized');
    }

    try {
      const tx = this.api.tx.assets.mint(id, recipient, amount);
      const injector = await web3FromSource(this.connectedAccount.meta.source);
      const txHash = await tx.signAndSend(this.connectedAccount.address, {
        signer: injector.signer
      });
      
      return txHash.toString();
    } catch (error) {
      console.error('Failed to mint tokens:', error);
      throw error;
    }
  }

  /**
   * Transfer tokens from one account to another
   * @param id Asset ID
   * @param target Target address
   * @param amount Amount to transfer
   */
  async transferTokens(id: number, target: string, amount: string | number | bigint): Promise<string> {
    if (!this.api || !this.connectedAccount) {
      throw new Error('API or account not initialized');
    }

    try {
      const tx = this.api.tx.assets.transfer(id, target, amount);
      const injector = await web3FromSource(this.connectedAccount.meta.source);
      const txHash = await tx.signAndSend(this.connectedAccount.address, {
        signer: injector.signer
      });
      
      return txHash.toString();
    } catch (error) {
      console.error('Failed to transfer tokens:', error);
      throw error;
    }
  }

  /**
   * Approve a delegate to transfer tokens on behalf of the caller
   * @param id Asset ID
   * @param delegate Delegate address
   * @param amount Amount to approve
   */
  async approveTransfer(id: number, delegate: string, amount: string | number | bigint): Promise<string> {
    if (!this.api || !this.connectedAccount) {
      throw new Error('API or account not initialized');
    }

    try {
      const tx = this.api.tx.assets.approveTransfer(id, delegate, amount);
      const injector = await web3FromSource(this.connectedAccount.meta.source);
      const txHash = await tx.signAndSend(this.connectedAccount.address, {
        signer: injector.signer
      });
      
      return txHash.toString();
    } catch (error) {
      console.error('Failed to approve transfer:', error);
      throw error;
    }
  }

  /**
   * Transfer tokens that were approved by the owner
   * @param id Asset ID
   * @param owner Owner address
   * @param destination Destination address
   * @param amount Amount to transfer
   */
  async transferApproved(
    id: number,
    owner: string,
    destination: string,
    amount: string | number | bigint
  ): Promise<string> {
    if (!this.api || !this.connectedAccount) {
      throw new Error('API or account not initialized');
    }

    try {
      const tx = this.api.tx.assets.transferApproved(id, owner, destination, amount);
      const injector = await web3FromSource(this.connectedAccount.meta.source);
      const txHash = await tx.signAndSend(this.connectedAccount.address, {
        signer: injector.signer
      });
      
      return txHash.toString();
    } catch (error) {
      console.error('Failed to transfer approved tokens:', error);
      throw error;
    }
  }

  /**
   * Get the balance of an asset for a specific account
   * @param id Asset ID
   * @param address Account address
   */
  async getBalance(id: number, address: string): Promise<string> {
    if (!this.api) {
      throw new Error('API not initialized');
    }

    try {
      const balance = await this.api.query.assets.account(id, address);
      // The balance is returned as an object, extract the free balance
      return balance.toString();
    } catch (error) {
      console.error('Failed to get balance:', error);
      throw error;
    }
  }
}

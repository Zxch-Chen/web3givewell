import { ApiPromise, WsProvider } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { InjectedAccountWithMeta } from '@polkadot/extension-inject/types';
import { web3FromSource } from '@polkadot/extension-dapp';
import { AssetHubService } from './asset-hub-service';

/**
 * Service that coordinates between ink! smart contracts and Asset Hub
 */
export class NPOGovernanceService {
  private api: ApiPromise | null = null;
  private npoContract: ContractPromise | null = null;
  private assetHubService: AssetHubService;
  private connectedAccount: InjectedAccountWithMeta | null = null;

  constructor() {
    this.assetHubService = new AssetHubService();
  }

  /**
   * Initialize the connection to the Polkadot network and contracts
   * @param wsEndpoint WebSocket endpoint to connect to
   * @param npoContractAddress Address of the NPO Registry contract
   * @param npoContractAbi ABI of the NPO Registry contract
   */
  async initialize(
    wsEndpoint = 'wss://rococo-contracts-rpc.polkadot.io',
    assetHubEndpoint = 'wss://rococo-asset-hub-rpc.polkadot.io',
    npoContractAddress: string,
    npoContractAbi: any
  ): Promise<void> {
    try {
      // Connect to the contract chain
      const provider = new WsProvider(wsEndpoint);
      this.api = await ApiPromise.create({ provider });
      
      // Initialize the contract
      this.npoContract = new ContractPromise(this.api, npoContractAbi, npoContractAddress);
      
      // Connect to Asset Hub
      await this.assetHubService.connect(assetHubEndpoint);
      
      console.log('NPO Governance Service initialized');
    } catch (error) {
      console.error('Failed to initialize NPO Governance Service:', error);
      throw error;
    }
  }

  /**
   * Set the account to use for transactions
   * @param account The account to use
   */
  setAccount(account: InjectedAccountWithMeta): void {
    this.connectedAccount = account;
    this.assetHubService.setAccount(account);
  }

  /**
   * Register a new NPO and create its governance token
   */
  async registerNPO({
    name,
    descriptionCid,
    legalId,
    categories,
    country,
    tokenName,
    tokenSymbol,
    tokenDescription,
    tokenIconCid
  }: {
    name: string;
    descriptionCid: string;
    legalId?: string;
    categories: string[];
    country: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDescription: string;
    tokenIconCid?: string;
  }): Promise<{ npoRegistered: boolean; tokenId: number; tokenCreated: boolean }> {
    if (!this.api || !this.npoContract || !this.connectedAccount) {
      throw new Error('Service not properly initialized');
    }

    try {
      const gasLimit = this.api.registry.createType('WeightV2', {
        refTime: 9999999999,
        proofSize: 9999999999,
      });

      // Step 1: Call the contract to register the NPO and get the token ID
      const injector = await web3FromSource(this.connectedAccount.meta.source);
      
      const { result, output } = await this.npoContract.query.registerNpo(
        this.connectedAccount.address,
        { gasLimit },
        name,
        descriptionCid,
        legalId || null,
        categories,
        country,
        tokenName,
        tokenSymbol,
        tokenDescription,
        tokenIconCid || null
      );

      if (result.isOk && output) {
        // Successfully registered in contract, get the token ID
        const tokenId = output.toNumber();

        // Step 2: Create the token on Asset Hub
        const txHash = await this.assetHubService.createAsset(
          tokenId,
          this.connectedAccount.address,
          '1000000', // Min balance
          {
            name: tokenName,
            symbol: tokenSymbol,
            decimals: 18,
            isFrozen: false
          }
        );

        // Step 3: Mint and distribute tokens
        await this.distributeGovernanceTokens(tokenId);

        return {
          npoRegistered: true,
          tokenId,
          tokenCreated: true
        };
      } else {
        console.error('Contract call failed:', result.asErr);
        throw new Error('Failed to register NPO in contract');
      }
    } catch (error) {
      console.error('NPO registration process failed:', error);
      throw error;
    }
  }

  /**
   * Distribute governance tokens for a registered NPO
   * @param tokenId The asset ID of the governance token
   */
  private async distributeGovernanceTokens(tokenId: number): Promise<void> {
    if (!this.api || !this.npoContract || !this.connectedAccount) {
      throw new Error('Service not properly initialized');
    }

    try {
      // Get auditors from the contract
      const gasLimit = this.api.registry.createType('WeightV2', {
        refTime: 9999999999,
        proofSize: 9999999999,
      });

      // Call the auditor registry contract to get all auditors
      // This assumes there's a method to get the auditor registry address and a method to get all auditors
      const { result: auditorRegistryResult, output: auditorRegistryOutput } = 
        await this.npoContract.query.getAuditorRegistry(
          this.connectedAccount.address,
          { gasLimit }
        );

      if (!auditorRegistryResult.isOk || !auditorRegistryOutput) {
        throw new Error('Failed to get auditor registry address');
      }

      const auditorRegistryAddress = auditorRegistryOutput.toString();
      
      // For this example, we'll simulate getting auditors directly
      // In a real implementation, you would call the auditor registry contract
      const auditors = [
        '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY', // Alice
        '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty', // Bob
        '5FLSigC9HGRKVhB9FiEo4Y3koPsNmBmLJbpXg2mp1hXcS59Y', // Charlie
      ];

      // Calculate token distribution
      const totalSupply = BigInt('1000000000000000000000000'); // 1 million tokens with 18 decimals
      const npoAmount = totalSupply * BigInt(75) / BigInt(100); // 75%
      const auditorAmount = totalSupply * BigInt(25) / BigInt(100); // 25%
      
      // Mint 75% to the NPO (contract caller)
      await this.assetHubService.mintTokens(
        tokenId,
        this.connectedAccount.address,
        npoAmount
      );

      if (auditors.length > 0) {
        // Calculate per-auditor amount
        const perAuditorAmount = auditorAmount / BigInt(auditors.length);
        
        // Mint tokens to each auditor
        for (const auditor of auditors) {
          await this.assetHubService.mintTokens(
            tokenId,
            auditor,
            perAuditorAmount
          );
        }
      }

      console.log(`Governance tokens distributed for token ID ${tokenId}`);
    } catch (error) {
      console.error('Failed to distribute governance tokens:', error);
      throw error;
    }
  }

  /**
   * Get the details of an NPO
   * @param npoAddress The address of the NPO
   */
  async getNPODetails(npoAddress: string): Promise<any> {
    if (!this.api || !this.npoContract || !this.connectedAccount) {
      throw new Error('Service not properly initialized');
    }

    try {
      const gasLimit = this.api.registry.createType('WeightV2', {
        refTime: 9999999999,
        proofSize: 9999999999,
      });

      const { result, output } = await this.npoContract.query.getNpo(
        this.connectedAccount.address,
        { gasLimit },
        npoAddress
      );

      if (result.isOk && output) {
        return output.toJSON();
      } else {
        throw new Error('Failed to get NPO details');
      }
    } catch (error) {
      console.error('Failed to get NPO details:', error);
      throw error;
    }
  }

  /**
   * Get token metadata
   * @param tokenId The asset ID of the token
   */
  async getTokenMetadata(tokenId: number): Promise<any> {
    if (!this.api || !this.npoContract || !this.connectedAccount) {
      throw new Error('Service not properly initialized');
    }

    try {
      const gasLimit = this.api.registry.createType('WeightV2', {
        refTime: 9999999999,
        proofSize: 9999999999,
      });

      const { result, output } = await this.npoContract.query.getTokenMetadata(
        this.connectedAccount.address,
        { gasLimit },
        tokenId
      );

      if (result.isOk && output) {
        return output.toJSON();
      } else {
        throw new Error('Failed to get token metadata');
      }
    } catch (error) {
      console.error('Failed to get token metadata:', error);
      throw error;
    }
  }
}

#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::cast_possible_truncation)]
#![allow(clippy::cast_precision_loss)]
#![allow(clippy::cast_sign_loss)]
#![allow(clippy::cast_lossless)]
#![allow(clippy::cast_possible_wrap)]
#![allow(clippy::arithmetic_side_effects)]
#![cfg_attr(feature = "__ink_dylint_Storage", allow(unused))]

use ink::{ storage::Mapping, env::call::FromAccountId };
use scale::{Decode, Encode};
use ink::storage::traits::StorageLayout;

/// NPO Registry Contract - Manages nonprofit organizations and their governance tokens
#[ink::contract]
mod npo_registry {
    use super::*;

    /// Interface for the Auditor Registry to get all registered auditors
    #[ink::trait_definition]
    pub trait AuditorInterface {
        fn get_all_auditors(&self) -> Vec<AccountId>;
    }

    /// Metadata for the governance token
    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone, Default, StorageLayout)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct TokenMetadata {
        /// Name of the token
        name: String,
        /// Symbol of the token
        symbol: String,
        /// Decimal places
        decimals: u8,
        /// Description of the token
        description: String,
        /// Token icon/logo as IPFS CID
        icon_cid: Option<String>,
    }

    /// Nonprofit organization data structure
    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone, Default, StorageLayout)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct NPO {
        /// Account that controls the NPO
        owner: AccountId,
        /// ID of the governance token for this NPO
        governance_token_id: Option<u32>,
        /// Timestamp when the NPO was registered
        registered_at: Timestamp,
        /// IPFS CID for detailed NPO description
        description_cid: String,
        /// Name of the nonprofit organization
        name: String,
        /// Legal registration ID if available
        legal_id: Option<String>,
        /// Categories/tags for the nonprofit
        categories: Vec<String>,
        /// Country of operation
        country: String,
    }

    /// Storage structure for the NPO Registry contract
    #[ink(storage)]
    pub struct NPORegistry {
        /// Mapping from NPO address to NPO details
        npos: Mapping<AccountId, NPO>,
        /// Mapping from token ID to token metadata
        token_metadata: Mapping<u32, TokenMetadata>,
        /// Total number of registered NPOs
        npo_count: u32,
        /// Next available token ID
        next_token_id: u32,
        /// Auditor registry contract address
        auditor_registry: AccountId,
        /// Contract owner with admin privileges
        admin: AccountId,
    }

    /// Event emitted when a new NPO is registered
    #[ink(event)]
    pub struct NPORegistered {
        /// The account ID of the NPO
        #[ink(topic)]
        npo: AccountId,
        /// The ID of the governance token created
        #[ink(topic)]
        token_id: u32,
        /// Name of the NPO
        name: String,
    }

    /// Event emitted when governance tokens are distributed
    #[ink(event)]
    pub struct TokensDistributed {
        /// The ID of the governance token
        #[ink(topic)]
        token_id: u32,
        /// The NPO that received 75% of tokens
        #[ink(topic)]
        npo: AccountId,
        /// Amount of tokens distributed to the NPO
        npo_amount: Balance,
        /// Number of auditors that received tokens
        auditor_count: u32,
        /// Amount of tokens distributed per auditor
        per_auditor_amount: Balance,
    }

    /// Errors that can occur during contract execution
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// NPO is already registered
        AlreadyRegistered,
        /// Token creation failed
        TokenCreationFailed,
        /// Token distribution failed
        DistributionFailed,
        /// Invalid token metadata
        InvalidMetadata,
        /// Caller is not authorized
        Unauthorized,
        /// Missing required information
        MissingRequiredInfo,
        /// No auditors available for distribution
        NoAuditorsAvailable,
    }

    /// Type alias for Result with the contract's Error type
    pub type Result<T> = core::result::Result<T, Error>;

    impl NPORegistry {
        /// Create a new NPO Registry contract
        #[ink(constructor)]
        pub fn new(auditor_registry: AccountId) -> Self {
            Self {
                npos: Mapping::default(),
                token_metadata: Mapping::default(),
                npo_count: 0,
                next_token_id: 1, // Start from 1 to avoid 0 (which can be confused with null/none)
                auditor_registry,
                admin: Self::env().caller(),
            }
        }

        /// Register a new NPO and create its governance token
        #[ink(message)]
        pub fn register_npo(
            &mut self,
            name: String,
            description_cid: String,
            legal_id: Option<String>,
            categories: Vec<String>,
            country: String,
            token_name: String,
            token_symbol: String,
            token_description: String,
            token_icon_cid: Option<String>,
        ) -> Result<u32> {
            let caller = self.env().caller();
            
            // Validation checks
            if name.is_empty() || description_cid.is_empty() || country.is_empty() {
                return Err(Error::MissingRequiredInfo);
            }
            
            if token_name.is_empty() || token_symbol.is_empty() {
                return Err(Error::InvalidMetadata);
            }
            
            // Ensure NPO is not already registered
            if self.npos.contains(caller) {
                return Err(Error::AlreadyRegistered);
            }
            
            // Generate unique token ID for this NPO
            let token_id = self.next_token_id;
            self.next_token_id += 1;
            
            // Create token metadata
            let metadata = TokenMetadata {
                name: token_name.clone(),
                symbol: token_symbol,
                decimals: 18, // Standard for most tokens
                description: token_description,
                icon_cid: token_icon_cid,
            };
            
            // Store the token metadata
            self.token_metadata.insert(token_id, &metadata);
            
            // Register the NPO
            let npo = NPO {
                owner: caller,
                governance_token_id: Some(token_id),
                registered_at: self.env().block_timestamp(),
                description_cid,
                name: name.clone(),
                legal_id,
                categories,
                country,
            };
            
            self.npos.insert(caller, &npo);
            self.npo_count += 1;
            
            // Emit registration event
            self.env().emit_event(NPORegistered {
                npo: caller,
                token_id,
                name,
            });
            
            // Simulate token creation and distribution
            // In a real contract, this would involve cross-contract calls
            self.simulate_token_distribution(token_id, caller)?;
            
            Ok(token_id)
        }
        
        /// Simulate governance token distribution - 75% to NPO, 25% distributed among auditors
        fn simulate_token_distribution(&mut self, token_id: u32, npo: AccountId) -> Result<()> {
            // Total supply of governance tokens (e.g., 1,000,000 with 18 decimals)
            let total_supply: Balance = 1_000_000 * 10u128.pow(18); 
            
            // Calculate distribution
            let npo_amount = total_supply * 75 / 100; // 75%
            let auditor_amount = total_supply * 25 / 100; // 25%
            
            // Simulate getting all registered auditors
            // In a real contract, this would be a cross-contract call
            let auditors = self.simulate_get_auditors();
            
            let (auditor_count, per_auditor_amount) = if !auditors.is_empty() {
                // Calculate per-auditor amount
                let per_auditor = auditor_amount / auditors.len() as u128;
                (auditors.len() as u32, per_auditor)
            } else {
                // If no auditors, all tokens go to the NPO or a reserve
                (0, 0)
            };
            
            // Emit distribution event
            self.env().emit_event(TokensDistributed {
                token_id,
                npo,
                npo_amount,
                auditor_count,
                per_auditor_amount,
            });
            
            Ok(())
        }
        
        /// Simulate getting all registered auditors (for demo purposes)
        fn simulate_get_auditors(&self) -> Vec<AccountId> {
            // In a real contract, this would be a cross-contract call to the auditor registry
            // For simulation, return some placeholder accounts
            vec![
                AccountId::from([1u8; 32]),
                AccountId::from([2u8; 32]),
                AccountId::from([3u8; 32]),
                AccountId::from([4u8; 32]),
                AccountId::from([5u8; 32]),
            ]
        }
        
        /// Get the details of an NPO
        #[ink(message)]
        pub fn get_npo(&self, npo: AccountId) -> Option<NPO> {
            self.npos.get(npo)
        }
        
        /// Get the metadata for a token
        #[ink(message)]
        pub fn get_token_metadata(&self, token_id: u32) -> Option<TokenMetadata> {
            self.token_metadata.get(token_id)
        }
        
        /// Get the total number of registered NPOs
        #[ink(message)]
        pub fn get_npo_count(&self) -> u32 {
            self.npo_count
        }
        
        /// Check if an account is a registered NPO
        #[ink(message)]
        pub fn is_registered_npo(&self, account: AccountId) -> bool {
            self.npos.contains(account)
        }
    }
    
    /// Unit tests for the NPO Registry contract
    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test::*, DefaultEnvironment};
        
        #[ink::test]
        fn test_registration() {
            // Initialize the contract
            let auditor_registry = AccountId::from([0x42; 32]);
            let mut npo_registry = NPORegistry::new(auditor_registry);
            
            // Prepare registration data
            let name = String::from("Save The Oceans");
            let description_cid = String::from("QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdG");
            let legal_id = Some(String::from("501c3-12345"));
            let categories = vec![String::from("Environment"), String::from("Conservation")];
            let country = String::from("USA");
            let token_name = String::from("Ocean Token");
            let token_symbol = String::from("OCN");
            let token_description = String::from("Governance token for Save The Oceans NPO");
            let token_icon_cid = Some(String::from("QmYwAPJzv5CZsnA625s3Xf2nemtYgPpHdWEz79ojWnPbdH"));
            
            // Register NPO
            let token_id = npo_registry.register_npo(
                name,
                description_cid,
                legal_id,
                categories,
                country,
                token_name,
                token_symbol,
                token_description,
                token_icon_cid,
            ).unwrap();
            
            assert_eq!(token_id, 1);
            assert_eq!(npo_registry.get_npo_count(), 1);
            
            let caller = default_accounts::<DefaultEnvironment>().alice;
            assert!(npo_registry.is_registered_npo(caller));
            
            let stored_npo = npo_registry.get_npo(caller).unwrap();
            assert_eq!(stored_npo.name, "Save The Oceans");
            
            let token_metadata = npo_registry.get_token_metadata(token_id).unwrap();
            assert_eq!(token_metadata.name, "Ocean Token");
            assert_eq!(token_metadata.symbol, "OCN");
        }
    }
}

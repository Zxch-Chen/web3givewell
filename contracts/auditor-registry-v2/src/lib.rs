#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::cast_possible_truncation)]
#![allow(clippy::cast_precision_loss)]
#![allow(clippy::cast_sign_loss)]
#![allow(clippy::cast_lossless)]
#![allow(clippy::cast_possible_wrap)]
#![allow(clippy::arithmetic_side_effects)]
#![cfg_attr(feature = "__ink_dylint_Storage", allow(unused))]

use ink::{ storage::Mapping };
use scale::{Decode, Encode};
use ink::storage::traits::StorageLayout;

/// Enhanced Auditor Registry Contract with support for governance token distribution
#[ink::contract]
mod auditor_registry_v2 {
    use super::*;

    /// Auditor data structure with profile information
    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone, Default, StorageLayout)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Auditor {
        /// Amount staked by the auditor
        stake: Balance,
        /// Reputation score (0-100)
        reputation: u32,
        /// Timestamp until which the stake is locked
        lock_until: Timestamp,
        /// Governance tokens received from various NPOs
        governance_tokens: Vec<(u32, Balance)>,
        /// Name of the auditor (optional)
        name: Option<String>,
        /// Auditor's specialization areas
        specializations: Vec<String>,
        /// Experience level (1-5)
        experience_level: u8,
        /// IPFS CID for the auditor's profile (optional)
        profile_cid: Option<String>,
    }

    /// Storage structure for the Auditor Registry contract
    #[ink(storage)]
    pub struct AuditorRegistryV2 {
        /// Mapping from auditor address to auditor details
        auditors: Mapping<AccountId, Auditor>,
        /// List of all auditor accounts for iteration
        auditor_accounts: Vec<AccountId>,
        /// Initial lock period in days for new auditors
        initial_lock_days: u32,
        /// Extension lock period in days when reputation increases
        extension_lock_days: u32,
        /// Minimum stake required to register
        minimum_stake: Balance,
        /// Optional NPO registry contract for cross-contract calls
        npo_registry: Option<AccountId>,
        /// Admin account with privileged operations
        admin: AccountId,
    }

    /// Event emitted when a new auditor is registered
    #[ink(event)]
    pub struct AuditorRegistered {
        /// The registered auditor's account
        #[ink(topic)]
        auditor: AccountId,
        /// The amount staked
        amount: Balance,
        /// The auditor's name if provided
        name: Option<String>,
    }

    /// Event emitted when an auditor's reputation is updated
    #[ink(event)]
    pub struct ReputationUpdated {
        /// The auditor's account
        #[ink(topic)]
        auditor: AccountId,
        /// The new reputation score
        new_reputation: u32,
        /// Whether the update was due to successful audit
        success: bool,
    }

    /// Event emitted when governance tokens are received by an auditor
    #[ink(event)]
    pub struct GovernanceTokensReceived {
        /// The auditor's account
        #[ink(topic)]
        auditor: AccountId,
        /// The token ID
        #[ink(topic)]
        token_id: u32,
        /// The amount of tokens received
        amount: Balance,
    }

    /// Errors that can occur during contract execution
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Error {
        /// Stake is below minimum required
        StakeTooLow,
        /// Auditor is not registered
        AuditorNotRegistered,
        /// Called by unauthorized account
        Unauthorized,
        /// Insufficient stake balance
        InsufficientStake,
        /// Stake is still locked
        StakeLocked,
        /// Invalid parameter
        InvalidParameter,
    }

    /// Type alias for Result with the contract's Error type
    pub type Result<T> = core::result::Result<T, Error>;

    impl AuditorRegistryV2 {
        /// Create a new Auditor Registry contract
        #[ink(constructor)]
        pub fn new(initial_lock_days: u32, extension_lock_days: u32, minimum_stake: Balance) -> Self {
            Self {
                auditors: Mapping::default(),
                auditor_accounts: Vec::new(),
                initial_lock_days,
                extension_lock_days,
                minimum_stake,
                npo_registry: None,
                admin: Self::env().caller(),
            }
        }

        /// Register a new auditor by staking native tokens
        #[ink(message, payable)]
        pub fn register_auditor(
            &mut self,
            name: Option<String>,
            specializations: Vec<String>,
            experience_level: u8,
            profile_cid: Option<String>,
        ) -> Result<()> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();

            // Check minimum stake
            if amount < self.minimum_stake {
                return Err(Error::StakeTooLow);
            }
            
            // Validate experience level
            if experience_level < 1 || experience_level > 5 {
                return Err(Error::InvalidParameter);
            }
            
            // Get existing auditor or create new one
            let mut is_new = false;
            let mut auditor = match self.auditors.get(caller) {
                Some(existing) => existing,
                None => {
                    is_new = true;
                    Auditor::default()
                }
            };
            
            // Update auditor details
            auditor.stake += amount;
            auditor.name = name.clone();
            auditor.specializations = specializations;
            auditor.experience_level = experience_level;
            auditor.profile_cid = profile_cid;
            
            // Calculate lock period if new
            if is_new {
                let now = self.env().block_timestamp();
                let lock_days_in_secs = (self.initial_lock_days as u64) * 24 * 60 * 60;
                auditor.lock_until = now + lock_days_in_secs;
                
                // Add to the list of auditors for iteration
                self.auditor_accounts.push(caller);
            }
            
            // Store updated auditor
            self.auditors.insert(caller, &auditor);
            
            // Emit event
            self.env().emit_event(AuditorRegistered {
                auditor: caller,
                amount,
                name,
            });
            
            Ok(())
        }

        /// Update auditor reputation based on audit success
        #[ink(message)]
        pub fn update_reputation(&mut self, auditor: AccountId, success: bool) -> Result<()> {
            // Access control check
            let caller = self.env().caller();
            if caller != self.admin && caller != self.env().account_id() {
                return Err(Error::Unauthorized);
            }

            // Get auditor details
            let mut auditor_data = self.auditors.get(auditor)
                .ok_or(Error::AuditorNotRegistered)?;

            let now = self.env().block_timestamp();

            if success {
                // Increase reputation (cap at 100)
                auditor_data.reputation = (auditor_data.reputation + 1).min(100);

                // Extend lock-up period
                let extension_days_in_secs = (self.extension_lock_days as u64) * 24 * 60 * 60;
                
                // If lock period has expired, start from now
                let base_time = if auditor_data.lock_until > now {
                    auditor_data.lock_until
                } else {
                    now
                };
                
                auditor_data.lock_until = base_time + extension_days_in_secs;
            } else {
                // Decrease reputation (floor at 0)
                auditor_data.reputation = auditor_data.reputation.saturating_sub(2);
            }
            
            // Update storage
            self.auditors.insert(auditor, &auditor_data);
            
            // Emit event
            self.env().emit_event(ReputationUpdated {
                auditor,
                new_reputation: auditor_data.reputation,
                success,
            });
            
            Ok(())
        }

        /// Record governance token receipt from an NPO
        #[ink(message)]
        pub fn record_governance_tokens(&mut self, auditor: AccountId, token_id: u32, amount: Balance) -> Result<()> {
            // Access control check
            let caller = self.env().caller();
            if caller != self.admin && 
               self.npo_registry.map_or(false, |addr| caller == addr) {
                return Err(Error::Unauthorized);
            }

            // Get auditor details
            let mut auditor_data = self.auditors.get(auditor)
                .ok_or(Error::AuditorNotRegistered)?;
            
            // Add or update token balance
            let mut found = false;
            for token_balance in &mut auditor_data.governance_tokens {
                if token_balance.0 == token_id {
                    token_balance.1 += amount;
                    found = true;
                    break;
                }
            }
            
            if !found {
                auditor_data.governance_tokens.push((token_id, amount));
            }
            
            // Update storage
            self.auditors.insert(auditor, &auditor_data);
            
            // Emit event
            self.env().emit_event(GovernanceTokensReceived {
                auditor,
                token_id,
                amount,
            });
            
            Ok(())
        }

        /// Set the NPO registry contract address for cross-contract calls
        #[ink(message)]
        pub fn set_npo_registry(&mut self, npo_registry: AccountId) -> Result<()> {
            // Only admin can set this
            if self.env().caller() != self.admin {
                return Err(Error::Unauthorized);
            }
            
            self.npo_registry = Some(npo_registry);
            Ok(())
        }

        /// Get all registered auditor accounts (implements AuditorInterface for NPO Registry)
        #[ink(message)]
        pub fn get_all_auditors(&self) -> Vec<AccountId> {
            self.auditor_accounts.clone()
        }

        /// Get auditor details
        #[ink(message)]
        pub fn get_auditor(&self, auditor: AccountId) -> Option<Auditor> {
            self.auditors.get(auditor)
        }

        /// Get the total number of registered auditors
        #[ink(message)]
        pub fn get_auditor_count(&self) -> u32 {
            self.auditor_accounts.len() as u32
        }

        /// Get minimum stake required
        #[ink(message)]
        pub fn get_minimum_stake(&self) -> Balance {
            self.minimum_stake
        }
    }

    /// Unit tests
    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test::*, DefaultEnvironment};

        /// Helper to create a new registry with test defaults
        fn create_registry() -> AuditorRegistryV2 {
            let initial_lock_days = 30;
            let extension_lock_days = 15;
            let minimum_stake = 100;
            AuditorRegistryV2::new(initial_lock_days, extension_lock_days, minimum_stake)
        }

        #[ink::test]
        fn test_registration() {
            let accounts = default_accounts::<DefaultEnvironment>();
            set_caller::<DefaultEnvironment>(accounts.alice);
            
            let mut registry = create_registry();
            let name = Some(String::from("Alice Auditor"));
            let specializations = vec![String::from("Finance"), String::from("Healthcare")];
            let experience_level = 3;
            let profile_cid = Some(String::from("QmProfile123"));
            
            // Set transferred amount to 200 - above minimum
            set_value_transferred::<DefaultEnvironment>(200);
            
            let result = registry.register_auditor(
                name.clone(),
                specializations.clone(),
                experience_level,
                profile_cid.clone(),
            );
            
            assert!(result.is_ok());
            
            let auditors = registry.get_all_auditors();
            assert_eq!(auditors.len(), 1);
            assert_eq!(auditors[0], accounts.alice);
            
            let auditor = registry.get_auditor(accounts.alice).unwrap();
            assert_eq!(auditor.name, name);
            assert_eq!(auditor.specializations, specializations);
            assert_eq!(auditor.experience_level, experience_level);
            assert_eq!(auditor.profile_cid, profile_cid);
            assert_eq!(auditor.stake, 200);
        }
        
        #[ink::test]
        fn test_reputation_update() {
            let accounts = default_accounts::<DefaultEnvironment>();
            set_caller::<DefaultEnvironment>(accounts.alice);
            
            let mut registry = create_registry();
            set_value_transferred::<DefaultEnvironment>(200);
            
            // Register an auditor
            let _ = registry.register_auditor(
                Some(String::from("Test Auditor")),
                vec![String::from("General")],
                3,
                None,
            );
            
            // Switch to admin (contract creator)
            set_caller::<DefaultEnvironment>(accounts.alice);
            
            // Update reputation positively
            let result = registry.update_reputation(accounts.alice, true);
            assert!(result.is_ok());
            
            let auditor = registry.get_auditor(accounts.alice).unwrap();
            assert_eq!(auditor.reputation, 1); // Reputation increased by 1
            
            // Update reputation negatively
            let result = registry.update_reputation(accounts.alice, false);
            assert!(result.is_ok());
            
            let auditor = registry.get_auditor(accounts.alice).unwrap();
            assert_eq!(auditor.reputation, 0); // Reputation decreased by 2 but floored at 0
        }
    }
}

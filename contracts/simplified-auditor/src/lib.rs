#![cfg_attr(not(feature = "std"), no_std)]
#![allow(clippy::cast_possible_truncation)]
#![allow(clippy::cast_precision_loss)]
#![allow(clippy::cast_sign_loss)]
#![allow(clippy::cast_lossless)]
#![allow(clippy::cast_possible_wrap)]
#![allow(clippy::arithmetic_side_effects)]
// Keep only one allow(unused) attribute
#![cfg_attr(feature = "__ink_dylint_Storage", allow(unused))]

use ink::{ storage::Mapping };
use scale::{Decode, Encode};
use ink::storage::traits::StorageLayout;

/// A simplified auditor registry smart contract for testing
/// This contract allows auditors to stake tokens and gain reputation
#[ink::contract]
mod simplified_auditor {
    use super::*;

    /// Represents an auditor in the system with their stake and reputation
    #[derive(Encode, Decode, Debug, PartialEq, Eq, Copy, Clone, Default, StorageLayout)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Auditor {
        stake: Balance,          // Amount staked by the auditor
        reputation: u32,         // Reputation score of the auditor
        lock_until: Timestamp,   // Timestamp until which the stake is locked
    }

    /// Main storage structure for the simplified auditor contract
    #[ink(storage)]
    pub struct SimplifiedAuditor {
        // Mapping from auditor address to auditor details
        auditors: Mapping<AccountId, Auditor>,
        // Initial lock period in days for new auditors
        initial_lock_days: u32,
        // Extension lock period in days when reputation increases
        extension_lock_days: u32,
    }

    // Events
    #[ink(event)]
    pub struct AuditorRegistered {
        #[ink(topic)]
        auditor: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct AuditorSlashed {
        #[ink(topic)]
        auditor: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct ReputationUpdated {
        #[ink(topic)]
        auditor: AccountId,
        new_reputation: u32,
        success: bool,
    }

    #[ink(event)]
    pub struct StakeWithdrawn {
        #[ink(topic)]
        auditor: AccountId,
        amount: Balance,
    }

    // Error types
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(::scale_info::TypeInfo))]
    pub enum Error {
        /// Insufficient stake to withdraw
        InsufficientStake,
        /// Stake is still locked
        StakeLocked,
        /// Auditor not registered
        AuditorNotRegistered,
        /// Unauthorized caller
        Unauthorized,
        /// Zero amount not allowed
        ZeroAmount,
    }

    // Type alias for Result
    pub type Result<T> = core::result::Result<T, Error>;

    impl SimplifiedAuditor {
        #[ink(constructor)]
        pub fn new(initial_lock_days: u32, extension_lock_days: u32) -> Self {
            Self {
                auditors: Mapping::default(),
                initial_lock_days,
                extension_lock_days,
            }
        }

        /// Register a new auditor by staking native tokens
        #[ink(message, payable)]
        pub fn register_auditor(&mut self) -> Result<()> {
            let caller = self.env().caller();
            let amount = self.env().transferred_value();

            // Check for zero amount
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }
            
            // Get existing auditor or create new one
            let mut auditor = self.auditors.get(caller).unwrap_or_default();
            
            // Update auditor details
            auditor.stake += amount;
            
            // Calculate lock until timestamp (current time + initial_lock_days in seconds)
            let now = self.env().block_timestamp();
            let lock_days_in_secs = (self.initial_lock_days as u64) * 24 * 60 * 60;
            
            // Only update lock period if it's a new auditor or extending existing lock
            if auditor.reputation == 0 || now > auditor.lock_until {
                auditor.lock_until = now + lock_days_in_secs;
            }

            // Store updated auditor
            self.auditors.insert(caller, &auditor);

            // Emit event
            self.env().emit_event(AuditorRegistered {
                auditor: caller,
                amount,
            });

            Ok(())
        }

        /// Slash an auditor's stake (called by authorized contracts)
        #[ink(message)]
        pub fn slash(&mut self, auditor: AccountId, amount: Balance) -> Result<()> {
            // In a real contract, you would implement access control here
            let caller = self.env().caller();
            if caller != self.env().account_id() { // Simplified check - in real contract this would be more sophisticated
                return Err(Error::Unauthorized);
            }

            // Check for zero amount
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            // Get auditor details
            let mut auditor_data = self.auditors.get(auditor)
                .ok_or(Error::AuditorNotRegistered)?;

            // Ensure auditor has enough stake to slash
            if auditor_data.stake < amount {
                return Err(Error::InsufficientStake);
            }

            // Reduce stake
            auditor_data.stake -= amount;
            self.auditors.insert(auditor, &auditor_data);

            // In a full implementation, the slashed tokens would be transferred somewhere
            // For simplicity, we're just reducing the stake without transferring tokens

            // Emit event
            self.env().emit_event(AuditorSlashed {
                auditor,
                amount,
            });

            Ok(())
        }

        /// Update auditor reputation based on audit success
        #[ink(message)]
        pub fn update_reputation(&mut self, auditor: AccountId, success: bool) -> Result<()> {
            // In a real contract, you would implement access control here
            let caller = self.env().caller();
            if caller != self.env().account_id() { // Simplified check
                return Err(Error::Unauthorized);
            }

            // Get auditor details
            let mut auditor_data = self.auditors.get(auditor)
                .ok_or(Error::AuditorNotRegistered)?;

            let now = self.env().block_timestamp();

            if success {
                // Increase reputation
                auditor_data.reputation += 1;

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
                // Reset lock to now (effectively unlocking)
                auditor_data.lock_until = now;
            }

            // Update auditor data
            self.auditors.insert(auditor, &auditor_data);

            // Emit event
            self.env().emit_event(ReputationUpdated {
                auditor,
                new_reputation: auditor_data.reputation,
                success,
            });

            Ok(())
        }

        /// Unstake tokens and withdraw them
        #[ink(message)]
        pub fn unstake(&mut self, amount: Balance) -> Result<()> {
            let caller = self.env().caller();

            // Check for zero amount
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            // Get auditor details
            let mut auditor_data = self.auditors.get(caller)
                .ok_or(Error::AuditorNotRegistered)?;

            // Check if stake is unlocked
            if self.env().block_timestamp() < auditor_data.lock_until {
                return Err(Error::StakeLocked);
            }

            // Check if enough stake to withdraw
            if auditor_data.stake < amount {
                return Err(Error::InsufficientStake);
            }

            // Reduce stake
            auditor_data.stake -= amount;
            self.auditors.insert(caller, &auditor_data);

            // Transfer tokens back to the auditor
            self.env().transfer(caller, amount).expect("transfer failed");

            // Emit event
            self.env().emit_event(StakeWithdrawn {
                auditor: caller,
                amount,
            });

            Ok(())
        }

        /// Get auditor details
        #[ink(message)]
        pub fn get_auditor(&self, auditor: AccountId) -> Option<Auditor> {
            self.auditors.get(auditor)
        }

        /// Check if an address is a registered auditor with active stake
        #[ink(message)]
        pub fn is_auditor(&self, auditor: AccountId) -> bool {
            match self.auditors.get(auditor) {
                Some(data) => data.stake > 0,
                None => false,
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test::*, DefaultEnvironment};

        #[ink::test]
        fn test_constructor() {
            let contract = SimplifiedAuditor::new(30, 15);
            assert_eq!(contract.initial_lock_days, 30);
            assert_eq!(contract.extension_lock_days, 15);
        }

        #[ink::test]
        fn test_register_auditor() {
            // Create a new contract
            let mut contract = SimplifiedAuditor::new(30, 15);
            
            // Set the sender and transferred value for the call
            let accounts = default_accounts::<DefaultEnvironment>();
            set_caller::<DefaultEnvironment>(accounts.alice);
            set_value_transferred::<DefaultEnvironment>(1000);
            
            // Register Alice as an auditor
            assert!(contract.register_auditor().is_ok());
            
            // Check if Alice is registered
            assert!(contract.is_auditor(accounts.alice));
            
            // Verify Alice's stake
            let auditor = contract.get_auditor(accounts.alice).unwrap();
            assert_eq!(auditor.stake, 1000);
        }
    }
}

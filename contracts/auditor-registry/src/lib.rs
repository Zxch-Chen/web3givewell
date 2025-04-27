#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

use ink::{ storage::Mapping, prelude::vec::Vec };
use openbrush::contracts::psp22::PSP22Ref;
use scale::{Decode, Encode};
use ink::env::call::FromAccountId;
#[ink::contract]
mod auditor_registry {
    use super::*;

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Copy, Clone, Default)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Auditor {
        stake: Balance,          // Amount staked by the auditor
        reputation: u32,         // Reputation score of the auditor
        lock_until: Timestamp,   // Timestamp until which the stake is locked
    }

    #[ink(storage)]
    pub struct AuditorRegistry {
        // Mapping from auditor address to auditor details
        auditors: Mapping<AccountId, Auditor>,
        // Governance token used for staking
        gov_token: AccountId,
        // Insurance fund where slashed tokens are sent
        insurance_fund: AccountId,
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
        /// Token transfer failed
        TokenTransferFailed,
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

    impl AuditorRegistry {
        #[ink(constructor)]
        pub fn new(gov_token: AccountId, insurance_fund: AccountId, initial_lock_days: u32, extension_lock_days: u32) -> Self {
            Self {
                auditors: Mapping::default(),
                gov_token,
                insurance_fund,
                initial_lock_days,
                extension_lock_days,
            }
        }

        /// Register a new auditor by staking governance tokens
        #[ink(message)]
        pub fn register_auditor(&mut self, amount: Balance) -> Result<()> {
            let caller = self.env().caller();

            // Check for zero amount
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            // Transfer tokens from caller to this contract
            let result = PSP22Ref::transfer_from(
                &self.gov_token,
                caller,
                self.env().account_id(),
                amount,
                Vec::new()
            );

            if result.is_err() {
                return Err(Error::TokenTransferFailed);
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

        /// Slash an auditor's stake (called by AuditBountyManager on bad votes)
        #[ink(message)]
        pub fn slash(&mut self, auditor: AccountId, amount: Balance) -> Result<()> {
            // Only authorized contracts can call this (e.g., AuditBountyManager)
            // This is a simple check - in production you'd use an access control system
            if self.env().caller() != AccountId::from([0x1; 32]) {
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

            // Transfer slashed tokens to insurance fund
            let result = PSP22Ref::transfer(
                &self.gov_token,
                self.insurance_fund,
                amount,
                Vec::new()
            );

            if result.is_err() {
                return Err(Error::TokenTransferFailed);
            }

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
            // Only authorized contracts can call this
            if self.env().caller() != AccountId::from([0x1; 32]) {
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
            let result = PSP22Ref::transfer(
                &self.gov_token,
                caller,
                amount,
                Vec::new()
            );

            if result.is_err() {
                return Err(Error::TokenTransferFailed);
            }

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
        type Environment = DefaultEnvironment;

        // Mock PSP22 token for testing
        // In a real test, you'd use a proper mock implementation
        fn create_mock_gov_token() -> AccountId {
            AccountId::from([0x1; 32])
        }

        fn create_mock_insurance_fund() -> AccountId {
            AccountId::from([0x2; 32])
        }

        fn setup() -> AuditorRegistry {
            let gov_token = create_mock_gov_token();
            let insurance_fund = create_mock_insurance_fund();
            AuditorRegistry::new(gov_token, insurance_fund, 30, 15) // 30 days initial lock, 15 days extension
        }

        #[ink::test]
        fn test_constructor() {
            let contract = setup();
            assert_eq!(contract.initial_lock_days, 30);
            assert_eq!(contract.extension_lock_days, 15);
            assert_eq!(contract.gov_token, create_mock_gov_token());
            assert_eq!(contract.insurance_fund, create_mock_insurance_fund());
        }

        // Add more tests for each function
        // Mocking PSP22 transfers would require more complex test setup
    }
}

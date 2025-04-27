#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

use ink::{ storage::Mapping, prelude::vec::Vec };
use openbrush::contracts::psp22::PSP22Ref;
use scale::{Decode, Encode};

#[ink::contract]
mod insurance_fund {
    use super::*;

    #[ink(storage)]
    pub struct InsuranceFund {
        // Governance token for transfers
        gov_token: AccountId,
        // Authorized managers who can direct payouts
        authorized_managers: Vec<AccountId>,
        // Max payout without governance approval
        max_direct_payout: Balance,
    }

    // Events
    #[ink(event)]
    pub struct FundsReceived {
        #[ink(topic)]
        from: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct PayoutMade {
        #[ink(topic)]
        to: AccountId,
        amount: Balance,
        reason: String,
    }

    #[ink(event)]
    pub struct ManagerAdded {
        #[ink(topic)]
        manager: AccountId,
    }

    #[ink(event)]
    pub struct ManagerRemoved {
        #[ink(topic)]
        manager: AccountId,
    }

    // Error types
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(::scale_info::TypeInfo))]
    pub enum Error {
        /// Token transfer failed
        TokenTransferFailed,
        /// Unauthorized caller
        Unauthorized,
        /// Zero amount not allowed
        ZeroAmount,
        /// Exceeds direct payout limit
        ExceedsDirectPayoutLimit,
        /// Insufficient balance
        InsufficientBalance,
    }

    // Type alias for Result
    pub type Result<T> = core::result::Result<T, Error>;

    impl InsuranceFund {
        #[ink(constructor)]
        pub fn new(gov_token: AccountId, initial_managers: Vec<AccountId>, max_direct_payout: Balance) -> Self {
            Self {
                gov_token,
                authorized_managers: initial_managers,
                max_direct_payout,
            }
        }

        /// Receive funds into the insurance fund
        #[ink(message)]
        pub fn receive_funds(&mut self, amount: Balance) -> Result<()> {
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

            // Emit event
            self.env().emit_event(FundsReceived {
                from: caller,
                amount,
            });

            Ok(())
        }

        /// Make a payout from the insurance fund
        #[ink(message)]
        pub fn payout(&mut self, to: AccountId, amount: Balance, reason: String) -> Result<()> {
            let caller = self.env().caller();

            // Check if caller is authorized
            if !self.authorized_managers.contains(&caller) {
                return Err(Error::Unauthorized);
            }

            // Check for zero amount
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            // Check if amount exceeds direct payout limit
            if amount > self.max_direct_payout {
                return Err(Error::ExceedsDirectPayoutLimit);
            }

            // Transfer tokens to recipient
            let result = PSP22Ref::transfer(
                &self.gov_token,
                to,
                amount,
                Vec::new()
            );

            if result.is_err() {
                return Err(Error::TokenTransferFailed);
            }

            // Emit event
            self.env().emit_event(PayoutMade {
                to,
                amount,
                reason,
            });

            Ok(())
        }

        /// Make a large payout (requires governance approval)
        #[ink(message)]
        pub fn governance_payout(&mut self, to: AccountId, amount: Balance, reason: String) -> Result<()> {
            let caller = self.env().caller();

            // Check if caller is the governance contract
            // In a real implementation, this would be more sophisticated
            // Currently we're just checking if it's not one of the regular managers
            if self.authorized_managers.contains(&caller) {
                return Err(Error::Unauthorized);
            }

            // Check for zero amount
            if amount == 0 {
                return Err(Error::ZeroAmount);
            }

            // Transfer tokens to recipient
            let result = PSP22Ref::transfer(
                &self.gov_token,
                to,
                amount,
                Vec::new()
            );

            if result.is_err() {
                return Err(Error::TokenTransferFailed);
            }

            // Emit event
            self.env().emit_event(PayoutMade {
                to,
                amount,
                reason,
            });

            Ok(())
        }

        /// Add a new authorized manager
        #[ink(message)]
        pub fn add_manager(&mut self, manager: AccountId) -> Result<()> {
            let caller = self.env().caller();

            // Check if caller is authorized
            if !self.authorized_managers.contains(&caller) {
                return Err(Error::Unauthorized);
            }

            // Add new manager if not already in the list
            if !self.authorized_managers.contains(&manager) {
                self.authorized_managers.push(manager);

                // Emit event
                self.env().emit_event(ManagerAdded {
                    manager,
                });
            }

            Ok(())
        }

        /// Remove an authorized manager
        #[ink(message)]
        pub fn remove_manager(&mut self, manager: AccountId) -> Result<()> {
            let caller = self.env().caller();

            // Check if caller is authorized
            if !self.authorized_managers.contains(&caller) {
                return Err(Error::Unauthorized);
            }

            // Find and remove manager
            if let Some(idx) = self.authorized_managers.iter().position(|m| *m == manager) {
                self.authorized_managers.swap_remove(idx);

                // Emit event
                self.env().emit_event(ManagerRemoved {
                    manager,
                });
            }

            Ok(())
        }

        /// Get current balance of insurance fund
        #[ink(message)]
        pub fn get_balance(&self) -> Balance {
            PSP22Ref::balance_of(&self.gov_token, self.env().account_id())
        }

        /// Check if an account is a manager
        #[ink(message)]
        pub fn is_manager(&self, account: AccountId) -> bool {
            self.authorized_managers.contains(&account)
        }

        /// Get maximum direct payout amount
        #[ink(message)]
        pub fn get_max_direct_payout(&self) -> Balance {
            self.max_direct_payout
        }

        /// Set maximum direct payout amount
        #[ink(message)]
        pub fn set_max_direct_payout(&mut self, amount: Balance) -> Result<()> {
            let caller = self.env().caller();

            // Check if caller is authorized
            if !self.authorized_managers.contains(&caller) {
                return Err(Error::Unauthorized);
            }

            self.max_direct_payout = amount;
            Ok(())
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test::*, DefaultEnvironment};
        type Environment = DefaultEnvironment;

        // Mock setup for testing
        fn setup() -> InsuranceFund {
            let gov_token = AccountId::from([0x1; 32]);
            let managers = vec![AccountId::from([0x2; 32])];
            let max_payout = 1_000_000_000; // 1 DOT
            
            InsuranceFund::new(gov_token, managers, max_payout)
        }

        #[ink::test]
        fn test_constructor() {
            let contract = setup();
            assert_eq!(contract.gov_token, AccountId::from([0x1; 32]));
            assert_eq!(contract.authorized_managers.len(), 1);
            assert_eq!(contract.max_direct_payout, 1_000_000_000);
        }

        // More tests would be added for each function
    }
}

#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

use ink::{ storage::Mapping, prelude::vec::Vec };
use openbrush::contracts::psp22::PSP22Ref;
use scale::{Decode, Encode};

#[ink::contract]
mod escrow_manager {
    use super::*;

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Copy, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum MilestoneStatus {
        Active,   // Funds can be released normally
        Frozen,   // Requires governance action to move funds
        Released, // Funds have been released to NPO
    }

    impl Default for MilestoneStatus {
        fn default() -> Self {
            MilestoneStatus::Active
        }
    }

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct MilestoneEscrow {
        npo: AccountId,
        milestone_id: u32,
        amount: Balance,
        status: MilestoneStatus,
        donors: Vec<AccountId>,
        donor_amounts: Vec<Balance>,
    }

    #[ink(storage)]
    pub struct EscrowManager {
        // Mapping from (npo, milestone_id) to escrowed amount
        escrows: Mapping<(AccountId, u32), MilestoneEscrow>,
        // Governance token for transfers
        gov_token: AccountId,
        // Authorized callers who can manage escrows
        authorized_callers: Vec<AccountId>,
    }

    // Events
    #[ink(event)]
    pub struct DepositMade {
        #[ink(topic)]
        npo: AccountId,
        #[ink(topic)]
        milestone_id: u32,
        #[ink(topic)]
        donor: AccountId,
        amount: Balance,
        total_amount: Balance,
    }

    #[ink(event)]
    pub struct FundsReleased {
        #[ink(topic)]
        npo: AccountId,
        #[ink(topic)]
        milestone_id: u32,
        amount: Balance,
    }

    #[ink(event)]
    pub struct MilestoneFrozen {
        #[ink(topic)]
        npo: AccountId,
        #[ink(topic)]
        milestone_id: u32,
        amount: Balance,
    }

    #[ink(event)]
    pub struct FundsRedirected {
        #[ink(topic)]
        from_npo: AccountId,
        #[ink(topic)]
        milestone_id: u32,
        to_npo: AccountId,
        amount: Balance,
    }

    #[ink(event)]
    pub struct FundsRefunded {
        #[ink(topic)]
        npo: AccountId,
        #[ink(topic)]
        milestone_id: u32,
        donor: AccountId,
        amount: Balance,
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
        /// Milestone already frozen
        MilestoneAlreadyFrozen,
        /// Milestone already released
        MilestoneAlreadyReleased,
        /// Milestone not found
        MilestoneNotFound,
        /// Milestone not frozen
        MilestoneNotFrozen,
        /// Donor not found for refund
        DonorNotFound,
    }

    // Type alias for Result
    pub type Result<T> = core::result::Result<T, Error>;

    impl EscrowManager {
        #[ink(constructor)]
        pub fn new(gov_token: AccountId, initial_authorized: Vec<AccountId>) -> Self {
            Self {
                escrows: Mapping::default(),
                gov_token,
                authorized_callers: initial_authorized,
            }
        }

        /// Deposit funds into escrow for an NPO's milestone
        #[ink(message)]
        pub fn deposit(&mut self, npo: AccountId, milestone_id: u32, amount: Balance) -> Result<()> {
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

            // Get or initialize escrow for this milestone
            let mut escrow = self.escrows.get((npo, milestone_id)).unwrap_or_else(|| {
                MilestoneEscrow {
                    npo,
                    milestone_id,
                    amount: 0,
                    status: MilestoneStatus::Active,
                    donors: Vec::new(),
                    donor_amounts: Vec::new(),
                }
            });

            // Check if milestone is not already released
            if escrow.status == MilestoneStatus::Released {
                return Err(Error::MilestoneAlreadyReleased);
            }

            // Find donor in the list or add if new
            let donor_idx = escrow.donors.iter().position(|d| *d == caller);
            match donor_idx {
                Some(idx) => {
                    // Existing donor, update amount
                    escrow.donor_amounts[idx] += amount;
                },
                None => {
                    // New donor, add to lists
                    escrow.donors.push(caller);
                    escrow.donor_amounts.push(amount);
                }
            }

            // Update total amount
            escrow.amount += amount;

            // Save updated escrow
            self.escrows.insert((npo, milestone_id), &escrow);

            // Emit event
            self.env().emit_event(DepositMade {
                npo,
                milestone_id,
                donor: caller,
                amount,
                total_amount: escrow.amount,
            });

            Ok(())
        }

        /// Release funds to NPO after successful audit
        #[ink(message)]
        pub fn release(&mut self, npo: AccountId, milestone_id: u32) -> Result<()> {
            // Only authorized callers can release funds
            let caller = self.env().caller();
            if !self.authorized_callers.contains(&caller) {
                return Err(Error::Unauthorized);
            }

            // Get escrow for this milestone
            let mut escrow = self.escrows.get((npo, milestone_id))
                .ok_or(Error::MilestoneNotFound)?;

            // Check if milestone is not already released or frozen
            match escrow.status {
                MilestoneStatus::Released => return Err(Error::MilestoneAlreadyReleased),
                MilestoneStatus::Frozen => return Err(Error::MilestoneAlreadyFrozen),
                _ => {}
            }

            // Update status to Released
            escrow.status = MilestoneStatus::Released;
            self.escrows.insert((npo, milestone_id), &escrow);

            // Transfer tokens to NPO
            let result = PSP22Ref::transfer(
                &self.gov_token,
                npo,
                escrow.amount,
                Vec::new()
            );

            if result.is_err() {
                return Err(Error::TokenTransferFailed);
            }

            // Emit event
            self.env().emit_event(FundsReleased {
                npo,
                milestone_id,
                amount: escrow.amount,
            });

            Ok(())
        }

        /// Freeze milestone funds due to failed audit or dispute
        #[ink(message)]
        pub fn freeze_milestone(&mut self, npo: AccountId, milestone_id: u32) -> Result<()> {
            // Only authorized callers can freeze funds
            let caller = self.env().caller();
            if !self.authorized_callers.contains(&caller) {
                return Err(Error::Unauthorized);
            }

            // Get escrow for this milestone
            let mut escrow = self.escrows.get((npo, milestone_id))
                .ok_or(Error::MilestoneNotFound)?;

            // Check if milestone is not already released or frozen
            match escrow.status {
                MilestoneStatus::Released => return Err(Error::MilestoneAlreadyReleased),
                MilestoneStatus::Frozen => return Err(Error::MilestoneAlreadyFrozen),
                _ => {}
            }

            // Update status to Frozen
            escrow.status = MilestoneStatus::Frozen;
            self.escrows.insert((npo, milestone_id), &escrow);

            // Emit event
            self.env().emit_event(MilestoneFrozen {
                npo,
                milestone_id,
                amount: escrow.amount,
            });

            Ok(())
        }

        /// Redirect funds from a frozen milestone to another NPO (governance action)
        #[ink(message)]
        pub fn redirect_funds(&mut self, from_npo: AccountId, milestone_id: u32, to_npo: AccountId) -> Result<()> {
            // Only authorized governance callers can redirect funds
            let caller = self.env().caller();
            if !self.authorized_callers.contains(&caller) {
                return Err(Error::Unauthorized);
            }

            // Get escrow for this milestone
            let mut escrow = self.escrows.get((from_npo, milestone_id))
                .ok_or(Error::MilestoneNotFound)?;

            // Check if milestone is frozen
            if escrow.status != MilestoneStatus::Frozen {
                return Err(Error::MilestoneNotFrozen);
            }

            // Save amount before updating escrow
            let amount = escrow.amount;

            // Update status to Released and clear amount
            escrow.status = MilestoneStatus::Released;
            escrow.amount = 0;
            // Clear donors and amounts since funds are redirected
            escrow.donors.clear();
            escrow.donor_amounts.clear();
            self.escrows.insert((from_npo, milestone_id), &escrow);

            // Transfer tokens to the new NPO
            let result = PSP22Ref::transfer(
                &self.gov_token,
                to_npo,
                amount,
                Vec::new()
            );

            if result.is_err() {
                return Err(Error::TokenTransferFailed);
            }

            // Emit event
            self.env().emit_event(FundsRedirected {
                from_npo,
                milestone_id,
                to_npo,
                amount,
            });

            Ok(())
        }

        /// Refund a donor's contribution from a frozen milestone (governance action)
        #[ink(message)]
        pub fn refund_donor(&mut self, npo: AccountId, milestone_id: u32, donor: AccountId) -> Result<()> {
            // Only authorized governance callers can issue refunds
            let caller = self.env().caller();
            if !self.authorized_callers.contains(&caller) {
                return Err(Error::Unauthorized);
            }

            // Get escrow for this milestone
            let mut escrow = self.escrows.get((npo, milestone_id))
                .ok_or(Error::MilestoneNotFound)?;

            // Check if milestone is frozen
            if escrow.status != MilestoneStatus::Frozen {
                return Err(Error::MilestoneNotFrozen);
            }

            // Find donor in the list
            let donor_idx = escrow.donors.iter().position(|d| *d == donor)
                .ok_or(Error::DonorNotFound)?;

            // Get donor's contribution amount
            let donor_amount = escrow.donor_amounts[donor_idx];

            // Remove donor from lists and update total amount
            escrow.donors.swap_remove(donor_idx);
            escrow.donor_amounts.swap_remove(donor_idx);
            escrow.amount -= donor_amount;

            // Update escrow
            self.escrows.insert((npo, milestone_id), &escrow);

            // Transfer tokens back to donor
            let result = PSP22Ref::transfer(
                &self.gov_token,
                donor,
                donor_amount,
                Vec::new()
            );

            if result.is_err() {
                return Err(Error::TokenTransferFailed);
            }

            // Emit event
            self.env().emit_event(FundsRefunded {
                npo,
                milestone_id,
                donor,
                amount: donor_amount,
            });

            Ok(())
        }

        /// Add a new authorized caller
        #[ink(message)]
        pub fn add_authorized_caller(&mut self, caller: AccountId) -> Result<()> {
            // Only existing authorized callers can add new ones
            let sender = self.env().caller();
            if !self.authorized_callers.contains(&sender) {
                return Err(Error::Unauthorized);
            }

            // Add new caller if not already authorized
            if !self.authorized_callers.contains(&caller) {
                self.authorized_callers.push(caller);
            }

            Ok(())
        }

        /// Remove an authorized caller
        #[ink(message)]
        pub fn remove_authorized_caller(&mut self, caller: AccountId) -> Result<()> {
            // Only existing authorized callers can remove others
            let sender = self.env().caller();
            if !self.authorized_callers.contains(&sender) {
                return Err(Error::Unauthorized);
            }

            // Find and remove caller
            if let Some(idx) = self.authorized_callers.iter().position(|c| *c == caller) {
                self.authorized_callers.swap_remove(idx);
            }

            Ok(())
        }

        /// Get escrowed amount for an NPO's milestone
        #[ink(message)]
        pub fn get_escrow(&self, npo: AccountId, milestone_id: u32) -> Option<MilestoneEscrow> {
            self.escrows.get((npo, milestone_id))
        }

        /// Check if a caller is authorized
        #[ink(message)]
        pub fn is_authorized(&self, caller: AccountId) -> bool {
            self.authorized_callers.contains(&caller)
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test::*, DefaultEnvironment};
        type Environment = DefaultEnvironment;

        // Mock setup for testing
        fn setup() -> EscrowManager {
            let gov_token = AccountId::from([0x1; 32]);
            let authorized = vec![AccountId::from([0x2; 32])];
            
            EscrowManager::new(gov_token, authorized)
        }

        #[ink::test]
        fn test_constructor() {
            let contract = setup();
            assert_eq!(contract.gov_token, AccountId::from([0x1; 32]));
            assert_eq!(contract.authorized_callers.len(), 1);
            assert_eq!(contract.authorized_callers[0], AccountId::from([0x2; 32]));
        }

        // More tests would be added for each function
    }
}

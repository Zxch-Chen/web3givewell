#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

use ink::{ storage::Mapping, prelude::vec::Vec };
use openbrush::contracts::psp22::PSP22Ref;
use scale::{Decode, Encode};
use ink::env::call::FromAccountId;

#[ink::contract]
mod audit_bounty_manager {
    use super::*;
    
    type AuditorRegistryRef = auditor_registry::AuditorRegistryRef;

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Copy, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum Vote {
        None,
        Pass,
        Fail,
    }

    impl Default for Vote {
        fn default() -> Self {
            Vote::None
        }
    }

    #[derive(Encode, Decode, Debug, Default, PartialEq, Eq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct VoteData {
        vote: Vote,
        report_cid: String,
        evidence_cids: Vec<String>,
        timestamp: Timestamp,
    }

    // Bounty struct to store in storage
    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Bounty {
        id: u32,
        npo: AccountId,
        milestone_id: u32,
        reward_pool: Balance,
        stake_required: Balance,
        start: Timestamp,
        concern_deadline: Timestamp,
        auditors: Vec<AccountId>,
        status: BountyStatus,
        concerns_raised: bool,
    }

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone, Copy)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum BountyStatus {
        Active,
        Disputed,
        Passed,
        Failed,
    }

    impl Default for BountyStatus {
        fn default() -> Self {
            BountyStatus::Active
        }
    }

    #[ink(storage)]
    pub struct AuditBountyManager {
        // Counter for bounty IDs
        next_bounty_id: u32,
        // Mapping from bounty ID to bounty details
        bounties: Mapping<u32, Bounty>,
        // Mapping from (bounty ID, auditor) to vote
        votes: Mapping<(u32, AccountId), VoteData>,
        // Governance token used for staking
        gov_token: AccountId,
        // Auditor registry contract address
        auditor_registry: AccountId,
        // Dispute manager contract address
        dispute_manager: AccountId,
        // Escrow manager contract address
        escrow_manager: AccountId,
        // Window for raising concerns (in seconds)
        concern_window: u64,
        // Maximum number of auditors per bounty
        max_auditors: u32,
        // Minimum stake required to opt in a bounty
        min_stake_required: Balance,
    }

    // Events
    #[ink(event)]
    pub struct BountyCreated {
        #[ink(topic)]
        id: u32,
        #[ink(topic)]
        npo: AccountId,
        milestone_id: u32,
        reward_pool: Balance,
        concern_deadline: Timestamp,
    }

    #[ink(event)]
    pub struct AuditorOptedIn {
        #[ink(topic)]
        bounty_id: u32,
        #[ink(topic)]
        auditor: AccountId,
    }

    #[ink(event)]
    pub struct VoteSubmitted {
        #[ink(topic)]
        bounty_id: u32,
        #[ink(topic)]
        auditor: AccountId,
        #[ink(topic)]
        vote: Vote,
    }

    #[ink(event)]
    pub struct ConcernRaised {
        #[ink(topic)]
        bounty_id: u32,
        #[ink(topic)]
        auditor: AccountId,
    }

    #[ink(event)]
    pub struct BountyFinalized {
        #[ink(topic)]
        bounty_id: u32,
        #[ink(topic)]
        status: BountyStatus,
    }

    // Error types
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(::scale_info::TypeInfo))]
    pub enum Error {
        /// Token transfer failed
        TokenTransferFailed,
        /// Bounty not found
        BountyNotFound,
        /// Auditor not registered
        AuditorNotRegistered,
        /// Unauthorized caller
        Unauthorized,
        /// Maximum number of auditors reached
        MaxAuditorsReached,
        /// Auditor already opted in
        AlreadyOptedIn,
        /// Insufficient stake
        InsufficientStake,
        /// Concern deadline passed
        ConcernDeadlinePassed,
        /// Vote already submitted
        VoteAlreadySubmitted,
        /// Bounty not finalizable
        BountyNotFinalizable,
        /// Bounty already finalized
        BountyAlreadyFinalized,
        /// No auditors opted in
        NoAuditorsOptedIn,
        /// AuditorRegistry interaction failed
        AuditorRegistryError,
        /// DisputeManager interaction failed
        DisputeManagerError,
        /// EscrowManager interaction failed
        EscrowManagerError,
    }

    // Type alias for Result
    pub type Result<T> = core::result::Result<T, Error>;

    impl AuditBountyManager {
        #[ink(constructor)]
        pub fn new(
            gov_token: AccountId,
            auditor_registry: AccountId,
            dispute_manager: AccountId,
            escrow_manager: AccountId,
            concern_window: u64,
            max_auditors: u32,
            min_stake_required: Balance,
        ) -> Self {
            Self {
                next_bounty_id: 1,
                bounties: Mapping::default(),
                votes: Mapping::default(),
                gov_token,
                auditor_registry,
                dispute_manager,
                escrow_manager,
                concern_window,
                max_auditors,
                min_stake_required,
            }
        }

        /// Create a new audit bounty
        #[ink(message)]
        pub fn create_bounty(&mut self, npo: AccountId, milestone_id: u32, reward_pool: Balance) -> Result<u32> {
            let caller = self.env().caller();
            
            // Transfer reward pool into contract
            let result = PSP22Ref::transfer_from(
                &self.gov_token,
                caller,
                self.env().account_id(),
                reward_pool,
                Vec::new()
            );

            if result.is_err() {
                return Err(Error::TokenTransferFailed);
            }

            // Set start and concern deadline
            let now = self.env().block_timestamp();
            let concern_deadline = now + self.concern_window;

            // Create new bounty
            let bounty_id = self.next_bounty_id;
            let bounty = Bounty {
                id: bounty_id,
                npo,
                milestone_id,
                reward_pool,
                stake_required: self.min_stake_required,
                start: now,
                concern_deadline,
                auditors: Vec::new(),
                status: BountyStatus::Active,
                concerns_raised: false,
            };

            // Store the bounty
            self.bounties.insert(bounty_id, &bounty);
            self.next_bounty_id += 1;

            // Emit event
            self.env().emit_event(BountyCreated {
                id: bounty_id,
                npo,
                milestone_id,
                reward_pool,
                concern_deadline,
            });

            Ok(bounty_id)
        }

        /// Opt in to a bounty as an auditor
        #[ink(message)]
        pub fn opt_in_bounty(&mut self, bounty_id: u32) -> Result<()> {
            let caller = self.env().caller();

            // Get bounty
            let mut bounty = self.bounties.get(bounty_id).ok_or(Error::BountyNotFound)?;

            // Check if bounty is still active
            if bounty.status != BountyStatus::Active {
                return Err(Error::BountyAlreadyFinalized);
            }

            // Check if maximum auditors reached
            if bounty.auditors.len() as u32 >= self.max_auditors {
                return Err(Error::MaxAuditorsReached);
            }

            // Check if already opted in
            if bounty.auditors.contains(&caller) {
                return Err(Error::AlreadyOptedIn);
            }

            // Check if auditor is registered and has enough stake
            let auditor_registry: AuditorRegistryRef = FromAccountId::from_account_id(self.auditor_registry);
            
            match auditor_registry.get_auditor(caller) {
                Some(auditor) => {
                    if auditor.stake < bounty.stake_required {
                        return Err(Error::InsufficientStake);
                    }
                },
                None => return Err(Error::AuditorNotRegistered),
            }

            // Add auditor to bounty
            bounty.auditors.push(caller);
            self.bounties.insert(bounty_id, &bounty);

            // Emit event
            self.env().emit_event(AuditorOptedIn {
                bounty_id,
                auditor: caller,
            });

            Ok(())
        }

        /// Submit a vote on a bounty
        #[ink(message)]
        pub fn submit_vote(
            &mut self,
            bounty_id: u32,
            vote: Vote,
            report_cid: String,
            evidence_cids: Vec<String>,
        ) -> Result<()> {
            let caller = self.env().caller();
            let now = self.env().block_timestamp();

            // Get bounty
            let mut bounty = self.bounties.get(bounty_id).ok_or(Error::BountyNotFound)?;

            // Check if bounty is still active
            if bounty.status != BountyStatus::Active {
                return Err(Error::BountyAlreadyFinalized);
            }

            // Check if concern deadline has not passed
            if now >= bounty.concern_deadline {
                return Err(Error::ConcernDeadlinePassed);
            }

            // Check if auditor has opted in
            if !bounty.auditors.contains(&caller) {
                return Err(Error::Unauthorized);
            }

            // Check if already voted
            if let Some(vote_data) = self.votes.get((bounty_id, caller)) {
                if vote_data.vote != Vote::None {
                    return Err(Error::VoteAlreadySubmitted);
                }
            }

            // Record vote data
            let vote_data = VoteData {
                vote,
                report_cid,
                evidence_cids,
                timestamp: now,
            };
            self.votes.insert((bounty_id, caller), &vote_data);

            // If vote is Fail, set concerns_raised flag
            if vote == Vote::Fail && !bounty.concerns_raised {
                bounty.concerns_raised = true;
                self.bounties.insert(bounty_id, &bounty);

                // Emit concern raised event
                self.env().emit_event(ConcernRaised {
                    bounty_id,
                    auditor: caller,
                });
            }

            // Emit vote submitted event
            self.env().emit_event(VoteSubmitted {
                bounty_id,
                auditor: caller,
                vote,
            });

            Ok(())
        }

        /// Finalize a bounty after concern window
        #[ink(message)]
        pub fn finalize_bounty(&mut self, bounty_id: u32) -> Result<()> {
            let now = self.env().block_timestamp();

            // Get bounty
            let mut bounty = self.bounties.get(bounty_id).ok_or(Error::BountyNotFound)?;

            // Check if bounty is still active
            if bounty.status != BountyStatus::Active {
                return Err(Error::BountyAlreadyFinalized);
            }

            // Check if concern deadline has passed
            if now < bounty.concern_deadline {
                return Err(Error::BountyNotFinalizable);
            }

            // Check if any auditors opted in
            if bounty.auditors.is_empty() {
                return Err(Error::NoAuditorsOptedIn);
            }

            // If concerns were raised, start a dispute
            if bounty.concerns_raised {
                // Mark bounty as disputed
                bounty.status = BountyStatus::Disputed;
                self.bounties.insert(bounty_id, &bounty);

                // Start dispute (would call dispute_manager in real implementation)
                // This is a mock implementation; in reality you'd make a cross-contract call
                // to the dispute manager contract
                self.env().emit_event(BountyFinalized {
                    bounty_id,
                    status: BountyStatus::Disputed,
                });

                return Ok(());
            }

            // If no concerns, tally votes
            let mut pass_votes = 0;
            let mut fail_votes = 0;

            for auditor in &bounty.auditors {
                if let Some(vote_data) = self.votes.get((bounty_id, *auditor)) {
                    match vote_data.vote {
                        Vote::Pass => pass_votes += 1,
                        Vote::Fail => fail_votes += 1,
                        Vote::None => {}, // No vote cast
                    }
                }
            }

            // Determine outcome based on majority vote
            let status = if pass_votes >= fail_votes {
                BountyStatus::Passed
            } else {
                BountyStatus::Failed
            };

            // Update bounty status
            bounty.status = status;
            self.bounties.insert(bounty_id, &bounty);

            // Distribute rewards and update reputation
            // Note: This is simplified - in a real implementation you'd have more
            // complex reward distribution logic
            
            // Emit finalized event
            self.env().emit_event(BountyFinalized {
                bounty_id,
                status,
            });

            Ok(())
        }

        /// Get bounty details
        #[ink(message)]
        pub fn get_bounty(&self, bounty_id: u32) -> Option<Bounty> {
            self.bounties.get(bounty_id)
        }

        /// Get auditor's vote for a bounty
        #[ink(message)]
        pub fn get_vote(&self, bounty_id: u32, auditor: AccountId) -> Option<VoteData> {
            self.votes.get((bounty_id, auditor))
        }

        /// Check if a bounty is finalizable
        #[ink(message)]
        pub fn is_bounty_finalizable(&self, bounty_id: u32) -> bool {
            match self.bounties.get(bounty_id) {
                Some(bounty) => {
                    let now = self.env().block_timestamp();
                    bounty.status == BountyStatus::Active 
                        && now >= bounty.concern_deadline 
                        && !bounty.auditors.is_empty()
                },
                None => false,
            }
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test::*, DefaultEnvironment};
        type Environment = DefaultEnvironment;

        // Mock dependencies for testing
        // In a real test, you'd use proper mock implementations
        fn setup() -> AuditBountyManager {
            let gov_token = AccountId::from([0x1; 32]);
            let auditor_registry = AccountId::from([0x2; 32]);
            let dispute_manager = AccountId::from([0x3; 32]);
            let escrow_manager = AccountId::from([0x4; 32]);
            
            AuditBountyManager::new(
                gov_token,
                auditor_registry,
                dispute_manager,
                escrow_manager,
                7 * 24 * 60 * 60, // 7 days concern window
                10, // max 10 auditors
                100_000_000_000, // min stake
            )
        }

        #[ink::test]
        fn test_constructor() {
            let contract = setup();
            assert_eq!(contract.next_bounty_id, 1);
            assert_eq!(contract.max_auditors, 10);
            assert_eq!(contract.concern_window, 7 * 24 * 60 * 60);
        }

        // More tests would be added for each function
        // Mocking cross-contract calls requires more complex test setup
    }
}

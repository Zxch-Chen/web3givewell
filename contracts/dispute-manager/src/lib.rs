#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

use ink::{ storage::Mapping, prelude::vec::Vec };
use scale::{Decode, Encode};
use ink::env::call::FromAccountId;

#[ink::contract]
mod dispute_manager {
    use super::*;
    
    type AuditorRegistryRef = auditor_registry::AuditorRegistryRef;

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Dispute {
        id: u32,
        bounty_id: u32,
        panel: Vec<AccountId>,
        end: Timestamp,
        status: DisputeStatus,
        result: DisputeResult,
    }

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone, Copy)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum DisputeStatus {
        Active,
        Finalized,
    }

    impl Default for DisputeStatus {
        fn default() -> Self {
            DisputeStatus::Active
        }
    }

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone, Copy)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum DisputeResult {
        None,
        Overturn,
        Uphold,
    }

    impl Default for DisputeResult {
        fn default() -> Self {
            DisputeResult::None
        }
    }

    #[derive(Encode, Decode, Debug, Default, PartialEq, Eq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct PanelVote {
        overturn: bool,
        notes_cid: String,
        timestamp: Timestamp,
    }

    #[ink(storage)]
    pub struct DisputeManager {
        // Counter for dispute IDs
        next_dispute_id: u32,
        // Mapping from dispute ID to dispute details
        disputes: Mapping<u32, Dispute>,
        // Mapping from (dispute ID, auditor) to panel vote
        panel_votes: Mapping<(u32, AccountId), PanelVote>,
        // Mapping from bounty ID to dispute ID
        bounty_to_dispute: Mapping<u32, u32>,
        // Auditor registry contract address
        auditor_registry: AccountId,
        // Escrow manager contract address
        escrow_manager: AccountId,
        // Audit bounty manager contract address
        audit_bounty_manager: AccountId,
        // Window for resolving disputes (in seconds)
        dispute_window: u64,
        // Number of panel members to select
        panel_size: u32,
        // Threshold percentage for overturning (0-100)
        overturn_threshold_pct: u8,
    }

    // Events
    #[ink(event)]
    pub struct DisputeStarted {
        #[ink(topic)]
        dispute_id: u32,
        #[ink(topic)]
        bounty_id: u32,
        panel: Vec<AccountId>,
        end: Timestamp,
    }

    #[ink(event)]
    pub struct PanelVoteSubmitted {
        #[ink(topic)]
        dispute_id: u32,
        #[ink(topic)]
        auditor: AccountId,
        overturn: bool,
    }

    #[ink(event)]
    pub struct DisputeFinalized {
        #[ink(topic)]
        dispute_id: u32,
        #[ink(topic)]
        result: DisputeResult,
        overturn_votes: u32,
        uphold_votes: u32,
    }

    // Error types
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(::scale_info::TypeInfo))]
    pub enum Error {
        /// Dispute not found
        DisputeNotFound,
        /// Bounty already has a dispute
        BountyAlreadyDisputed,
        /// Unauthorized caller
        Unauthorized,
        /// Not a panel member
        NotPanelMember,
        /// Vote already submitted
        VoteAlreadySubmitted,
        /// Dispute already finalized
        DisputeAlreadyFinalized,
        /// Dispute not finalizable
        DisputeNotFinalizable,
        /// Dispute deadline not passed
        DisputeDeadlineNotPassed,
        /// Not enough auditors for panel
        NotEnoughAuditors,
        /// AuditorRegistry interaction failed
        AuditorRegistryError,
        /// EscrowManager interaction failed
        EscrowManagerError,
    }

    // Type alias for Result
    pub type Result<T> = core::result::Result<T, Error>;

    impl DisputeManager {
        #[ink(constructor)]
        pub fn new(
            auditor_registry: AccountId,
            escrow_manager: AccountId,
            audit_bounty_manager: AccountId,
            dispute_window: u64,
            panel_size: u32,
            overturn_threshold_pct: u8,
        ) -> Self {
            // Ensure threshold is between 0-100
            let threshold = if overturn_threshold_pct > 100 { 100 } else { overturn_threshold_pct };
            
            Self {
                next_dispute_id: 1,
                disputes: Mapping::default(),
                panel_votes: Mapping::default(),
                bounty_to_dispute: Mapping::default(),
                auditor_registry,
                escrow_manager,
                audit_bounty_manager,
                dispute_window,
                panel_size,
                overturn_threshold_pct: threshold,
            }
        }

        /// Start a new dispute for a bounty
        #[ink(message)]
        pub fn start_dispute(&mut self, bounty_id: u32) -> Result<u32> {
            // Only AuditBountyManager can call this
            if self.env().caller() != self.audit_bounty_manager {
                return Err(Error::Unauthorized);
            }

            // Check if bounty already has a dispute
            if self.bounty_to_dispute.contains(bounty_id) {
                return Err(Error::BountyAlreadyDisputed);
            }

            // Create new dispute
            let dispute_id = self.next_dispute_id;
            let now = self.env().block_timestamp();
            let end = now + self.dispute_window;

            // In a real implementation, we would use VRF to select panel members
            // Here we're just mocking the panel selection for simplicity
            let panel = self.select_panel_members()?;

            let dispute = Dispute {
                id: dispute_id,
                bounty_id,
                panel: panel.clone(),
                end,
                status: DisputeStatus::Active,
                result: DisputeResult::None,
            };

            // Store the dispute
            self.disputes.insert(dispute_id, &dispute);
            self.bounty_to_dispute.insert(bounty_id, &dispute_id);
            self.next_dispute_id += 1;

            // Emit event
            self.env().emit_event(DisputeStarted {
                dispute_id,
                bounty_id,
                panel,
                end,
            });

            Ok(dispute_id)
        }

        /// Submit a vote as a panel member
        #[ink(message)]
        pub fn submit_panel_vote(&mut self, dispute_id: u32, overturn: bool, notes_cid: String) -> Result<()> {
            let caller = self.env().caller();
            let now = self.env().block_timestamp();

            // Get dispute
            let dispute = self.disputes.get(dispute_id).ok_or(Error::DisputeNotFound)?;

            // Check if dispute is still active
            if dispute.status != DisputeStatus::Active {
                return Err(Error::DisputeAlreadyFinalized);
            }

            // Check if caller is a panel member
            if !dispute.panel.contains(&caller) {
                return Err(Error::NotPanelMember);
            }

            // Check if dispute end time has not passed
            if now >= dispute.end {
                return Err(Error::DisputeNotFinalizable);
            }

            // Check if already voted
            if self.panel_votes.contains((dispute_id, caller)) {
                return Err(Error::VoteAlreadySubmitted);
            }

            // Record vote
            let vote = PanelVote {
                overturn,
                notes_cid,
                timestamp: now,
            };
            self.panel_votes.insert((dispute_id, caller), &vote);

            // Emit event
            self.env().emit_event(PanelVoteSubmitted {
                dispute_id,
                auditor: caller,
                overturn,
            });

            Ok(())
        }

        /// Finalize a dispute after voting period
        #[ink(message)]
        pub fn finalize_dispute(&mut self, dispute_id: u32) -> Result<()> {
            let now = self.env().block_timestamp();

            // Get dispute
            let mut dispute = self.disputes.get(dispute_id).ok_or(Error::DisputeNotFound)?;

            // Check if dispute is still active
            if dispute.status != DisputeStatus::Active {
                return Err(Error::DisputeAlreadyFinalized);
            }

            // Check if dispute end time has passed
            if now < dispute.end {
                return Err(Error::DisputeDeadlineNotPassed);
            }

            // Tally votes
            let mut overturn_votes = 0;
            let mut uphold_votes = 0;

            for member in &dispute.panel {
                if let Some(vote) = self.panel_votes.get((dispute_id, *member)) {
                    if vote.overturn {
                        overturn_votes += 1;
                    } else {
                        uphold_votes += 1;
                    }
                }
            }

            // Calculate percentage of overturn votes
            let total_votes = overturn_votes + uphold_votes;
            let result = if total_votes > 0 {
                let overturn_pct = (overturn_votes * 100) / total_votes;
                if overturn_pct >= self.overturn_threshold_pct as u32 {
                    DisputeResult::Overturn
                } else {
                    DisputeResult::Uphold
                }
            } else {
                // If no votes, default to uphold
                DisputeResult::Uphold
            };

            // Update dispute status and result
            dispute.status = DisputeStatus::Finalized;
            dispute.result = result;
            self.disputes.insert(dispute_id, &dispute);

            // If result is overturn, call escrow_manager.freezeMilestone
            // In a real implementation, this would be a cross-contract call
            // Here it's just a placeholder comment

            // Emit finalized event
            self.env().emit_event(DisputeFinalized {
                dispute_id,
                result,
                overturn_votes,
                uphold_votes,
            });

            Ok(())
        }

        /// Get dispute details
        #[ink(message)]
        pub fn get_dispute(&self, dispute_id: u32) -> Option<Dispute> {
            self.disputes.get(dispute_id)
        }

        /// Get panel member's vote for a dispute
        #[ink(message)]
        pub fn get_panel_vote(&self, dispute_id: u32, auditor: AccountId) -> Option<PanelVote> {
            self.panel_votes.get((dispute_id, auditor))
        }

        /// Get dispute ID for a bounty
        #[ink(message)]
        pub fn get_bounty_dispute(&self, bounty_id: u32) -> Option<u32> {
            self.bounty_to_dispute.get(bounty_id)
        }

        /// Check if a dispute is finalizable
        #[ink(message)]
        pub fn is_dispute_finalizable(&self, dispute_id: u32) -> bool {
            match self.disputes.get(dispute_id) {
                Some(dispute) => {
                    let now = self.env().block_timestamp();
                    dispute.status == DisputeStatus::Active && now >= dispute.end
                },
                None => false,
            }
        }

        /// Helper function to select panel members
        /// In a real implementation, this would use VRF for random selection
        fn select_panel_members(&self) -> Result<Vec<AccountId>> {
            // This is a mock implementation that would typically involve
            // calling the auditor registry to get eligible auditors and
            // using VRF for random selection
            
            // For this mock, we'll just return some fixed account IDs
            let panel = vec![
                AccountId::from([0x1; 32]),
                AccountId::from([0x2; 32]),
                AccountId::from([0x3; 32]),
            ];
            
            if panel.len() < self.panel_size as usize {
                return Err(Error::NotEnoughAuditors);
            }
            
            Ok(panel)
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test::*, DefaultEnvironment};
        type Environment = DefaultEnvironment;

        // Mock setup for testing
        fn setup() -> DisputeManager {
            let auditor_registry = AccountId::from([0x1; 32]);
            let escrow_manager = AccountId::from([0x2; 32]);
            let audit_bounty_manager = AccountId::from([0x3; 32]);
            
            DisputeManager::new(
                auditor_registry,
                escrow_manager,
                audit_bounty_manager,
                3 * 24 * 60 * 60, // 3 days dispute window
                3, // panel size
                51, // 51% threshold for overturn
            )
        }

        #[ink::test]
        fn test_constructor() {
            let contract = setup();
            assert_eq!(contract.next_dispute_id, 1);
            assert_eq!(contract.panel_size, 3);
            assert_eq!(contract.overturn_threshold_pct, 51);
        }

        // More tests would be added for each function
    }
}

#![cfg_attr(not(feature = "std"), no_std)]
#![feature(min_specialization)]

use ink::{ storage::Mapping, prelude::vec::Vec };
use openbrush::contracts::psp22::PSP22Ref;
use scale::{Decode, Encode};
use ink::env::call::FromAccountId;

#[ink::contract]
mod governance_manager {
    use super::*;
    
    use escrow_manager::EscrowManagerRef;

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub struct Proposal {
        id: u32,
        proposer: AccountId,
        proposal_type: ProposalType,
        description: String,
        start_time: Timestamp,
        end_time: Timestamp,
        executed: bool,
        votes_for: u32,
        votes_against: u32,
    }

    #[derive(Encode, Decode, Debug, PartialEq, Eq, Clone)]
    #[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
    pub enum ProposalType {
        RedirectFunds {
            from_npo: AccountId,
            milestone_id: u32,
            to_npo: AccountId,
        },
        RefundDonors {
            npo: AccountId,
            milestone_id: u32,
        },
        AddAuditor {
            auditor: AccountId,
        },
        RemoveAuditor {
            auditor: AccountId,
        },
        Payout {
            recipient: AccountId,
            amount: Balance,
        },
    }

    #[ink(storage)]
    pub struct GovernanceManager {
        // Counter for proposal IDs
        next_proposal_id: u32,
        // Mapping from proposal ID to proposal details
        proposals: Mapping<u32, Proposal>,
        // Mapping from (proposal ID, voter) to vote
        votes: Mapping<(u32, AccountId), bool>, // true = for, false = against
        // Governance token used for voting
        gov_token: AccountId,
        // Escrow manager contract
        escrow_manager: AccountId,
        // Insurance fund contract
        insurance_fund: AccountId,
        // Auditor registry contract
        auditor_registry: AccountId,
        // Voting period in seconds
        voting_period: u64,
        // Minimum votes required for quorum
        quorum: u32,
    }

    // Events
    #[ink(event)]
    pub struct ProposalCreated {
        #[ink(topic)]
        proposal_id: u32,
        #[ink(topic)]
        proposer: AccountId,
        proposal_type: ProposalType,
        end_time: Timestamp,
    }

    #[ink(event)]
    pub struct VoteCast {
        #[ink(topic)]
        proposal_id: u32,
        #[ink(topic)]
        voter: AccountId,
        #[ink(topic)]
        support: bool,
    }

    #[ink(event)]
    pub struct ProposalExecuted {
        #[ink(topic)]
        proposal_id: u32,
        #[ink(topic)]
        success: bool,
    }

    // Error types
    #[derive(Debug, PartialEq, Eq, scale::Encode, scale::Decode)]
    #[cfg_attr(feature = "std", derive(::scale_info::TypeInfo))]
    pub enum Error {
        /// Proposal not found
        ProposalNotFound,
        /// Proposal already executed
        ProposalAlreadyExecuted,
        /// Voting period not ended
        VotingPeriodNotEnded,
        /// Already voted
        AlreadyVoted,
        /// Voting period ended
        VotingPeriodEnded,
        /// Quorum not reached
        QuorumNotReached,
        /// Proposal not approved
        ProposalNotApproved,
        /// Escrow manager error
        EscrowManagerError,
        /// Insurance fund error
        InsuranceFundError,
        /// Auditor registry error
        AuditorRegistryError,
        /// Invalid proposal type
        InvalidProposalType,
    }

    // Type alias for Result
    pub type Result<T> = core::result::Result<T, Error>;

    impl GovernanceManager {
        #[ink(constructor)]
        pub fn new(
            gov_token: AccountId,
            escrow_manager: AccountId,
            insurance_fund: AccountId,
            auditor_registry: AccountId,
            voting_period: u64,
            quorum: u32,
        ) -> Self {
            Self {
                next_proposal_id: 1,
                proposals: Mapping::default(),
                votes: Mapping::default(),
                gov_token,
                escrow_manager,
                insurance_fund,
                auditor_registry,
                voting_period,
                quorum,
            }
        }

        /// Propose to redirect funds from a frozen milestone to a new NPO
        #[ink(message)]
        pub fn propose_redirect(
            &mut self,
            from_npo: AccountId,
            milestone_id: u32,
            to_npo: AccountId,
            description: String,
        ) -> Result<u32> {
            let proposer = self.env().caller();
            
            // Create proposal
            let proposal_id = self.next_proposal_id;
            let now = self.env().block_timestamp();
            let end_time = now + self.voting_period;
            
            let proposal = Proposal {
                id: proposal_id,
                proposer,
                proposal_type: ProposalType::RedirectFunds {
                    from_npo,
                    milestone_id,
                    to_npo,
                },
                description,
                start_time: now,
                end_time,
                executed: false,
                votes_for: 0,
                votes_against: 0,
            };
            
            // Store proposal
            self.proposals.insert(proposal_id, &proposal);
            self.next_proposal_id += 1;
            
            // Emit event
            self.env().emit_event(ProposalCreated {
                proposal_id,
                proposer,
                proposal_type: proposal.proposal_type.clone(),
                end_time,
            });
            
            Ok(proposal_id)
        }

        /// Propose to refund donors from a frozen milestone
        #[ink(message)]
        pub fn propose_refund_donors(
            &mut self,
            npo: AccountId,
            milestone_id: u32,
            description: String,
        ) -> Result<u32> {
            let proposer = self.env().caller();
            
            // Create proposal
            let proposal_id = self.next_proposal_id;
            let now = self.env().block_timestamp();
            let end_time = now + self.voting_period;
            
            let proposal = Proposal {
                id: proposal_id,
                proposer,
                proposal_type: ProposalType::RefundDonors {
                    npo,
                    milestone_id,
                },
                description,
                start_time: now,
                end_time,
                executed: false,
                votes_for: 0,
                votes_against: 0,
            };
            
            // Store proposal
            self.proposals.insert(proposal_id, &proposal);
            self.next_proposal_id += 1;
            
            // Emit event
            self.env().emit_event(ProposalCreated {
                proposal_id,
                proposer,
                proposal_type: proposal.proposal_type.clone(),
                end_time,
            });
            
            Ok(proposal_id)
        }

        /// Propose payout from insurance fund
        #[ink(message)]
        pub fn propose_payout(
            &mut self,
            recipient: AccountId,
            amount: Balance,
            description: String,
        ) -> Result<u32> {
            let proposer = self.env().caller();
            
            // Create proposal
            let proposal_id = self.next_proposal_id;
            let now = self.env().block_timestamp();
            let end_time = now + self.voting_period;
            
            let proposal = Proposal {
                id: proposal_id,
                proposer,
                proposal_type: ProposalType::Payout {
                    recipient,
                    amount,
                },
                description,
                start_time: now,
                end_time,
                executed: false,
                votes_for: 0,
                votes_against: 0,
            };
            
            // Store proposal
            self.proposals.insert(proposal_id, &proposal);
            self.next_proposal_id += 1;
            
            // Emit event
            self.env().emit_event(ProposalCreated {
                proposal_id,
                proposer,
                proposal_type: proposal.proposal_type.clone(),
                end_time,
            });
            
            Ok(proposal_id)
        }

        /// Vote on a proposal
        #[ink(message)]
        pub fn vote(&mut self, proposal_id: u32, support: bool) -> Result<()> {
            let voter = self.env().caller();
            let now = self.env().block_timestamp();
            
            // Get proposal
            let mut proposal = self.proposals.get(proposal_id)
                .ok_or(Error::ProposalNotFound)?;
            
            // Check if voting period is still active
            if now >= proposal.end_time {
                return Err(Error::VotingPeriodEnded);
            }
            
            // Check if already voted
            if self.votes.contains((proposal_id, voter)) {
                return Err(Error::AlreadyVoted);
            }
            
            // Record vote
            self.votes.insert((proposal_id, voter), &support);
            
            // Update vote count
            if support {
                proposal.votes_for += 1;
            } else {
                proposal.votes_against += 1;
            }
            
            // Update proposal
            self.proposals.insert(proposal_id, &proposal);
            
            // Emit event
            self.env().emit_event(VoteCast {
                proposal_id,
                voter,
                support,
            });
            
            Ok(())
        }

        /// Execute a proposal after voting period ends
        #[ink(message)]
        pub fn execute_proposal(&mut self, proposal_id: u32) -> Result<()> {
            let now = self.env().block_timestamp();
            
            // Get proposal
            let mut proposal = self.proposals.get(proposal_id)
                .ok_or(Error::ProposalNotFound)?;
            
            // Check if proposal is not already executed
            if proposal.executed {
                return Err(Error::ProposalAlreadyExecuted);
            }
            
            // Check if voting period has ended
            if now < proposal.end_time {
                return Err(Error::VotingPeriodNotEnded);
            }
            
            // Check quorum
            let total_votes = proposal.votes_for + proposal.votes_against;
            if total_votes < self.quorum {
                return Err(Error::QuorumNotReached);
            }
            
            // Check if proposal is approved (more votes for than against)
            let approved = proposal.votes_for > proposal.votes_against;
            if !approved {
                // Mark as executed but don't perform action
                proposal.executed = true;
                self.proposals.insert(proposal_id, &proposal);
                
                self.env().emit_event(ProposalExecuted {
                    proposal_id,
                    success: false,
                });
                
                return Err(Error::ProposalNotApproved);
            }
            
            // Execute proposal action based on type
            let execution_result = match &proposal.proposal_type {
                ProposalType::RedirectFunds { from_npo, milestone_id, to_npo } => {
                    self.execute_redirect_funds(*from_npo, *milestone_id, *to_npo)
                },
                ProposalType::RefundDonors { npo, milestone_id } => {
                    self.execute_refund_donors(*npo, *milestone_id)
                },
                ProposalType::Payout { recipient, amount } => {
                    self.execute_payout(*recipient, *amount)
                },
                _ => Err(Error::InvalidProposalType),
            };
            
            // Update proposal as executed
            proposal.executed = true;
            self.proposals.insert(proposal_id, &proposal);
            
            // Emit event with success status
            self.env().emit_event(ProposalExecuted {
                proposal_id,
                success: execution_result.is_ok(),
            });
            
            // Propagate any error from execution
            execution_result
        }

        /// Execute redirect funds action
        fn execute_redirect_funds(&self, from_npo: AccountId, milestone_id: u32, to_npo: AccountId) -> Result<()> {
            // In a real implementation, this would make a cross-contract call to the escrow manager
            // Here we're just mocking the behavior
            
            // Call escrow_manager.redirect_funds
            let escrow_manager: EscrowManagerRef = FromAccountId::from_account_id(self.escrow_manager);
            
            // Redirect funds (this would be a real call in production)
            // escrow_manager.redirect_funds(from_npo, milestone_id, to_npo);
            
            Ok(())
        }

        /// Execute refund donors action
        fn execute_refund_donors(&self, npo: AccountId, milestone_id: u32) -> Result<()> {
            // In a real implementation, this would make cross-contract calls to the escrow manager
            // to refund each donor, possibly in a loop or through a specialized function
            
            // Call escrow_manager to refund donors
            // This is simplified; in reality you'd need to get donor list and refund each one
            
            Ok(())
        }

        /// Execute payout from insurance fund
        fn execute_payout(&self, recipient: AccountId, amount: Balance) -> Result<()> {
            // In a real implementation, this would make a cross-contract call to the insurance fund
            // Here we're just mocking the behavior
            
            // Call insurance_fund.payout(recipient, amount)
            
            Ok(())
        }

        /// Get proposal details
        #[ink(message)]
        pub fn get_proposal(&self, proposal_id: u32) -> Option<Proposal> {
            self.proposals.get(proposal_id)
        }

        /// Check if an account has voted on a proposal
        #[ink(message)]
        pub fn has_voted(&self, proposal_id: u32, voter: AccountId) -> Option<bool> {
            if !self.proposals.contains(proposal_id) {
                return None;
            }
            
            if !self.votes.contains((proposal_id, voter)) {
                return Some(false);
            }
            
            Some(true)
        }

        /// Get vote of an account on a proposal
        #[ink(message)]
        pub fn get_vote(&self, proposal_id: u32, voter: AccountId) -> Option<bool> {
            self.votes.get((proposal_id, voter))
        }
    }

    #[cfg(test)]
    mod tests {
        use super::*;
        use ink::env::{test::*, DefaultEnvironment};
        type Environment = DefaultEnvironment;

        // Mock setup for testing
        fn setup() -> GovernanceManager {
            let gov_token = AccountId::from([0x1; 32]);
            let escrow_manager = AccountId::from([0x2; 32]);
            let insurance_fund = AccountId::from([0x3; 32]);
            let auditor_registry = AccountId::from([0x4; 32]);
            
            GovernanceManager::new(
                gov_token,
                escrow_manager,
                insurance_fund,
                auditor_registry,
                7 * 24 * 60 * 60, // 7 days voting period
                10, // 10 votes for quorum
            )
        }

        #[ink::test]
        fn test_constructor() {
            let contract = setup();
            assert_eq!(contract.next_proposal_id, 1);
            assert_eq!(contract.voting_period, 7 * 24 * 60 * 60);
            assert_eq!(contract.quorum, 10);
        }

        // More tests would be added for each function
    }
}

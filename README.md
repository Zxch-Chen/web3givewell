Screenshots: 
Homepage: ![image](https://github.com/user-attachments/assets/3fb5f447-97df-40e9-a57d-bef9047bb6fb)
Login: ![image](https://github.com/user-attachments/assets/a55e384e-e6b8-4943-b328-b87a989c5eab)

Donate to projects: ![image](https://github.com/user-attachments/assets/d42323a9-56b1-4aee-9e1d-e466a24e2dc6)

demo video and technical video: https://www.loom.com/share/cdef3ae564fe4150b95f3b7de16f9504?sid=43491018-d277-41d8-9b15-59bd1a494cbd
description of how smart contract works: 

Overview

The SimplifiedAuditor contract is a Polkadot ink! smart contract that implements a trust and incentive system for auditors in the Web3GiveWell platform. It allows auditors to stake tokens as a form of economic commitment, earn reputation through successful audits, and face penalties for incorrect validations.

Key Components
Storage Structure
rust
CopyInsert
#[ink(storage)]
pub struct SimplifiedAuditor {
    auditors: Mapping<AccountId, Auditor>,
    initial_lock_days: u32,
    extension_lock_days: u32,
}
The contract uses Substrate's efficient Mapping type to store auditor information, indexed by their blockchain account ID. This allows for O(1) lookups regardless of how many auditors join the system.

Auditor Model
rust
CopyInsert
pub struct Auditor {
    stake: Balance,          
    reputation: u32,         
    lock_until: Timestamp,   
}
Each auditor has three core properties:

stake: Amount of tokens deposited as commitment
reputation: Score representing trustworthiness based on audit history
lock_until: Timestamp indicating when staked tokens can be withdrawn
Key Functions
Registration & Staking
rust
CopyInsert
#[ink(message, payable)]
pub fn register_auditor(&mut self) -> Result<()>
This function allows users to become auditors by staking tokens. The staking mechanism leverages Polkadot's native token handling capabilities:

Tokens are transferred to the contract using the payable attribute
New auditors receive an initial lock period (typically 30 days)
An AuditorRegistered event is emitted for transparency
Reputation System
rust
CopyInsert
#[ink(message)]
pub fn update_reputation(&mut self, auditor: AccountId, success: bool) -> Result<()>
The reputation system creates incentives for honest validation:

Successful audits increase reputation score
Each reputation increase extends the lock period on staked tokens
Unsuccessful audits decrease reputation and don't extend the lock
When reputation drops to zero, the auditor can be slashed
This dynamic lock period is a unique feature that creates long-term incentives for honest participation, discouraging "hit and run" attacks where validators could act maliciously right before withdrawing.

Slashing Mechanism
rust
CopyInsert
#[ink(message)]
pub fn slash(&mut self, auditor: AccountId, amount: Balance) -> Result<()>
The slashing function implements a penalty system for misbehavior:

Authorized contracts can reduce an auditor's stake
The slashed amount can be redirected to governance funds or affected parties
Acts as a deterrent against dishonest validation
Stake Withdrawal
rust
CopyInsert
#[ink(message)]
pub fn unstake(&mut self, amount: Balance) -> Result<()>
Auditors can withdraw their stake once the lock period ends:

Checks for sufficient stake and that the lock period has expired
Transfers tokens back to the auditor's wallet
Updates the auditor's stake balance in storage
Query Functions
rust
CopyInsert
#[ink(message)]
pub fn get_auditor(&self, auditor: AccountId) -> Option<Auditor>

#[ink(message)]
pub fn is_auditor(&self, auditor: AccountId) -> bool
These read-only functions allow other contracts or off-chain applications to:

Retrieve complete auditor information
Quickly verify if an address is a registered auditor with active stake
Technical Implementation Details
Event Emission: All state-changing functions emit events, leveraging Substrate's event system for off-chain monitoring
Error Handling: Comprehensive error types ensure transactions fail gracefully with clear reasons
Access Control: Functions like slash and update_reputation implement authorization checks
Gas Efficiency: Using Substrate's native storage patterns minimizes gas costs compared to similar EVM implementations
This contract forms the foundation of the auditor incentive system in Web3GiveWell, creating economic alignment between auditors and the platform's goal of nonprofit verification transparency.


e) wasn't able to add. 

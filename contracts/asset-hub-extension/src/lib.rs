#![cfg_attr(not(feature = "std"), no_std)]

use ink::env::Environment;
use scale::{Decode, Encode};

#[ink::chain_extension]
pub trait AssetHubExtension {
    type ErrorCode = AssetHubError;

    /// Create a new asset
    #[ink(extension = 1)]
    fn create_asset(id: u32, admin: [u8; 32], min_balance: u128) -> Result<(), AssetHubError>;

    /// Mint tokens to an account
    #[ink(extension = 2)]
    fn mint_asset(id: u32, beneficiary: [u8; 32], amount: u128) -> Result<(), AssetHubError>;

    /// Transfer tokens from the contract to an account
    #[ink(extension = 3)]
    fn transfer_asset(id: u32, target: [u8; 32], amount: u128) -> Result<(), AssetHubError>;

    /// Approve a delegate to transfer tokens
    #[ink(extension = 4)]
    fn approve_transfer(id: u32, delegate: [u8; 32], amount: u128) -> Result<(), AssetHubError>;

    /// Transfer approved tokens
    #[ink(extension = 5)]
    fn transfer_approved(id: u32, owner: [u8; 32], destination: [u8; 32], amount: u128) -> Result<(), AssetHubError>;

    /// Check asset balance of an account
    #[ink(extension = 6)]
    fn asset_balance(id: u32, who: [u8; 32]) -> Result<u128, AssetHubError>;
}

#[derive(Debug, Copy, Clone, PartialEq, Eq, Encode, Decode)]
#[cfg_attr(feature = "std", derive(scale_info::TypeInfo))]
pub enum AssetHubError {
    /// Failed to create asset
    FailedToCreateAsset,
    /// Failed to mint tokens
    FailedToMintTokens,
    /// Failed to transfer tokens
    FailedToTransferTokens,
    /// Failed to approve transfer
    FailedToApproveTransfer,
    /// Failed to execute approved transfer
    FailedToExecuteApprovedTransfer,
    /// Failed to get balance
    FailedToGetBalance,
    /// Insufficient privileges
    InsufficientPrivileges,
    /// Unknown error
    Unknown,
}

/// Default environment with our chain extension for asset hub integration
#[derive(Debug, Clone, PartialEq, Eq)]
pub enum CustomEnvironment {}

impl Environment for CustomEnvironment {
    const MAX_EVENT_TOPICS: usize = <ink::env::DefaultEnvironment as Environment>::MAX_EVENT_TOPICS;

    type AccountId = <ink::env::DefaultEnvironment as Environment>::AccountId;
    type Balance = <ink::env::DefaultEnvironment as Environment>::Balance;
    type Hash = <ink::env::DefaultEnvironment as Environment>::Hash;
    type BlockNumber = <ink::env::DefaultEnvironment as Environment>::BlockNumber;
    type Timestamp = <ink::env::DefaultEnvironment as Environment>::Timestamp;
    type ChainExtension = AssetHubExtension;
}

// This type represents the ink! contract using our extension
pub type EnvironmentWithAssetHub = CustomEnvironment;

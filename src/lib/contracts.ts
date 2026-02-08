/**
 * Smart contract addresses and ABIs for ClawTask platform.
 * Update addresses after deployment.
 */

// ── Contract Addresses ──
// Set via environment variables or update after deployment
export const CONTRACT_ADDRESSES = {
  AVT: (process.env.NEXT_PUBLIC_AVT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  CAMPAIGN_VAULT: (process.env.NEXT_PUBLIC_VAULT_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
  MINING_POOL: (process.env.NEXT_PUBLIC_MINING_POOL_ADDRESS || "0x0000000000000000000000000000000000000000") as `0x${string}`,
} as const;

// ── Chain Config ──
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || "84532"); // Base Sepolia default

// ── ABIs (minimal for frontend interaction) ──

export const ERC20_ABI = [
  { inputs: [], name: "name", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "symbol", outputs: [{ type: "string" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "decimals", outputs: [{ type: "uint8" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalSupply", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "account", type: "address" }], name: "balanceOf", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "spender", type: "address" }, { name: "amount", type: "uint256" }], name: "approve", outputs: [{ type: "bool" }], stateMutability: "nonpayable", type: "function" },
  { inputs: [{ name: "owner", type: "address" }, { name: "spender", type: "address" }], name: "allowance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

export const CAMPAIGN_VAULT_ABI = [
  {
    inputs: [
      { name: "_campaignId", type: "bytes32" },
      { name: "_token", type: "address" },
      { name: "_amount", type: "uint256" },
      { name: "_durationDays", type: "uint256" },
    ],
    name: "createCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_campaignId", type: "bytes32" }],
    name: "getCampaign",
    outputs: [
      {
        components: [
          { name: "creator", type: "address" },
          { name: "token", type: "address" },
          { name: "totalAmount", type: "uint256" },
          { name: "remainingAmount", type: "uint256" },
          { name: "platformFee", type: "uint256" },
          { name: "startsAt", type: "uint256" },
          { name: "endsAt", type: "uint256" },
          { name: "active", type: "bool" },
        ],
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ name: "_campaignId", type: "bytes32" }],
    name: "pauseCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_campaignId", type: "bytes32" }],
    name: "resumeCampaign",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ name: "_campaignId", type: "bytes32" }],
    name: "withdrawRemaining",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  { inputs: [], name: "platformFeeBps", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "getCampaignCount", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  // Events
  { anonymous: false, inputs: [{ indexed: true, name: "campaignId", type: "bytes32" }, { indexed: true, name: "creator", type: "address" }, { indexed: false, name: "token", type: "address" }, { indexed: false, name: "amount", type: "uint256" }, { indexed: false, name: "fee", type: "uint256" }], name: "CampaignCreated", type: "event" },
  { anonymous: false, inputs: [{ indexed: true, name: "campaignId", type: "bytes32" }, { indexed: true, name: "agent", type: "address" }, { indexed: false, name: "amount", type: "uint256" }], name: "RewardClaimed", type: "event" },
] as const;

export const MINING_POOL_ABI = [
  { inputs: [], name: "poolBalance", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "totalDistributed", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "currentEpoch", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "currentEpochReward", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "remainingToday", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [], name: "dailyLimit", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
  { inputs: [{ name: "agent", type: "address" }], name: "agentTotalClaimed", outputs: [{ type: "uint256" }], stateMutability: "view", type: "function" },
] as const;

/**
 * On-chain reward service — sends AVT tokens to agent wallets on HashKey Chain.
 * Uses the deployer wallet to sign and send ERC-20 transfer transactions.
 */

import { createWalletClient, createPublicClient, http, parseAbi, parseUnits, formatUnits } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { defineChain } from "viem";

// HashKey Chain mainnet definition
const hashkeyChain = defineChain({
  id: 177,
  name: "HashKey Chain",
  nativeCurrency: { name: "HSK", symbol: "HSK", decimals: 18 },
  rpcUrls: { default: { http: ["https://mainnet.hsk.xyz"] } },
  blockExplorers: { default: { name: "HashKey Explorer", url: "https://explorer.hsk.xyz" } },
});

const AVT_ADDRESS = (process.env.NEXT_PUBLIC_AVT_ADDRESS || "0x8e10cb3C0E9248004876Ecf2f9428BBeBd34b012") as `0x${string}`;
const MINING_POOL_ADDRESS = (process.env.NEXT_PUBLIC_MINING_POOL_ADDRESS || "0x9EE7B7585f0946D33F1FbfE694D3fD141678fb01") as `0x${string}`;
const DEPLOYER_PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY as `0x${string}` | undefined;

const ERC20_TRANSFER_ABI = parseAbi([
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address account) view returns (uint256)",
]);

const MINING_POOL_ABI = parseAbi([
  "function distributeReward(address _agent, uint256 _amount, string _reason) external",
]);

// Nonce management to avoid conflicts
let pendingNonce: number | null = null;
let noncePromise: Promise<void> | null = null;

async function waitForNonce(): Promise<void> {
  if (noncePromise) await noncePromise;
}

function getClients() {
  if (!DEPLOYER_PRIVATE_KEY) {
    throw new Error("DEPLOYER_PRIVATE_KEY not configured");
  }

  const account = privateKeyToAccount(DEPLOYER_PRIVATE_KEY);

  const publicClient = createPublicClient({
    chain: hashkeyChain,
    transport: http(),
  });

  const walletClient = createWalletClient({
    account,
    chain: hashkeyChain,
    transport: http(),
  });

  return { account, publicClient, walletClient };
}

/**
 * Send AVT tokens directly from deployer wallet to an agent wallet.
 * Used for mining rewards (social posts, check-ins, comments, etc.)
 */
export async function sendAvtReward(
  toAddress: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!DEPLOYER_PRIVATE_KEY) {
      console.warn("[onChainReward] No DEPLOYER_PRIVATE_KEY, skipping on-chain transfer");
      return { success: false, error: "No deployer key configured" };
    }

    if (!toAddress || !/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
      return { success: false, error: "Invalid wallet address" };
    }

    await waitForNonce();

    const { publicClient, walletClient, account } = getClients();

    const amountWei = parseUnits(amount.toString(), 18);

    // Use MiningPool.distributeReward if amount is for mining rewards
    const txHash = await walletClient.writeContract({
      address: AVT_ADDRESS,
      abi: ERC20_TRANSFER_ABI,
      functionName: "transfer",
      args: [toAddress as `0x${string}`, amountWei],
    });

    console.log(`[onChainReward] Sent ${amount} AVT to ${toAddress} | tx: ${txHash} | reason: ${reason}`);

    return { success: true, txHash };
  } catch (error: any) {
    console.error(`[onChainReward] Failed to send ${amount} AVT to ${toAddress}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Distribute mining reward via MiningPool contract.
 * This uses the pool's AVT allocation (40M) instead of deployer's balance.
 */
export async function distributeMiningReward(
  toAddress: string,
  amount: number,
  reason: string
): Promise<{ success: boolean; txHash?: string; error?: string }> {
  try {
    if (!DEPLOYER_PRIVATE_KEY) {
      console.warn("[onChainReward] No DEPLOYER_PRIVATE_KEY, skipping on-chain transfer");
      return { success: false, error: "No deployer key configured" };
    }

    if (!toAddress || !/^0x[a-fA-F0-9]{40}$/.test(toAddress)) {
      return { success: false, error: "Invalid wallet address" };
    }

    await waitForNonce();

    const { walletClient } = getClients();

    const amountWei = parseUnits(amount.toString(), 18);

    const txHash = await walletClient.writeContract({
      address: MINING_POOL_ADDRESS,
      abi: MINING_POOL_ABI,
      functionName: "distributeReward",
      args: [toAddress as `0x${string}`, amountWei, reason],
    });

    console.log(`[onChainReward] Mining reward: ${amount} AVT to ${toAddress} | tx: ${txHash} | reason: ${reason}`);

    return { success: true, txHash };
  } catch (error: any) {
    console.error(`[onChainReward] Mining reward failed for ${toAddress}:`, error.message);
    return { success: false, error: error.message };
  }
}

/**
 * Check deployer's AVT balance on HashKey Chain.
 */
export async function getDeployerAvtBalance(): Promise<string> {
  try {
    const { publicClient, account } = getClients();
    const balance = await publicClient.readContract({
      address: AVT_ADDRESS,
      abi: ERC20_TRANSFER_ABI,
      functionName: "balanceOf",
      args: [account.address],
    });
    return formatUnits(balance, 18);
  } catch {
    return "0";
  }
}

/**
 * Check MiningPool's AVT balance.
 */
export async function getMiningPoolBalance(): Promise<string> {
  try {
    const { publicClient } = getClients();
    const balance = await publicClient.readContract({
      address: AVT_ADDRESS,
      abi: ERC20_TRANSFER_ABI,
      functionName: "balanceOf",
      args: [MINING_POOL_ADDRESS],
    });
    return formatUnits(balance, 18);
  } catch {
    return "0";
  }
}

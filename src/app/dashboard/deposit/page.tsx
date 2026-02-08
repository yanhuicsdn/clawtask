"use client";

import { useState } from "react";
import { useAccount, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { parseUnits, encodePacked, keccak256 } from "viem";
import {
  ArrowDownToLine, Coins, AlertCircle, CheckCircle2,
  Wallet, ArrowLeft, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import ConnectWallet from "@/components/ConnectWallet";
import { CONTRACT_ADDRESSES, ERC20_ABI, CAMPAIGN_VAULT_ABI } from "@/lib/contracts";

export default function DepositPage() {
  const { address, isConnected } = useAccount();
  const [step, setStep] = useState<"approve" | "deposit" | "done">("approve");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    tokenAddress: "",
    amount: "",
    campaignId: "",
    durationDays: "30",
  });

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  // Approve transaction
  const { writeContract: writeApprove, data: approveHash } = useWriteContract();
  const { isLoading: approveLoading, isSuccess: approveSuccess } = useWaitForTransactionReceipt({ hash: approveHash });

  // Deposit transaction
  const { writeContract: writeDeposit, data: depositHash } = useWriteContract();
  const { isLoading: depositLoading, isSuccess: depositSuccess } = useWaitForTransactionReceipt({ hash: depositHash });

  async function handleApprove() {
    setError("");
    if (!form.tokenAddress || !form.amount) {
      setError("Please fill in token address and amount");
      return;
    }
    try {
      writeApprove({
        address: form.tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [CONTRACT_ADDRESSES.CAMPAIGN_VAULT, parseUnits(form.amount, 18)],
      });
      setStep("deposit");
    } catch (e: any) {
      setError(e.message || "Approval failed");
    }
  }

  async function handleDeposit() {
    setError("");
    if (!form.campaignId) {
      setError("Please enter a campaign ID");
      return;
    }
    try {
      const campaignIdBytes = keccak256(encodePacked(["string"], [form.campaignId]));
      writeDeposit({
        address: CONTRACT_ADDRESSES.CAMPAIGN_VAULT,
        abi: CAMPAIGN_VAULT_ABI,
        functionName: "createCampaign",
        args: [
          campaignIdBytes,
          form.tokenAddress as `0x${string}`,
          parseUnits(form.amount, 18),
          BigInt(form.durationDays),
        ],
      });
      setStep("done");
    } catch (e: any) {
      setError(e.message || "Deposit failed");
    }
  }

  return (
    <div className="max-w-xl">
      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#06B6D4] transition-colors mb-6">
        <ArrowLeft className="w-3.5 h-3.5" />
        Back to Dashboard
      </Link>

      <div className="flex items-center gap-2 mb-2">
        <ArrowDownToLine className="w-6 h-6 text-[#8B5CF6]" />
        <h1 className="text-2xl sm:text-3xl font-bold font-display tracking-tight">Deposit Tokens</h1>
      </div>
      <p className="text-sm text-[#94A3B8] mb-8">Deposit ERC-20 tokens into the CampaignVault smart contract.</p>

      {!isConnected ? (
        <div className="card text-center py-12">
          <Wallet className="w-12 h-12 mx-auto mb-4 text-[#1E2D4A]" />
          <p className="text-lg text-[#94A3B8] mb-2">Connect your wallet to deposit</p>
          <p className="text-sm text-[#64748B] mb-6">You need a Web3 wallet to interact with the smart contract.</p>
          <div className="max-w-xs mx-auto">
            <ConnectWallet />
          </div>
        </div>
      ) : (
        <>
          {error && (
            <div className="flex items-center gap-2 p-3 mb-6 rounded-lg bg-[#EF4444]/10 border border-[#EF4444]/20 text-sm text-[#EF4444]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}

          {depositSuccess && (
            <div className="card text-center py-10 mb-6 bg-gradient-to-br from-[#10B981]/5 to-[#06B6D4]/5 border-[#10B981]/20">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-[#10B981]" />
              <p className="text-lg font-semibold text-[#F8FAFC] mb-2">Deposit Successful!</p>
              <p className="text-sm text-[#94A3B8] mb-4">Your tokens have been deposited into the CampaignVault.</p>
              {depositHash && (
                <a
                  href={`https://sepolia.basescan.org/tx/${depositHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-sm text-[#06B6D4] hover:underline"
                >
                  View on BaseScan <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
            </div>
          )}

          {/* Steps indicator */}
          <div className="flex items-center gap-3 mb-8">
            {["approve", "deposit", "done"].map((s, i) => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                  step === s ? "bg-[#06B6D4] text-white" :
                  ["approve", "deposit", "done"].indexOf(step) > i ? "bg-[#10B981] text-white" :
                  "bg-[#1E2D4A] text-[#64748B]"
                }`}>
                  {["approve", "deposit", "done"].indexOf(step) > i ? "✓" : i + 1}
                </div>
                <span className={`text-xs ${step === s ? "text-[#06B6D4]" : "text-[#64748B]"}`}>
                  {s === "approve" ? "Approve" : s === "deposit" ? "Deposit" : "Complete"}
                </span>
                {i < 2 && <div className="w-8 h-px bg-[#1E2D4A]" />}
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="space-y-5">
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Token Address (ERC-20) *</label>
              <input
                type="text"
                value={form.tokenAddress}
                onChange={(e) => update("tokenAddress", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] font-mono focus:border-[#06B6D4] focus:outline-none transition-colors"
                placeholder="0x..."
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Amount *</label>
              <input
                type="text"
                value={form.amount}
                onChange={(e) => update("amount", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] font-mono focus:border-[#06B6D4] focus:outline-none transition-colors"
                placeholder="10000"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Campaign ID *</label>
              <input
                type="text"
                value={form.campaignId}
                onChange={(e) => update("campaignId", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
                placeholder="Campaign ID from dashboard"
              />
            </div>
            <div>
              <label className="block text-sm text-[#94A3B8] mb-1.5">Duration (days)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.durationDays}
                onChange={(e) => update("durationDays", e.target.value)}
                className="w-full px-3 py-2.5 bg-[#0A0E1A] border border-[#1E2D4A] rounded-lg text-sm text-[#F8FAFC] focus:border-[#06B6D4] focus:outline-none transition-colors"
              />
            </div>

            {/* Fee info */}
            <div className="card bg-gradient-to-br from-[#111B2E] to-[#0F1629] !p-4">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-[#64748B]">Platform Fee (5%)</span>
                <span className="text-[#F59E0B] font-mono">{form.amount ? (parseFloat(form.amount) * 0.05).toLocaleString() : "0"}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[#64748B]">Net to Campaign</span>
                <span className="text-[#10B981] font-mono">{form.amount ? (parseFloat(form.amount) * 0.95).toLocaleString() : "0"}</span>
              </div>
            </div>

            {step === "approve" && (
              <button
                onClick={handleApprove}
                disabled={approveLoading}
                className="btn-primary w-full text-sm !py-3 disabled:opacity-50"
              >
                {approveLoading ? "Approving..." : (
                  <>
                    <Coins className="w-4 h-4" />
                    Step 1: Approve Token Transfer
                  </>
                )}
              </button>
            )}

            {step === "deposit" && (
              <button
                onClick={handleDeposit}
                disabled={depositLoading || !approveSuccess}
                className="btn-primary w-full text-sm !py-3 disabled:opacity-50"
              >
                {depositLoading ? "Depositing..." : !approveSuccess ? "Waiting for approval..." : (
                  <>
                    <ArrowDownToLine className="w-4 h-4" />
                    Step 2: Deposit to CampaignVault
                  </>
                )}
              </button>
            )}
          </div>

          {/* Contract info */}
          <div className="mt-8 text-xs text-[#475569] space-y-1">
            <p>CampaignVault: <span className="font-mono text-[#64748B]">{CONTRACT_ADDRESSES.CAMPAIGN_VAULT}</span></p>
            <p>Connected: <span className="font-mono text-[#06B6D4]">{address}</span></p>
          </div>
        </>
      )}
    </div>
  );
}

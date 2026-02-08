"use client";

import { useAccount, useConnect, useDisconnect } from "wagmi";
import { Wallet, LogOut, ChevronDown } from "lucide-react";
import { useState } from "react";

export default function ConnectWallet() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const [showMenu, setShowMenu] = useState(false);

  if (isConnected && address) {
    const short = `${address.slice(0, 6)}...${address.slice(-4)}`;
    return (
      <div className="relative">
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#111B2E] border border-[#1E2D4A] text-sm text-[#F8FAFC] hover:border-[#06B6D4] transition-colors"
        >
          <Wallet className="w-4 h-4 text-[#10B981]" />
          <span className="font-mono text-xs">{short}</span>
          <ChevronDown className="w-3 h-3 text-[#64748B]" />
        </button>
        {showMenu && (
          <div className="absolute right-0 top-full mt-1 w-48 bg-[#0F1629] border border-[#1E2D4A] rounded-lg shadow-xl z-50 animate-fade-in">
            <div className="p-3 border-b border-[#1E2D4A]">
              <p className="text-xs text-[#64748B]">Connected</p>
              <p className="text-xs font-mono text-[#06B6D4] mt-0.5">{short}</p>
            </div>
            <button
              onClick={() => { disconnect(); setShowMenu(false); }}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#EF4444] hover:bg-[#111B2E] transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {connectors.map((connector) => (
        <button
          key={connector.uid}
          onClick={() => connect({ connector })}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r from-[#06B6D4]/10 to-[#8B5CF6]/10 border border-[#06B6D4]/30 text-sm text-[#06B6D4] hover:border-[#06B6D4] transition-colors"
        >
          <Wallet className="w-4 h-4" />
          {connector.name}
        </button>
      ))}
    </div>
  );
}

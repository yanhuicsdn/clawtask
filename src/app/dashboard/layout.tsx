"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, PlusCircle, BarChart3, Wallet as WalletIcon,
  ArrowLeft, ArrowDownToLine,
} from "lucide-react";
import ConnectWallet from "@/components/ConnectWallet";

const sidebarLinks = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/create", label: "Create Campaign", icon: PlusCircle },
  { href: "/dashboard/deposit", label: "Deposit Tokens", icon: ArrowDownToLine },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-[calc(100vh-12rem)]">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-[#1E2D4A] pr-6">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-[#64748B] hover:text-[#06B6D4] transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to site
          </Link>
        </div>
        <h2 className="text-xs font-semibold text-[#64748B] uppercase tracking-wider mb-4">Project Dashboard</h2>
        <nav className="space-y-1">
          {sidebarLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "text-[#06B6D4] bg-[#06B6D4]/10 font-medium"
                    : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111B2E]"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto pt-6 border-t border-[#1E2D4A]">
          <p className="text-[10px] text-[#64748B] uppercase tracking-wider mb-2 px-1">Wallet</p>
          <ConnectWallet />
        </div>
      </aside>

      {/* Mobile nav */}
      <div className="lg:hidden flex overflow-x-auto gap-1 mb-6 pb-2 border-b border-[#1E2D4A] w-full">
        {sidebarLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs whitespace-nowrap transition-colors ${
                isActive
                  ? "text-[#06B6D4] bg-[#06B6D4]/10 font-medium"
                  : "text-[#94A3B8] hover:text-[#F8FAFC] hover:bg-[#111B2E]"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {link.label}
            </Link>
          );
        })}
      </div>

      {/* Main content */}
      <main className="flex-1 lg:pl-6">
        {children}
      </main>
    </div>
  );
}

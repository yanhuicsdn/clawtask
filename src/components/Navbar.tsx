"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, MessageSquare, Trophy, Coins, Menu, X } from "lucide-react";

const navLinks = [
  { href: "/campaigns", label: "Campaigns", icon: LayoutGrid },
  { href: "/feed", label: "Feed", icon: MessageSquare },
  { href: "/agents", label: "Leaderboard", icon: Trophy },
  { href: "/token", label: "$AVT", icon: Coins },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-[#0A0E1A]/85 border-b border-[#1E2D4A]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 cursor-pointer group" onClick={() => setMobileOpen(false)}>
          <img src="https://www.agiopen.network/logo.svg" alt="ClawTask" className="w-10 h-10 rounded-lg transition-transform duration-200 group-hover:scale-105" />
          <span className="text-lg font-bold font-display gradient-text tracking-wider">
            CLAWTASK
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors duration-200 cursor-pointer ${
                  isActive
                    ? "text-[#06B6D4] bg-[#06B6D4]/10"
                    : "text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#111B2E]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-lg text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#111B2E] transition-colors cursor-pointer"
            aria-label={mobileOpen ? "Close menu" : "Open menu"}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-[#1E2D4A] bg-[#0A0E1A]/95 backdrop-blur-xl animate-fade-in">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors duration-200 ${
                    isActive
                      ? "text-[#06B6D4] bg-[#06B6D4]/10"
                      : "text-[#94A3B8] hover:text-[#06B6D4] hover:bg-[#111B2E]"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
}

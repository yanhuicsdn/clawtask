"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/v1/owner/logout", { method: "POST" });
    router.push("/dashboard/login");
    router.refresh();
  };

  return (
    <button
      onClick={handleLogout}
      className="btn-secondary text-sm !py-2.5 !px-4"
      title="Sign out"
    >
      <LogOut className="w-4 h-4" />
      Sign Out
    </button>
  );
}

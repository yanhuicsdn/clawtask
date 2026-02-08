"use client";

import { useEffect, useState } from "react";
import { Zap } from "lucide-react";

interface Activity {
  id: string;
  agent: string;
  action: string;
  token: string;
  amount: number;
  campaign: string;
  time: string;
}

export default function LiveActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    async function fetchActivity() {
      try {
        const res = await fetch("/api/v1/activity?limit=10");
        if (res.ok) {
          const data = await res.json();
          if (data.activities?.length > 0) {
            setActivities(data.activities);
          }
        }
      } catch {
        // Silently fail — not critical
      }
    }
    fetchActivity();
    const interval = setInterval(fetchActivity, 30_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activities.length === 0) return;
    const interval = setInterval(() => {
      setCurrentIndex((i) => (i + 1) % activities.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [activities.length]);

  if (activities.length === 0) return null;

  const current = activities[currentIndex];

  return (
    <div className="inline-flex items-center gap-2 text-xs text-[#94A3B8] overflow-hidden">
      <Zap className="w-3 h-3 text-[#F59E0B] shrink-0 animate-pulse-glow" />
      <span className="truncate animate-fade-in" key={current.id}>
        <span className="text-[#06B6D4] font-medium">{current.agent}</span>
        {" "}{current.action}{" "}
        <span className="text-[#10B981] font-mono">{current.amount} {current.token}</span>
        {" from "}
        <span className="text-[#8B5CF6]">{current.campaign}</span>
      </span>
    </div>
  );
}

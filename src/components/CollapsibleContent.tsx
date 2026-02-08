"use client";

import { useState, useRef, useEffect } from "react";

export default function CollapsibleContent({ content, maxLines = 5 }: { content: string; maxLines?: number }) {
  const [expanded, setExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current) {
      const lineHeight = parseFloat(getComputedStyle(ref.current).lineHeight) || 20;
      const maxHeight = lineHeight * maxLines;
      setNeedsCollapse(ref.current.scrollHeight > maxHeight + 4);
    }
  }, [content, maxLines]);

  return (
    <div>
      <div
        ref={ref}
        className={`text-sm text-[#94A3B8] whitespace-pre-wrap leading-relaxed overflow-hidden transition-all duration-300 ${
          !expanded && needsCollapse ? "" : ""
        }`}
        style={!expanded && needsCollapse ? { maxHeight: `${maxLines * 1.6}em`, maskImage: "linear-gradient(to bottom, black 60%, transparent 100%)", WebkitMaskImage: "linear-gradient(to bottom, black 60%, transparent 100%)" } : {}}
      >
        {content}
      </div>
      {needsCollapse && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs text-[#06B6D4] hover:text-[#22D3EE] mt-1.5 transition-colors cursor-pointer"
        >
          {expanded ? "Collapse ↑" : "Show more ↓"}
        </button>
      )}
    </div>
  );
}

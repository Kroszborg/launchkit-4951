"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function HeroInput() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleSubmit = (val: string) => {
    const v = val.trim();
    if (v) router.push(`/generate?input=${encodeURIComponent(v)}`);
  };

  return (
    <div className="flex flex-col sm:flex-row gap-0 max-w-2xl border border-[#2a2a2a]">
      <input
        type="text"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => e.key === "Enter" && handleSubmit(value)}
        placeholder="github.com/you/your-project or describe your product..."
        className="flex-1 text-[#e8e0d0] placeholder-[#3a3a3a] px-5 py-4 font-['DM_Mono'] text-sm outline-none border border-transparent focus:border-[#e8e0d0]"
        style={{ background: "#111111" }}
      />
      <button
        onClick={() => handleSubmit(value)}
        className="bg-[#e8e0d0] text-[#0a0a0a] px-6 py-4 font-['DM_Mono'] text-sm font-medium hover:bg-white transition-colors duration-150 whitespace-nowrap"
      >
        Generate →
      </button>
    </div>
  );
}

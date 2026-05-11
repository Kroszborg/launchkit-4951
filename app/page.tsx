import Link from "next/link";
import { HeroInput } from "@/components/hero-input";

const features = [
  {
    num: "01",
    title: "Landing Page Copy",
    desc: "Headline, subheadline, feature bullets, CTA — ready to paste into Framer, Webflow, or code.",
  },
  {
    num: "02",
    title: "Social Posts",
    desc: "Twitter/X thread opener, LinkedIn post, and Product Hunt tagline — all tuned for each platform.",
  },
  {
    num: "03",
    title: "The Perfect Pitch",
    desc: "One sentence that captures exactly what you built. The one you'll put in your bio.",
  },
];

const examples = [
  { input: "github.com/vercel/next.js", pitch: "The React framework for production-grade apps." },
  { input: "github.com/supabase/supabase", pitch: "Firebase but open source and actually yours." },
  { input: "A CLI tool that converts Figma designs to Tailwind components", pitch: "Design to code in one command." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "#0a0a0a" }}>
      {/* Nav */}
      <nav className="border-b border-[#2a2a2a] px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-['Playfair_Display'] text-xl font-semibold text-[#e8e0d0] tracking-tight">
            LaunchKit
          </span>
          <span className="text-[#6b6b6b] text-xs font-['DM_Mono']">
            ship faster. sound smarter.
          </span>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20">
        <div className="animate-fade-up stagger-1">
          <div className="inline-flex items-center gap-2 border border-[#2a2a2a] px-3 py-1 mb-8 text-[#6b6b6b] text-xs font-['DM_Mono']">
            <span className="w-1.5 h-1.5 rounded-full bg-[#e8e0d0] inline-block" />
            AI-powered launch copy, instantly
          </div>
        </div>

        <h1
          className="animate-fade-up stagger-2 font-['Playfair_Display'] font-semibold leading-[1.05] text-[#e8e0d0] mb-6"
          style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}
        >
          Your product deserves
          <br />
          <em className="italic" style={{ color: "#c8bfaf" }}>
            a better introduction.
          </em>
        </h1>

        <p className="animate-fade-up stagger-3 font-['DM_Mono'] text-[#6b6b6b] text-base leading-relaxed mb-12 max-w-xl">
          Paste a GitHub URL or describe your project. Get launch-ready copy —
          landing page, social posts, and your perfect pitch line — in seconds.
        </p>

        <div className="animate-fade-up stagger-4">
          <HeroInput />
        </div>

        <p className="animate-fade-up stagger-5 text-[#3a3a3a] text-xs font-['DM_Mono'] mt-4">
          Works with GitHub URLs or plain English descriptions. No signup required.
        </p>
      </section>

      {/* Features */}
      <section className="border-t border-[#2a2a2a] max-w-5xl mx-auto px-6 py-20">
        <p className="font-['DM_Mono'] text-[#6b6b6b] text-xs uppercase tracking-[0.15em] mb-12">
          What you get
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
          {features.map((f, i) => (
            <div
              key={i}
              className="border border-[#2a2a2a] p-8"
              style={{ marginLeft: i > 0 ? "-1px" : 0 }}
            >
              <span className="font-['DM_Mono'] text-[#3a3a3a] text-xs block mb-6">{f.num}</span>
              <h3 className="font-['Playfair_Display'] text-[#e8e0d0] text-xl font-medium mb-3">
                {f.title}
              </h3>
              <p className="font-['DM_Mono'] text-[#6b6b6b] text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-[#2a2a2a] max-w-5xl mx-auto px-6 py-20">
        <p className="font-['DM_Mono'] text-[#6b6b6b] text-xs uppercase tracking-[0.15em] mb-12">
          How it works
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { step: "1", title: "Paste your project", desc: "A GitHub URL or a plain description. That's all the input we need." },
            { step: "2", title: "AI writes the copy", desc: "Analyzes your README, description, and context to craft targeted launch copy." },
            { step: "3", title: "Copy and ship", desc: "Everything is copy-paste ready. No editing required — just move fast." },
          ].map((s, i) => (
            <div key={i}>
              <div className="font-['Playfair_Display'] text-[#2a2a2a] text-6xl font-semibold mb-4 leading-none">
                {s.step}
              </div>
              <h4 className="font-['Playfair_Display'] text-[#e8e0d0] text-lg font-medium mb-2">{s.title}</h4>
              <p className="font-['DM_Mono'] text-[#6b6b6b] text-sm leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Examples */}
      <section className="border-t border-[#2a2a2a] max-w-5xl mx-auto px-6 py-20">
        <p className="font-['DM_Mono'] text-[#6b6b6b] text-xs uppercase tracking-[0.15em] mb-12">
          Example outputs
        </p>
        <div className="space-y-0">
          {examples.map((ex, i) => (
            <div
              key={i}
              className="border border-[#2a2a2a] p-6 flex flex-col md:flex-row md:items-center gap-4"
              style={{ marginTop: i > 0 ? "-1px" : 0 }}
            >
              <span className="font-['DM_Mono'] text-[#3a3a3a] text-xs md:w-64 shrink-0 truncate">
                {ex.input}
              </span>
              <span className="text-[#2a2a2a] hidden md:block">→</span>
              <span className="font-['Playfair_Display'] text-[#e8e0d0] text-lg font-medium italic">
                &ldquo;{ex.pitch}&rdquo;
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#2a2a2a] max-w-5xl mx-auto px-6 py-24 text-center">
        <h2
          className="font-['Playfair_Display'] text-[#e8e0d0] font-semibold mb-6"
          style={{ fontSize: "clamp(2rem, 5vw, 4rem)" }}
        >
          Ready to launch?
        </h2>
        <p className="font-['DM_Mono'] text-[#6b6b6b] text-sm mb-10">
          Your README is not your launch copy. Let&apos;s fix that.
        </p>
        <Link
          href="/generate"
          className="inline-block border border-[#e8e0d0] text-[#e8e0d0] px-8 py-3 font-['DM_Mono'] text-sm hover:bg-[#e8e0d0] hover:text-[#0a0a0a] transition-colors duration-200"
        >
          Generate your launch kit →
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#2a2a2a] px-6 py-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-['Playfair_Display'] text-[#3a3a3a] text-sm">LaunchKit</span>
          <span className="font-['DM_Mono'] text-[#3a3a3a] text-xs">AI-powered launch copy</span>
        </div>
      </footer>
    </div>
  );
}

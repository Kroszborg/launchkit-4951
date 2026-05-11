"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Copy, Check, GitBranch, ExternalLink, Code2, Eye,
  Loader2, ArrowLeft, Zap, RotateCcw, Columns2,
} from "lucide-react";

const GithubIcon = GitBranch;

// ─── Types ────────────────────────────────────────────────────────────────────
interface CopyData {
  name: string;
  pitch: string;
  tagline: string;
  headline: string;
  subheadline: string;
  features: { title: string; desc: string }[];
  cta: string;
  twitter: string;
  linkedin: string;
  producthunt: string;
}
interface GenerateResult { copy: CopyData; landingCode: string; }
interface RepoMeta {
  name: string;
  description: string;
  stars: number;
  language: string;
  topics: string[];
  readme: string;
  owner: string;
  repo: string;
}
interface GhResult {
  repoUrl: string;
  fullName: string;
  vercelUrl: string;
  netlifyUrl: string;
  pagesUrl: string;
}
type Tab = "landing" | "social" | "pitch";
type LandingView = "split" | "preview" | "code";

const MONO = "'DM Mono', monospace";
const SERIF = "'Playfair Display', serif";
const BG = "#0a0a0a";
const SURFACE = "#111111";
const BORDER = "#2a2a2a";
const FG = "#e8e0d0";
const MUTED = "#6b6b6b";
const DIM = "#3a3a3a";

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function GenerateClient({ initialInput }: { initialInput: string }) {
  const router = useRouter();

  const [input, setInput] = useState(initialInput);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("landing");
  const [landingView, setLandingView] = useState<LandingView>("split");
  const [repoMeta, setRepoMeta] = useState<RepoMeta | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [hasGenerated, setHasGenerated] = useState(false);

  // GitHub modal
  const [showGithub, setShowGithub] = useState(false);
  const [ghToken, setGhToken] = useState("");
  const [ghRepoName, setGhRepoName] = useState("");
  const [ghLoading, setGhLoading] = useState(false);
  const [ghResult, setGhResult] = useState<GhResult | null>(null);
  const [ghError, setGhError] = useState<string | null>(null);

  useEffect(() => { if (initialInput) handleGenerate(initialInput); }, []);

  const isGitHubUrl = (v: string) => /github\.com\/[^/]+\/[^/\s?#]+/.test(v);

  async function handleGenerate(val?: string) {
    const v = (val ?? input).trim();
    if (!v) return;
    setLoading(true); setError(null); setResult(null);
    setHasGenerated(false); setGhResult(null); setActiveTab("landing");

    try {
      let meta: RepoMeta | null = null;
      if (isGitHubUrl(v)) {
        const r = await fetch("/api/fetch-repo", {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: v }),
        });
        if (r.ok) {
          meta = await r.json();
          setRepoMeta(meta);
          setGhRepoName(`${meta!.name}-landing`);
        }
      } else {
        setRepoMeta(null);
        setGhRepoName(v.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30) + "-landing");
      }

      const genRes = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: v, repoMeta: meta }),
      });
      if (!genRes.ok) {
        const e = await genRes.json();
        throw new Error(e.error || "Generation failed");
      }
      const data = await genRes.json();
      setResult(data); setHasGenerated(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally { setLoading(false); }
  }

  async function handleGithubCreate() {
    if (!ghToken || !ghRepoName || !result) return;
    setGhLoading(true); setGhError(null);
    try {
      const res = await fetch("/api/github-create", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: ghToken, repoName: ghRepoName,
          description: result.copy.tagline,
          landingCode: result.landingCode,
          productName: repoMeta?.name || input.slice(0, 40),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setGhResult(data);
    } catch (e: unknown) {
      setGhError(e instanceof Error ? e.message : "Failed");
    } finally { setGhLoading(false); }
  }

  function copy(text: string, key: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(key); setTimeout(() => setCopied(null), 2000);
    });
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: "landing", label: "Landing Page" },
    { key: "social", label: "Social Posts" },
    { key: "pitch", label: "Pitch Line" },
  ];

  return (
    <div style={{ background: BG, fontFamily: MONO, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* ── Sticky Nav ── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 50,
        background: BG, borderBottom: `1px solid ${BORDER}`,
        padding: "10px 24px", display: "flex", alignItems: "center", gap: 16,
      }}>
        <button onClick={() => router.push("/")} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer" }}>
          <ArrowLeft size={14} color={MUTED} />
          <span style={{ fontFamily: SERIF, fontSize: 20, fontWeight: 600, color: FG }}>LaunchKit</span>
        </button>

        {/* Input bar */}
        <div style={{ flex: 1, maxWidth: 560, marginLeft: 8, display: "flex", border: `1px solid ${BORDER}` }}>
          <input
            type="text" value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleGenerate()}
            placeholder="GitHub URL or product description..."
            style={{
              flex: 1, padding: "8px 14px", fontSize: 12,
              background: SURFACE, color: FG, border: "none", outline: "none",
              fontFamily: MONO,
            }}
          />
          <button
            onClick={() => handleGenerate()} disabled={loading}
            style={{
              padding: "8px 18px", fontSize: 12, fontWeight: 500,
              background: FG, color: BG, border: "none", cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1, display: "flex", alignItems: "center", gap: 6,
              fontFamily: MONO, whiteSpace: "nowrap",
            }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
            {loading ? "Generating..." : "Generate"}
          </button>
        </div>

        {hasGenerated && result && (
          <button
            onClick={() => setShowGithub(true)}
            style={{
              marginLeft: "auto", display: "flex", alignItems: "center", gap: 6,
              padding: "8px 16px", fontSize: 12, fontWeight: 500,
              background: FG, color: BG, border: "none", cursor: "pointer", fontFamily: MONO,
            }}
          >
            <GithubIcon size={13} />
            Push to GitHub
          </button>
        )}
      </nav>

      {/* ── Body ── */}
      <div style={{ flex: 1, padding: "28px 24px 48px", maxWidth: 1400, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {loading && <LoadingState />}

        {error && !loading && (
          <div style={{ border: `1px solid ${BORDER}`, padding: 40, textAlign: "center" }}>
            <p style={{ color: MUTED, fontSize: 13, marginBottom: 16 }}>{error}</p>
            <button onClick={() => handleGenerate()}
              style={{ border: `1px solid ${BORDER}`, background: "none", color: FG, padding: "8px 20px", fontSize: 12, cursor: "pointer", fontFamily: MONO }}>
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !hasGenerated && (
          <EmptyState onExample={ex => { setInput(ex); handleGenerate(ex); }} />
        )}

        {result && hasGenerated && !loading && (
          <div>
            {/* Pitch strip */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 16, marginBottom: 28, padding: "18px 20px",
              border: `1px solid ${BORDER}`, background: SURFACE,
            }}>
              <div>
                {repoMeta?.name && <span style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 4 }}>{repoMeta.name}</span>}
                <div style={{ fontFamily: SERIF, fontSize: 20, fontStyle: "italic", color: FG }}>
                  &ldquo;{result.copy.pitch}&rdquo;
                </div>
              </div>
              <CopyBtn text={result.copy.pitch} id="pitch-top" copied={copied} onCopy={copy} />
            </div>

            {/* Tab bar */}
            <div style={{ display: "flex", borderBottom: `1px solid ${BORDER}`, marginBottom: 28 }}>
              {tabs.map(t => (
                <button key={t.key} onClick={() => setActiveTab(t.key)}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: MONO, fontSize: 12, padding: "12px 20px",
                    borderBottom: activeTab === t.key ? `2px solid ${FG}` : "2px solid transparent",
                    color: activeTab === t.key ? FG : MUTED,
                    marginBottom: -1, transition: "color 0.15s", whiteSpace: "nowrap",
                  }}>
                  {t.label}
                </button>
              ))}
            </div>

            {activeTab === "landing" && (
              <LandingTab
                data={result.copy} code={result.landingCode}
                view={landingView} setView={setLandingView}
                copied={copied} onCopy={copy}
                onPushGithub={() => setShowGithub(true)}
              />
            )}
            {activeTab === "social" && <SocialTab data={result.copy} copied={copied} onCopy={copy} />}
            {activeTab === "pitch" && <PitchTab data={result.copy} copied={copied} onCopy={copy} />}
          </div>
        )}
      </div>

      {showGithub && (
        <GitHubModal
          repoName={ghRepoName} setRepoName={setGhRepoName}
          token={ghToken} setToken={setGhToken}
          loading={ghLoading} result={ghResult} error={ghError}
          onClose={() => { setShowGithub(false); setGhResult(null); setGhError(null); }}
          onSubmit={handleGithubCreate}
        />
      )}
    </div>
  );
}

// ─── Loading ──────────────────────────────────────────────────────────────────
function LoadingState() {
  const steps = ["Fetching repo metadata...", "Parsing README...", "Crafting copy...", "Building landing page...", "Writing social posts...", "Finalising..."];
  const [step, setStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setStep(s => Math.min(s + 1, steps.length - 1)), 1100);
    return () => clearInterval(iv);
  }, []);
  return (
    <div style={{ border: `1px solid ${BORDER}`, padding: "64px 32px", textAlign: "center" }}>
      <div style={{ fontFamily: SERIF, fontSize: 28, fontStyle: "italic", color: FG, marginBottom: 40 }}>
        Building your launch kit
      </div>
      <div style={{ maxWidth: 280, margin: "0 auto", textAlign: "left" }}>
        {steps.map((s, i) => (
          <div key={i} style={{
            display: "flex", alignItems: "center", gap: 10,
            fontSize: 12, marginBottom: 8, fontFamily: MONO,
            color: i < step ? DIM : i === step ? FG : "#1a1a1a",
            transition: "color 0.3s",
          }}>
            <span style={{
              width: 6, height: 6, borderRadius: "50%", flexShrink: 0,
              background: i < step ? DIM : i === step ? FG : "#1a1a1a",
            }} />
            {s}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────
function EmptyState({ onExample }: { onExample: (ex: string) => void }) {
  const examples = [
    "github.com/vercel/next.js",
    "A CLI tool that converts Figma files to Tailwind components",
    "github.com/supabase/supabase",
    "An AI-powered code review tool for GitHub PRs",
  ];
  return (
    <div style={{ maxWidth: 600 }}>
      <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
        Try an example
      </p>
      {examples.map((ex, i) => (
        <button key={i} onClick={() => onExample(ex)}
          style={{
            width: "100%", textAlign: "left", display: "flex", alignItems: "center", justifyContent: "space-between",
            border: `1px solid ${BORDER}`, marginTop: i > 0 ? -1 : 0,
            padding: "14px 16px", fontSize: 13, color: MUTED,
            background: "none", cursor: "pointer", fontFamily: MONO,
            transition: "color 0.15s, border-color 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = FG; (e.currentTarget as HTMLButtonElement).style.borderColor = FG; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = MUTED; (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; }}
        >
          <span>{ex}</span>
          <Zap size={13} style={{ opacity: 0.3 }} />
        </button>
      ))}
    </div>
  );
}

// ─── Landing Tab ──────────────────────────────────────────────────────────────
function LandingTab({ data, code, view, setView, copied, onCopy, onPushGithub }: {
  data: CopyData; code: string;
  view: LandingView; setView: (v: LandingView) => void;
  copied: string | null; onCopy: (t: string, k: string) => void;
  onPushGithub: () => void;
}) {
  const [iframeLoaded, setIframeLoaded] = useState(false);

  const iframeHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<script src="https://cdn.tailwindcss.com"></script>
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet"/>
<style>
  body{margin:0;background:#0a0a0a;color:#e8e0d0;}
  *{box-sizing:border-box;}
  #error{display:none;padding:32px;font-family:monospace;font-size:12px;color:#ff6b6b;white-space:pre-wrap;background:#0a0a0a;}
</style>
<script>
  tailwind.config={theme:{extend:{fontFamily:{serif:['Playfair Display','serif'],mono:['DM Mono','monospace']}}}}
</script>
</head>
<body>
<div id="root"></div>
<div id="error"></div>
<script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
<script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
<script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
<script type="text/babel" data-presets="react">
const {useState, useEffect} = React;
try {
${code}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(LandingPage));
} catch(e) {
  document.getElementById('error').style.display = 'block';
  document.getElementById('error').textContent = 'Preview error: ' + e.message + '\\n\\n' + e.stack;
}
</script>
</body>
</html>`;

  const EDITOR_H = 720;

  return (
    <div>
      {/* ── Toolbar ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ display: "flex", border: `1px solid ${BORDER}`, padding: 2, gap: 2 }}>
          {([
            { key: "split", label: "Split", icon: Columns2 },
            { key: "preview", label: "Preview", icon: Eye },
            { key: "code", label: "Code", icon: Code2 },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button key={key} onClick={() => setView(key)}
              style={{
                padding: "5px 12px", fontSize: 11, cursor: "pointer",
                display: "flex", alignItems: "center", gap: 5,
                background: view === key ? FG : "none",
                color: view === key ? BG : MUTED,
                border: "none", fontFamily: MONO,
                transition: "background 0.15s, color 0.15s",
              }}>
              <Icon size={11} />
              {label}
            </button>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <CopyBtn text={code} id="code-copy" copied={copied} onCopy={onCopy} label="Copy Code" />
          <button onClick={onPushGithub}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 14px", fontSize: 11, fontWeight: 500,
              background: FG, color: BG, border: "none", cursor: "pointer", fontFamily: MONO,
            }}>
            <GithubIcon size={11} />
            Push to GitHub
          </button>
        </div>
      </div>

      {/* ── Editor / Preview ── */}
      <div style={{
        border: `1px solid ${BORDER}`,
        display: "grid",
        gridTemplateColumns: view === "split" ? "1fr 1fr" : "1fr",
        height: EDITOR_H,
        overflow: "hidden",
      }}>
        {(view === "code" || view === "split") && (
          <div style={{
            display: "flex", flexDirection: "column", overflow: "hidden",
            borderRight: view === "split" ? `1px solid ${BORDER}` : "none",
          }}>
            <div style={{
              padding: "8px 14px", borderBottom: `1px solid ${BORDER}`,
              background: SURFACE, display: "flex", justifyContent: "space-between", alignItems: "center",
              flexShrink: 0,
            }}>
              <span style={{ color: MUTED, fontSize: 11 }}>LandingPage.jsx</span>
              <span style={{ color: DIM, fontSize: 11 }}>{code.split("\n").length} lines</span>
            </div>
            <div style={{ flex: 1, overflow: "auto", background: "#0d0d0d" }}>
              <pre style={{
                margin: 0, padding: 16, fontSize: 11, lineHeight: 1.7,
                color: "#c8bfaf", fontFamily: MONO, whiteSpace: "pre-wrap",
                wordBreak: "break-word", tabSize: 2,
              }}>
                <code>{code}</code>
              </pre>
            </div>
          </div>
        )}

        {(view === "preview" || view === "split") && (
          <div style={{ display: "flex", flexDirection: "column", overflow: "hidden", background: BG }}>
            <div style={{
              padding: "8px 14px", borderBottom: `1px solid ${BORDER}`,
              background: SURFACE, display: "flex", alignItems: "center", gap: 8, flexShrink: 0,
            }}>
              <div style={{ display: "flex", gap: 5 }}>
                {[0, 1, 2].map(d => <div key={d} style={{ width: 9, height: 9, borderRadius: "50%", background: DIM }} />)}
              </div>
              <span style={{ color: DIM, fontSize: 11, marginLeft: 4 }}>Live Preview</span>
              {!iframeLoaded && <Loader2 size={11} className="animate-spin" style={{ color: MUTED, marginLeft: "auto" }} />}
            </div>
            <iframe
              srcDoc={iframeHtml}
              style={{ flex: 1, width: "100%", border: "none" }}
              sandbox="allow-scripts allow-same-origin"
              onLoad={() => setIframeLoaded(true)}
            />
          </div>
        )}
      </div>

      {/* ── Copy Cards ── */}
      <div style={{ marginTop: 32 }}>
        <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>
          Copy assets
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 0 }}>
          <Block label="Headline" content={data.headline} id="hl" copied={copied} onCopy={onCopy} serif />
          <Block label="Subheadline" content={data.subheadline} id="sub" copied={copied} onCopy={onCopy} />
          <Block label="Tagline" content={data.tagline} id="tl" copied={copied} onCopy={onCopy} serif />
          <Block label="CTA Button" content={data.cta} id="cta" copied={copied} onCopy={onCopy} />
        </div>

        <div style={{ border: `1px solid ${BORDER}`, marginTop: -1 }}>
          <div style={{
            padding: "8px 14px", borderBottom: `1px solid ${BORDER}`,
            background: SURFACE, display: "flex", justifyContent: "space-between", alignItems: "center",
          }}>
            <span style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>Features</span>
            <CopyBtn
              text={data.features.map(f => `${f.title}: ${f.desc}`).join("\n")}
              id="feats" copied={copied} onCopy={onCopy}
            />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))" }}>
            {data.features.map((f, i) => (
              <div key={i} style={{
                padding: "16px 16px",
                borderRight: i < data.features.length - 1 ? `1px solid ${BORDER}` : "none",
              }}>
                <div style={{ fontFamily: SERIF, color: FG, fontSize: 15, fontWeight: 500, marginBottom: 6 }}>{f.title}</div>
                <div style={{ color: MUTED, fontSize: 12, lineHeight: 1.6 }}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Social Tab ───────────────────────────────────────────────────────────────
function SocialTab({ data, copied, onCopy }: { data: CopyData; copied: string | null; onCopy: (t: string, k: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <Block label="Twitter / X" content={data.twitter} id="tw" copied={copied} onCopy={onCopy} large />
      <Block label="LinkedIn" content={data.linkedin} id="li" copied={copied} onCopy={onCopy} large />
      <Block label="Product Hunt Tagline" content={data.producthunt} id="ph" copied={copied} onCopy={onCopy} serif />
    </div>
  );
}

// ─── Pitch Tab ────────────────────────────────────────────────────────────────
function PitchTab({ data, copied, onCopy }: { data: CopyData; copied: string | null; onCopy: (t: string, k: string) => void }) {
  return (
    <div>
      <div style={{ border: `1px solid ${BORDER}`, padding: "64px 32px", textAlign: "center", marginBottom: -1 }}>
        <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 24 }}>
          Your one-liner
        </p>
        <blockquote style={{
          fontFamily: SERIF, fontSize: "clamp(1.4rem, 3.5vw, 2.4rem)",
          fontStyle: "italic", color: FG, lineHeight: 1.2, marginBottom: 32,
        }}>
          &ldquo;{data.pitch}&rdquo;
        </blockquote>
        <button
          onClick={() => onCopy(data.pitch, "pitch-main")}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            border: `1px solid ${FG}`, background: "none", color: FG,
            padding: "10px 24px", fontSize: 13, cursor: "pointer", fontFamily: MONO,
            transition: "background 0.15s, color 0.15s",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = FG; (e.currentTarget as HTMLButtonElement).style.color = BG; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "none"; (e.currentTarget as HTMLButtonElement).style.color = FG; }}
        >
          {copied === "pitch-main" ? <Check size={14} /> : <Copy size={14} />}
          {copied === "pitch-main" ? "Copied!" : "Copy this line"}
        </button>
      </div>

      <Block label="Tagline" content={data.tagline} id="tl-p" copied={copied} onCopy={onCopy} serif />
      <Block label="Product Hunt" content={data.producthunt} id="ph-p" copied={copied} onCopy={onCopy} />

      <div style={{ border: `1px solid ${BORDER}`, padding: "20px 20px", marginTop: -1 }}>
        <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
          Use this line for
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 8 }}>
          {["Twitter bio", "GitHub description", "Email signature", "Product Hunt"].map((u, i) => (
            <div key={i} style={{ border: `1px solid ${BORDER}`, padding: "10px 14px", textAlign: "center" }}>
              <span style={{ color: MUTED, fontSize: 12 }}>{u}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Shared: Block ────────────────────────────────────────────────────────────
function Block({ label, content, id, copied, onCopy, serif = false, large = false }: {
  label: string; content: string; id: string;
  copied: string | null; onCopy: (t: string, k: string) => void;
  serif?: boolean; large?: boolean;
}) {
  return (
    <div style={{ border: `1px solid ${BORDER}`, marginTop: -1 }}>
      <div style={{
        padding: "8px 14px", borderBottom: `1px solid ${BORDER}`,
        background: SURFACE, display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>{label}</span>
        <CopyBtn text={content} id={id} copied={copied} onCopy={onCopy} />
      </div>
      <div style={{
        padding: "14px 16px", color: FG, lineHeight: 1.65, whiteSpace: "pre-wrap",
        fontFamily: serif ? SERIF : MONO,
        fontSize: serif ? 16 : large ? 13 : 12,
      }}>
        {content}
      </div>
    </div>
  );
}

// ─── Shared: CopyBtn ──────────────────────────────────────────────────────────
function CopyBtn({ text, id, copied, onCopy, label = "Copy" }: {
  text: string; id: string; copied: string | null;
  onCopy: (t: string, k: string) => void; label?: string;
}) {
  const done = copied === id;
  return (
    <button onClick={() => onCopy(text, id)}
      style={{
        display: "flex", alignItems: "center", gap: 5,
        background: "none", border: `1px solid ${BORDER}`,
        color: done ? FG : MUTED, fontSize: 11, cursor: "pointer",
        padding: "4px 10px", fontFamily: MONO, transition: "color 0.15s, border-color 0.15s",
      }}
      onMouseEnter={e => { if (!done) { (e.currentTarget as HTMLButtonElement).style.color = FG; (e.currentTarget as HTMLButtonElement).style.borderColor = FG; }}}
      onMouseLeave={e => { if (!done) { (e.currentTarget as HTMLButtonElement).style.color = MUTED; (e.currentTarget as HTMLButtonElement).style.borderColor = BORDER; }}}
    >
      {done ? <Check size={11} /> : <Copy size={11} />}
      {done ? "Copied!" : label}
    </button>
  );
}

// ─── GitHub Modal ─────────────────────────────────────────────────────────────
function GitHubModal({ repoName, setRepoName, token, setToken, loading, result, error, onClose, onSubmit }: {
  repoName: string; setRepoName: (v: string) => void;
  token: string; setToken: (v: string) => void;
  loading: boolean; result: GhResult | null; error: string | null;
  onClose: () => void; onSubmit: () => void;
}) {
  const deployOptions = result ? [
    { label: "Deploy to Vercel", url: result.vercelUrl, desc: "Auto-detects Vite. Live in ~30s.", icon: "▲" },
    { label: "Deploy to Netlify", url: result.netlifyUrl, desc: "Connect repo. Free tier.", icon: "◆" },
    { label: "GitHub Pages", url: result.pagesUrl, desc: "Enable in repo settings.", icon: "⬡" },
  ] : [];

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: 16, background: "rgba(0,0,0,0.88)",
    }}>
      <div style={{ width: "100%", maxWidth: 480, border: `1px solid ${BORDER}`, background: BG }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "14px 20px", borderBottom: `1px solid ${BORDER}`,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <GithubIcon size={15} color={FG} />
            <span style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 500, color: FG }}>
              {result ? "Repo Created" : "Push to GitHub"}
            </span>
          </div>
          <button onClick={onClose}
            style={{ background: "none", border: "none", color: MUTED, fontSize: 20, cursor: "pointer", lineHeight: 1 }}>
            ×
          </button>
        </div>

        <div style={{ padding: 20 }}>
          {!result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 6 }}>
                  GitHub Personal Access Token
                </label>
                <input
                  type="password" value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: 12,
                    background: SURFACE, color: FG, border: `1px solid ${BORDER}`,
                    outline: "none", fontFamily: MONO, boxSizing: "border-box",
                  }}
                />
                <p style={{ color: DIM, fontSize: 11, marginTop: 6 }}>
                  Need one?{" "}
                  <a href="https://github.com/settings/tokens/new?scopes=repo&description=LaunchKit"
                    target="_blank" rel="noreferrer"
                    style={{ color: MUTED, textDecoration: "underline" }}>
                    Generate here
                  </a>
                  {" "}— check <code style={{ fontSize: 10 }}>repo</code> scope.
                </p>
              </div>

              <div>
                <label style={{ color: MUTED, fontSize: 11, display: "block", marginBottom: 6 }}>
                  Repository Name
                </label>
                <input
                  type="text" value={repoName}
                  onChange={e => setRepoName(e.target.value)}
                  placeholder="my-product-landing"
                  style={{
                    width: "100%", padding: "10px 14px", fontSize: 12,
                    background: SURFACE, color: FG, border: `1px solid ${BORDER}`,
                    outline: "none", fontFamily: MONO, boxSizing: "border-box",
                  }}
                />
              </div>

              {error && (
                <p style={{ color: "#ff6b6b", fontSize: 11, border: "1px solid #4a1a1a", padding: "8px 12px" }}>
                  {error}
                </p>
              )}

              <button
                onClick={onSubmit}
                disabled={loading || !token || !repoName}
                style={{
                  width: "100%", padding: "12px", fontSize: 13, fontWeight: 500,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
                  background: FG, color: BG, border: "none",
                  cursor: loading || !token || !repoName ? "not-allowed" : "pointer",
                  opacity: loading || !token || !repoName ? 0.5 : 1,
                  fontFamily: MONO,
                }}>
                {loading ? <Loader2 size={14} className="animate-spin" /> : <GithubIcon size={14} />}
                {loading ? "Creating repo..." : "Create repo & push files"}
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ border: `1px solid ${BORDER}`, padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ color: FG, fontSize: 13, marginBottom: 3 }}>{result.fullName}</p>
                  <p style={{ color: MUTED, fontSize: 11 }}>All files pushed successfully</p>
                </div>
                <a href={result.repoUrl} target="_blank" rel="noreferrer"
                  style={{ display: "flex", alignItems: "center", gap: 5, color: MUTED, fontSize: 11, textDecoration: "none" }}>
                  <ExternalLink size={12} />
                  Open
                </a>
              </div>

              <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                Deploy now
              </p>

              <div>
                {deployOptions.map((d, i) => (
                  <a key={i} href={d.url} target="_blank" rel="noreferrer"
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      border: `1px solid ${BORDER}`, padding: "12px 14px",
                      marginTop: i > 0 ? -1 : 0, textDecoration: "none",
                      transition: "border-color 0.15s",
                    }}
                    onMouseEnter={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = FG}
                    onMouseLeave={e => (e.currentTarget as HTMLAnchorElement).style.borderColor = BORDER}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <span style={{ color: FG, fontSize: 13, width: 18, textAlign: "center" }}>{d.icon}</span>
                      <div>
                        <p style={{ color: FG, fontSize: 13, marginBottom: 2 }}>{d.label}</p>
                        <p style={{ color: MUTED, fontSize: 11 }}>{d.desc}</p>
                      </div>
                    </div>
                    <ExternalLink size={13} color={DIM} />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

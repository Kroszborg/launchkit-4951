import type { CopyData } from "./schemas";

function esc(s: unknown): string {
  return String(s || "")
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ");
}

export function buildLandingTemplate(d: CopyData): string {
  const name        = esc(d.name        || "Product");
  const headline    = esc(d.headline    || "Build something great");
  const subheadline = esc(d.subheadline || "");
  const tagline     = esc(d.tagline     || "");
  const pitch       = esc(d.pitch       || "");
  const cta         = esc(d.cta         || "Get Started");
  const ctaUrl      = esc(d.ctaUrl      || "https://github.com");

  const rawFeatures = (d.features || []).slice(0, 4);
  while (rawFeatures.length < 4)
    rawFeatures.push({ num: `0${rawFeatures.length + 1}`, title: "Feature", desc: "More details coming soon." });
  const features = rawFeatures.map((f) => ({
    num: esc(f.num || "01"), title: esc(f.title || ""), desc: esc(f.desc || ""),
  }));

  const rawSteps = (d.steps || []).slice(0, 3);
  while (rawSteps.length < 3)
    rawSteps.push({ num: `${rawSteps.length + 1}`, title: "Step", desc: "Coming soon." });
  const steps = rawSteps.map((s) => ({
    num: esc(s.num || "1"), title: esc(s.title || ""), desc: esc(s.desc || ""),
  }));

  const words    = headline.split(" ");
  const mid      = Math.ceil(words.length / 2);
  const headline1 = words.slice(0, mid).join(" ");
  const headline2 = words.slice(mid).join(" ");

  const featuresJson = JSON.stringify(features);
  const stepsJson    = JSON.stringify(steps);

  const L: string[] = [];
  const p = (...s: string[]) => s.forEach((x) => L.push(x));

  /* ── component open ─────────────────────────────────────── */
  p(
    "const LandingPage = () => {",
    '  const SERIF = "\'Playfair Display\', Georgia, serif";',
    '  const MONO  = "\'DM Mono\', \'Courier New\', monospace";',
    '  const FG    = "#e8e0d0";',
    '  const MUTED = "#6b6b6b";',
    '  const DIM   = "#2a2a2a";',
    '  const BG    = "#0a0a0a";',
    '  const SURF  = "#0e0e0e";',
    '  const GOLD  = "#c9a96e";',
    '  const GOLDF = "rgba(201,169,110,0.08)";',
    "",
    "  const features = " + featuresJson + ";",
    "  const steps    = " + stepsJson + ";",
    "",
    "  const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth' }); };",
    "",
    "  return (",
  );

  /* ── wrapper ─────────────────────────────────────────────── */
  p(
    '    <div style={{ background: BG, color: FG, fontFamily: MONO, minHeight: "100vh", overflowX: "hidden" }}>',
    "",
  );

  /* ── CSS animations ──────────────────────────────────────── */
  p(
    "      <style>{`",
    "        @keyframes fadeUp { from { opacity:0; transform:translateY(22px) } to { opacity:1; transform:translateY(0) } }",
    "        @keyframes pulse  { 0%,100% { opacity:1 } 50% { opacity:0.4 } }",
    "        @keyframes borderGlow { 0%,100% { border-color:#2a2a2a } 50% { border-color:rgba(201,169,110,0.5) } }",
    "        .lk-a  { animation: fadeUp 0.65s ease forwards; opacity:0 }",
    "        .lk-d1 { animation-delay:0.05s } .lk-d2 { animation-delay:0.15s }",
    "        .lk-d3 { animation-delay:0.25s } .lk-d4 { animation-delay:0.35s }",
    "        .lk-d5 { animation-delay:0.45s } .lk-d6 { animation-delay:0.55s }",
    "        .lk-card { transition: transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease, background 0.25s ease }",
    "        .lk-card:hover { transform:translateY(-6px) !important; border-color:#c9a96e !important; box-shadow:0 24px 64px rgba(0,0,0,0.7) !important; background:#111 !important }",
    "        .lk-btn  { transition: background 0.18s ease, transform 0.18s ease, color 0.18s ease }",
    "        .lk-btn:hover  { background:#ffffff !important; transform:translateY(-2px) !important }",
    "        .lk-ghost { transition: border-color 0.18s ease, color 0.18s ease }",
    "        .lk-ghost:hover { border-color:#e8e0d0 !important; color:#e8e0d0 !important }",
    "        .lk-nav-link { transition: color 0.15s ease; cursor:pointer }",
    "        .lk-nav-link:hover { color:#e8e0d0 !important }",
    "        .lk-step-dot { transition: border-color 0.2s, color 0.2s }",
    "        .lk-step:hover .lk-step-dot { border-color:#c9a96e !important; color:#c9a96e !important }",
    "        .lk-pulse { animation: pulse 2.5s ease infinite }",
    "        .lk-border-glow { animation: borderGlow 3s ease infinite }",
    "      `}</style>",
    "",
  );

  /* ── NAV ─────────────────────────────────────────────────── */
  p(
    "      {/* NAV */}",
    "      <nav style={{",
    '        position:"sticky", top:0, zIndex:50,',
    '        background:"rgba(10,10,10,0.85)", backdropFilter:"blur(16px)",',
    "        borderBottom:`1px solid ${DIM}`, padding:\"0 48px\", height:64,",
    '        display:"flex", alignItems:"center", justifyContent:"space-between"',
    "      }}>",
    '        <div style={{ display:"flex", alignItems:"center", gap:10 }}>',
    '          <div style={{ width:8, height:8, background:GOLD, borderRadius:"50%" }} className="lk-pulse" />',
    '          <span style={{ fontFamily:SERIF, fontSize:19, fontWeight:700, letterSpacing:"-0.02em" }}>',
    "            " + JSON.stringify(name),
    "          </span>",
    "        </div>",
    '        <div style={{ display:"flex", alignItems:"center", gap:36 }}>',
    '          <span className="lk-nav-link" onClick={() => scrollTo("features")} style={{ color:MUTED, fontSize:12, letterSpacing:"0.04em" }}>Features</span>',
    '          <span className="lk-nav-link" onClick={() => scrollTo("how")}      style={{ color:MUTED, fontSize:12, letterSpacing:"0.04em" }}>How it works</span>',
    '          <button className="lk-btn" onClick={() => window.open(' + JSON.stringify(ctaUrl) + ', "_blank")} style={{',
    '            background:FG, color:BG, border:"none", cursor:"pointer",',
    '            padding:"9px 22px", fontSize:12, fontFamily:MONO, fontWeight:600, letterSpacing:"0.06em"',
    "          }}>",
    "            " + JSON.stringify(cta),
    "          </button>",
    "        </div>",
    "      </nav>",
    "",
  );

  /* ── HERO ────────────────────────────────────────────────── */
  p(
    "      {/* HERO */}",
    '      <section style={{ position:"relative", overflow:"hidden", minHeight:"92vh", display:"flex", flexDirection:"column", justifyContent:"center" }}>',
    "",
    "        {/* grid bg */}",
    "        <div style={{",
    '          position:"absolute", inset:0, zIndex:0,',
    '          backgroundImage:"linear-gradient(rgba(42,42,42,0.2) 1px,transparent 1px),linear-gradient(90deg,rgba(42,42,42,0.2) 1px,transparent 1px)",',
    '          backgroundSize:"64px 64px",',
    '          maskImage:"linear-gradient(to bottom,transparent,black 15%,black 65%,transparent)",',
    '          WebkitMaskImage:"linear-gradient(to bottom,transparent,black 15%,black 65%,transparent)"',
    "        }} />",
    "",
    "        {/* radial glow */}",
    "        <div style={{",
    '          position:"absolute", top:"-20%", left:"50%", transform:"translateX(-50%)",',
    '          width:900, height:900, borderRadius:"50%",',
    '          background:"radial-gradient(circle,rgba(201,169,110,0.07) 0%,transparent 65%)", zIndex:0',
    "        }} />",
    "",
    '        <div style={{ position:"relative", zIndex:1, maxWidth:1100, margin:"0 auto", padding:"80px 48px 60px", width:"100%" }}>',
    "",
    "          {/* badge */}",
    '          <div className="lk-a lk-d1" style={{ display:"inline-flex", alignItems:"center", gap:8, border:`1px solid rgba(201,169,110,0.35)`, padding:"5px 14px", marginBottom:40, background:"rgba(201,169,110,0.05)" }}>',
    '            <span className="lk-pulse" style={{ width:6, height:6, borderRadius:"50%", background:GOLD, display:"inline-block" }} />',
    '            <span style={{ color:GOLD, fontSize:11, letterSpacing:"0.18em", textTransform:"uppercase", fontWeight:500 }}>',
    "              " + JSON.stringify(tagline),
    "            </span>",
    "          </div>",
    "",
    "          {/* headline */}",
    '          <h1 className="lk-a lk-d2" style={{',
    "            fontFamily:SERIF, fontWeight:700, lineHeight:1.0,",
    '            fontSize:"clamp(3rem,6.5vw,6.5rem)", letterSpacing:"-0.04em",',
    '            margin:"0 0 6px", maxWidth:900,',
    '            background:"linear-gradient(135deg, #e8e0d0 0%, #c9a96e 55%, #e8e0d0 100%)",',
    '            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",',
    '            backgroundClip:"text"',
    "          }}>",
    "            " + JSON.stringify(headline1),
    "          </h1>",
    '          <h1 className="lk-a lk-d3" style={{',
    "            fontFamily:SERIF, fontWeight:700, fontStyle:'italic', lineHeight:1.0,",
    '            fontSize:"clamp(3rem,6.5vw,6.5rem)", letterSpacing:"-0.04em",',
    '            margin:"0 0 40px", maxWidth:900, color:"#b8b0a0"',
    "          }}>",
    "            " + JSON.stringify(headline2),
    "          </h1>",
    "",
    "          {/* sub + cta row */}",
    '          <div className="lk-a lk-d4" style={{ display:"flex", alignItems:"flex-end", gap:64, flexWrap:"wrap", marginBottom:56 }}>',
    '            <p style={{ color:MUTED, fontSize:16, lineHeight:1.85, maxWidth:460, margin:0 }}>',
    "              " + JSON.stringify(subheadline),
    "            </p>",
    '            <div style={{ display:"flex", flexDirection:"column", gap:12, flexShrink:0 }}>',
    '              <button className="lk-btn" onClick={() => window.open(' + JSON.stringify(ctaUrl) + ', "_blank")} style={{',
    '                background:FG, color:BG, border:"none", cursor:"pointer",',
    '                padding:"16px 44px", fontSize:13, fontFamily:MONO, fontWeight:700,',
    '                letterSpacing:"0.08em", whiteSpace:"nowrap"',
    "              }}>",
    "                {" + JSON.stringify(cta + " →") + "}",
    "              </button>",
    '              <a className="lk-ghost" href={' + JSON.stringify(ctaUrl) + '} target="_blank" rel="noreferrer" style={{',
    '                display:"flex", alignItems:"center", justifyContent:"center", gap:6,',
    '                border:`1px solid ${DIM}`, color:MUTED, textDecoration:"none",',
    '                padding:"11px 24px", fontSize:12, fontFamily:MONO',
    "              }}>",
    '                View on GitHub <span style={{ fontSize:14 }}>↗</span>',
    "              </a>",
    "            </div>",
    "          </div>",
    "",
    "          {/* pitch card */}",
    '          <div className="lk-a lk-d5" style={{',
    '            border:`1px solid ${DIM}`, borderTop:`2px solid ${GOLD}`,',
    '            background:SURF, padding:"28px 32px", maxWidth:620,',
    '            position:"relative"',
    "          }}>",
    '            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>',
    '              <span style={{ fontFamily:MONO, color:GOLD, fontSize:10, letterSpacing:"0.2em", textTransform:"uppercase" }}>One-liner</span>',
    '              <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${DIM},transparent)` }} />',
    "            </div>",
    '            <p style={{ fontFamily:SERIF, fontSize:20, fontStyle:"italic", color:FG, lineHeight:1.4, margin:0 }}>',
    '              &ldquo;{' + JSON.stringify(pitch) + '}&rdquo;',
    "            </p>",
    "          </div>",
    "",
    "        </div>",
    "",
    "        {/* scroll hint */}",
    "        <div style={{ borderTop:`1px solid ${DIM}` }}>",
    '          <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", justifyContent:"space-between", alignItems:"center", padding:"14px 48px" }}>',
    '            <span style={{ color:"#3a3a3a", fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase" }}>Scroll to explore</span>',
    '            <span style={{ color:"#3a3a3a", fontSize:14 }}>↓</span>',
    "          </div>",
    "        </div>",
    "      </section>",
    "",
  );

  /* ── STATS STRIP ─────────────────────────────────────────── */
  p(
    "      {/* STATS */}",
    "      <section style={{ borderTop:`1px solid ${DIM}`, borderBottom:`1px solid ${DIM}`, background:SURF }}>",
    '        <div style={{ maxWidth:1100, margin:"0 auto", display:"grid", gridTemplateColumns:"repeat(3,1fr)", padding:"0 48px" }}>',
    "          {[",
    '            { label:"Setup time",  value:"< 5 min"   },',
    '            { label:"Platforms",   value:"Any stack"  },',
    '            { label:"Cost",        value:"Free"       },',
    "          ].map((s, i) => (",
    '            <div key={i} style={{ padding:"28px 0", borderRight: i < 2 ? `1px solid ${DIM}` : "none", paddingLeft: i > 0 ? 40 : 0 }}>',
    '              <div style={{ fontFamily:SERIF, fontSize:28, fontWeight:700, color:GOLD, marginBottom:4 }}>{s.value}</div>',
    '              <div style={{ color:MUTED, fontSize:12, letterSpacing:"0.08em" }}>{s.label}</div>',
    "            </div>",
    "          ))}",
    "        </div>",
    "      </section>",
    "",
  );

  /* ── FEATURES ────────────────────────────────────────────── */
  p(
    '      {/* FEATURES */}',
    '      <section id="features" style={{ padding:"100px 48px" }}>',
    '        <div style={{ maxWidth:1100, margin:"0 auto" }}>',
    '          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", marginBottom:64 }}>',
    '            <div>',
    '              <p style={{ color:GOLD, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:8 }}>What you get</p>',
    '              <h2 style={{ fontFamily:SERIF, fontSize:"clamp(1.8rem,3vw,2.6rem)", fontWeight:700, letterSpacing:"-0.03em", margin:0 }}>',
    '                Everything you need to launch',
    '              </h2>',
    '            </div>',
    '            <span style={{ color:DIM, fontSize:12, fontFamily:MONO }}>04 features</span>',
    '          </div>',
    '          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:1, background:DIM }}>',
    "            {features.map((f, i) => (",
    '              <div key={i} className="lk-card" style={{',
    '                padding:"44px 36px 48px", background:BG,',
    '                borderTop:`3px solid ${i === 0 ? GOLD : DIM}`,',
    '                position:"relative", overflow:"hidden"',
    "              }}>",
    "                {/* ghost number */}",
    "                <div style={{",
    "                  position:'absolute', bottom:-10, right:16,",
    "                  fontFamily:SERIF, fontSize:100, fontWeight:700, lineHeight:1,",
    '                  color:"rgba(201,169,110,0.06)", userSelect:"none", pointerEvents:"none"',
    "                }}>{f.num}</div>",
    "",
    '                <div style={{ width:32, height:2, background:GOLD, marginBottom:32 }} />',
    '                <h3 style={{ fontFamily:SERIF, fontSize:22, fontWeight:600, marginBottom:12, lineHeight:1.2, position:"relative" }}>{f.title}</h3>',
    '                <p  style={{ color:MUTED, fontSize:14, lineHeight:1.8, margin:0, position:"relative" }}>{f.desc}</p>',
    "              </div>",
    "            ))}",
    "          </div>",
    "        </div>",
    "      </section>",
    "",
  );

  /* ── HOW IT WORKS ────────────────────────────────────────── */
  p(
    '      {/* HOW */}',
    '      <section id="how" style={{ borderTop:`1px solid ${DIM}`, padding:"100px 48px", background:SURF }}>',
    '        <div style={{ maxWidth:1100, margin:"0 auto" }}>',
    '          <div style={{ marginBottom:64 }}>',
    '            <p style={{ color:GOLD, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:8 }}>How it works</p>',
    '            <h2 style={{ fontFamily:SERIF, fontSize:"clamp(1.8rem,3vw,2.6rem)", fontWeight:700, letterSpacing:"-0.03em", margin:0 }}>',
    '              Three steps to launch',
    '            </h2>',
    '          </div>',
    '          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:0 }}>',
    "            {steps.map((s, i) => (",
    '              <div key={i} className="lk-step" style={{ padding:"0 40px 0 0", position:"relative" }}>',
    "                {/* connector */}",
    "                {i < steps.length - 1 && (",
    '                  <div style={{ position:"absolute", top:20, left:40, right:0, height:1, background:`linear-gradient(90deg,${DIM},transparent)` }} />',
    "                )}",
    '                <div className="lk-step-dot" style={{',
    '                  width:40, height:40, border:`1px solid ${DIM}`,',
    '                  display:"flex", alignItems:"center", justifyContent:"center",',
    '                  fontFamily:SERIF, fontSize:16, color:MUTED, marginBottom:28, background:BG, position:"relative"',
    "                }}>{s.num}</div>",
    '                <h4 style={{ fontFamily:SERIF, fontSize:20, fontWeight:600, marginBottom:12, lineHeight:1.2 }}>{s.title}</h4>',
    '                <p  style={{ color:MUTED, fontSize:14, lineHeight:1.8, margin:0 }}>{s.desc}</p>',
    "              </div>",
    "            ))}",
    "          </div>",
    "        </div>",
    "      </section>",
    "",
  );

  /* ── PITCH SHOWCASE ──────────────────────────────────────── */
  p(
    "      {/* PITCH */}",
    "      <section style={{ borderTop:`1px solid ${DIM}`, borderBottom:`1px solid ${DIM}`, padding:'80px 48px' }}>",
    '        <div style={{ maxWidth:820, margin:"0 auto", textAlign:"center" }}>',
    '          <div style={{ display:"flex", alignItems:"center", gap:16, justifyContent:"center", marginBottom:40 }}>',
    '            <div style={{ flex:1, height:1, background:`linear-gradient(90deg,transparent,${DIM})` }} />',
    '            <span style={{ color:MUTED, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase" }}>The pitch</span>',
    '            <div style={{ flex:1, height:1, background:`linear-gradient(90deg,${DIM},transparent)` }} />',
    "          </div>",
    '          <blockquote style={{',
    '            fontFamily:SERIF, fontSize:"clamp(1.6rem,3.5vw,2.8rem)",',
    '            fontStyle:"italic", color:FG, lineHeight:1.2, margin:"0 0 40px",',
    '            letterSpacing:"-0.02em"',
    "          }}>",
    '            &ldquo;{' + JSON.stringify(pitch) + '}&rdquo;',
    "          </blockquote>",
    '          <div style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"8px 20px", border:`1px solid ${DIM}` }}>',
    '            <div style={{ width:6, height:6, background:GOLD, borderRadius:"50%" }} />',
    '            <span style={{ color:MUTED, fontSize:12 }}>',
    "              " + JSON.stringify(name),
    "            </span>",
    "          </div>",
    "        </div>",
    "      </section>",
    "",
  );

  /* ── CTA BAND ────────────────────────────────────────────── */
  p(
    "      {/* CTA */}",
    "      <section style={{",
    '        background:"linear-gradient(135deg,#0d0c0a 0%,#0a0a0a 50%,#0c0b09 100%)",',
    '        position:"relative", overflow:"hidden"',
    "      }}>",
    "        <div style={{",
    '          position:"absolute", top:"-30%", right:"-10%", width:600, height:600, borderRadius:"50%",',
    '          background:"radial-gradient(circle,rgba(201,169,110,0.06) 0%,transparent 65%)"',
    "        }} />",
    "        <div style={{",
    '          maxWidth:1100, margin:"0 auto", padding:"110px 48px",',
    '          display:"flex", alignItems:"center", justifyContent:"space-between",',
    '          gap:48, position:"relative", zIndex:1, flexWrap:"wrap"',
    "        }}>",
    "          <div>",
    '            <p style={{ color:GOLD, fontSize:11, letterSpacing:"0.2em", textTransform:"uppercase", marginBottom:20 }}>',
    '              Ready to ship?',
    "            </p>",
    "            <h2 style={{",
    "              fontFamily:SERIF, fontWeight:700, lineHeight:1.05,",
    '              fontSize:"clamp(2.4rem,5vw,4.2rem)", letterSpacing:"-0.03em", margin:0, maxWidth:560',
    "            }}>",
    '              Stop waiting.<br/>',
    '              <em style={{ fontStyle:"italic", color:"#b8b0a0" }}>Start launching.</em>',
    "            </h2>",
    "          </div>",
    '          <div style={{ display:"flex", flexDirection:"column", gap:14, alignItems:"flex-end", flexShrink:0 }}>',
    '            <button className="lk-btn" onClick={() => window.open(' + JSON.stringify(ctaUrl) + ', "_blank")} style={{',
    '              background:FG, color:BG, border:"none", cursor:"pointer",',
    '              padding:"20px 52px", fontSize:14, fontFamily:MONO, fontWeight:700,',
    '              letterSpacing:"0.08em", whiteSpace:"nowrap"',
    "            }}>",
    "              {" + JSON.stringify(cta + " →") + "}",
    "            </button>",
    '            <span style={{ color:MUTED, fontSize:12 }}>Free · No signup · Instant results</span>',
    "          </div>",
    "        </div>",
    "      </section>",
    "",
  );

  /* ── FOOTER ──────────────────────────────────────────────── */
  p(
    "      {/* FOOTER */}",
    "      <footer style={{ borderTop:`1px solid ${DIM}`, padding:'32px 48px' }}>",
    '        <div style={{ maxWidth:1100, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>',
    '          <div style={{ display:"flex", alignItems:"center", gap:10 }}>',
    '            <div style={{ width:7, height:7, background:GOLD, borderRadius:"50%" }} />',
    '            <span style={{ fontFamily:SERIF, fontSize:16, fontWeight:600 }}>' + JSON.stringify(name) + '</span>',
    '            <span style={{ color:DIM, fontSize:12, marginLeft:4 }}>—</span>',
    '            <span style={{ color:MUTED, fontSize:12 }}>' + JSON.stringify(tagline) + '</span>',
    "          </div>",
    '          <span style={{ color:"#3a3a3a", fontSize:11, letterSpacing:"0.08em" }}>Built with LaunchKit</span>',
    "        </div>",
    "      </footer>",
    "",
  );

  /* ── close ───────────────────────────────────────────────── */
  p(
    "    </div>",
    "  );",
    "};",
    "",
    "export default LandingPage;",
  );

  return L.join("\n");
}

/* ── GitHub scaffold builders ───────────────────────────────── */

export function buildIndexHtml(name: string) {
  return [
    "<!DOCTYPE html>",
    '<html lang="en">',
    "  <head>",
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `    <title>${name}</title>`,
    '    <link rel="preconnect" href="https://fonts.googleapis.com" />',
    '    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />',
    "  </head>",
    "  <body>",
    '    <div id="root"></div>',
    '    <script type="module" src="/src/index.jsx"></script>',
    "  </body>",
    "</html>",
  ].join("\n");
}

export function buildIndexJsx() {
  return [
    "import React from 'react'",
    "import { createRoot } from 'react-dom/client'",
    "import LandingPage from './LandingPage'",
    "",
    "createRoot(document.getElementById('root')).render(<LandingPage />)",
  ].join("\n");
}

export function buildPackageJson(name: string, desc: string) {
  return JSON.stringify(
    {
      name: name.toLowerCase().replace(/\s+/g, "-"),
      version: "0.1.0",
      description: desc || name,
      scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
      dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" },
      devDependencies: {
        "@vitejs/plugin-react": "^4.0.0",
        tailwindcss: "^3.4.0",
        autoprefixer: "^10.4.0",
        vite: "^5.0.0",
      },
    },
    null,
    2,
  );
}

export function buildReadme(name: string, desc: string) {
  return [
    `# ${name}`,
    "",
    desc || "A beautiful landing page generated by LaunchKit.",
    "",
    "## Getting Started",
    "",
    "```bash",
    "npm install",
    "npm run dev",
    "```",
    "",
    "## Deploy",
    "",
    "- **Vercel**: Import this repo at vercel.com/new",
    "- **Netlify**: Import this repo at app.netlify.com/start",
    "- **GitHub Pages**: Enable in repo Settings > Pages",
    "",
    "---",
    "",
    "*Generated with [LaunchKit](https://launchkit.vercel.app)*",
  ].join("\n");
}

export function buildTailwindConfig() {
  return [
    "/** @type {import('tailwindcss').Config} */",
    "export default {",
    "  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],",
    "  theme: { extend: {} },",
    "  plugins: [],",
    "}",
  ].join("\n");
}

export function buildViteConfig() {
  return [
    "import { defineConfig } from 'vite'",
    "import react from '@vitejs/plugin-react'",
    "",
    "export default defineConfig({",
    "  plugins: [react()],",
    "})",
  ].join("\n");
}

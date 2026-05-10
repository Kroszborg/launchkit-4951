import { Hono } from 'hono';
import { cors } from "hono/cors";
import { generateText } from "ai";
import { gateway } from "./agent/gateway";
import dedent from "dedent";

const app = new Hono()
  .basePath('api')
  .use(cors({ origin: (origin) => origin ?? "*", credentials: true }))
  .get('/health', (c) => c.json({ status: 'ok' }, 200))

  // Fetch GitHub repo metadata
  .post('/fetch-repo', async (c) => {
    const { url } = await c.req.json();
    const match = url.match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
    if (!match) return c.json({ error: 'Invalid GitHub URL' }, 400);
    const [, owner, repo] = match;
    try {
      const [repoRes, readmeRes] = await Promise.all([
        fetch(`https://api.github.com/repos/${owner}/${repo}`, {
          headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'LaunchKit' }
        }),
        fetch(`https://api.github.com/repos/${owner}/${repo}/readme`, {
          headers: { Accept: 'application/vnd.github.v3+json', 'User-Agent': 'LaunchKit' }
        })
      ]);
      const repoData = repoRes.ok ? await repoRes.json() : null;
      let readmeText = '';
      if (readmeRes.ok) {
        const rd = await readmeRes.json();
        readmeText = Buffer.from(rd.content, 'base64').toString('utf-8').slice(0, 3000);
      }
      return c.json({
        name: repoData?.name || repo,
        description: repoData?.description || '',
        stars: repoData?.stargazers_count || 0,
        language: repoData?.language || '',
        topics: repoData?.topics || [],
        readme: readmeText,
        owner,
        repo,
      }, 200);
    } catch {
      return c.json({ error: 'Failed to fetch repo' }, 500);
    }
  })

  // Generate copy + full landing page HTML
  .post('/generate', async (c) => {
    const { description, repoMeta } = await c.req.json();

    const context = repoMeta
      ? dedent`
          Product name: ${repoMeta.name}
          Description: ${repoMeta.description || description}
          Language: ${repoMeta.language}
          Topics: ${repoMeta.topics?.join(', ')}
          README excerpt: ${repoMeta.readme?.slice(0, 2000)}
        `
      : `Product description: ${description}`;

    const systemPrompt = dedent`
      You are a world-class product launch copywriter.
      Given product info, generate sharp launch copy. Write like a senior PM — clear, confident, no fluff. No em-dashes.

      Respond ONLY with valid JSON. Nothing else — no markdown, no explanation, just the JSON object.
      {
        "name": "Product name (short, clean)",
        "pitch": "One killer sentence. Max 15 words. Memorable.",
        "tagline": "4-6 word punchy tagline",
        "headline": "Bold landing page headline. Max 10 words. Verb-first.",
        "subheadline": "2 sentences. What it does + why it matters.",
        "features": [
          { "num": "01", "title": "Short title", "desc": "One sentence benefit." },
          { "num": "02", "title": "Short title", "desc": "One sentence benefit." },
          { "num": "03", "title": "Short title", "desc": "One sentence benefit." }
        ],
        "steps": [
          { "num": "1", "title": "Short action title", "desc": "One sentence." },
          { "num": "2", "title": "Short action title", "desc": "One sentence." },
          { "num": "3", "title": "Short action title", "desc": "One sentence." }
        ],
        "cta": "Action CTA button text. 2-4 words.",
        "ctaUrl": "https://github.com",
        "twitter": "Twitter/X launch post. Hook first line, then 3-4 short lines. Max 280 chars. No hashtags.",
        "linkedin": "LinkedIn launch post. Professional but human. 4-6 short paragraphs. Include CTA.",
        "producthunt": "Product Hunt tagline. Max 60 chars. No exclamation marks."
      }
    `;

    try {
      const copyResult = await generateText({
        model: gateway("openai/gpt-4o-mini"),
        system: systemPrompt,
        prompt: context,
        temperature: 0.8,
      });

      const jsonMatch = copyResult.text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) return c.json({ error: 'Failed to parse copy' }, 500);
      const copyData = JSON.parse(jsonMatch[0]);

      // Build the landing page from a beautiful hardcoded template — AI fills content only
      const landingCode = buildLandingTemplate(copyData);

      return c.json({ copy: copyData, landingCode }, 200);
    } catch (err) {
      console.error('Generate error:', err);
      return c.json({ error: 'Generation failed. Check AI gateway keys.' }, 500);
    }
  })

  // Create GitHub repo and push landing page
  .post('/github-create', async (c) => {
    const { token, repoName, description, landingCode, productName } = await c.req.json();

    if (!token || !repoName) return c.json({ error: 'Token and repo name required' }, 400);

    try {
      // 1. Create repo
      const createRes = await fetch('https://api.github.com/user/repos', {
        method: 'POST',
        headers: {
          Authorization: `token ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'LaunchKit',
        },
        body: JSON.stringify({
          name: repoName,
          description: description || `Landing page for ${productName}`,
          private: false,
          auto_init: false,
        }),
      });

      if (!createRes.ok) {
        const err = await createRes.json();
        return c.json({ error: err.message || 'Failed to create repo' }, 400);
      }

      const repoData = await createRes.json();
      const { full_name, html_url } = repoData;

      // 2. Build file contents
      const indexHtml = buildIndexHtml(productName, landingCode);
      const packageJson = buildPackageJson(productName, description);
      const readmeContent = buildReadme(productName, description);

      // 3. Push files via GitHub Contents API
      const files = [
        { path: 'src/LandingPage.jsx', content: landingCode },
        { path: 'src/index.jsx', content: buildIndexJsx() },
        { path: 'index.html', content: indexHtml },
        { path: 'package.json', content: packageJson },
        { path: 'README.md', content: readmeContent },
        { path: 'tailwind.config.js', content: buildTailwindConfig() },
        { path: 'vite.config.js', content: buildViteConfig() },
        { path: '.gitignore', content: 'node_modules\ndist\n.env' },
      ];

      for (const file of files) {
        await fetch(`https://api.github.com/repos/${full_name}/contents/${file.path}`, {
          method: 'PUT',
          headers: {
            Authorization: `token ${token}`,
            Accept: 'application/vnd.github.v3+json',
            'Content-Type': 'application/json',
            'User-Agent': 'LaunchKit',
          },
          body: JSON.stringify({
            message: `Add ${file.path}`,
            content: Buffer.from(file.content).toString('base64'),
          }),
        });
      }

      return c.json({
        repoUrl: html_url,
        fullName: full_name,
        vercelUrl: `https://vercel.com/new/clone?repository-url=https://github.com/${full_name}&project-name=${repoName}&framework=vite`,
        netlifyUrl: `https://app.netlify.com/start/deploy?repository=https://github.com/${full_name}`,
        pagesUrl: `https://github.com/${full_name}/settings/pages`,
      }, 200);
    } catch (err) {
      console.error('GitHub create error:', err);
      return c.json({ error: 'Failed to create GitHub repo' }, 500);
    }
  });

// ─── Landing Page Template ────────────────────────────────────────────────────

function esc(s: unknown): string {
  return String(s || '').replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\r?\n/g, ' ');
}

function buildLandingTemplate(d: any): string {
  const name        = esc(d.name        || 'Product');
  const headline    = esc(d.headline    || 'Build something great');
  const subheadline = esc(d.subheadline || '');
  const tagline     = esc(d.tagline     || '');
  const cta         = esc(d.cta         || 'Get Started');
  const ctaUrl      = esc(d.ctaUrl      || 'https://github.com');

  const rawFeatures = ((d.features || []) as any[]).slice(0, 3);
  while (rawFeatures.length < 3) rawFeatures.push({ num: `0${rawFeatures.length + 1}`, title: 'Feature', desc: 'More details coming soon.' });
  const features = rawFeatures.map((f: any) => ({ num: esc(f.num || '01'), title: esc(f.title || ''), desc: esc(f.desc || '') }));

  const rawSteps = ((d.steps || []) as any[]).slice(0, 3);
  while (rawSteps.length < 3) rawSteps.push({ num: `${rawSteps.length + 1}`, title: 'Step', desc: 'Coming soon.' });
  const steps = rawSteps.map((s: any) => ({ num: esc(s.num || '1'), title: esc(s.title || ''), desc: esc(s.desc || '') }));

  // Split headline into two halves for the split italic effect
  const words = headline.split(' ');
  const mid = Math.ceil(words.length / 2);
  const headline1 = words.slice(0, mid).join(' ');
  const headline2 = words.slice(mid).join(' ');

  const featuresJson = JSON.stringify(features);
  const stepsJson    = JSON.stringify(steps);

  const lines: string[] = [];

  lines.push('const LandingPage = () => {');
  lines.push('  const SERIF = "\'Playfair Display\', Georgia, serif";');
  lines.push('  const MONO  = "\'DM Mono\', \'Courier New\', monospace";');
  lines.push('  const FG    = "#e8e0d0";');
  lines.push('  const MUTED = "#6b6b6b";');
  lines.push('  const DIM   = "#2a2a2a";');
  lines.push('  const BG    = "#0a0a0a";');
  lines.push('  const SURF  = "#0f0f0f";');
  lines.push('  const GOLD  = "#c9a96e";');
  lines.push('');
  lines.push('  const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: "smooth" }); };');
  lines.push('');
  lines.push('  const features = ' + featuresJson + ';');
  lines.push('  const steps    = ' + stepsJson + ';');
  lines.push('');
  lines.push('  return (');
  lines.push('    <div style={{ background: BG, color: FG, fontFamily: MONO, minHeight: "100vh", overflowX: "hidden" }}>');
  lines.push('');
  lines.push('      {/* NAV */}');
  lines.push('      <nav style={{');
  lines.push('        position: "sticky", top: 0, zIndex: 50,');
  lines.push('        background: "rgba(10,10,10,0.92)", backdropFilter: "blur(12px)",');
  lines.push('        borderBottom: `1px solid ${DIM}`, padding: "0 48px", height: 64,');
  lines.push('        display: "flex", alignItems: "center", justifyContent: "space-between"');
  lines.push('      }}>');
  lines.push('        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>');
  lines.push('          <div style={{ width: 8, height: 8, background: GOLD, borderRadius: "50%" }} />');
  lines.push('          <span style={{ fontFamily: SERIF, fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em" }}>');
  lines.push('            ' + JSON.stringify(name));
  lines.push('          </span>');
  lines.push('        </div>');
  lines.push('        <div style={{ display: "flex", alignItems: "center", gap: 40 }}>');
  lines.push('          <span onClick={() => scrollTo("features")} style={{ color: MUTED, fontSize: 12, cursor: "pointer", letterSpacing: "0.04em" }}>Features</span>');
  lines.push('          <span onClick={() => scrollTo("how")} style={{ color: MUTED, fontSize: 12, cursor: "pointer", letterSpacing: "0.04em" }}>How it works</span>');
  lines.push('          <button onClick={() => window.open(' + JSON.stringify(ctaUrl) + ', "_blank")} style={{');
  lines.push('            background: FG, color: BG, border: "none", cursor: "pointer",');
  lines.push('            padding: "9px 22px", fontSize: 12, fontFamily: MONO, fontWeight: 600, letterSpacing: "0.04em"');
  lines.push('          }}>');
  lines.push('            ' + JSON.stringify(cta));
  lines.push('          </button>');
  lines.push('        </div>');
  lines.push('      </nav>');
  lines.push('');
  lines.push('      {/* HERO */}');
  lines.push('      <section style={{ position: "relative", overflow: "hidden" }}>');
  lines.push('        {/* Grid bg */}');
  lines.push('        <div style={{');
  lines.push('          position: "absolute", inset: 0, zIndex: 0,');
  lines.push('          backgroundImage: "linear-gradient(rgba(42,42,42,0.25) 1px, transparent 1px), linear-gradient(90deg, rgba(42,42,42,0.25) 1px, transparent 1px)",');
  lines.push('          backgroundSize: "64px 64px",');
  lines.push('          WebkitMaskImage: "linear-gradient(to bottom, transparent, black 20%, black 60%, transparent)",');
  lines.push('          maskImage: "linear-gradient(to bottom, transparent, black 20%, black 60%, transparent)"');
  lines.push('        }} />');
  lines.push('        {/* Glow */}');
  lines.push('        <div style={{');
  lines.push('          position: "absolute", top: -200, left: "50%", transform: "translateX(-50%)",');
  lines.push('          width: 700, height: 700, borderRadius: "50%",');
  lines.push('          background: "radial-gradient(circle, rgba(201,169,110,0.06) 0%, transparent 70%)", zIndex: 0');
  lines.push('        }} />');
  lines.push('        <div style={{ position: "relative", zIndex: 1, maxWidth: 1100, margin: "0 auto", padding: "140px 48px 120px" }}>');
  lines.push('          {/* Eyebrow */}');
  lines.push('          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 44 }}>');
  lines.push('            <div style={{ width: 32, height: 1, background: GOLD }} />');
  lines.push('            <span style={{ color: GOLD, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", fontWeight: 500 }}>');
  lines.push('              ' + JSON.stringify(tagline));
  lines.push('            </span>');
  lines.push('          </div>');
  lines.push('          {/* Headline split */}');
  lines.push('          <h1 style={{');
  lines.push('            fontFamily: SERIF, fontWeight: 700, lineHeight: 1.0,');
  lines.push('            fontSize: "clamp(3.2rem, 6.5vw, 7rem)", letterSpacing: "-0.04em",');
  lines.push('            margin: "0 0 8px 0", maxWidth: 880');
  lines.push('          }}>');
  lines.push('            ' + JSON.stringify(headline1));
  lines.push('          </h1>');
  lines.push('          <h1 style={{');
  lines.push('            fontFamily: SERIF, fontWeight: 700, fontStyle: "italic", lineHeight: 1.0,');
  lines.push('            fontSize: "clamp(3.2rem, 6.5vw, 7rem)", letterSpacing: "-0.04em",');
  lines.push('            margin: "0 0 48px 0", maxWidth: 880, color: "#c8bfaf"');
  lines.push('          }}>');
  lines.push('            ' + JSON.stringify(headline2));
  lines.push('          </h1>');
  lines.push('          {/* Sub + CTA row */}');
  lines.push('          <div style={{ display: "flex", alignItems: "flex-end", gap: 80, flexWrap: "wrap" }}>');
  lines.push('            <p style={{ color: MUTED, fontSize: 15, lineHeight: 1.8, maxWidth: 420, margin: 0 }}>');
  lines.push('              ' + JSON.stringify(subheadline));
  lines.push('            </p>');
  lines.push('            <div style={{ display: "flex", flexDirection: "column", gap: 12, flexShrink: 0 }}>');
  lines.push('              <button onClick={() => window.open(' + JSON.stringify(ctaUrl) + ', "_blank")} style={{');
  lines.push('                background: FG, color: BG, border: "none", cursor: "pointer",');
  lines.push('                padding: "16px 40px", fontSize: 13, fontFamily: MONO, fontWeight: 600,');
  lines.push('                letterSpacing: "0.06em", whiteSpace: "nowrap"');
  lines.push('              }}>');
  lines.push('                {' + JSON.stringify(cta + ' \u2192') + '}');
  lines.push('              </button>');
  lines.push('              <span style={{ color: MUTED, fontSize: 11, textAlign: "center", letterSpacing: "0.04em" }}>');
  lines.push('                Free to use. No account needed.');
  lines.push('              </span>');
  lines.push('            </div>');
  lines.push('          </div>');
  lines.push('        </div>');
  lines.push('        {/* Scroll hint */}');
  lines.push('        <div style={{ borderTop: `1px solid ${DIM}` }}>');
  lines.push('          <div style={{ maxWidth: 1100, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 48px" }}>');
  lines.push('            <span style={{ color: MUTED, fontSize: 11, letterSpacing: "0.12em" }}>SCROLL TO EXPLORE</span>');
  lines.push('            <span style={{ color: DIM, fontSize: 11 }}>\u2193</span>');
  lines.push('          </div>');
  lines.push('        </div>');
  lines.push('      </section>');
  lines.push('');
  lines.push('      {/* FEATURES */}');
  lines.push('      <section id="features" style={{ background: SURF }}>');
  lines.push('        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 48px" }}>');
  lines.push('          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 56 }}>');
  lines.push('            <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>What you get</p>');
  lines.push('            <span style={{ color: DIM, fontSize: 11 }}>03 features</span>');
  lines.push('          </div>');
  lines.push('          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>');
  lines.push('            {features.map((f, i) => (');
  lines.push('              <div key={i} style={{');
  lines.push('                padding: "40px 36px 44px",');
  lines.push('                borderTop: `1px solid ${DIM}`, borderBottom: `1px solid ${DIM}`,');
  lines.push('                borderLeft: `1px solid ${DIM}`,');
  lines.push('                borderRight: i === 2 ? `1px solid ${DIM}` : "none",');
  lines.push('                position: "relative"');
  lines.push('              }}>');
  lines.push('                <div style={{');
  lines.push('                  fontFamily: SERIF, fontSize: 80, fontWeight: 700,');
  lines.push('                  color: "rgba(42,42,42,0.6)", position: "absolute",');
  lines.push('                  top: 16, right: 20, lineHeight: 1, userSelect: "none"');
  lines.push('                }}>{f.num}</div>');
  lines.push('                <div style={{ width: 28, height: 2, background: GOLD, marginBottom: 28 }} />');
  lines.push('                <h3 style={{ fontFamily: SERIF, fontSize: 21, fontWeight: 600, marginBottom: 14, lineHeight: 1.2, maxWidth: 200 }}>{f.title}</h3>');
  lines.push('                <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.75, margin: 0 }}>{f.desc}</p>');
  lines.push('              </div>');
  lines.push('            ))}');
  lines.push('          </div>');
  lines.push('        </div>');
  lines.push('      </section>');
  lines.push('');
  lines.push('      {/* HOW IT WORKS */}');
  lines.push('      <section id="how" style={{ borderTop: `1px solid ${DIM}` }}>');
  lines.push('        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "80px 48px" }}>');
  lines.push('          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 64 }}>');
  lines.push('            <p style={{ color: MUTED, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.2em", margin: 0 }}>How it works</p>');
  lines.push('          </div>');
  lines.push('          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 48 }}>');
  lines.push('            {steps.map((s, i) => (');
  lines.push('              <div key={i} style={{ display: "flex", flexDirection: "column" }}>');
  lines.push('                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 28 }}>');
  lines.push('                  <div style={{');
  lines.push('                    width: 40, height: 40, border: `1px solid ${DIM}`,');
  lines.push('                    display: "flex", alignItems: "center", justifyContent: "center",');
  lines.push('                    fontFamily: SERIF, fontSize: 16, color: GOLD, flexShrink: 0');
  lines.push('                  }}>{s.num}</div>');
  lines.push('                  {i < 2 && <div style={{ flex: 1, height: 1, background: `linear-gradient(90deg, ${DIM}, transparent)` }} />}');
  lines.push('                </div>');
  lines.push('                <h4 style={{ fontFamily: SERIF, fontSize: 19, fontWeight: 600, marginBottom: 12, lineHeight: 1.2 }}>{s.title}</h4>');
  lines.push('                <p style={{ color: MUTED, fontSize: 13, lineHeight: 1.75, margin: 0 }}>{s.desc}</p>');
  lines.push('              </div>');
  lines.push('            ))}');
  lines.push('          </div>');
  lines.push('        </div>');
  lines.push('      </section>');
  lines.push('');
  lines.push('      {/* CTA BAND */}');
  lines.push('      <section style={{');
  lines.push('        borderTop: `1px solid ${DIM}`,');
  lines.push('        background: "linear-gradient(135deg, #0f0e0c 0%, #0a0a0a 50%, #0d0c0a 100%)",');
  lines.push('        position: "relative", overflow: "hidden"');
  lines.push('      }}>');
  lines.push('        <div style={{');
  lines.push('          position: "absolute", top: -100, right: -100, width: 400, height: 400, borderRadius: "50%",');
  lines.push('          background: "radial-gradient(circle, rgba(201,169,110,0.05) 0%, transparent 70%)"');
  lines.push('        }} />');
  lines.push('        <div style={{');
  lines.push('          maxWidth: 1100, margin: "0 auto", padding: "100px 48px",');
  lines.push('          display: "flex", alignItems: "center", justifyContent: "space-between",');
  lines.push('          gap: 48, position: "relative", zIndex: 1');
  lines.push('        }}>');
  lines.push('          <div>');
  lines.push('            <p style={{ color: GOLD, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20 }}>Ready to ship?</p>');
  lines.push('            <h2 style={{');
  lines.push('              fontFamily: SERIF, fontWeight: 700, lineHeight: 1.05,');
  lines.push('              fontSize: "clamp(2.2rem, 4.5vw, 4rem)", letterSpacing: "-0.03em", margin: 0, maxWidth: 560');
  lines.push('            }}>');
  lines.push('              Stop waiting.<br/>');
  lines.push('              <em style={{ fontStyle: "italic", color: "#c8bfaf" }}>Start launching.</em>');
  lines.push('            </h2>');
  lines.push('          </div>');
  lines.push('          <div style={{ display: "flex", flexDirection: "column", gap: 14, alignItems: "flex-end", flexShrink: 0 }}>');
  lines.push('            <button onClick={() => window.open(' + JSON.stringify(ctaUrl) + ', "_blank")} style={{');
  lines.push('              background: FG, color: BG, border: "none", cursor: "pointer",');
  lines.push('              padding: "18px 48px", fontSize: 14, fontFamily: MONO, fontWeight: 600,');
  lines.push('              letterSpacing: "0.06em", whiteSpace: "nowrap"');
  lines.push('            }}>');
  lines.push('              {' + JSON.stringify(cta + ' \u2192') + '}');
  lines.push('            </button>');
  lines.push('            <span style={{ color: MUTED, fontSize: 11 }}>Free \u00b7 No signup \u00b7 Instant results</span>');
  lines.push('          </div>');
  lines.push('        </div>');
  lines.push('      </section>');
  lines.push('');
  lines.push('      {/* FOOTER */}');
  lines.push('      <footer style={{ borderTop: `1px solid ${DIM}`, padding: "28px 48px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>');
  lines.push('        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>');
  lines.push('          <div style={{ width: 6, height: 6, background: GOLD, borderRadius: "50%" }} />');
  lines.push('          <span style={{ fontFamily: SERIF, fontSize: 15, color: MUTED }}>' + JSON.stringify(name) + '</span>');
  lines.push('        </div>');
  lines.push('        <span style={{ color: DIM, fontSize: 11, letterSpacing: "0.08em" }}>Built with LaunchKit</span>');
  lines.push('      </footer>');
  lines.push('');
  lines.push('    </div>');
  lines.push('  );');
  lines.push('};');

  return lines.join('\n');
}

// ─── GitHub Scaffold Builders ─────────────────────────────────────────────────

function buildIndexHtml(name: string, _code: string) {
  return [
    '<!DOCTYPE html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `    <title>${name}</title>`,
    '    <link rel="preconnect" href="https://fonts.googleapis.com" />',
    '    <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Mono:wght@300;400;500&display=swap" rel="stylesheet" />',
    '  </head>',
    '  <body>',
    '    <div id="root"></div>',
    '    <script type="module" src="/src/index.jsx"></script>',
    '  </body>',
    '</html>',
  ].join('\n');
}

function buildIndexJsx() {
  return [
    "import React from 'react'",
    "import { createRoot } from 'react-dom/client'",
    "import LandingPage from './LandingPage'",
    '',
    "createRoot(document.getElementById('root')).render(<LandingPage />)",
  ].join('\n');
}

function buildPackageJson(name: string, desc: string) {
  return JSON.stringify({
    name: name.toLowerCase().replace(/\s+/g, '-'),
    version: "0.1.0",
    description: desc || name,
    scripts: { dev: "vite", build: "vite build", preview: "vite preview" },
    dependencies: { react: "^18.2.0", "react-dom": "^18.2.0" },
    devDependencies: {
      "@vitejs/plugin-react": "^4.0.0",
      "tailwindcss": "^3.4.0",
      "autoprefixer": "^10.4.0",
      "vite": "^5.0.0",
    },
  }, null, 2);
}

function buildReadme(name: string, desc: string) {
  return [
    `# ${name}`,
    '',
    desc || 'A beautiful landing page generated by LaunchKit.',
    '',
    '## Getting Started',
    '',
    '```bash',
    'npm install',
    'npm run dev',
    '```',
    '',
    '## Deploy',
    '',
    '- **Vercel**: Import this repo at vercel.com/new',
    '- **Netlify**: Import this repo at app.netlify.com/start',
    '- **GitHub Pages**: Enable in repo Settings > Pages',
    '',
    '---',
    '',
    '*Generated with [LaunchKit](https://launchkit.runable.app)*',
  ].join('\n');
}

function buildTailwindConfig() {
  return [
    '/** @type {import(\'tailwindcss\').Config} */',
    'export default {',
    "  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],",
    '  theme: { extend: {} },',
    '  plugins: [],',
    '}',
  ].join('\n');
}

function buildViteConfig() {
  return [
    "import { defineConfig } from 'vite'",
    "import react from '@vitejs/plugin-react'",
    '',
    'export default defineConfig({',
    '  plugins: [react()],',
    '})',
  ].join('\n');
}

export type AppType = typeof app;
export default app;

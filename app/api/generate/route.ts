import { generateObject } from "ai";
import { google } from "@/lib/ai";
import { CopySchema } from "@/lib/schemas";
import { buildLandingTemplate } from "@/lib/landing-template";
import dedent from "dedent";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { description, repoMeta, tone = "startup" } = await request.json();

  const repoUrl = repoMeta?.repoUrl || null;

  const context = repoMeta
    ? dedent`
        === PRODUCT INFORMATION (use ONLY these details — do not invent or assume anything) ===

        Product name: ${repoMeta.name}
        GitHub URL: ${repoMeta.repoUrl}
        GitHub description: ${repoMeta.description || "(none)"}
        Primary language: ${repoMeta.language || "(unknown)"}
        Topics/tags: ${repoMeta.topics?.join(", ") || "(none)"}
        Stars: ${repoMeta.stars}
        ${repoMeta.packageInfo ? `\nPackage info:\n${repoMeta.packageInfo}` : ""}

        README (full content — this is your primary source of truth):
        ---
        ${repoMeta.readme || "(no README found)"}
        ---
      `
    : `Product description: ${description}`;

  const toneGuide: Record<string, string> = {
    startup:    "Write like a founder shipping their first product — conversational, punchy, direct. No corporate speak.",
    technical:  "Write for developers and engineers. Be precise and specific. Mention real technical capabilities. Avoid vague marketing adjectives.",
    enterprise: "Write for enterprise buyers. Professional, ROI-focused, trust-building. Emphasise reliability, scale, and measurable outcomes.",
  };

  const systemPrompt = dedent`
    You are a world-class product launch copywriter. ${toneGuide[tone] || toneGuide.startup}
    No em-dashes. No fluffy adjectives. No vague promises.

    CRITICAL: Base ALL copy strictly on the product information provided. Every claim, feature, and
    benefit must come directly from the README or repo metadata. Do not invent capabilities, do not
    use generic placeholder copy, do not write about things not mentioned in the context.

    TWITTER/X: Hook on line 1 — state the ONE specific thing this product does using concrete nouns
    pulled directly from the README. Then 2-4 short lines, each with a specific fact or feature from
    the README. No hashtags. No "Excited to share". HARD LIMIT: 280 chars total.
    Example: "git diff, but readable.\n\nColour-coded. Side by side. No config.\n\ngithub.com/user/difft"

    LINKEDIN: Start with the real problem this project solves (from README). Then what was built and
    the key insight. Then 2-3 specific capabilities (dash list, from actual features). Then who it's
    for and the GitHub link as CTA. 150-300 words. Double newlines between paragraphs. First person.

    PRODUCT HUNT: HARD LIMIT 60 chars. Format: [Verb] your [thing] [benefit]. No exclamation marks.
    Must describe what it actually does from the README. Example: "Turn GitHub repos into landing pages instantly"
  `;

  // Always lock ctaUrl to the real GitHub URL when available
  const overrideCtaUrl = repoUrl;

  try {
    const { object: copyData } = await generateObject({
      model: google("gemini-2.0-flash"),
      schema: CopySchema,
      system: systemPrompt,
      prompt: context,
      temperature: 0.8,
      maxRetries: 2,
    });

    // Always use the real GitHub URL, not whatever the AI guessed
    if (overrideCtaUrl) copyData.ctaUrl = overrideCtaUrl;

    // Hard-enforce character limits as a final safety net
    if (copyData.twitter.length > 280)     copyData.twitter     = copyData.twitter.slice(0, 277) + "...";
    if (copyData.producthunt.length > 60)  copyData.producthunt = copyData.producthunt.slice(0, 60);

    const landingCode = buildLandingTemplate(copyData);

    return Response.json({ copy: copyData, landingCode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Generate error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

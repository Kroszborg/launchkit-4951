import { generateObject } from "ai";
import { google } from "@/lib/ai";
import { CopySchema } from "@/lib/schemas";
import { buildLandingTemplate } from "@/lib/landing-template";
import dedent from "dedent";

export const maxDuration = 60;

export async function POST(request: Request) {
  const { description, repoMeta } = await request.json();

  const context = repoMeta
    ? dedent`
        Product name: ${repoMeta.name}
        Description: ${repoMeta.description || description}
        Language: ${repoMeta.language}
        Topics: ${repoMeta.topics?.join(", ")}
        README excerpt: ${repoMeta.readme?.slice(0, 2000)}
      `
    : `Product description: ${description}`;

  const systemPrompt = dedent`
    You are a world-class product launch copywriter. Write like a senior PM who ships.
    No em-dashes. No fluffy adjectives. No vague promises. Use the actual product details provided.

    TWITTER/X: Hook on line 1 — state the ONE specific thing this product does using concrete nouns.
    Then 2-4 short lines, each adding a specific fact or capability. No hashtags. No filler openers.
    HARD LIMIT: 280 characters total. Count carefully.
    Example: "git diff, but readable.\n\nColour-coded. Side by side. No config.\n\ngithub.com/user/difft"

    LINKEDIN: Start with the problem (1-2 sentences). Then what you built and the key insight.
    Then 2-3 specific things it does (dash list). Then who it's for and how to access it.
    Close with a real CTA. 150-300 words. Double newlines between paragraphs. First person.

    PRODUCT HUNT: HARD LIMIT 60 chars. Format: [Verb] your [thing] [benefit]. No exclamation marks.
    Example: "Turn GitHub repos into landing pages instantly"
  `;

  try {
    const { object: copyData } = await generateObject({
      model: google("gemini-2.5-flash"),
      schema: CopySchema,
      system: systemPrompt,
      prompt: context,
      temperature: 0.8,
      maxRetries: 2,
    });

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

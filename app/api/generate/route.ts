import { generateText } from "ai";
import { google } from "@/lib/ai";
import { CopySchema } from "@/lib/schemas";
import { buildLandingTemplate } from "@/lib/landing-template";
import dedent from "dedent";
import { z } from "zod";

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

    ════ TWITTER/X RULES ════
    - HARD LIMIT: 280 characters total including line breaks. Count carefully before responding.
    - Line 1: A hook that states the ONE specific thing this product does. Use concrete nouns. Not "I built a tool" — write what the tool actually does.
    - Lines 2-4: 2-4 short punchy lines. Each adds one specific fact, capability, or benefit from the README/description.
    - No hashtags. No "Excited to share". No "Introducing". No filler.
    - Example for a CLI diff tool: "git diff, but readable.\\n\\nColour-coded. Side by side. No config.\\n\\ngithub.com/user/difft"

    ════ LINKEDIN RULES ════
    - 150-300 words. Professional but direct. No "Thrilled to announce" openers.
    - Paragraph 1: State the problem you solved in 1-2 sentences using specifics from the product.
    - Paragraph 2: What you built and the one key insight behind it.
    - Paragraph 3: 2-3 specific things it does (use dashes for a short list).
    - Paragraph 4: Who it's for and how to access/try it.
    - Close with a real CTA. Use \\n\\n between paragraphs. Write in first person.

    ════ PRODUCT HUNT TAGLINE RULES ════
    - HARD LIMIT: 60 characters total. Count carefully before responding.
    - Format: [Verb] your [thing] [benefit/differentiation]
    - No exclamation marks. No "the best". No "powered by AI" unless AI is the actual differentiator.
    - Must be instantly understandable with zero context.
    - Example: "Turn GitHub repos into landing pages instantly"

    Respond ONLY with valid JSON. Nothing else — no markdown fences, no explanation, just the raw JSON object.

    {
      "name": "Product name (short, clean — use the real name from the input)",
      "pitch": "One killer sentence. Max 15 words. Concrete verb. No filler.",
      "tagline": "4-6 word punchy tagline — different from pitch",
      "headline": "Bold landing page headline. Max 10 words. Verb-first.",
      "subheadline": "2 sentences. Sentence 1: what it does. Sentence 2: who benefits or why it matters.",
      "features": [
        { "num": "01", "title": "Actual feature name", "desc": "One sentence benefit. Concrete, not vague." },
        { "num": "02", "title": "Actual feature name", "desc": "One sentence benefit." },
        { "num": "03", "title": "Actual feature name", "desc": "One sentence benefit." }
      ],
      "steps": [
        { "num": "1", "title": "Short action title", "desc": "One sentence. Active voice." },
        { "num": "2", "title": "Short action title", "desc": "One sentence." },
        { "num": "3", "title": "Short action title", "desc": "One sentence." }
      ],
      "cta": "Action CTA button text. 2-4 words.",
      "ctaUrl": "https://github.com",
      "twitter": "MUST be 280 chars or fewer. Use \\n for line breaks.",
      "linkedin": "150-300 words. Use \\n\\n between paragraphs.",
      "producthunt": "MUST be 60 chars or fewer. No exclamation marks."
    }
  `;

  try {
    const copyResult = await generateText({
      model: google("gemini-2.5-flash"),
      system: systemPrompt,
      prompt: context,
      temperature: 0.8,
      maxRetries: 1,
    });

    const jsonMatch = copyResult.text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("AI returned no JSON. Raw:", copyResult.text.slice(0, 500));
      return Response.json({ error: "Failed to parse copy" }, { status: 500 });
    }

    let parsedCopy: unknown;
    try {
      parsedCopy = JSON.parse(jsonMatch[0]);
    } catch (parseErr) {
      console.error("JSON.parse failed:", parseErr);
      return Response.json({ error: "Malformed AI response" }, { status: 500 });
    }

    const validated = CopySchema.safeParse(parsedCopy);
    if (!validated.success) {
      console.error("Schema validation issues:", validated.error.issues);
    }

    const copyData = parsedCopy as z.infer<typeof CopySchema>;

    if (copyData.twitter?.length > 280) copyData.twitter = copyData.twitter.slice(0, 277) + "...";
    if (copyData.producthunt?.length > 60) copyData.producthunt = copyData.producthunt.slice(0, 60);

    const landingCode = buildLandingTemplate(copyData);

    return Response.json({ copy: copyData, landingCode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Generate error:", msg);
    return Response.json({ error: msg }, { status: 500 });
  }
}

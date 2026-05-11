import { z } from "zod";

export const FeatureSchema = z.object({
  num:   z.string().describe("Feature number: '01', '02', '03'"),
  title: z.string().describe("Short, concrete feature name — not vague"),
  desc:  z.string().describe("One sentence benefit. Specific, not fluffy."),
});

export const StepSchema = z.object({
  num:   z.string().describe("Step number: '1', '2', '3'"),
  title: z.string().describe("Short action title, active voice"),
  desc:  z.string().describe("One sentence describing this step"),
});

export const CopySchema = z.object({
  name:        z.string().describe("Product name — short and clean, use the real name from input"),
  pitch:       z.string().describe("One killer sentence. Max 15 words. Concrete verb. No filler words."),
  tagline:     z.string().describe("4-6 word punchy tagline — different from pitch"),
  headline:    z.string().describe("Bold landing page headline. Max 10 words. Verb-first."),
  subheadline: z.string().describe("2 sentences: sentence 1 = what it does, sentence 2 = who benefits or why it matters"),
  features:    z.array(FeatureSchema).min(3).max(3).describe("Exactly 3 features using real capabilities from the product"),
  steps:       z.array(StepSchema).min(3).max(3).describe("Exactly 3 how-it-works steps"),
  cta:         z.string().describe("CTA button text. 2-4 words. Action verb first."),
  ctaUrl:      z.string().describe("URL for the CTA — use the GitHub URL if available, else https://github.com"),
  twitter:     z.string().describe("Twitter/X post. Hook on line 1. Then 2-4 short specific lines. HARD LIMIT: 280 chars including newlines. No hashtags."),
  linkedin:    z.string().describe("LinkedIn post. 150-300 words. Problem → what you built → 2-3 specifics → CTA. Use \\n\\n between paragraphs. First person."),
  producthunt: z.string().describe("Product Hunt tagline. HARD LIMIT: 60 chars. No exclamation marks. Format: [Verb] your [thing] [benefit]."),
});

export type CopyData = z.infer<typeof CopySchema>;

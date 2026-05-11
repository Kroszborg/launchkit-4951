import { z } from "zod";

export const FeatureSchema = z.object({
  num: z.string(),
  title: z.string(),
  desc: z.string(),
});

export const StepSchema = z.object({
  num: z.string(),
  title: z.string(),
  desc: z.string(),
});

export const CopySchema = z.object({
  name: z.string(),
  pitch: z.string(),
  tagline: z.string(),
  headline: z.string(),
  subheadline: z.string(),
  features: z.array(FeatureSchema).min(1),
  steps: z.array(StepSchema).min(1),
  cta: z.string(),
  ctaUrl: z.string(),
  twitter: z.string(),
  linkedin: z.string(),
  producthunt: z.string(),
});

export type CopyData = z.infer<typeof CopySchema>;

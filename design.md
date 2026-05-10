# LaunchKit — Design Direction

## Vibe
Editorial. Dark. High-contrast. Feels like a premium dev tool — not another AI wrapper with purple gradients. Inspired by high-end editorial print design applied to a web product.

## Colors
- Background: `#0a0a0a` (near-black)
- Surface: `#111111`, `#161616`
- Border: `#2a2a2a` (thin 1px lines, no rounded fluff)
- Accent: `#e8e0d0` (warm off-white — primary text, highlights)
- Muted text: `#6b6b6b`
- Subtle text: `#3a3a3a`
- NO purple, NO blue gradients, NO neon

## Typography
- Display / Headings: `Playfair Display` (serif — editorial, authoritative)
- Body / UI / Code: `DM Mono` (monospace — precise, dev-native)
- Scale: aggressive size contrast between headline and body
- Letter spacing: tight on large headings (-0.02em), normal on body

## Texture & Depth
- Subtle grain/noise texture overlay on backgrounds (SVG or CSS filter)
- No box shadows — use borders instead
- Thin separator lines over card borders
- Occasional large low-opacity number or letter as background decoration

## Layout
- Max width: 1100px, centered
- Generous whitespace
- Asymmetric sections — not symmetrical card grids
- Left-aligned editorial blocks

## Motion
- Page load: staggered fade+translate-up reveals (0.1s stagger)
- Generated output: typewriter/streaming text effect
- Hover: subtle brightness shift, no scale transforms

## Components
- Buttons: flat, outlined with `#2a2a2a` border, `#e8e0d0` text — no rounded pill shapes
- Inputs: dark bg `#111`, `1px #2a2a2a` border, no glow on focus — just border color change to `#e8e0d0`
- Tabs: text-only with bottom border indicator
- Cards: `#111` bg, `1px #2a2a2a` border, sharp corners (2px radius max)

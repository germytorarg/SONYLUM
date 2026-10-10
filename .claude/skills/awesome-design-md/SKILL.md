---
name: awesome-design-md
description: Library of 74 DESIGN.md reference files capturing the visual systems of well-known brands (colors, typography, spacing, radii, components, motion). Use when the user asks for a UI, page, or component "in the style of", "like", or "inspired by" a known brand or product (e.g. Stripe, Linear, Apple, Vercel, Notion, Airbnb), or wants a concrete design-token starting point borrowed from a real product.
license: MIT (VoltAgent/awesome-design-md)
---

# Awesome DESIGN.md

Brand design-system references from [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md). Each file in `brands/` is a DESIGN.md with YAML tokens (colors, type scale, spacing, radii) plus prose on layout, components, and do/don't rules.

## How to use

1. Identify the brand(s) the user named. If they described a vibe instead ("dark, technical, dense"), pick 1–2 candidates from the list below and say which you chose.
2. Read `brands/<name>.md` (relative to this skill's directory). Read only the files you need.
3. Translate its tokens into the project's own system (CSS variables, Tailwind theme, etc.). Use the reference as direction, not a clone:
   - Never copy logos, brand marks, trademarked names, or proprietary copy.
   - Swap proprietary fonts for the listed fallback or a close open-source equivalent.
   - Keep the user's own brand, content, and constraints above the reference.
4. When mixing references, take structure from one and accent/typography from another, and state the mix explicitly.

## Available brands

airbnb, airtable, apple, binance, bmw-m, bmw, bugatti, cal, claude, clay, clickhouse, cohere, coinbase, composio, cursor, dell-1996, elevenlabs, expo, ferrari, figma, framer, hashicorp, hp, ibm, intercom, kraken, lamborghini, linear.app, lovable, mastercard, meta, minimax, mintlify, miro, mistral.ai, mongodb, nike, nintendo-2001, notion, nvidia, ollama, opencode.ai, pinterest, playstation, posthog, raycast, renault, replicate, resend, revolut, runwayml, sanity, sentry, shopify, slack, spacex, spotify, starbucks, stripe, supabase, superhuman, tesla, theverge, together.ai, uber, vercel, vodafone, voltagent, warp, webflow, wired, wise, x.ai, zapier

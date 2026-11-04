---
name: taste-skill
description: "Anti-slop frontend design skill for landing pages, portfolios, and redesigns. Ships opinionated, non-templated visual direction (typography, color, layout, motion) and a strict pre-flight checklist against common AI-generated-design tells. Assumes a React/Next/Tailwind/Motion/GSAP stack by default (falls back to plain HTML/CSS otherwise)."
---

# tasteskill: Anti-Slop Frontend Skill

> Landing pages, portfolios, and redesigns. Not dashboards, not data tables, not multi-step product UI.
> Every rule below is contextual. None of it fires automatically. First read the brief, then pull only what fits.
>
> Note: this skill's default stack (Section 3) is React/Next.js/Tailwind/Motion/GSAP. When the project isn't in that stack (plain HTML/CSS/vanilla JS, WordPress, etc.), apply Sections 0, 1, 2, 4, 6, 7, 9, 10, 11, 13, 14 (design judgment, AI-tell bans, pre-flight checklist) and translate the React-specific mechanics of Sections 3, 5, 12 to the actual stack in spirit (e.g. "isolate motion in a client component" -> "isolate motion-heavy JS in its own script/module"). When working on a Sonylum-family site, [[sonylum-web-style]] and [[frontend-design]] set the brand-specific direction (dark editorial, gold/burgundy/black, Cormorant Garamond) and this skill's bans/checklist still apply on top of it.

---

## 0. BRIEF INFERENCE (Read the Room Before Anything Else)

Before touching code or tweaking dials, infer what the user actually wants. Most LLM design output is bad because the model jumps to a default aesthetic instead of reading the room.

### 0.A Read these signals first
1. Page kind - landing (SaaS / consumer / agency / event), portfolio (dev / designer / creative studio), redesign (preserve vs overhaul), editorial / blog.
2. Vibe words the user used - "minimalist", "calm", "Linear-style", "Awwwards", "brutalist", "premium consumer", "Apple-y", "playful", "serious B2B", "editorial", "agency-y", "glassy", "dark tech".
3. Reference signals - URLs they linked, screenshots they pasted, products they named, brands they're competing with.
4. Audience - B2B procurement panel vs. design-conscious consumer vs. recruiter scanning a portfolio. The audience picks the aesthetic, not your taste.
5. Brand assets that already exist - logo, color, type, photography. For redesigns, these are starting material, not optional input (see Section 11).
6. Quiet constraints - accessibility-first audiences, public-sector, regulated industries, trust-first commerce, kids' products. These constraints OVERRIDE aesthetic preference.

### 0.B Output a one-line "Design Read" before generating
Before any code, state in one line: "Reading this as: <page kind> for <audience>, with a <vibe> language, leaning toward <design system or aesthetic family>."

Example reads:
- "Reading this as: B2B SaaS landing for technical buyers, with a Linear-style minimalist language, leaning toward Tailwind utilities + Geist + restrained motion."
- "Reading this as: solo designer portfolio for hiring managers, with an editorial / kinetic-type language, leaning toward native CSS + scroll-driven animation + custom typography."
- "Reading this as: redesign of a public-sector service site, with a trust-first language, leaning toward GOV.UK Frontend or USWDS."

### 0.C If the brief is ambiguous, ask one question, do not guess
Ask exactly one clarifying question - never a multi-question dump - and only when the design read genuinely diverges. Example: "Should this feel closer to Linear-clean or Awwwards-experimental?"

If you can confidently infer from context, do not ask. Just declare the design read and proceed.

### 0.D Anti-Default Discipline
Do not default to: AI-purple gradients, centered hero over dark mesh, three equal feature cards, generic glassmorphism on everything, infinite-loop micro-animations everywhere, Inter + slate-900. These are the LLM defaults. Reach past them deliberately based on the design read.

---

## 1. THE THREE DIALS (Core Configuration)

After the design read, set three dials. Every layout, motion, and density decision below is gated by these.

* DESIGN_VARIANCE: 8 - 1 = Perfect Symmetry, 10 = Artsy Chaos
* MOTION_INTENSITY: 6 - 1 = Static, 10 = Cinematic / Physics
* VISUAL_DENSITY: 4 - 1 = Art Gallery / Airy, 10 = Cockpit / Packed Data

Baseline: 8 / 6 / 4. Use these unless the design read overrides them. Do not ask the user to edit this file - overrides happen conversationally.

### 1.A Dial Inference (design read -> dial values)
| Signal | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| "minimalist / clean / calm / editorial / Linear-style" | 5-6 | 3-4 | 2-3 |
| "premium consumer / Apple-y / luxury / brand" | 7-8 | 5-7 | 3-4 |
| "playful / wild / Dribbble / Awwwards / experimental / agency" | 9-10 | 8-10 | 3-4 |
| "landing page / portfolio / marketing site (default)" | 7-9 | 6-8 | 3-5 |
| "trust-first / public-sector / regulated / accessibility-critical" | 3-4 | 2-3 | 4-5 |
| "redesign - preserve" | match existing | +1 | match existing |
| "redesign - overhaul" | +2 | +2 | match existing |

### 1.B Use-Case Presets
| Use case | VARIANCE | MOTION | DENSITY |
|---|---|---|---|
| Landing (SaaS, mainstream) | 7 | 6 | 4 |
| Landing (Agency / creative) | 9 | 8 | 3 |
| Landing (Premium consumer) | 7 | 6 | 3 |
| Portfolio (Designer / studio) | 8 | 7 | 3 |
| Portfolio (Developer) | 6 | 5 | 4 |
| Editorial / Blog | 6 | 4 | 3 |
| Public-sector service | 3 | 2 | 5 |
| Redesign - preserve | match | match+1 | match |
| Redesign - overhaul | +2 | +2 | match |

### 1.C How the Dials Drive Output
Use these (or user-overridden values) as global variables. Cross-references throughout this document refer to these exact variable names - never invent aliases like LAYOUT_VARIANCE or ANIM_LEVEL.

---

## 2. BRIEF -> DESIGN SYSTEM MAP

Once you have the design read (Section 0) and dials (Section 1), pick the right foundation. Do not invent CSS for things that have an official package. Do not pretend an aesthetic trend is an official system.

### 2.A When to reach for a real design system (use official packages)
| Brief reads as | Reach for | Why |
|---|---|---|
| Microsoft / enterprise SaaS / dashboards | @fluentui/react-components or @fluentui/web-components | Official Fluent UI, Microsoft tokens, accessibility done |
| Google-ish UI, Material-flavored product | @material/web + Material 3 tokens | Official, theme-able via Material Theming |
| IBM-style B2B / enterprise analytics | @carbon/react + @carbon/styles | Official Carbon, mature data-density patterns |
| Shopify app surfaces | polaris.js web components / Polaris React | Required for Shopify admin UI |
| Atlassian / Jira-style product | @atlaskit/* + @atlaskit/tokens | Official Atlassian DS |
| GitHub-style devtool / community page | @primer/css or @primer/react-brand | Official Primer; Brand variant for marketing |
| Public-sector UK service | govuk-frontend | Legally / regulatorily expected |
| US public-sector / trust-first | uswds | Same |
| Fast local-business / agency MVP | Bootstrap 5.3 | Boring, fast, works |
| Modern accessible React foundation | @radix-ui/themes | Primitives + polished theme |
| Modern SaaS where you own the components | shadcn/ui (npx shadcn@latest add ...) | You own the code, easy to customise; never ship default state |
| Tailwind-based modern SaaS / AI marketing | Tailwind v4 utilities + dark: variant | Default for indie + small team builds |

Honesty rule: if the brief reads as one of the systems above, install and use the official package. Do not recreate its CSS by hand. Do not import a system's tokens but then override 90% of them.

One system per project. Do not mix Fluent React with Carbon in the same tree. Do not import shadcn/ui components into a Material 3 app.

### 2.B When the brief is an aesthetic, not a system
For these directions, there is no single official package. Build with native CSS + Tailwind + a maintained component library. Be honest in code comments about what is borrowed inspiration vs. official material.

| Aesthetic | Honest implementation |
|---|---|
| Glassmorphism / "frosted glass" | backdrop-filter, layered borders, highlight overlays. Provide solid-fill fallback for prefers-reduced-transparency. |
| Bento (Apple-style tile grids) | CSS Grid with mixed cell sizes. No single library owns this. |
| Brutalism | Native CSS, monospace, raw borders. No library. |
| Editorial / magazine | Serif type, asymmetric grid, generous whitespace. No library. |
| Dark tech / hacker | Mono + accent neon, terminal motifs. No library. |
| Aurora / mesh gradients | SVG or layered radial gradients. No library. |
| Kinetic typography | Native CSS animations, scroll-driven animations, GSAP for hijacks. No library. |
| Apple Liquid Glass | Apple documents this for Apple platforms only. There is no official liquid-glass.css. Web implementations are approximations using backdrop-filter + layered borders + highlights. Label clearly as approximation. |

---

## 3. DEFAULT ARCHITECTURE & CONVENTIONS (React/Next stack - adapt in spirit for other stacks)

Unless the design read picks a real design system (Section 2.A), these are the defaults:

### 3.A Stack
* Framework: React or Next.js. Default to Server Components (RSC).
  * RSC SAFETY: Global state works ONLY in Client Components. In Next.js, wrap providers in a "use client" component.
  * INTERACTIVITY ISOLATION: Any component using Motion, scroll listeners, or pointer physics MUST be an isolated leaf with 'use client' at the top. Server Components render static layouts only.
* Styling: Tailwind v4 (default). Tailwind v3 only if the existing project demands it.
  * For v4: do NOT use tailwindcss plugin in postcss.config.js. Use @tailwindcss/postcss or the Vite plugin.
* Animation: Motion (the library formerly known as Framer Motion). Import from motion/react. The framer-motion package still works as a legacy alias - prefer motion/react in new code.
* Fonts: Always use next/font (Next.js) or self-host with @font-face + font-display: swap. Never link Google Fonts via <link> in production.

### 3.B State
* Local useState / useReducer for isolated UI.
* Global state ONLY for deep prop-drilling avoidance - Zustand, Jotai, or React context.
* NEVER use useState to track continuous values driven by user input (mouse position, scroll progress, pointer physics, magnetic hover). Use Motion's useMotionValue / useTransform / useScroll. useState re-renders the React tree on every change and collapses on mobile.

### 3.C Icons
* Allowed libraries (priority order): @phosphor-icons/react, hugeicons-react, @radix-ui/react-icons, @tabler/icons-react.
* Discouraged: lucide-react. Acceptable only when the user explicitly asks for it or the project already depends on it.
* NEVER hand-roll SVG icons. If a glyph is missing, install a second library or compose from primitives - do not draw icon paths from scratch.
* One family per project. Do not mix Phosphor with Lucide in the same component tree.
* Standardize strokeWidth globally (e.g. 1.5 or 2.0).

### 3.D Emoji Policy
Discouraged by default in code, markup, and visible text. Replace symbols with icon-library glyphs. Override: allow emojis only when the user explicitly asks for a playful / chat-style / social-native vibe - and even then use them sparingly with intent.

### 3.E Responsiveness & Layout Mechanics
* Standardize breakpoints (sm 640, md 768, lg 1024, xl 1280, 2xl 1536).
* Contain page layouts using max-w-[1400px] mx-auto or max-w-7xl.
* Viewport Stability: NEVER use h-screen for full-height Hero sections. ALWAYS use min-h-[100dvh] to prevent layout jumping on mobile (iOS Safari address bar).
* Grid over Flex-Math: NEVER use complex flexbox percentage math (w-[calc(33%-1rem)]). ALWAYS use CSS Grid (grid grid-cols-1 md:grid-cols-3 gap-6).

### 3.F Dependency Verification (mandatory)
Before importing ANY 3rd-party library, check package.json. If the package is missing, output the install command first. Never assume a library exists.

---

## 4. DESIGN ENGINEERING DIRECTIVES (Bias Correction)

LLMs default to cliches. Override these defaults proactively. Each rule has a context-aware override path.

### 4.1 Typography
* Display / Headlines: Default text-4xl md:text-6xl tracking-tighter leading-none.
* Body / Paragraphs: Default text-base text-gray-600 leading-relaxed max-w-[65ch].
* Sans font choice:
  * Discouraged as default: Inter. Pick Geist, Outfit, Cabinet Grotesk, Satoshi, or a brand-appropriate serif first.
  * Override: Inter is acceptable when the user explicitly asks for a neutral / standard / Linear-style feel, or when the brief is a public-sector / accessibility-first site.
* Pairings to know: Geist + Geist Mono, Satoshi + JetBrains Mono, Cabinet Grotesk + Inter Tight, GT America + IBM Plex Mono.
* SERIF DISCIPLINE (VERY DISCOURAGED AS DEFAULT):
  * Serif is very discouraged as the default font for any project. "It feels creative / premium / editorial" is NOT a reason to reach for serif. The agent's default mental model that "creative brief = serif" is the single most-tested AI tell in production rounds.
  * Serif is only acceptable when ONE of these is explicitly true: the brand brief literally names a serif font, OR the aesthetic family is genuinely editorial / luxury / publication / manuscript / heritage / vintage AND you can articulate why this specific serif fits this specific brand.
  * For everything else, default sans-serif display (Geist Display, ABC Diatype, Sohne Breit, Cabinet Grotesk Display, Migra Sans, GT Walsheim, Inter Display, PP Neue Montreal). Sans display fonts are not "boring" - they are the default for the same reason black is the default in fashion.
  * EMPHASIS RULE (related): When you want to emphasize a word within a headline, use italic or bold of the SAME font. Do NOT inject a random serif word into a sans headline (or vice versa). Mixed-family emphasis is amateur.
  * Specifically BANNED as defaults: Fraunces and Instrument_Serif (the two LLM-favorite display serifs).
  * If a serif is justified (rare), rotate from this pool, do NOT reuse the same serif across consecutive projects: PP Editorial New, GT Sectra Display, Cardinal Grotesque, Reckless Neue, Tiempos Headline, Recoleta, Cormorant Garamond, Playfair Display, EB Garamond, IvyPresto, Migra, Editorial Old, Saol Display, Sohne Breit Kursiv, Domaine Display, Canela, Schnyder, Tobias, NB Architekt, ITC Galliard.
  * (For a Sonylum-family brand where [[sonylum-web-style]] already names Cormorant Garamond as the brand serif, that brand override wins - the rotation rule above is for briefs with no named brand serif.)
* ITALIC DESCENDER CLEARANCE (mandatory): When italic is used in display type and the word contains a descender letter (y g j p q), leading-[1] or leading-none will clip the descender. Use leading-[1.1] minimum and add pb-1 or mb-1 reserve. Audit every italic word in display headlines before shipping.

### 4.2 Color Calibration
* Max 1 accent color. Saturation < 80% by default.
* THE LILA RULE: The "AI Purple / Blue glow" aesthetic is discouraged as a default. No automatic purple button glows, no random neon gradients. Use neutral bases (Zinc / Slate / Stone) with high-contrast singular accents.
* Override: if the brand or brief explicitly asks for purple / violet / lila, embrace it, executed with intent.
* One palette per project. Do not fluctuate between warm and cool grays within the same project.
* COLOR CONSISTENCY LOCK (mandatory): Once an accent color is chosen for a page, it is used on the WHOLE page. Pick one accent, lock it, audit every component before shipping.
* PREMIUM-CONSUMER PALETTE BAN (mandatory): For premium-consumer briefs (cookware, wellness, artisan, luxury, heritage craft, DTC home goods, etc.) the LLM default is warm beige/cream + brass/clay/oxblood/ochre + espresso/ink dark text. Banned hex families as default: backgrounds like #f5f1ea/#f7f5f1/#fbf8f1/#efeae0/#ece6db/#faf7f1/#e8dfcb; accents like #b08947/#b6553a/#9a2436/#9c6e2a/#bc7c3a/#7d5621; text like #1a1714/#1a1814/#1b1814.
  * Default alternatives (rotate, do not reuse): Cold Luxury (silver-grey + chrome + smoke), Forest (deep green + bone + amber), Black and Tan (true off-black + warm tan), Cobalt + Cream, Terracotta + Slate, Olive + Brick + Paper, Pure monochrome + single saturated pop.
  * Palette-rotation rule: if the previous premium-consumer project used the beige+brass family, this one MUST use a different family.
  * Override: the beige+brass+espresso palette is acceptable ONLY when the brand brief explicitly names those colors, or the brand identity is genuinely vintage/artisan/warm-craft and you can articulate why.

### 4.3 Layout Diversification
* ANTI-CENTER BIAS: Centered Hero / H1 sections are avoided when DESIGN_VARIANCE > 4. Force "Split Screen", "Left-aligned content / right-aligned asset", "Asymmetric white-space", or scroll-pinned structures.
* Override: centered hero is OK for editorial / manifesto / launch-announcement briefs where the message itself is the design.

### 4.4 Materiality, Shadows, Cards
* Use cards ONLY when elevation communicates real hierarchy. Otherwise group with border-t, divide-y, or negative space.
* When a shadow is used, tint it to the background hue. No pure-black drop shadows on light backgrounds.
* For VISUAL_DENSITY > 7: generic card containers are banned.
* SHAPE CONSISTENCY LOCK (mandatory): Pick ONE corner-radius scale for the page and stick to it (all-sharp, all-soft, or all-pill for interactive elements, with a documented exception rule if mixed).

### 4.5 Interactive UI States
Always implement full cycles, not just static successful state:
* Loading: Skeletal loaders matching the final layout's shape. Avoid generic circular spinners.
* Empty States: Beautifully composed; indicate how to populate.
* Error States: Clear, inline (forms), or contextual (toasts only for transient).
* Tactile Feedback: On :active, use -translate-y-[1px] or scale-[0.98] to simulate a physical push.
* BUTTON CONTRAST CHECK (mandatory, a11y): verify button text is readable against the button background. WCAG AA min (4.5:1 body, 3:1 large text 18px+). Same for ghost buttons over photographic backgrounds.
* CTA BUTTON WRAP BAN (mandatory): Button text MUST fit on one line at desktop (3 words max for primary CTAs, ideally 1-2).
* NO DUPLICATE CTA INTENT (mandatory): Two CTAs with the same intent on one page is a fail (e.g. "Get in touch" + "Contact us" + "Let's talk" = pick ONE label, use everywhere).
* FORM CONTRAST CHECK (mandatory, a11y): inputs, placeholders, focus rings, helper/error text all pass WCAG AA against the section background.

### 4.6 Data & Form Patterns
* Label ABOVE input. Helper text optional but present in markup. Error text BELOW input.
* No placeholder-as-label. Ever.

### 4.7 Layout Discipline (Hard Rules)

* Hero MUST fit in the initial viewport. Headline max 2 lines desktop, subtext max 20 words AND max 3-4 lines, CTAs visible without scroll.
* Hero font-scale discipline: plan font size and image size together. Default sensible range text-4xl md:text-5xl lg:text-6xl for most heroes; text-6xl md:text-7xl only for 3-5 word headlines.
* HERO TOP PADDING CAP (mandatory): max pt-24 (~6rem) at desktop.
* HERO STACK DISCIPLINE (max 4 text elements): eyebrow-or-brand-strip-or-neither, headline, subtext, CTAs (1 primary + max 1 secondary). Banned in hero: tiny tagline below CTAs, trust micro-strip, pricing teaser, feature bullet list, social-proof avatar row - those move below the hero.
* "Used by" / "Trusted by" logo wall belongs UNDER the hero, never inside it.
* Navigation MUST render on a single line on desktop; condense or hamburger if it doesn't fit at 1024px.
* Navigation height cap: 80px max desktop, default 64-72px.
* Bento grids MUST have rhythm, not one-sided repetition.
* BENTO CELL COUNT RULE (mandatory): exactly as many cells as content items; no empty cells.
* Section-Layout-Repetition Ban: a layout family (e.g. 3-column-image-cards) appears at most ONCE per page; an 8-section page uses at least 4 different layout families.
* ZIGZAG ALTERNATION CAP (mandatory): max 2 consecutive image+text-split sections.
* EYEBROW RESTRAINT (mandatory, #1 violated rule): max 1 eyebrow per 3 sections (hero counts as 1). Mechanical check: count uppercase-tracking labels across sections, must be <= ceil(sectionCount/3).
* SPLIT-HEADER BAN (mandatory): "left big headline + right small explainer paragraph" as a section header is banned by default; stack vertically instead unless the right column carries a real visual/interactive element.
* Bento Background Diversity (mandatory): at least 2-3 cells in a multi-cell grid need real visual variation (image, gradient, pattern, tint), not all white-on-white text cards.
* Mobile collapse must be explicit per section (declare the < 768px fallback in the same component).

### 4.8 Image & Visual Asset Strategy

Landing pages and portfolios are visual products. Text-only pages with fake-screenshot divs are slop.

Priority order for visual assets:
1. Image-generation tool first, if any is available in the environment - use it for hero photography, product shots, texture backgrounds, mood images, at the right aspect ratio.
2. Real web images second: https://picsum.photos/seed/{descriptive-seed}/{w}/{h} for placeholders, actual stock/brand URLs when provided, open-license sources if explicitly allowed.
3. Last resort: leave clearly-labeled placeholder slots and tell the user what images are needed and where.

Even minimalist sites need real images - a pure-text page is incomplete work, not minimalism.

Real company logos for social proof: use real SVG logos (Simple Icons CDN, devicon for tech logos), not plain text wordmarks. If the brand name is made up, generate a simple monogram/SVG mark instead of a text wordmark. Ensure logos render in both light and dark mode. LOGO-ONLY rule: logo wall = logos and nothing else, no category labels underneath.

Hand-rolled decorative SVGs (illustrations, logos, marks): strongly discouraged as default; icon-library icons are fine.

Div-based fake screenshots are banned - use a real screenshot, a generated image, a real component preview, or skip the preview.

Hero needs a real visual - text + gradient blob is a placeholder, not a hero.

### 4.9 Content Density

Landing pages live on the first impression. Cut ruthlessly.

* Default content shape per section: short headline (<= 8 words) + short sub-paragraph (<= 25 words) + one visual asset OR one CTA.
* No data-dump sections (20-row tables, 30-row award lists, giant pricing matrices on a marketing page). Use top highlights + "view full list", marquee/carousel, or a separate page.
* Long lists (> 5 items) need a different UI component than a bulleted <ul>: 2-column split, card grid, tabs/accordion, scroll-snap pills, carousel, or marquee.
* Spec sheets: avoid a long table with border-b on every row (the "Marrow-cookware pattern"). Use a 2-col card grid, scroll-snap pills, grouped chunks with cluster headings, or featured-vs-rest with a disclosure.
* COPY SELF-AUDIT (mandatory before ship): re-read every visible string (headlines, subheads, eyebrows, buttons, body, captions, alt text, footer, errors). Flag and rewrite anything grammatically broken, with unclear referents, that sounds like AI hallucination, or reads like an LLM trying to sound thoughtful.
* Fake-precise numbers (92%, 4.1x, 48k, 5.8mm) must come from real data or be explicitly labeled as mock - never AI-invented spec aesthetics.
* One copy register per page - don't mix technical mono, editorial prose, and marketing punch unless the brand voice calls for it.

### 4.10 Quotes & Testimonials

* Max 3 lines of quote body, never 6 - cut longer quotes.
* No em-dashes inside quote text as a design flourish (em-dash is banned everywhere, see 9.G).
* Attribution: name + role + (optionally) company, never name only.
* Real typographic quote marks, or none - never straight ASCII quotes.

### 4.11 Page Theme Lock (Light / Dark Mode Consistency)

The page has ONE theme. Sections do not invert (no light-mode section sandwiched between dark sections, or vice versa), except a single deliberate "theme switch on scroll" device once per page if the brief calls for it. Section-level background tints within the same theme family are fine; flipping theme families mid-page is broken. When using a design system with built-in theming, set the theme ONCE at the root.

---

## 5. CONTEXT-AWARE PROACTIVITY

These are tools, not defaults. Use them when the design read calls for them. None of these fire automatically.

* Liquid Glass / Glassmorphism: appropriate for premium consumer, Apple-adjacent, luxury, or media-overlay vibes; inappropriate for dashboards/public-sector/boring B2B. When used, add a 1px inner border and subtle inner shadow for physical edge refraction, with a solid-fill fallback under prefers-reduced-transparency.
* Magnetic Micro-physics: use when MOTION_INTENSITY > 5 and the brief reads premium/playful/agency; implement with Motion's useMotionValue/useTransform, never useState.
* Perpetual Micro-Interactions (Pulse, Typewriter, Float, Shimmer, Carousel): use when MOTION_INTENSITY > 5 and the section benefits from motion; not every card needs an infinite loop; use spring physics, no linear easing.
* "Motion claimed, motion shown": if MOTION_INTENSITY > 4 the page must actually move (entry transitions, scroll-reveal, hover physics at minimum); if you can't ship working motion, drop the dial and ship clean and static instead.
* MOTION MUST BE MOTIVATED (mandatory): before adding animation, ask what it communicates (hierarchy, storytelling, feedback, state transition). "It looked cool" is not a reason.
* MARQUEE MAX-ONE-PER-PAGE (mandatory).
* GSAP Sticky-Stack and Horizontal-Pan patterns: use the canonical skeletons below when scroll-stack or scroll-hijack effects are used; the most common failure is using the wrong ScrollTrigger `start` value so the pin doesn't happen at the right moment (`start: "top top"` is correct).

### 5.A Sticky-Stack - Canonical Skeleton (React/Motion/GSAP)

```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function StickyStack({ cards }: { cards: React.ReactNode[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !ref.current) return;
    const ctx = gsap.context(() => {
      const cardEls = gsap.utils.toArray<HTMLElement>(".stack-card");
      cardEls.forEach((card, i) => {
        if (i === cardEls.length - 1) return;
        ScrollTrigger.create({
          trigger: card,
          start: "top top",
          endTrigger: cardEls[cardEls.length - 1],
          end: "top top",
          pin: true,
          pinSpacing: false,
        });
        gsap.to(card, {
          scale: 0.92,
          opacity: 0.55,
          ease: "none",
          scrollTrigger: {
            trigger: cardEls[i + 1],
            start: "top bottom",
            end: "top top",
            scrub: true,
          },
        });
      });
    }, ref);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <div ref={ref} className="relative">
      {cards.map((card, i) => (
        <div key={i} className="stack-card sticky top-0 min-h-[100dvh] flex items-center justify-center">
          {card}
        </div>
      ))}
    </div>
  );
}
```

Critical points: start: "top top", pin: true, every card except the last is pinned, the scale/opacity transform is driven by the NEXT card's scroll trigger.

### 5.B Horizontal-Pan - Canonical Skeleton (React/Motion/GSAP)

```tsx
"use client";
import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useReducedMotion } from "motion/react";

gsap.registerPlugin(ScrollTrigger);

export function HorizontalPan({ children }: { children: React.ReactNode }) {
  const wrap = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (reduce || !wrap.current || !track.current) return;
    const ctx = gsap.context(() => {
      const distance = track.current!.scrollWidth - window.innerWidth;
      gsap.to(track.current, {
        x: -distance,
        ease: "none",
        scrollTrigger: {
          trigger: wrap.current,
          start: "top top",
          end: () => `+=${distance}`,
          pin: true,
          scrub: 1,
          invalidateOnRefresh: true,
        },
      });
    }, wrap);
    return () => ctx.revert();
  }, [reduce]);

  return (
    <section ref={wrap} className="relative overflow-hidden">
      <div ref={track} className="flex h-[100dvh] items-center">
        {children}
      </div>
    </section>
  );
}
```

Critical points: start: "top top", pin: true, end: "+=${distance}", scrub: 1. The wrapper is pinned, the inner track slides horizontally as the user scrolls vertically.

### 5.C Scroll-Reveal Stagger - Canonical Skeleton (lighter alternative)

For simple "items appear as they enter viewport" (no pinning), prefer Motion's whileInView over GSAP:

```tsx
"use client";
import { motion, useReducedMotion } from "motion/react";

export function RevealStagger({ items }: { items: string[] }) {
  const reduce = useReducedMotion();
  return (
    <ul className="grid gap-6">
      {items.map((item, i) => (
        <motion.li
          key={item}
          initial={reduce ? false : { opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
        >
          {item}
        </motion.li>
      ))}
    </ul>
  );
}
```

Use this for feature lists, testimonial grids, logo walls - anything that just needs "enter on scroll." Save GSAP for actual pin/scrub work.

### 5.D Forbidden Animation Patterns

* window.addEventListener("scroll", ...) is banned - jank-prone, no batching. Use Motion's useScroll(), GSAP's ScrollTrigger, IntersectionObserver, or CSS scroll-driven animations.
* Custom scroll progress calculations using window.scrollY in React state - same reason.
* requestAnimationFrame loops that touch React state - use motion values instead.
* Layout Transitions: use Motion's layout/layoutId props for visible state changes; don't wrap static content in layout props "for safety."
* Staggered Orchestration: use staggerChildren (Motion) or CSS cascade for reveal moments where sequence matters.

---

## 6. PERFORMANCE & ACCESSIBILITY GUARDRAILS

### 6.A Hardware Acceleration
* Animate ONLY transform and opacity. Never animate top, left, width, height.
* Use will-change: transform sparingly.

### 6.B Reduced Motion (mandatory)
* Any motion above MOTION_INTENSITY > 3 MUST honor prefers-reduced-motion. Non-negotiable.
* In Motion: wrap with useReducedMotion() and degrade to static. In CSS: gate under @media (prefers-reduced-motion: no-preference) or provide a reduce override.
* Infinite loops, parallax, scroll-hijack, magnetic physics MUST collapse to static/instant under reduced motion.

### 6.C Dark Mode (mandatory for any consumer-facing page)
* Design for both modes from the start. Never ship light-only or dark-only without explicit instruction.
* Use Tailwind dark: variant OR CSS variables for tokens - pick one strategy per project.
* The brief decides specific colors; maintain hierarchy, brand identity, and WCAG AA contrast (AAA for body) across both modes.
* Respect prefers-color-scheme: dark by default unless the brand insists on one mode.

### 6.D Core Web Vitals Targets
* LCP < 2.5s (hero image priority/preloaded). INP < 200ms (heavy work off main thread). CLS < 0.1 (reserve space for images/fonts/embeds). Run Lighthouse before declaring a page done.

### 6.E DOM Cost
* Apply grain/noise filters EXCLUSIVELY to fixed, pointer-events-none pseudo-elements, never on scrolling containers.
* Be aware of bundle size (Motion isn't tiny, Three.js is large) - lazy-load anything not above-the-fold.

### 6.F Z-Index Restraint
Never spam arbitrary z-50/z-10. Use z-index strictly for systemic layer contexts (sticky navbars, modals, overlays, grain), documented in a constants file.

---

## 7. DIAL DEFINITIONS (Technical Reference)

### DESIGN_VARIANCE (Level 1-10)
* 1-3 (Predictable): symmetrical grid, equal paddings, centered alignment.
* 4-7 (Offset): overlaps, varied aspect ratios, left-aligned headers over centered data.
* 8-10 (Asymmetric): masonry, fractional-unit grids, massive empty zones.
* MOBILE OVERRIDE: for levels 4-10, asymmetric layouts above md: MUST collapse to strict single-column below 768px.

### MOTION_INTENSITY (Level 1-10)
* 1-3 (Static): no automatic animations, :hover/:active only.
* 4-7 (Fluid CSS): smooth transitions, animation-delay cascades for load-ins, transform/opacity focus.
* 8-10 (Advanced Choreography): scroll-triggered reveals, parallax, scroll-driven animation via Motion hooks or GSAP ScrollTrigger. NEVER window.addEventListener('scroll') - hard ban.

### VISUAL_DENSITY (Level 1-10)
* 1-3 (Art Gallery): lots of white space, huge section gaps.
* 4-7 (Daily App): standard web app spacing.
* 8-10 (Cockpit): tight paddings, no card boxes, 1px lines separate data, font-mono for numbers.

---

## 8. DARK MODE PROTOCOL

Dual-mode by default unless the brief is print-emulating editorial.

### 8.A Token Strategy (pick one, stick to it)
* Tailwind dark: variant (utility-first default): every color utility paired with its dark variant.
* CSS variables (for shadcn/ui, Radix Themes, or themed component libraries): semantic tokens swapped under [data-theme="dark"] or prefers-color-scheme.

### 8.B Do Not Prescribe Specific Colors Here
The brief and brand decide. This skill enforces only: contrast (WCAG AA body, AAA hero target), hierarchy parity between modes, brand fidelity (don't desaturate the brand in dark mode), and no pure #000000/#ffffff (use off-black/off-white for depth).

### 8.C Default Mode
Respect prefers-color-scheme unless the brand insists; add a manual toggle if either mode would lose key brand expression.

### 8.D Test in Both Modes Before Finishing
Open the page in both modes during development.

---

## 9. AI TELLS (Forbidden Patterns)

Avoid these signatures unless the brief explicitly asks for them.

### 9.A Visual & CSS
* No neon/outer glows by default - use inner borders or subtle tinted shadows.
* No pure black (#000000) - off-black, zinc-950, or charcoal.
* No oversaturated accents - desaturate to blend with neutrals.
* No excessive gradient text for large headers.
* No custom mouse cursors.

### 9.B Typography
* Avoid Inter as default (see 4.1).
* No oversized H1s that just scream - control hierarchy with weight + color, not raw scale.
* Serif constraints: editorial/luxury/publication only, not dashboards.

### 9.C Layout & Spacing
* Mathematically perfect padding/margins, no floating elements with awkward gaps.
* No 3-column equal feature cards as the generic default - use 2-column zig-zag, asymmetric grid, scroll-pinned, or horizontal-scroll instead.

### 9.D Content & Data ("Jane Doe" Effect)
* No generic names ("John Doe", "Sarah Chan") - use creative, realistic, locale-appropriate names.
* No generic avatars (SVG "egg" or default user icons) - use believable photo placeholders.
* No fake-perfect numbers (99.99%, 50%, 1234567) - use organic, messy data.
* No startup-slop brand names ("Acme", "Nexus", "SmartFlow", "Cloudly") - invent contextual, premium-sounding names.
* No filler verbs ("Elevate", "Seamless", "Unleash", "Next-Gen", "Revolutionize") - use concrete verbs.

### 9.E External Resources & Components
* No hand-rolled SVG icons - use an allowed icon library (Lucide on explicit request only).
* Hand-rolled decorative SVGs strongly discouraged as default.
* No div-based fake screenshots - use real images, generated images, or skip the preview.
* No broken Unsplash links - use picsum.photos seeded URLs, generated placeholders, or real assets.
* shadcn/ui customization allowed but never in default state.
* Production-ready cleanliness: code visually clean, memorable, meticulously refined.

### 9.F Production-Test Tells (banned outright unless the brief explicitly calls for one)

Hero & top-of-page: no version labels in the hero (V0.6, BETA, INVITE-ONLY, ALPHA) unless the brief is genuinely about a launch; no "Brand . No. 01"-style sub-eyebrows.

Section numbering & micro-labels: no section-number eyebrows ("00/INDEX", "001 . Capabilities"); no "01/4"-style pagination on tiles; no "Scroll . 001 Capabilities"-style scroll cues; no "Index of Work, 2018-2026"-style range labels as eyebrows.

Separators & dots: middle-dot rationed to max 1 per line in metadata strips, not the default separator for everything; no decorative colored status dots on every list/nav/badge unless conveying real semantic state, sparingly.

Em-dashes & typography flourishes: no em-dash as a design element anywhere (see 9.G, complete ban); no <br>-broken-and-italicized headline splits as a default move; no vertical rotated text unless the brief is explicitly agency/Awwwards/experimental and it serves real composition; no crosshair/hairline grid lines as pure decoration.

Fake product previews: no div-based fake product UI in the hero (fake task list, terminal, dashboard from styled divs) - the #1 LLM-design tell; no fake version footers inside fake screenshots.

Marketing-copy tells: no "Quietly in use at/trusted by" - use natural language or skip the heading; no "From the field/Field notes/Currently on the bench"-style poetic labels - use plain functional labels or skip; no mock-humble industry-reference asides in body copy; no weather/locale strips unless the brief is explicitly place/timezone-focused; no micro-meta-sentences under eyebrows; no generic step labels ("Stage 1/Step 1/Phase 01") - use the actual verb-noun directly ("Install", "Configure", "Ship").

Pills, labels and version stamps: no pills/labels/tags overlaid on images; no invented photo-credit captions as decoration (only credit a real photographer for a real photo, with permission); no version footers on marketing pages; no "Reservation 412 of 800"-style live-stock counters unless real data backs it.

Decoration text strips: no decoration text strip at hero bottom ("BRAND. MOTION. SPATIAL.") unless it carries real navigable links or real status info; no floating top-right sub-text corner paragraphs in section headers - put sub-text directly under the headline or build a clean 2-column header instead.

Lists, dividers and scoring: no border-t + border-b on every row of a long list/spec table - pick one, use sparsely, or use one of the Section 4.9 alternatives; no scoring/progress bars with filled background tracks as comparison visuals on a landing page - prefer a number + small icon or a tiny inline bar without a background track.

Locale, time, scroll cues: locale/city-name/time/weather strips banned for 99% of briefs (allowed only for genuinely globally-distributed studios, travel brands, or a real physical venue - a single footer address is fine, an atmospheric locale strip is not); scroll cues ("Scroll", "scroll to explore", animated mouse-wheel icons) are banned - if the user hasn't scrolled yet they're looking at the hero and know what scrolling is; zero decorative status dots by default.

### 9.G EM-DASH BAN (the single most-violated Tell)

Em-dash (the long dash character) is COMPLETELY banned. It is the LLM's signature stylistic crutch and the #1 visual Tell in production tests. No "limited use" allowance, no "natural language frequency" allowance, no "body copy is fine" allowance. None.

* Banned in headlines - use a period or comma.
* Banned in eyebrows/labels/pills/button text/captions/nav items - use line breaks, columns, or hairlines.
* Banned in body copy - restructure with two sentences, a comma, parentheses, or a colon.
* Banned in quote attribution - use a normal hyphen with spaces or a line break + smaller-weight name.
* Banned in en-dash form too when used as a separator - date ranges and number ranges use a regular hyphen.

The ONLY permitted dash characters on the page are the regular hyphen (compound words, ranges, line dividers) and the minus sign in math. If the output contains a single long dash anywhere visible to the user, it fails the pre-flight check and must be rewritten. This rule is binary: zero em-dashes, not "use sparingly."

---

## 10. REFERENCE VOCABULARY (Pattern Names the Agent Should Know)

A vocabulary, not a library - know these pattern names to communicate about them and reach for them when the design read calls for them.

Hero Paradigms: Asymmetric Split Hero, Editorial Manifesto Hero, Video/Media Mask Hero, Kinetic-Type Hero, Curtain-Reveal Hero, Scroll-Pinned Hero.

Navigation & Menus: Mac OS Dock Magnification, Magnetic Button, Gooey Menu, Dynamic Island, Contextual Radial Menu, Floating Speed Dial, Mega Menu Reveal.

Layout & Grids: Bento Grid, Masonry Layout, Chroma Grid, Split-Screen Scroll, Sticky-Stack Sections.

Cards & Containers: Parallax Tilt Card, Spotlight Border Card, Glassmorphism Panel, Holographic Foil Card, Tinder Swipe Stack, Morphing Modal.

Scroll Animations: Sticky Scroll Stack, Horizontal Scroll Hijack, Locomotive/Sequence Scroll, Zoom Parallax, Scroll Progress Path, Liquid Swipe Transition.

Galleries & Media: Dome Gallery, Coverflow Carousel, Drag-to-Pan Grid, Accordion Image Slider, Hover Image Trail, Glitch Effect Image.

Typography & Text: Kinetic Marquee, Text Mask Reveal, Text Scramble Effect, Circular Text Path, Gradient Stroke Animation, Kinetic Typography Grid.

Micro-Interactions & Effects: Particle Explosion Button, Liquid Pull-to-Refresh, Skeleton Shimmer, Directional Hover-Aware Button, Ripple Click Effect, Animated SVG Line Drawing, Mesh Gradient Background, Lens Blur Depth.

Animation Library Choice: Motion (motion/react) - default for UI/Bento/state-change motion. GSAP + ScrollTrigger - for full-page scrolltelling and scroll hijacks, isolated in dedicated leaf components with cleanup. Three.js/WebGL - for canvas backgrounds and 3D scenes, same isolation rule. NEVER mix GSAP/Three.js with Motion in the same component tree - they fight over the same frames.

---

## 11. REDESIGN PROTOCOL

Handles greenfield builds AND redesigns. Misclassifying the mode is the single biggest source of bad redesign output.

### 11.A Detect the Mode (first action)
* Greenfield - no existing site, or full overhaul approved. Dial baseline from Section 1.
* Redesign - Preserve - modernise without breaking the brand. Audit first, extract brand tokens, evolve gradually.
* Redesign - Overhaul - new visual language on top of existing content. Treat as greenfield for visuals; preserve content and IA.

If ambiguous, ask once: "Should this redesign preserve the existing brand, or are we starting visually from scratch?"

### 11.B Audit Before Touching
Document the current state: brand tokens (colors, type, logo, radii), information architecture, content blocks (what's doing work vs filler), patterns to preserve (signature interactions, recognisable hero, copy voice), patterns to retire (AI-slop tells, broken layouts, dead links, generic stock imagery, perf traps), a dial reading of the existing site (that's your starting point, not the baseline), and an SEO baseline (current ranking pages, meta titles, structured data, OG cards - SEO migration is the #1 redesign risk).

### 11.C Preservation Rules
* Do not change information architecture unless asked - keep page slugs, anchor IDs, primary nav labels stable for SEO and muscle memory.
* Extract brand colors before applying Section 4.2 - a brand that is already purple stays purple.
* Preserve copy voice unless asked for a rewrite - visual modernisation is not content rewrite.
* Honor existing accessibility wins - don't regress focus states, alt text, keyboard nav, contrast.
* Respect existing analytics events - don't rename buttons/fields/section IDs that tracking depends on.

### 11.D Modernisation Levers (priority order, stop when the brief is satisfied)
1. Typography refresh - biggest visual lift per unit of risk.
2. Spacing & rhythm - increase section padding, fix vertical rhythm.
3. Color recalibration - desaturate, unify neutrals, keep brand accent.
4. Motion layer - add appropriate micro-interactions to existing components.
5. Hero & key-section recomposition - restructure top-of-funnel.
6. Full block replacement - only when the existing block is unsalvageable.

### 11.E Decision Tree: Targeted Evolution vs Full Redesign
* IA, content, and SEO sound -> targeted evolution (Levers 1-4), most of the value at a fraction of the risk.
* Visual debt is structural (broken IA, no design system, broken mobile) -> full redesign with strict content preservation.
* Brand itself is changing -> greenfield.

### 11.F What Never Changes Silently
Never modify without explicit user approval: URL structure/route slugs, primary nav labels, form field names or order, brand logo/wordmark, existing legal/consent/cookie copy.

---

## 12. THE BLOCK LIBRARY (Reference Vocabulary Implementation Contract)

Section 10 names patterns; a full implementation library would give each one real props, motion specs, and code sketches, organized under a blocks/ folder by category (hero, feature, social-proof, pricing, cta, footer, navigation, portfolio, transition), one block per file, each with frontmatter (name, category, dial_compatibility, when_to_use, not_for, stack) and body sections (visual sketch, props API, code sketch, mobile fallback, motion variants per intensity band, dark-mode notes, anti-patterns, references). When asked to design one of the Section 10 patterns from scratch, follow this same discipline: one clear implementation, an explicit mobile fallback, a reduced-motion fallback, and a note on when NOT to use it.

---

## 13. OUT OF SCOPE

This skill is NOT for: dashboards/dense product UI/admin panels (use Fluent, Carbon, Atlassian, or Polaris from Section 2.A); data tables (use TanStack Table or AG Grid); multi-step forms/wizards; code editors (use Monaco/CodeMirror with official skinning); native mobile (use Apple HIG/Material directly); realtime collab UIs (presence, cursors - different problem class).

If the brief is one of the above, say so explicitly, point to the right tool, and only apply this skill's marketing-page/about-page/landing-page parts to the surfaces where they apply.

---

## 14. FINAL PRE-FLIGHT CHECK

Run this matrix before delivering. This is the last filter, not optional. Key checks:

- Brief inference declared as a one-liner?
- Dial values explicit and reasoned from the brief, not silently defaulted?
- Design system chosen from Section 2 if applicable, or aesthetic labeled honestly?
- Redesign mode detected and audited if applicable?
- ZERO em-dashes anywhere on the page (headlines, eyebrows, pills, body, quotes, attribution, captions, buttons, alt text)?
- Page Theme Lock: one theme for the whole page, no mid-page inversion?
- Color Consistency Lock: one accent color used identically everywhere?
- Shape Consistency Lock: one corner-radius system applied consistently?
- Button Contrast Check: every CTA readable against its background (WCAG AA)?
- CTA Button Wrap: no CTA label wraps to 2+ lines at desktop?
- Form Contrast Check: inputs/placeholders/focus rings/labels pass WCAG AA?
- Serif discipline: not Fraunces/Instrument_Serif unless explicitly brand-justified; rotated from prior projects?
- Premium-consumer palette check: not the banned beige+brass+oxblood+espresso family unless brand-justified?
- Italic descender clearance handled?
- Hero fits the viewport (headline <= 2 lines, subtext <= 20 words/4 lines, CTA visible without scroll)?
- Hero top padding capped, hero stack discipline (max 4 text elements) respected?
- "Trusted by" logo wall lives under the hero, real SVG logos, not plain text?
- Eyebrow count <= ceil(sectionCount/3)?
- Split-Header Ban respected; Zigzag Alternation Cap (max 2 consecutive) respected?
- No duplicate CTA intent across the page?
- Bento grids have exact cell count and background diversity?
- Section-Layout-Repetition check: no two sections share a layout family; >=4 families across 8 sections?
- Long lists use the right UI component, not a default bulleted list for >5 items?
- Real images used (gen-tool first, then seeded placeholders, then explicit placeholder slots) - no div-based fake screenshots, no hand-rolled decorative SVGs, no pure-text minimalism?
- No pills/labels overlaid on images, no invented photo-credit captions, no version footers on marketing pages, no micro-meta-sentences under eyebrows, no hero-bottom decoration strips, no floating top-right corner sub-text?
- No scoring bars with filled background tracks; no locale/time/weather strips unless justified; no scroll cues; no version labels in hero unless it's a real launch; no section-numbering eyebrows; no decorative dots without real semantic state; no border-t+border-b on every list row?
- Content density sane (no 20-row tables, no fake-precise specs, <=25-word sub-paragraphs by default)? Quotes <=3 lines, clean attribution?
- Motion claimed = motion shown; GSAP sticky-stack/horizontal-pan implemented per the canonical skeletons where used; no window.addEventListener('scroll'); reduced motion respected everywhere MOTION_INTENSITY > 3?
- Dark mode tokens defined and tested in both modes; mobile collapse explicit; min-h-[100dvh] used, never h-screen?
- Empty/loading/error states provided; cards omitted in favor of spacing where possible; icons from an allowed library only; motion isolated in client-leaf components?
- No AI Tells from Section 9 (Inter as default, AI-purple, three-equal cards, Jane Doe, Acme, "Quietly in use at")?
- Core Web Vitals plausibly hit; one design system per project (no mixing)?

If a single item cannot be honestly ticked, the page is not done. Fix it before delivering.

---

## Appendix - Install commands and canonical sources per design system

For the design systems named in Section 2.A, install the official package rather than recreating it: @material/web (Material 3), @fluentui/react-components or @fluentui/web-components (Fluent), @carbon/react + @carbon/styles (Carbon), Shopify's polaris.js web components, @atlaskit/* + @atlaskit/tokens (Atlassian), @primer/css or @primer/react-brand (GitHub Primer), govuk-frontend (UK public sector), uswds (US public sector), Bootstrap 5.3, @radix-ui/themes, or shadcn/ui (npx shadcn@latest init / add). Consult each system's own official docs before hand-rolling its patterns - don't reinvent CSS for a system that already ships one.

Apple Liquid Glass is documented by Apple for Apple platforms only (Human Interface Guidelines, SwiftUI Material) - there is no official web CSS package for it. A web approximation uses backdrop-filter, layered borders, and highlight overlays, and must be labeled in code comments as an approximation, with a solid-fill fallback under prefers-reduced-transparency (uneven browser support, test it).

(Adapted from the open-source taste-skill / tasteskill project, github.com/Leonxlnx/taste-skill, MIT-licensed. Original frontmatter name: design-taste-frontend.)
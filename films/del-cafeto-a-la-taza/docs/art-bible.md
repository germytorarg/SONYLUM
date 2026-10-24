# Art bible: Del cafeto a la taza

The visual rules every scene follows.
Where this file and a scene brief disagree on a colour, weight or rule, this file wins.
Where this file and `docs/storyboard.md` disagree on a position or a time, the storyboard wins.

Sections 1 to 9 are the house style, fixed by the reference analysis — change them only after a fresh one (the skill's `templates/reference-analysis.md` shows the method). Sections 2.2, the identity tints in 2.3, and 10 are rewritten per film from the captured research.

## 1. Frame

The canvas is 1080 px wide and 1920 px tall at 24 fps.
Every pixel value in this file assumes that size.
The origin is the top-left corner and y grows downward.

### 1.1 Shorts safe area

YouTube Shorts draws its own interface over the video.
The title and channel row covers roughly the bottom 380 px, the button column covers roughly x 950 to 1080 from y 1000 down, and the top bar covers roughly the top 180 px.
Anything the viewer must read (the subject, a match-cut shape, a glyph that carries meaning, the wordmark) sits inside x 60 to 940 and y 220 to 1540.
Backgrounds, stripes, grain, guide geometry, construction lines and decorative scenery run full bleed.
The safe area is non-negotiable: the storyboard may never move must-read content outside it. If a composition collides with it, move the scenery — never the must-read content.

### 1.2 Composition for a tall frame

Compose for the height, never crop a square.
Hanging, climbing, falling and rising subjects use the vertical axis.
The frame centre line x = 540 is the default axis for the subject.
Large subjects fill 60 to 90 percent of the frame width so they read on a phone.

## 2. Palettes

Names below are the keys of `FILM.lib.pal`.
Where a key already exists in `src/lib.js`, the value here is the published final value.
Colour is flat.
Tone in illustrated mode comes from hatching, never from gradients.
Radial glow halos are allowed only in schematic mode.

### 2.1 Warm illustrated palette (paper plate)

| Name | Hex | Use |
|---|---|---|
| paper | #EFE3C9 | Paper base |
| paperShade | #E2D1B0 | Paper shadow, tucked edges on white |
| paperDeep | #CDB58C | Paper vignette, deep paper tone |
| stripeCream | #F2E7CF | Stripe band A, default |
| stripeYellow | #EFDCA3 | Stripe band B, warm default |
| stripeApricot | #F0D9B5 | Stripe band B, dawn or tender acts |
| stripeSage | #DCE3CC | Stripe band B, foliage acts |
| stripeSpring | #E4EDD0 | Stripe band B, new-growth acts |
| stripeSky | #C9D3D2 | Stripe band B, open-sky acts |
| ink | #2A1C13 | Main outlines |
| inkSoft | #5B4331 | Secondary outlines, detail lines |
| inkFaint | #8A735C | Construction lines, graticule |
| tan | #C8A47A | Dry organic matter |
| ochre | #C38F2E | Earthy accent |
| rose | #C88C86 | Dusty rose accents |
| duskRose | #E3B1A1 | Dusk sky band |
| sage | #94A47F | Generic foliage |
| teal | #3C8783 | Water hatching, teal accents |
| tealDeep | #285F5D | Deep water hatching |
| sun | #F1BF4A | Sun disc |
| nightSky | #4E3F6E | Night sky band |
| night | #2F2748 | Deepest night, star-field base |
| white | #FBF6EA | Highlights, silk, moon |

Stripe band B changes by act: act 1 (planta) stripeSpring, act 2 (cosecha) stripeSage, act 3 (tueste) stripeApricot, act 4 (taza) stripeYellow.
`orange #D8742B`, `leaf #6E8F4F`, `wood #A8784C`, `sunset #E79D8F`, `dusk #5A4878` and `red #BF3F2C` stay available in `lib.pal` for incidental scenery.

### 2.2 Subject palette, warm

These values are mirrored exactly in the subject block of `src/lib.js`.

| Name | Hex | Use |
|---|---|---|
| leafCoffee | #3F6B3A | Coffee leaf, glossy upper face |
| leafDeep | #284A28 | Leaf shadow side, hatch colour on leaves |
| leafLight | #79A062 | Young leaves, seedling cotyledons, leaf underside |
| leafSheen | #B9D3A4 | Gloss highlight streak along the midrib |
| bark | #8A6A48 | Branch and trunk |
| barkDeep | #5B4430 | Branch shadow, bark hatching |
| flowerWhite | #FBF7EC | Coffee blossom petals |
| flowerShade | #DCD4BE | Petal shadow side, tubes |
| anther | #E2C35A | Stamens and style tips |
| cherryGreen | #8FB04D | Unripe cherry |
| cherryYellow | #E3B53A | Turning cherry |
| cherryRed | #B9262E | Ripe cherry skin (exocarp) |
| cherryDeep | #741A22 | Ripe cherry shadow, overripe |
| cherryLight | #E8685C | Cherry gloss highlight |
| pulp | #F0C9A0 | Mesocarp (fruit flesh) |
| mucilage | #F4E7B6 | Sticky mucilage layer, wet beans |
| parchment | #E6D3A6 | Parchment (endocarp) hull |
| parchmentDeep | #C4AC7C | Parchment shadow, hull cracks |
| silverskin | #D8D3C2 | Silverskin film on the bean |
| beanGreen | #A9B48A | Green coffee (grey-green raw bean) |
| beanGreenDeep | #74805E | Green-bean shadow and crease |
| beanYellow | #D8BD72 | Drying stage of the roast |
| beanCinnamon | #B57B44 | Light roast at first crack |
| beanMedium | #7B4A29 | Medium roast |
| beanDark | #3D2416 | Dark roast, after second crack |
| beanOil | #9A6440 | Oily sheen highlight on dark beans |
| grounds | #4B2D1C | Ground coffee, spent puck |
| espresso | #2B170D | Espresso liquid |
| crema | #C88746 | Crema |
| cremaLight | #E5B97F | Crema highlight, tiger stripes |
| ceramic | #F7F2E7 | Cup and saucer |
| ceramicShade | #D8CFBD | Cup shadow side |
| steel | #A7ABAE | Roaster drum, portafilter, grinder burrs |
| steelDeep | #6C7175 | Steel shadow |
| enamel | #A9432C | Roaster body enamel (red) |
| flame | #E8792E | Burner flame |
| soil | #6E4C34 | Soil cutaway |
| soilDeep | #48321F | Deep soil, compost |
| jute | #C6A26A | Jute sack, picking basket |
| juteDeep | #93723F | Jute shadow and weave |
| water | #7FB2BE | Washing channel water |
| waterDeep | #4E8794 | Water hatching |
| skin | #B9825D | Picker's hand |
| skinDeep | #8A5A3C | Hand shadow |
| steam | #FBF6EA | Steam ribbons (white at 60 to 80 percent) |

### 2.3 Cool schematic palette (blueprint plate)

| Name | Hex | Use |
|---|---|---|
| navy | #0B1230 | Blueprint base |
| navyDeep | #060A1C | Near-black navy for the opening spark frame |
| navyLight | #18234D | Inset circle fills, panel tint |
| grid | #3A4A86 | 60 px grid lines |
| lavender | #C8C1EF | Main linework |
| lineWhite | #EEF0FF | Emphasis lines, veins, ticks |
| paleBlue | #9CC2EA | Secondary accent, frost |
| glow | #FFF3DC | Nucleus cores, sun glyph, glows |
| magenta | #FF3D98 | Moments of change only |

Subject identity tints, also in `src/lib.js`: `schemBean #F0B46E` (the bean and everything roasted), `schemLeaf #9FE3A6` (the living plant), `schemWater #7FD8F2` (water, steam, moisture).
Subject tints are line or dot colours, never fills, and a schematic shot uses at most one of them besides magenta.

### 2.4 Overlay colours on illustrations

| Name | Hex | Use |
|---|---|---|
| annMagenta | #E43D8C | Change rings, trajectories, target rings |
| annBlue | #3B8EE0 | Trajectory and motion lines, fluid paths, rulers |
| annYellow | #EAB530 | Attention rings, brackets, tally rings, sun paths |
| teal | #3C8783 | Secondary guide lines when blue is already in use |

Overlays sit above the illustration at full opacity and never get hatched or grained.

## 3. Line

All widths are at 1080 px wide.
Illustrated lines come from `lib.inkPath` with pressure variation of plus or minus 25 percent.

### 3.1 Illustrated weights

| Element | Width | Colour and opacity |
|---|---|---|
| Hero subject outline | 5 px | ink 100% |
| Doubled hero outline, occasional | 1.5 px, offset 3 px | ink 40% |
| Secondary form outline | 3 px | ink 100% |
| Detail lines: segment rings, veins, ridges | 1.8 px | inkSoft 90% |
| Hatch strokes | 1.2 to 1.8 px | ink or the form's deep colour, 70 to 90% |
| Construction lines | 1.5 px | inkFaint 30% |

Hero-specific line treatments (for example the band widths of a wing's veins) are specified in section 10 with exact widths at a stated subject size, and scale with the drawn size.

### 3.2 Schematic weights

| Element | Width | Colour and opacity |
|---|---|---|
| Primary outline, double | outer 2.5 px and inner 1.5 px, 9 px apart | lavender 85% outer, 50% inner |
| Secondary outline | 1.5 px | lavender 60% |
| Lattice and cell lines | 1 px | lavender 30 to 40% |
| Grid | 1 px, 60 px pitch | grid 35% |
| Guide circles | 1.5 px | lavender 12 to 18% |
| Long diagonals | 1 px | lavender 12% |
| Ticks | 1.5 px, 10 to 20 px long | lineWhite 60% |
| Brackets | 1.5 px, end ticks 16 px | lavender 60% |
| Magenta flashes and rings | 3 px | magenta 100%, fading |

### 3.3 Overlay weights

| Element | Width |
|---|---|
| Attention and change rings | 3 px |
| Trajectory lines | 2.5 px |
| Dashed trajectories | 2.5 px, 14 px on and 10 px off |
| Motion rings | 2 px |
| Arc annotations | 2 px with 8 px end ticks |
| Rulers | 2 px, short ticks 12 px, long ticks 28 px |

## 4. Tone

### 4.1 Hatching

Light comes from the upper left, so shadow falls on the lower right of each form.
Only shadow sides and recesses get hatched, and lit sides stay flat colour.
The primary hatch runs at 45 degrees, rising from lower left to upper right.
Cross-hatch adds a second layer at 105 degrees for deep shadow.
Spacing sets the tone: 12 px for light shade, 8 px for mid shade, 5 px for dark shade, with the cross layer at 7 px.
Cylinders (stems, bodies, trunks) take contour hatching perpendicular to the long axis, slightly curved, 6 to 8 px apart, on the shadow half only.
Foliage takes hatching parallel to the side veins, between the veins.
Bark takes lengthwise hatching.
Water takes horizontal hatching, and coastlines take engraved hatching parallel to the coast that fades with distance offshore.
Every stroke jitters: angle plus or minus 3 degrees, spacing plus or minus 15 percent, each end plus or minus 6 px.

### 4.2 Stipple

Stipple dots have a radius of 1.0 to 2.2 px.
Use stipple for hairs, frost, stars, fine tissue texture, and the body texture of a subject seen very small.
Density runs from 0.002 dots per px² (sparse) to 0.02 dots per px² (dense).

### 4.3 Grain and boil

`core` lays paper grain over illustrated shots and fine noise over schematic shots, re-seeded on the 12 fps boil clock.
Scenes do not add their own full-frame grain.
Every ink and schematic line wobbles on the same 12 fps boil through `lib.boil(T)`, so still frames shimmer like drawn animation.

### 4.4 Stripes

The stripe background uses `lib.stripes` with a band width of 140 px at 30 degrees, rising left to right (`width: 140, angle: -0.52`).
Band A is stripeCream and band B changes by act, as listed in 2.1.
Stripes drift 6 px along their normal per beat unless a shot says otherwise.

## 5. Schematic language

The schematic shots explain what happens inside, and they never show the outside life.
Every schematic frame starts from `lib.blueprint`: navy base, 60 px grid, at least one large faint guide circle, and two long diagonals.
The subject is a double lavender outline with fine internal structure.
Cell structure is a lattice: hexagons (14 to 18 px cells) for tissue and eyes, rectangular cells for shells and sections.
Nuclei and points of activity are glow dots: core radius 8 to 10 px in glow, halo radius 40 px, and 8 to 16 radial ticks 14 to 22 px long at 70 percent.
Measurement is shown with brackets, tick scales and arc annotations, never with numbers.
No text appears in any schematic shot except the final wordmark.
Relationships are shown as a network: thin curved lavender lines from a source region to small circular node glyphs 90 to 120 px across.
Magenta marks a moment of change and each magenta event lasts at most 12 frames before fading.
The progress glyph is a ring of radius 46 centred (900, 300), split into four arcs (planta, cosecha, tueste, taza) with 6-degree gaps, starting at 12 o'clock and running clockwise. Past arcs are lavender at 60 percent, the current arc is lineWhite at 100 percent and 3 px wide with a glow dot at its leading end, future arcs are lavender at 18 percent. The canonical helper code is in `docs/storyboard.md` ("Progress glyph"); every schematic shot copies it verbatim.

## 6. Overlays on illustrations

Overlays show what the drawing cannot: paths, attention, sound, time and scale.
They are thin rings, arcs, straight guide lines, rulers and brackets in the four overlay colours.
Rings expand with `outExpo` and fade over 5 to 12 frames.
Trajectory lines draw on behind a moving subject at 24 fps.
Every illustrated shot carries at least one overlay and at most four overlay colours at once.

## 7. Motion

### 7.1 The on-twos rule

Anything that is drawn as a character or object moves on twos.
Compute its pose from `lib.onTwos(t)`, so it changes 12 times a second and holds each drawing for 2 frames.
Camera moves, zooms, overlay draw-on progress and ring expansion run at a full 24 fps so they stay smooth.
Line wobble follows the 12 fps boil clock.

### 7.2 Timing

The beat is 60/bpm seconds; at the default 120 bpm that is 0.5 s, which is 12 frames at 24 fps, an 8th note 6 frames and a 16th note 3.
Every pop, cut and hit lands on a beat, an 8th or a 16th, exactly on the frame.
Pops use `outBack` over 3 frames with a 6 to 10 percent overshoot.
Draw-ons use `outExpo` over 6 frames.
Character motion never eases for longer than one beat, and only camera moves may run slower.
Motion should feel snappy, never floaty.

### 7.3 Determinism

Seed every random choice from `lib.hash(shotId, ...)` through `lib.rng`.
A scene draws from `t` alone and never depends on a previous frame.
A scene may be asked for `t` slightly beyond its duration during a transition, so clamp to the final pose.

## 8. Match cuts

A match cut keeps a shape on the same pixels across a mode change.
The shared geometry tables live in `docs/storyboard.md`, section "Shared geometry", and scenes copy those numbers exactly.
Line weights may change across the cut, positions may not.

## 9. Wordmark

The wordmark is the film's word in lowercase: `café`.
Draw it with `lib.text` in a thin system sans-serif (light weight), 44 px, letter-spacing 0.12 em, lavender at 85 percent.
It is centred on x = 540 with its baseline at y = 1470, inside the Shorts safe area (the bottom-right corner sits under the button column).
The baseline stays at y = 1470. If the closing diagram collides with the wordmark, move the diagram — never the wordmark.

## 10. Subject reference

Sources checked on 2026-10-24: Wikipedia "Coffea arabica"; Finnish Museum of Natural History taxon MX.5009814 (laji.fi); Central Queensland Coast Landcare Network plant sheet; 19grams "From coffee blossom to coffee cherry"; UW Bothell wetland plant page; IITA coffee development paper (peaberry share); ICO glossary ED-2074; SCA Q-grader study guide (processing, drying); Barista Hustle, Dallmayr and coffeeresearch.org (harvesting); Sweet Maria's, Cafédirect and Perfect Daily Grind (drying); coffeeresearch.org roasting page citing Davids; Siemens Home, Grain d'Expert and illy espresso guides. Notes in `.tmp/research/notes.md`.

### 10.1 Leaves and branch

- Leaves grow in **opposite pairs** along the branch, each pair at the same node. Never alternate.
- Blade elliptic to oblong with a short drawn-out tip, length to width about 2 : 1 (6 to 12 cm by 4 to 8 cm). At hero size a leaf is 380 to 460 px long and 190 to 230 px wide.
- Surface glossy dark green (leafCoffee) with a pale gloss streak (leafSheen) along one side of the midrib; margin gently **wavy**, 4 to 6 shallow undulations per side.
- 8 to 10 pairs of lateral veins, curving toward the tip and looping before the margin; veins sunken, drawn in leafDeep at 1.8 px.
- Short petiole, 30 to 40 px at hero size. Branches are horizontal laterals off an upright trunk; bark tan-brown, thin.

### 10.2 Flowers

- White (flowerWhite), **5 petals**, star-shaped, 10 to 18 mm across: 70 to 110 px at hero size. Petals narrow, pointed, spreading flat from a short tube.
- Stamens with pale yellow anthers (anther) and a forked style stick out of the tube.
- Flowers sit in **clusters of 2 to 9 in the leaf axils**, hugging the branch where each leaf pair joins it. Never on the leaf, never on long stalks.
- Blossom lasts only a few days; it is jasmine-scented. Bees may visit, but arabica is mostly self-pollinating.

### 10.3 Cherries and ripening

- Cherries also sit in **tight axillary clusters on the branch**, like the flowers before them, nearly stalkless.
- Shape: slightly oval sphere, height to width 1.1 : 1, with a small dark disc (the old calyx scar) at the tip. Hero cherry 120 to 150 px tall.
- 7 to 9 months from flower to ripe fruit. Colour sequence: cherryGreen, then cherryYellow, then cherryRed; overripe darkens to cherryDeep. A cluster ripens **unevenly** — green, yellow and red together.

| Stage | Colour | Note |
|---|---|---|
| set fruit | cherryGreen, 40 percent size | after petals fall |
| growing | cherryGreen, full size | months 2 to 6 |
| turning | cherryYellow | months 6 to 8 |
| ripe | cherryRed with cherryLight gloss | ready to pick, 10 to 14 days window |
| overripe | cherryDeep, wrinkled | avoided by pickers |

### 10.4 Inside the cherry (cutaway order, outside to in)

1. Exocarp: thin red skin (cherryRed), 6 px at a 600 px cherry.
2. Mesocarp: the pulp (pulp), thick, 50 to 70 px.
3. Mucilage: sticky translucent layer (mucilage), 12 px.
4. Parchment (endocarp): a stiff pale hull around each bean (parchment), 6 px.
5. Silverskin: a thin film tight on the bean (silverskin), 2 px.
6. **Two beans** facing each other **flat side to flat side**, each with a crease down its flat face.
- A peaberry (one round bean, 5 to 7 percent of the crop) is optional detail; it never replaces the two-bean drawing.

### 10.5 The bean (G1 in the storyboard)

- Seen face-on (flat side toward camera) it is an oval, length to width about 1.4 : 1, with a central S-shaped crease (the "centre cut") running end to end.
- Seen from the rounded back, it is a dome with no crease.
- Green coffee is grey-green (beanGreen), matte. Roasted beans are brown and larger.

### 10.6 Seedling

- The seed germinates in soil: the root goes down first; then the stem rises as a **hook** and lifts the seed, still wrapped in its parchment, up out of the soil (the "soldier" or "matchstick" stage).
- Then the parchment falls away and **two round cotyledons** open flat (the "butterfly" stage), followed by the first pair of true, pointed leaves.

### 10.7 Harvest

- Selective hand-picking: only red cherries come off; green ones stay for a later pass (pickers return every 8 to 10 days). A picker fills a woven basket tied at the waist, 50 to 120 kg per day.
- The fingers pinch the cherry and twist it off; it falls into the basket.

### 10.8 Processing and drying

- Washed process: cherries float in water (unripe floaters skimmed), the depulper squeezes the skin and pulp off, the beans in parchment ferment to lose their mucilage, then are washed.
- Drying: a layer 2 to 3 cm deep on a patio or raised mesh bed, raked and turned often. 6 to 7 days for washed coffee (up to 14 for naturals), down to 10 to 12 percent moisture.
- Hulling cracks the dry parchment off, revealing the grey-green bean. Green coffee travels in jute sacks.

### 10.9 Roasting

| Stage | Bean temperature | Colour | Size | What happens |
|---|---|---|---|---|
| charge | room | beanGreen | 1.0 | beans drop into a hot rotating drum |
| drying | to about 160 °C | beanYellow | 1.0 | water leaves, smells of toast |
| first crack | about 205 °C | beanCinnamon | about 1.8 to 2.0 | audible pop, crease splits open, chaff flakes off |
| development | 205 to 220 °C | beanMedium | 2.0 | sugars caramelise, about 13 percent weight lost |
| second crack | 225 to 230 °C | beanDark with beanOil sheen | 2.0 | quicker, quieter crackle, oils surface |

- The crease opens wider as the bean swells; a pale line of silverskin stays in the crease.
- Beans tumble in the drum; they are dumped into a cooling tray where a stirring arm sweeps them in a circle.

### 10.10 Grinding and espresso

- Burr grinder: two toothed burrs; beans enter from the hopper, grounds fall from the spout.
- Espresso: 7 to 9 g single (14 to 18 g double) of fine grounds tamped flat in the basket; water at 90 to 96 °C pushed through at **9 bar** for 25 to 30 s; yield about twice the dose.
- The stream starts dark, turns honey-coloured and "tiger-striped"; **crema** (CO2 foam, 2 to 3 mm) rises to the top of the cup.

### 10.11 Mistakes to avoid

- Leaves alternating up the branch → leaves come in **opposite pairs**.
- Cherries hanging on long stalks like grapes or cherries from a cherry tree → cherries **pressed into tight clusters on the branch** at the leaf nodes.
- A whole cluster ripening at once → **mixed colours** in one cluster.
- Flowers with 4 or 6 round petals, or pink flowers → **5 narrow pointed white petals**.
- One bean per cherry, or beans side by side → **two beans, flat faces together**.
- A roasted bean the same size as a green bean → roasted beans are **about twice the volume**, crease opened.
- Green coffee drawn bright leaf-green → green coffee is **grey-green (beanGreen)**, dull.
- Black espresso with no crema → a **caramel crema layer** always caps the shot.
- A seedling that pushes up green leaves first → the stem **hooks up and lifts the seed** first, then two round cotyledons open.

# Storyboard: Del cafeto a la taza

## Logline

A coffee seed sprouts, blooms in five-petalled white stars, ripens into red cherries, is picked, washed, dried, roasted until it cracks, ground and pushed through at 9 bar into a cup whose spent grounds feed the next coffee tree.
Warm ink illustrations show the farm and the café, navy blueprints show what happens inside the bean, and every cut lands on an 80 bpm grid in a tall 9:16 frame.

## Numbers

- BPM: 80. Beat 0.75 s = 18 frames, 8th = 9 frames, 8th-triplet = 6 frames, bar 3.0 s = 72 frames.
- Duration: 45.0 s, 15 bars of 4/4, 1080 frames at 24 fps.
- Frame: 1080 x 1920.
- Shots: 21, each 1.5 to 3.0 s, every boundary on the 0.75 s beat grid.
- Use 8ths (9 frames) and 8th-triplets (6 frames) for sub-beat events; a 16th (4.5 frames) does not land on a frame, so never use it.

## Summary

| Order | Id | Start | End | Mode | Title |
|---|---|---|---|---|---|
| 01 | hero-cherries | 0.00 | 1.50 | illustrated | Cold open: the ripe cherry |
| 02 | bean-blueprint | 1.50 | 3.75 | schematic | A spark, a seed |
| 03 | seedling | 3.75 | 6.00 | illustrated | Soldier, then butterfly |
| 04 | blossom | 6.00 | 8.25 | illustrated | Five-pointed white stars |
| 05 | flower-to-fruit | 8.25 | 9.75 | schematic | Nine months in a flower |
| 06 | ripening | 9.75 | 12.00 | illustrated | Green, yellow, red |
| 07 | picking | 12.00 | 14.25 | illustrated | Only the red ones |
| 08 | cherry-cutaway | 14.25 | 16.50 | schematic | Skin, pulp, honey, parchment |
| 09 | depulping | 16.50 | 18.00 | illustrated | Washed |
| 10 | drying-patio | 18.00 | 21.00 | illustrated | Seven suns on the patio |
| 11 | hulling | 21.00 | 22.50 | schematic | Dry to eleven percent, then hulled |
| 12 | green-beans | 22.50 | 24.00 | illustrated | Green coffee into the sack |
| 13 | roaster-drum | 24.00 | 27.00 | illustrated | The drum turns: green to gold to brown |
| 14 | first-crack | 27.00 | 28.50 | schematic | First crack |
| 15 | cooling-tray | 28.50 | 30.75 | illustrated | The cooling tray and the roast ladder |
| 16 | grinder | 30.75 | 33.00 | illustrated | Burrs |
| 17 | espresso-schematic | 33.00 | 35.25 | schematic | Nine bar, ninety-three degrees |
| 18 | pour-crema | 35.25 | 37.50 | illustrated | Tiger stripes and crema |
| 19 | cup-pullback | 37.50 | 40.50 | illustrated | Pull-back: cup, café, window, mountain |
| 20 | grounds-to-soil | 40.50 | 42.75 | illustrated | The grounds feed the next tree |
| 21 | bean-loop | 42.75 | 45.00 | schematic | Back to the seed |

## Structure

Act 1, planta, bars 1 to 4 (0 to 12 s): cherry, seed, seedling, blossom, fruit, ripening. Stripe band B: stripeSpring.
Act 2, cosecha, bars 5 to 8 (12 to 24 s): picking, inside the cherry, washing, drying, hulling, green coffee. Stripe band B: stripeSage.
Act 3, tueste, bars 9 to 11 (24 to 33 s): the hinge lands on the bar-9 downbeat (T 24.0) as the green beans hit the hot drum; first crack, cooling, grinding. Stripe band B: stripeApricot.
Act 4, taza, bars 12 to 15 (33 to 45 s): espresso, crema, the cup, the grounds back to soil, the seed again. Stripe band B: stripeYellow.

- Match cuts: hero cherry G2 (01 to 02, 08 opening, 20 end to 21, 21 end to 01 across the loop); bean G1 (02 to 03, 11 to 12, 14 start, 21); cup G3 and spouts G4 (17 to 18 to 19).
- Push-ins: 13 ends with a push (zoom 1.0 to 1.6) into the drum window; 20 ends with a snap zoom (1x to 9x) onto a ripe cherry landing on G2.
- Pull-backs: 19 (cup 1x to 0.12x through café table, window, mountain farm).
- Time devices: a sun arc with a day tally on the drying patio (10), a month tally ring (05, 06), a thermometer arc in the drum (13), the progress glyph filling its four arcs (planta, cosecha, tueste, taza) in every schematic shot.
- The ending loops: 21's last frame is the G2 cherry outline around the G1 bean, which cuts to frame 0 of 01, the inked G2 cherry.

## Conventions

Positions are frame pixels at camera zoom 1, origin top-left.
`T` is global seconds and `t` is seconds since the shot started. Times in shot sections are global `T`; convert with t = T − start.
The camera is `lib.camera(ctx, { x, y, zoom }, fn)`, which puts world point (x, y) at the frame centre (540, 960).
To zoom while keeping screen point (sx, sy) fixed over world point (wx, wy), set x = wx − (sx − 540) / zoom and y = wy − (sy − 960) / zoom.
Colour names are from `docs/art-bible.md` and exist in `FILM.lib.pal`.
Characters and objects move on twos; cameras and overlays at 24 fps; lines boil at 12 fps.
Readable content stays inside x 60 to 940, y 220 to 1540.
Hard cuts unless a shot says otherwise. Every scene clamps `t` to its duration.
No text anywhere except the wordmark `café` in 21 (art bible section 9). Overlay labels on brackets and arcs are not used in this film.

## Shared geometry

### G1: the bean, face-on (02, 03 start, 11, 12 start, 14, 21)

Defined upright, then rotated by −15 degrees (top leans left) about its centre (540, 900).
Length 480 px along the axis (y 660 to 1140 before rotation), width 340 px (x 370 to 710).
Outline: a superellipse |dx/170|^2.3 + |dy/240|^2.3 = 1, sampled at 96 points, with the top end 6 percent narrower than the bottom (scale dx by 1 − 0.06 × (1 − dy/240) / 2).
Crease (centre cut) centreline before rotation: (548, 682), (531, 750), (536, 826), (552, 900), (547, 976), (530, 1052), (538, 1118). Drawn as a 12 px dark groove (beanGreenDeep on paper, lineWhite on blueprint) tapering to 3 px at both ends.
Silverskin line: a 3 px pale line (silverskin) running inside the groove from (546, 700) to (538, 1100).
Scale for roasted beans: 14 animates the scale from 1.00 to 1.30 about (540, 900); roasted beans in 15 and 16 that recall G1 use 1.30.

### G2: the hero cherry (01, 02 start, 08 start, 20 end, 21 end)

An oval centred (540, 900), rx 260, ry 290 (y 610 to 1190), the tip with a dark calyx scar disc of radius 34 centred (540, 1172) seen slightly from below.
Gloss highlight: a crescent at upper left between angles 200 and 250 degrees, inset 40 px.
In 01 it sits on a branch running across the frame behind it at y 600 (the branch top edge at y 585, bottom edge at y 625), so the cherry hangs just under the branch.

### G3: the cup (17 bottom, 18, 19 start)

Three-quarter view from slightly above.
Rim: ellipse centred (540, 1080), rx 250, ry 70. Rim thickness 12 px.
Body: from the rim's side points (290, 1080) and (790, 1080) curving inward to the foot ellipse centred (540, 1395), rx 160, ry 34.
Handle: a loop on the right from (782, 1130) out to x 905 at y 1200 and back to (752, 1300); outer stroke 26 px wide.
Saucer: ellipse centred (540, 1420), rx 400, ry 96, with an inner well ellipse rx 190, ry 44.
Liquid surface: ellipse centred (540, 1102), rx 232, ry 60; crema fills it.

### G4: the espresso spouts and streams (17, 18)

Two spout tips at (505, 760) and (575, 760). Each stream falls straight down from its tip to the liquid surface (y 1102 at the centre line), 14 px wide at the tip narrowing to 9 px at the bottom.

### Progress glyph (every schematic shot: 02, 05, 08, 11, 14, 17, 21)

Copy this helper verbatim into each schematic scene; do not re-implement it.
Stage index: 0 planta (02, 05), 1 cosecha (08, 11), 2 tueste (14), 3 taza (17, 21). `u` is the shot's progress p in 0..1 (21 uses u = 1 and lights all four arcs as current-complete).

```js
// Progress glyph: canonical, copied verbatim from docs/storyboard.md.
function progressGlyph(ctx, L, stage, u, T, allLit) {
  const P = L.pal, cx = 900, cy = 300, r = 46, gap = 6 * Math.PI / 180;
  const q = Math.PI / 2, pop = L.clamp(u * 6);
  ctx.save();
  ctx.lineCap = 'round';
  ctx.globalAlpha = 0.5; ctx.strokeStyle = P.lavender; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(cx, cy, r + 14, 0, Math.PI * 2); ctx.stroke();
  for (let i = 0; i < 4; i++) {
    const a0 = -q + i * q + gap / 2, a1 = a0 + q - gap;
    const past = allLit || i < stage, cur = !allLit && i === stage;
    ctx.globalAlpha = past ? 0.6 : 0.18;
    ctx.strokeStyle = P.lavender; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(cx, cy, r, a0, a1); ctx.stroke();
    if (cur || allLit) {
      const k = allLit ? 1 : L.clamp(u);
      const ae = a0 + (a1 - a0) * k;
      ctx.globalAlpha = 1; ctx.strokeStyle = P.lineWhite; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(cx, cy, r, a0, ae); ctx.stroke();
      if (cur) L.glowDot(ctx, cx + Math.cos(ae) * r, cy + Math.sin(ae) * r, 4 + 2 * pop, { rays: 0, glow: 3.5, intensity: 0.8 });
    }
  }
  ctx.globalAlpha = 0.7; ctx.fillStyle = P.lineWhite;
  ctx.beginPath(); ctx.arc(cx, cy, 3, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
```

---

## 01 hero-cherries: Cold open, the ripe cherry

T 0.00 to 1.50, illustrated, enters on the film start and the loop replay.

### Composition

Full-frame stripes, band A stripeCream, band B stripeSpring.
A macro of a coffee branch: the branch runs across the frame at y 600 (G2), thick (40 px), barkDeep shadow underneath, from off-left to off-right with a gentle sag (y 590 at x 0, 605 at x 540, 595 at x 1080).
The hero cherry hangs on G2, ripe cherryRed, centred (540, 900), 520 × 580 px, the thumbnail on frame 0.
Its cluster: four more cherries tucked against the branch around it, partly overlapping and partly behind it: a yellow one at (230, 760) r 130, a red one at (850, 760) r 140, a green one at (120, 1000) r 110 (cut by the left edge), a deep red one at (980, 1040) r 120 (cut by the right edge).
An opposite leaf pair grows from the branch node at x 540, behind the cluster: one leaf rising up-left with its tip near (90, 250), one up-right with its tip near (990, 230), each 520 px long, 240 px wide, glossy leafCoffee with a leafSheen streak and 9 vein pairs.
A second, smaller leaf pair hangs below at the far left and right, tips at (60, 1500) and (1020, 1520), half-hidden.

### Forms

Cherry: closed `inkPath` 5 px ink, flat cherryRed fill, shadow side lower right cross-hatched in cherryDeep (8 px then 5 px), gloss crescent cherryLight, calyx scar disc ink with a 5-point star scar in cherryDeep.
Leaves: 3 px ink outline with wavy margin, midrib 2.5 px leafDeep, laterals 1.8 px leafDeep, hatching parallel to laterals on the shadow half (leafDeep 70 percent).
Branch: bark with lengthwise hatching in barkDeep, small lenticel dots.
A drop of dew on the hero cherry at (650, 760), r 18, white with an ink rim.

### Overlays

An annYellow attention ring around the hero cherry, radius 330, drawing on from 12 o'clock clockwise.
A short annBlue ruler along the right of the hero cherry from y 610 to 1190 at x 830 (long ticks at both ends), measuring the cherry.

### Motion

T 0.00: everything drawn, frame 0 is the full thumbnail.
T 0.00 to 0.75: the cluster sways on twos, ±4 px, the dew drop trembles.
T 0.75 (beat 2): the hero cherry bobs (drops 10 px and back with outBack over 3 frames) and the attention ring draws on over 6 frames with outExpo.
T 1.125 (8th): the ruler draws on over 6 frames.

### Camera

Locked push-in, zoom 1.00 to 1.06 about (540, 900), inOutSine, landing at T 1.50.

### Enter and exit

Enters on frame 0 / the loop seam from 21 (G2 outline). Exits on the G2 cherry, which 02 redraws as a blueprint outline on the same pixels (camera zoom must be compensated so the cherry is on G2 exactly at the last frame: push-in centre on (540, 900) keeps the cherry centred; 02 starts at zoom 1.06 scale for the outline and settles to 1.0 by T 1.875).

### Subject

Ripe arabica cherries are red, oval, tightly clustered on the branch at the leaf node, and a cluster ripens unevenly (yellow and green next to red). Leaves are glossy, wavy-edged, in opposite pairs.

### Sound

T 0.00: open, a soft felt kick and a warm Dmaj9 pad swell up from nothing; a wooden "tock".
T 0.75: the hook hit, a round marimba stab D4+A4 with a sub thump, as the cherry bobs.
T 1.125: a glass tick for the ruler.

---

## 02 bean-blueprint: A spark, a seed

T 1.50 to 3.75, schematic, hard cut.

### Composition

`lib.blueprint` base. The G2 cherry outline as a lavender guide oval (1.5 px, 30 percent), scaled 1.06 at T 1.50 settling to 1.00 by T 1.875.
Inside it the G1 bean builds: a double lavender outline (outer 2.5 px, inner 1.5 px 9 px in), crease in lineWhite, a rectangular cell lattice clipped to the bean (cells 18 × 12 px, lavender 30 percent), the embryo as a glow dot near the bottom tip at (560, 1105) (before rotation: (548, 1110)).
Callout network: three node glyphs 100 px across at (180, 520) (a mini hex lattice: the endosperm cells), (180, 1340) (a tiny seedling glyph: two circles on a stem — the embryo), (880, 1340) (a water drop glyph in schemWater — water uptake). Thin curved lavender lines from the bean surface to each node.
A bracket along the bean length on the right (x 790, y 660 to 1140 after rotation approximated as a straight vertical bracket), tick scale along the bottom (y 1230, x 360 to 720).
Progress glyph stage 0, u = p.

### Forms

Double outline, crease, lattice, embryo glow (core 9 px, halo 40 px, 12 rays), nodes, bracket, ticks, guide circle radius 420 at (540, 900) at 15 percent, two long diagonals.

### Motion

T 1.50: a spark (glow dot, r 6) appears at the top of the cherry outline (540, 610) and travels down the outline's left side to the bean's top end over 9 frames.
T 1.875 (8th): the bean's outer outline traces on from the top end clockwise over 9 frames (`tracePath` progress), the inner outline 3 frames behind.
T 2.25 (beat 4 of bar 1): the crease draws top to bottom over 9 frames; lattice fades in row by row.
T 3.00 (bar 2 downbeat): the embryo glow pops (outBack, 3 frames) with a magenta ring (3 px) expanding 30 to 120 px over 12 frames and fading.
T 3.00 to 3.75: the network lines draw out to the nodes, one per 8th-triplet (T 3.00, 3.25, 3.50).
T 3.375: the bracket and ticks draw on.

### Camera

Locked at zoom 1. The guide oval scale settle is part of the drawing, not the camera.

### Enter and exit

From 01's cherry on G2. Exits on the G1 bean, which 03 shows inked on the same pixels.

### Subject

The coffee seed is the bean: oval, flat face with an S-shaped centre cut; it holds the embryo at one end and stored food (endosperm) around it; it must take up water to germinate.

### Sound

T 1.50: cut, a reversed noise swell ending in a soft "pling" (glass, A5).
T 1.875: kalimba motif starts on 8ths: F#5, A5, B5, D6 (T 1.875, 2.25, 2.625, 3.00).
T 3.00: the embryo pop, a bright fmBell D6 with a ping-pong echo, kick on the downbeat.

---

## 03 seedling: Soldier, then butterfly

T 3.75 to 6.00, illustrated, hard cut.

### Composition

Stripes stripeCream / stripeSpring in the top 60 percent; a soil cutaway band from y 1180 to 1920 (soil with soilDeep hatching, a few stones and root hairs). The soil surface line at y 1180.
T 3.75: the G1 bean, parchment-covered (parchment fill with parchmentDeep hatching, crease inked), on the same pixels as 02 — the soil surface is hidden behind the bean at first.
The bean drops into the soil: by T 4.125 it is buried at (540, 1350) at scale 0.35, still rotated −15 degrees.
Then a root grows down to y 1800 with root hairs; a pale stem hooks up and breaks the surface; the hook straightens and lifts the bean (parchment still on) to the top of a 520 px stem — the "soldier" (matchstick) stage, bean at (540, 700).
Then the parchment cracks and falls off to the right, and two round cotyledons open flat — the "butterfly" — each 230 px wide, leafLight, at (420, 640) and (660, 640). Last frame: the butterfly seedling with a tiny first true-leaf pair just visible between the cotyledons.

### Forms

Stem 22 px wide, leafLight with a pale yellow-green base, contour hatched on the right half.
Root: tapering inkPath ink 3 px → 1 px, 14 root hairs.
Cotyledons: round-kidney shapes, 3 px ink, leafLight fill, leafDeep vein midline, hatch on lower right.
Parchment helmet: two halves that split along the crease and tumble.

### Overlays

An annBlue dashed trajectory line tracing the bean's lift path (from 1350 up to 700) drawing on behind it.
An annMagenta change ring (3 px) bursting at the parchment split at T 5.25.
An annYellow arc annotation across the cotyledon span when they open (radius 260, from 200 to 340 degrees around (540, 700)).

### Motion

T 3.75 to 4.125: the bean shrinks and falls into the soil (inOutCubic over 9 frames).
T 4.125 to 4.50: the root draws down (outExpo, 9 frames).
T 4.50 (beat): the hook breaks the surface; T 4.50 to 5.25 the stem rises on twos, hook straightening, bean lifted to (540, 700).
T 5.25 (beat): the parchment splits (magenta ring), halves fall over 9 frames.
T 5.625 (8th): the cotyledons unfold from closed to flat (popTwos, outBack).
T 5.625 to 6.00: hold, a slight sway.

### Camera

Locked at zoom 1.

### Enter and exit

From 02's G1 bean. Exits on the butterfly seedling; 04 is a hard cut to a mature branch.

### Subject

Coffee germination: root first, then the hypocotyl hook lifts the seed still in parchment ("soldier"), then two round cotyledons open ("butterfly").

### Sound

T 3.75: cut, a muted "thup" into soil (whump), a low brush.
T 4.50: a rising glide (pluck glissando) as the stem rises; shaker on 8ths enters.
T 5.25: the parchment cracks, a dry click-pair (clickGrains).
T 5.625: cotyledons open, a soft kalimba chord D5 F#5 A5.

---

## 04 blossom: Five-pointed white stars

T 6.00 to 8.25, illustrated, hard cut.

### Composition

Stripes stripeCream / stripeSpring.
A mature horizontal coffee branch diagonal from lower-left (−40, 1250) to upper-right (1120, 760), 34 px thick, with three leaf nodes at x 260, 560, 860 along it. Each node has an opposite pair of leaves (one above the branch, one below), 360 px long, glossy.
At each node an axillary cluster of white blossoms: node 1: 5 flowers, node 2 (centre, hero cluster around (560, 1010)): 8 flowers, node 3: 6 flowers. Flowers 90 to 110 px across, 5 narrow pointed petals each, anthers sticking out. Plus buds (white elongated club shapes) at each node.
A honeybee (small, 60 px) visits the hero cluster.

### Forms

Petals: 5 lanceolate petals, flowerWhite fill, 2 px ink, flowerShade hatching at petal bases, corolla tube centre, 5 anthers (anther) on short filaments, a forked style.
Bee: ochre and ink stripes, translucent wings (white 60 percent), on twos.

### Overlays

annYellow attention rings popping around each cluster as it opens.
An annBlue dashed flight path for the bee looping from the left edge to the hero cluster.
A tally of three small annYellow dots in the top-left (x 120 to 200, y 300) filling one per opened cluster (the bloom lasts a few days).

### Motion

T 6.00: buds closed (white clubs).
T 6.00 (cut), 6.75 (beat), 7.50 (beat): cluster 1, 2, 3 bursts open in turn — each flower pops on twos (popTwos), staggered by 2 frames within the cluster, petals rotating out from closed to open.
T 6.375 to 8.25: the bee flies in along its path, lands on the hero cluster at T 7.50, wings buzzing on twos.
T 7.875 (8th): a few petals of cluster 1 begin to fall (drift down on twos) — the bloom is brief.

### Camera

Slow push-in, zoom 1.00 to 1.04 about (560, 1010).

### Enter and exit

Hard cut from the seedling. Exits on the hero cluster around (560, 1010); 05 is a blueprint of one flower.

### Subject

Arabica flowers: white, five narrow pointed petals, jasmine-scented, in axillary clusters of 2 to 9, bloom for a few days; mostly self-pollinating, bees visit.

### Sound

T 6.00: cut, a soft gong "bloom" (glass + pad), kick.
T 6.00, 6.75, 7.50: each cluster opens with a rising glock triad (D6 F#6 A6, then E6 G6 B6, then F#6 A6 D7) on 8th-triplets.
T 6.375 to 8.25: a bee buzz (buzz instrument, filtered, panning left to centre).

---

## 05 flower-to-fruit: Nine months in a flower

T 8.25 to 9.75, schematic, hard cut.

### Composition

`lib.blueprint`. One flower in section at the top (centred (540, 560), 320 px across, five petals in double lavender outline, the ovary below the petals highlighted).
Below it a horizontal growth ladder at y 1150: five fruit outlines left to right at x 170, 320, 490, 680, 880 with radii 24, 44, 62, 78, 92, double lavender outlines with schemLeaf dots inside; the fifth (ripe) gets a magenta flash when it completes.
A month tick scale below the ladder from x 120 to 960 at y 1320: 9 long ticks (one per month).
Lines connect the flower's ovary down to the first fruit.
Progress glyph stage 0, u = p.

### Forms

Double outlines, hex lattice inside the ovary (14 px cells), glow dot at the ovary (r 8), ticks, bracket under the ladder.

### Motion

T 8.25: the flower already drawn; petals fade out over 9 frames from T 8.25 (the petals fall), leaving the ovary glowing.
T 8.625, 8.875, 9.125, 9.375, 9.625 (every 6 frames, 8th-triplets): each ladder fruit draws on in turn, the month ticks lighting in step (about two months per fruit).
T 9.625: magenta ring on the fifth fruit (ripe).

### Camera

Locked at zoom 1.

### Enter and exit

From the hero cluster. Exits on the ladder; 06 cuts to a real cluster.

### Subject

After the petals fall the ovary swells; 7 to 9 months from fertilised flower to ripe fruit.

### Sound

T 8.25: cut, a soft reversed swell, kick.
T 8.625 to 9.625: five marimba notes rising on 8th-triplets: D5, E5, F#5, A5, B5.
T 9.625: a soft bell (fmBell B5).

---

## 06 ripening: Green, yellow, red

T 9.75 to 12.00, illustrated, hard cut.

### Composition

Stripes stripeCream / stripeSpring.
A branch horizontal at y 700 across the frame, with two opposite leaf pairs (above and below, at x 220 and x 860).
The hero cluster at the centre node (540, 760): 11 cherries packed in a tight ring around the branch, radius 70 to 85 px each, arranged in two rows under and over the branch (the front row fully visible: 7 cherries from x 300 to 780 at y 860; back row 4 cherries peeking above the branch at y 640).
A month tally ring top-right: a circle of 9 dots at (840, 330), radius 70, annYellow, filling one dot per beat-third.

### Forms

Cherries: inked 4 px, flat fill switching cherryGreen → cherryYellow → cherryRed (per-cherry schedule, deliberately uneven), gloss highlight, calyx scar, shadow hatching in the darker tone of each colour.

### Overlays

The tally ring (annYellow). annMagenta change rings flash around each cherry the moment it turns red. A short annBlue ruler shows the cherries growing (left side, x 160, y 780 to 940).

### Motion

T 9.75: all 11 cherries small (scale 0.55), cherryGreen.
T 9.75 to 10.50: they swell to full size on twos (outBack per cherry, staggered 2 frames).
T 10.50 (beat): first four turn yellow (one per 8th-triplet).
T 11.25 (beat): five turn red one per 8th-triplet, with magenta rings; two stay green and two stay yellow to the end (uneven ripening).
T 11.625: one cherry darkens to cherryDeep (overripe).
Tally ring: dot k lights at T 9.75 + k × 0.25 for k = 0..8.

### Camera

Locked, slow push zoom 1.00 to 1.05 about (540, 800).

### Enter and exit

From the ladder. Exits on the mixed cluster; 07 cuts to a hand picking.

### Subject

Cherries ripen unevenly: green, yellow, red side by side on one cluster.

### Sound

T 9.75: cut, kick, pad change to Bm9.
T 10.50: four pluck notes for the yellows (A4 B4 D5 E5) on triplets.
T 11.25: five bright glock notes for the reds (F#5 A5 B5 D6 E6) on triplets, each with a soft "pop".
T 11.625: a low wooden tock for the overripe cherry.

---

## 07 picking: Only the red ones

T 12.00 to 14.25, illustrated, hard cut. Act 2 starts: stripe band B stripeSage.

### Composition

Stripes stripeCream / stripeSage.
A branch from upper-left (−40, 520) to the right (1120, 640) with three cherry clusters at x 260, 560, 860, mixed colours (each cluster 6 to 8 cherries: about half red, the rest green/yellow).
A picker's hand enters from the right: forearm from the right edge (1080, 1150) to the wrist at (760, 900), the hand with thumb and index finger pinching. Skin with skinDeep hatching, a rolled sleeve in tealDeep.
A woven jute basket at the bottom from y 1300 to 1920, rim ellipse centred (540, 1360), rx 380, ry 80; inside it a heap of red cherries that grows.

### Forms

Hand: 4 px ink outline, fingernails, knuckle lines, contour hatching.
Basket: jute with a woven criss-cross pattern in juteDeep, rim rope.
Falling cherries: red, rotating on twos.

### Overlays

An annBlue dashed trajectory from each picked cherry down into the basket.
annYellow tick marks (small check rings) on each picked red cherry's former spot; annMagenta X rings briefly over a green cherry the hand skips.

### Motion

The hand visits the three clusters in turn: T 12.00 cluster 3 (right), T 12.75 cluster 2, T 13.50 cluster 1. At each visit, on the beat it pinches a red cherry, twists (rotate 15 degrees over 3 frames), and the cherry drops; a second cherry is picked on the following 8th. The hand moves between visits with inOutCubic over 9 frames.
At T 13.125 the hand hovers over a green cherry and moves on (magenta X ring).
The basket heap rises by 14 px with each cherry landing (landing 9 frames after release).

### Camera

Locked at zoom 1.

### Enter and exit

Hard cut from ripening. Exits on the full basket; 08 opens on a single cherry on G2.

### Subject

Selective hand-picking: only ripe red cherries, green ones left for a later pass; picked into a basket at the waist.

### Sound

T 12.00: cut, kick, brush loop enters, pad to Gmaj7.
T 12.00, 12.375, 12.75, 13.125(skip: a muted "nh-uh" blip), 13.50, 13.875: each pick is a snap (tock) followed 9 frames later by a soft thud into the basket (felt kick, low).

---

## 08 cherry-cutaway: Skin, pulp, honey, parchment

T 14.25 to 16.50, schematic, hard cut.

### Composition

`lib.blueprint`. The G2 cherry outline (double lavender) at its exact pixels at T 14.25.
It splits: a cutaway wedge opens (the right half rotates away / becomes a section view): concentric layers inside G2: exocarp (outline at G2), pulp band (inset 0 to 64 px, hatched lavender 25 percent), mucilage (inset 64 to 78 px, fine lavender dots), parchment (inset 78 to 86, double line), silverskin (thin line), and two beans facing flat side to flat side in section: two half-ovals, left bean x 330 to 535, right bean x 545 to 750, y 690 to 1110, each with a crease mark on its flat face.
Node callouts: five node glyphs 96 px on the left and right margins, each connected to its layer by a curved line: skin (130, 620), pulp (130, 900), mucilage (130, 1180), parchment (885, 760), bean (885, 1080). Each node glyph shows a tiny icon of its layer (concentric arc, hatch patch, dots, double line, bean).
Progress glyph stage 1, u = p.

### Forms

Double outlines, concentric layer arcs, hex lattice inside the beans (16 px cells, 35 percent), lattice rectangles in the pulp.

### Motion

T 14.25: the whole cherry outline.
T 14.625 (8th): the section line slices down the middle (lineWhite, 9 frames), magenta flash along the cut.
T 15.00 (beat): the two halves part 60 px each side (outBack over 3 frames), revealing the layers which draw on from outside to in, one per 8th-triplet (T 15.00, 15.25, 15.50, 15.75, 16.00).
Each layer's node and line draw on with its layer.

### Camera

Locked at zoom 1.

### Enter and exit

From the basket. Exits on the labelled section; 09 cuts to the washing station.

### Subject

Cherry layers: skin, pulp, sticky mucilage, parchment hull, silverskin, two beans flat face to flat face.

### Sound

T 14.25: cut, glass ping, kick.
T 14.625: a slicing noise sweep (nz, high to low).
T 15.00: the split, a soft whump; then five kalimba notes on triplets (D5 F#5 A5 D6 F#6) as the layers draw.

---

## 09 depulping: Washed

T 16.50 to 18.00, illustrated, hard cut.

### Composition

Stripes stripeCream / stripeSage at the top; a washing channel fills the lower 55 percent: water (water fill, waterDeep horizontal hatching) between two concrete walls (paperDeep with ink), the surface at y 980.
Upper part: a depulper drum (steel cylinder 300 px wide, toothed, centred (540, 640), axis horizontal) with a hopper above it from which red cherries fall; below the drum, pale beans in parchment (mucilage-wet, glistening) slide into the water while red skins fly out to the right into a heap (pulp).
In the water: beans in parchment sink (bottom), two green unripe floaters bob at the surface at (260, 975) and (820, 975).

### Forms

Drum with teeth (ink), steel hatching, axle. Beans in parchment: small ovals 46 × 32 px, mucilage fill with a white glint. Skins: crumpled red crescents.

### Overlays

annBlue curved flow arrows along the channel (water flowing right). An annYellow ring around a floater ("unripe floats"). An annMagenta change ring where skin meets bean at the drum gap.

### Motion

T 16.50 to 18.00: the drum rotates continuously (24 fps), cherries enter on 8ths, each pops into bean + skin at the drum gap.
Beans sink with slight sway on twos; water surface ripples (sine, boil).
T 17.25 (beat): a big splash ring as a group of beans hits the water.

### Camera

Locked at zoom 1.

### Enter and exit

Hard cut from the section. Exits on the channel; 10 cuts to the patio.

### Subject

Wet process: floaters skimmed, the depulper strips skin and pulp, beans in parchment ferment and are washed.

### Sound

T 16.50: cut, kick, a water bed (amb noise, lowpassed, panning).
T 16.50 to 18.00: squelches on 8ths (chew instrument) for each cherry.
T 17.25: a splash (nz burst + plip cluster).

---

## 10 drying-patio: Seven suns on the patio

T 18.00 to 21.00, illustrated, hard cut.

### Composition

Stripes stripeCream / stripeSage in the sky (top 45 percent), a sun-path arc across it.
A raised drying bed seen in perspective from above-front: a wooden frame with mesh, its top surface a trapezoid from (90, 1000)–(990, 1000) at the back to (−40, 1600)–(1120, 1600) at the front, legs below; covered with a 2-3 cm layer of beans in parchment (thousands of tiny ovals drawn as stipple-like ellipses in parchment and parchmentDeep).
A wooden rake drawn in the bed, handle running from (700, 1600) up to (980, 1180).
Sun-path arc: a dotted annYellow arc through (60, 700), (540, 330), (1020, 700). The sun disc (sun, r 44, 12 ray ticks).
A day tally top-left: 7 small circles in a row at y 250 from x 120 to 480 (inside the safe area), filling one per day.

### Forms

Bed wood: wood with barkDeep hatching. Beans: colour shifts over the shot from mucilage-wet (mucilage, glints) to dry parchment (parchment), losing glints. Rake: tines leave furrows (ridges drawn as wavy lines that move with the rake).

### Overlays

The sun arc and day tally (annYellow); annBlue rake path dashed; small annBlue vapour wisps rising from the beans in the early days, fading by day 5.

### Motion

The sun crosses the arc 7 times: 6 days of 0.375 s (9 frames, one 8th) from T 18.00 to 20.25, and the 7th day takes the last beat-pair from T 20.25 to 21.00 as a slow final crossing.
Each day: the sun rises at the left end of the arc and sets at the right; between days a 2-frame dim (night) pass darkens the sky band with a navy wash at 25 percent.
The rake drags back and forth once per day (on twos), furrows shift.
Tally circle k fills at the end of day k.
Bean colour: wet → dry across days 1 to 5.

### Camera

Locked at zoom 1.

### Enter and exit

Hard cut from washing. Exits on dry parchment beans; 11 is the blueprint of one bean drying.

### Subject

Drying on raised beds or patios, 2 to 3 cm deep, raked often; washed coffee dries about 6 to 7 days.

### Sound

T 18.00: cut, kick, a bright "day" chime.
Each day start (T 18.00, 18.375, 18.75, 19.125, 19.50, 19.875, 20.25): a glock tick rising through D5 E5 F#5 G5 A5 B5 D6, and a rake scrape (nz burst, bandpassed) on its 8th.

---

## 11 hulling: Dry to eleven percent, then hulled

T 21.00 to 22.50, schematic, hard cut.

### Composition

`lib.blueprint`. The G1 bean inside its parchment hull: the hull is an outline 22 px outside G1 (offset outline, double lavender). Inside, schemWater droplets (small glow dots r 4) scattered through a lattice.
A vertical moisture gauge on the left: a tall bracket from y 600 to 1300 at x 150 with tick scale; a schemWater level bar inside it drops from the top to 18 percent of its height.
Progress glyph stage 1, u = p.

### Forms

Bean double outline, crease, lattice, droplets, gauge.

### Motion

T 21.00 to 21.75: droplets drift out of the bean and fade (each on twos), the gauge level falls with inOutSine.
T 21.75 (beat): the hull cracks: a magenta crack line runs along the hull, the two hull halves fly apart (outBack, 3 frames) and fade off left and right over 9 frames.
T 22.125 (8th): the bare G1 bean pulses once (outline glow) — now green coffee.

### Camera

Locked at zoom 1.

### Enter and exit

From the patio. Exits on the bare G1 bean; 12 opens on the inked green bean on the same pixels.

### Subject

Beans dry to 10 to 12 percent moisture; hulling removes the dry parchment to give green coffee.

### Sound

T 21.00: cut, kick, a descending water-drop figure (plip on 8ths, pitched down).
T 21.75: the hull crack (clickGrains + crash, short).
T 22.125: a soft fmBell A5.

---

## 12 green-beans: Green coffee into the sack

T 22.50 to 24.00, illustrated, hard cut.

### Composition

Stripes stripeCream / stripeSage.
T 22.50: the inked green bean on G1 (beanGreen, matte, crease beanGreenDeep, silverskin line).
By T 22.875 it shrinks (scale 1.0 to 0.12, inOutCubic, 9 frames) to become one bean in a pouring stream: a stream of green beans falls from a metal scoop at the top (scoop at (540, 330)) into a jute sack from y 1150 to 1920 (sack mouth ellipse centred (540, 1180), rx 300, ry 70, rolled jute rim), the heap of green beans visible inside. Beans in the stream: 40 to 60 px each.
The sack carries no text, only a small stencilled coffee-bean emblem (an oval with a crease) in juteDeep on the sack.

### Forms

Jute weave, rope tie, beans with beanGreen fill, shadow hatch beanGreenDeep.

### Overlays

annBlue dashed stream guide; annYellow bracket on the sack height.

### Motion

T 22.875 to 24.00: the stream pours (beans fall on twos, seeded per bean), the heap rises; T 23.25 (beat) the scoop tips further, more beans.
T 23.625 (8th): the sack slumps slightly (squash 3 percent) as it fills.

### Camera

Locked at zoom 1.

### Enter and exit

From the bare bean. Exits on the sack; 13 cuts to the roaster on the act-3 downbeat.

### Subject

Green coffee is grey-green, dull; it ships in jute sacks.

### Sound

T 22.50: cut, kick, a rattling bean pour (grainBuffer, dense clicks) from T 22.875.
T 23.25: pour thickens. A riser (revSwell) from T 23.25 to 24.00 into the hinge.

---

## 13 roaster-drum: The drum turns, green to gold to brown

T 24.00 to 27.00, illustrated, hard cut. Act 3 starts: stripe band B stripeApricot. The hinge.

### Composition

Stripes stripeCream / stripeApricot.
A drum roaster in cutaway, centred (540, 960): the enamel body (rounded box 760 × 820 px from (160, 560) to (920, 1380)), with a circular cutaway window radius 300 centred (540, 960) showing the rotating steel drum inside (drum radius 280, 8 paddles/vanes) and beans tumbling within (about 140 beans, 38 × 28 px each).
A hopper on top (funnel from (420, 360) to (660, 560)); green beans fall from it into the drum at T 24.00.
Burner flames below the drum (a row of 7 small flames at y 1300, flame colour).
A thermometer dial top-right at (820, 420), radius 70, whose needle swings across an arc.
A chaff collector chimney on the left from (220, 560) up to (220, 260) with flakes drifting up.

### Forms

Enamel with ink outline 5 px, hatching on the shadow side, rivets; steel drum with radial vanes; beans colour from beanGreen through beanYellow to beanCinnamon and beanMedium; chaff flakes silverskin.

### Overlays

annYellow arc annotation around the drum window (radius 330, sweeping with the roast progress). annBlue circular arrows showing rotation. annMagenta ring on the dial at the end.

### Motion

T 24.00 (bar 9 downbeat, the hinge): green beans pour from the hopper into the drum (6 frames), a heat shimmer starts.
T 24.00 to 27.00: the drum rotates at one turn per bar (the vanes visible moving at 24 fps), beans tumble (seeded positions on twos along a tumbling cycle).
Colour: green until T 24.75, yellow by T 25.50, cinnamon by T 26.25, medium brown at T 27.00 (inOutSine per bean with ±0.2 s seeded offset).
Dial needle: 0 percent at 24.00 to 90 percent at 27.00.
Chaff flakes rise up the chimney from T 25.50.
T 26.25 (beat): camera push begins.

### Camera

Locked until T 26.25, then push-in zoom 1.0 to 1.6 on (540, 960) with inOutCubic, landing at T 27.00 on the beans in the window (the bean nearest the window centre ends up near G1 scale-down position, but 14 is a hard cut).

### Enter and exit

Hard cut from the sack on the hinge. Exits pushed into the tumbling beans; 14 is the blueprint of one bean in the heat.

### Subject

Beans tumble in a hot rotating drum; they dry and turn yellow (toast smell), then brown; chaff flakes off.

### Sound

T 24.00: the hinge hit, crash + sub drop + kick, full drums enter, pad to Gmaj7 then A13.
T 24.00 to 27.00: the drum rumble (low noise loop, slowly rising lowpass), a gentle bean rattle rhythm on 8ths (shaker).
T 26.25: a riser.

---

## 14 first-crack: First crack

T 27.00 to 28.50, schematic, hard cut.

### Composition

`lib.blueprint`. The G1 bean in double lavender outline; the schemBean tint is used only for heat lines and the crease glow.
Heat: wavy schemBean lines rising around the bean; a thermometer bracket on the right (x 900, y 620 to 1300) with a schemBean level rising to a marked tick (first crack ≈ 205 °C, shown as a marked tick, no number).
Inside the bean: a rectangular cell lattice whose cells swell; a few CO2 glow dots.
Progress glyph stage 2, u = p.

### Forms

Double outline, crease, lattice (cells 18 × 12 → 24 × 16 as the bean swells), glow dots, bracket, ticks.

### Motion

T 27.00 to 27.75: the bean scale grows 1.00 → 1.15 (G1 scaled about (540, 900)), heat lines waver.
T 27.75 (beat): FIRST CRACK: the crease splits open (the groove widens to 26 px), a magenta flash ring 40 to 260 px over 12 frames, four tiny shards (chaff) fly out, scale jumps to 1.25 (outBack, 3 frames).
T 28.125 (8th) and 28.25 (triplet): two smaller follow-up cracks (small magenta rings at seeded points on the outline), scale settles at 1.30.

### Camera

Locked at zoom 1.

### Enter and exit

From the drum. Exits on the cracked bean at scale 1.30; 15 hard cuts to the cooling tray.

### Subject

First crack near 205 °C: the bean swells to about twice its volume, the crease splits, chaff flakes off.

### Sound

T 27.00: cut, kick, sustained heat hiss.
T 27.75: the crack, a sharp pop (clickGrains, loud) + a snare-like noise burst + crash.
T 28.125, 28.25: two smaller pops.

---

## 15 cooling-tray: The cooling tray and the roast ladder

T 28.50 to 30.75, illustrated, hard cut.

### Composition

Stripes stripeCream / stripeApricot.
A round cooling tray seen from above at a three-quarter angle: ellipse centred (540, 1180), rx 470, ry 300, perforated steel floor (dots), a rim 30 px; a stirring arm rotating around the centre sweeping the beans; a heap of roasted beans (beanMedium, with beanCinnamon and beanDark mixed) filling it, each 48 × 34 px, about 160 visible.
Above the tray, a roast ladder: six large beans in a row at y 520, x 135, 285, 435, 600, 770, 930 (each 110 × 150 px), colour ramp beanGreen, beanYellow, beanCinnamon, beanMedium, beanDark, beanDark with beanOil sheen, growing in size from scale 0.8 (green) to 1.0 (roasted), crease opening progressively.
Wisps of steam/smoke rise from the tray.

### Forms

Beans with crease and silverskin line, hatched shadow, oil gloss streak on the last. Steel tray with rim highlights.

### Overlays

annBlue circular arrow for the stirring arm. annYellow bracket under the ladder (x 100 to 980, y 640). annMagenta ring around the oily last bean at the end (second crack).

### Motion

T 28.50: the tray full, arm sweeping (one turn per 1.5 s at 24 fps), beans nudged on twos.
The ladder beans pop in left to right, one per 8th-triplet, at T 28.50, 28.75, 29.00, 29.25, 29.50, 29.75 (popTwos).
T 30.00 (beat): magenta ring on the last bean (oil sheen catches light: a gleam streak travels across it over 6 frames).
Smoke wisps drift up continuously.

### Camera

Locked, slow drift down: y from 960 to 990 over the shot.

### Enter and exit

Hard cut from the crack. Exits on the tray; 16 cuts to the grinder.

### Subject

Roast colours green → yellow → cinnamon → medium → dark with oil sheen after second crack; beans grow; roasted beans are cooled quickly with a stirring arm.

### Sound

T 28.50: cut, kick, a cooling whoosh (wind), the tray rattle (shaker loop).
T 28.50 to 29.75: six marimba notes rising (D4 F#4 A4 B4 D5 F#5) on triplets for the ladder.
T 30.00: a crackle (second crack, quieter, faster: clickGrains density high, low volume).

---

## 16 grinder: Burrs

T 30.75 to 33.00, illustrated, hard cut.

### Composition

Stripes stripeCream / stripeApricot.
A burr grinder in partial cutaway, centred on x 540: a clear hopper at the top (trapezoid from (330, 260)–(750, 260) to (440, 620)–(640, 620)) full of dark roasted beans, the beans sinking; the grinder body (steel, from y 620 to 1180, 360 px wide) with a cutaway window showing two conical burrs (outer ring burr and inner cone, toothed) at (540, 860); a spout at (540, 1180) from which grounds fall into a portafilter basket held at (540, 1380) (basket 260 px wide, handle off to the left to x 120).
Grounds: a fine stream of grounds dots, and a heap rising in the basket.

### Forms

Burrs with radial teeth, steel hatching; beans beanDark/beanMedium; grounds stipple in grounds and beanMedium.

### Overlays

annBlue rotation arrow around the burr. annYellow bracket showing the fineness (a little ruler with short ticks next to the stream: "fine"). annMagenta ring when the dose is full.

### Motion

The inner burr rotates continuously (24 fps). Beans in the hopper sink on twos and tumble into the throat.
T 31.50 (beat) grounds start falling; T 32.25 (beat) the heap peaks; T 32.625 (8th): a tamper (steel disk with handle) presses down onto the heap from above, flattening it (popTwos down), magenta ring.

### Camera

Locked at zoom 1.

### Enter and exit

Hard cut. Exits on the tamped portafilter; 17 shows its section in blueprint.

### Subject

Burr grinding to a fine espresso grind; dose 7 to 9 g single, 14 to 18 g double; tamped flat.

### Sound

T 30.75: cut, kick, the grinder whirr (buzz instrument through a bandpass, rising pitch) from T 30.75 to T 32.25.
T 32.625: the tamp, a dull felt thump + a small metal clink (ting).

---

## 17 espresso-schematic: Nine bar, ninety-three degrees

T 33.00 to 35.25, schematic, hard cut. Act 4 starts.

### Composition

`lib.blueprint`. Group head and portafilter in section, centred x 540: the group head at top (y 300 to 520, wide 520 px, double lavender), a shower screen line at y 520, the coffee puck (a lattice-filled slab y 530 to 640, x 390 to 690, hex lattice 14 px cells), the basket walls, the portafilter body and the two spouts down to the G4 tips (505, 760) and (575, 760).
Below, the G3 cup outline in lavender (rim, body, liquid surface, saucer) — the cup the espresso falls into.
Water: schemWater flow lines with arrows coming down through the group head and puck (8 parallel dashed lines), pressure ticks: a tick ring around the group head (pressure gauge at (180, 420), radius 70, the needle sweeping to a marked tick for 9 bar), a temperature bracket on the right (x 900, y 320 to 640) with a marked tick (93 °C) — no numbers.
Progress glyph stage 3, u = p.

### Forms

Double outlines, lattice puck, flow lines (dashed 2 px schemWater animated dash offset), glow dots where water enters the puck, G4 streams in lavender/lineWhite, G3 cup in lavender 60 percent.

### Motion

T 33.00: dry puck, gauge at zero.
T 33.375 (8th): water arrives: flow lines descend (dash offset animating at 24 fps), the gauge needle rises to the 9-bar tick by T 34.125 (inOutCubic).
T 34.125 (beat): first drops at the spouts (glow dots), then streams extend down to the cup surface by T 34.50 (outExpo).
T 34.50 to 35.25: streams flow, the cup's liquid surface rises 0 → 1 (drawn as a filling ellipse level).

### Camera

Locked at zoom 1.

### Enter and exit

From the tamp. Exits on the cup filling at G3 with streams at G4; 18 shows the same cup inked.

### Subject

Espresso: hot water at 90 to 96 °C forced at 9 bar through a fine, tamped puck for 25 to 30 s.

### Sound

T 33.00: cut, kick, pad to Dmaj9, the bass walks.
T 33.375: the pump hum (buzz, low, steady) and a hiss.
T 34.125: dripping plips, then a pouring trickle (nz with bandpass, gurgling).

---

## 18 pour-crema: Tiger stripes and crema

T 35.25 to 37.50, illustrated, hard cut.

### Composition

Stripes stripeCream / stripeYellow.
At the top: the inked portafilter spouts (steel) at G4 with the two streams falling into the G3 cup below, the cup ceramic on its saucer, a teaspoon on the saucer at the right (handle to (920, 1470)).
The liquid surface on G3 fills with crema: espresso dark at first, then crema rises: crema fill with cremaLight "tiger" mottling and a darker ring at the edge.
The streams change from dark espresso to honey-coloured (crema) and thin out ("blonding") near the end.

### Forms

Ceramic cup: 5 px ink, ceramic fill, ceramicShade hatched shadow side, a highlight streak. Saucer the same. Streams: espresso → crema colour gradient by time (flat per drawing). Crema mottling: seeded blobs in cremaLight and crema, shifting slowly.

### Overlays

annYellow ring around the crema when it completes. annBlue vertical arrows along the streams.

### Motion

T 35.25 to 36.75: streams flowing (wobble on twos), crema rises from dark to fully caramel by T 36.375; tiger mottling swirls.
T 36.75 (beat): the streams cut off (top first, last drops fall over 6 frames).
T 37.125 (8th): the annYellow ring pops around the crema; a first wisp of steam rises.

### Camera

Locked at zoom 1.

### Enter and exit

From the blueprint cup. Exits on the full cup at G3; 19 starts on the same cup and pulls back.

### Subject

The shot starts dark, turns honey-coloured and tiger-striped; crema caps the cup.

### Sound

T 35.25: cut, kick, trickle continues, a warm Rhodes-like pad (keys).
T 36.75: the stream stops, a last "plip".
T 37.125: a sweet bell chord (D6 F#6 A6).

---

## 19 cup-pullback: Pull-back, cup, café, window, mountain

T 37.50 to 40.50, illustrated, hard cut.

### Composition

One continuous log-linear zoom-out through nested layers, each its own drawing at its own scale, anchored on the cup (540, 1100).
Layer 1 (zoom 1.0 at T 37.50): the G3 cup with crema and steam ribbons, saucer, spoon.
Layer 2 (zoom ≈ 0.4 at T 38.25): a café table top (wood, round), a little sugar bowl, a book, a hand resting near the cup (sleeve tealDeep).
Layer 3 (zoom ≈ 0.16 at T 39.00): the café interior: the table by a big window, a chair, a hanging lamp, an espresso machine silhouette on a counter at the far right.
Layer 4 (zoom ≈ 0.07 at T 39.75 → 0.05 at T 40.50): through the window, green coffee mountains with terraced rows of coffee bushes and a shade tree, the farm from act 1, under a morning sun.
Steam ribbons rising from the cup stay visible as a fine white curl as long as the cup is larger than 20 px.

### Forms

Each layer drawn with its own detail; ink weights do not scale with the zoom (draw each layer at its native scale with screen-constant line widths, as in the butterfly pull-back).

### Overlays

annYellow ring around the cup that shrinks with it (staying 1.4× the cup radius), one annBlue arc annotation at layer 3 around the window.

### Motion

Zoom out from 1.0 to 0.05 on a log-linear curve, each layer landing on its beat (T 38.25, 39.00, 39.75). Steam ribbons rise and curl on twos. The hand in layer 2 lifts slightly toward the cup at T 38.25.

### Camera

As above: one continuous log zoom, keeping the cup at screen (540, 1100) until T 39.00, then drifting the camera so the window is centred by T 40.50.

### Enter and exit

From the full cup at G3. Exits on the mountain farm through the window; 20 cuts to a coffee tree's base.

### Subject

The cup is the end of a long chain back to the farm.

### Sound

T 37.50: cut, kick, full groove, the motif in the lead (whistle-ish lead: D5 F#5 A5 B5 A5 F#5).
T 38.25, 39.00, 39.75: a soft whoosh per layer landing; café ambience (cups clinking: ting) at T 39.00.

---

## 20 grounds-to-soil: The grounds feed the next tree

T 40.50 to 42.75, illustrated, hard cut.

### Composition

Stripes stripeCream / stripeYellow.
The base of a young coffee tree on the right (trunk at x 760 rising out of the top of the frame), soil band y 1250 to 1920 with soilDeep hatching.
A spent coffee puck (grounds, a 260 px disc) knocked out from the top-left (a knock-box edge) tumbling down to the soil at (420, 1250), where it crumbles into the soil (grounds mixing into soil as dots).
A branch of the tree crosses the upper frame with leaves and a cluster of ripe cherries at (540, 620): the snap-zoom target.

### Forms

Puck: grounds fill with crumbled edges, beanMedium specks. Soil with worms? one small earthworm (rose) curling. Branch and cherries as in 01.

### Overlays

annBlue dashed fall trajectory for the puck. annYellow ring where it lands. annMagenta ring on the target cherry just before the snap zoom.

### Motion

T 40.50 to 41.25: the puck falls (gravity curve), lands at T 41.25 (beat), crumbles into grounds dots that sink into the soil over 9 frames; a little green shoot pushes up next to it at T 41.625 (8th).
T 42.00 (beat): magenta ring on the target cherry.
T 42.00 to 42.75: snap zoom 1x to 9x onto the target cherry, eased (outExpo), keeping its centre landing exactly on (540, 900) and its size on G2 (target cherry drawn at world size rx 29, ry 32 at (540, 620) → at 9x it becomes rx 261 ≈ 260, ry 288 ≈ 290 at screen (540, 900)).

### Camera

Locked until 42.00, then snap zoom: zoom from 1 to 9 with outExpo over 18 frames, world point (540, 620) moving to screen (540, 900): x = 540, y = 620 − (900 − 960)/zoom.

### Enter and exit

Hard cut from the farm window. Exits on the cherry exactly at G2; 21 opens on the G2 outline.

### Subject

Spent coffee grounds are used as compost; the cycle continues on the farm.

### Sound

T 40.50: cut, kick, pad to Bm9.
T 41.25: the puck lands (soft whump + crumble grains).
T 42.00: a rising whoosh (revSwell) into the snap zoom.

---

## 21 bean-loop: Back to the seed

T 42.75 to 45.00, schematic, hard cut.

### Composition

`lib.blueprint`, a near-duplicate of 02's finished frame, fully drawn on its first frame: the G2 cherry guide oval, the G1 bean double outline with crease and lattice, the embryo glow, the three nodes and their lines, bracket and ticks.
The progress glyph with all four arcs lit (allLit = true).
The wordmark `café` (art bible section 9: 44 px, light weight, letter-spacing 0.12 em, lavender 85 percent, centred x 540, baseline y 1470), fading in from T 43.50.

### Forms

As 02.

### Motion

T 42.75: everything drawn except the wordmark.
T 43.50 (beat): the wordmark fades in over 9 frames.
T 44.25 (beat): the embryo pulses (glow intensity ×1.4 and back over 12 frames).
T 44.25 to 45.00: the nodes, lines, bracket, ticks and lattice fade out, leaving only the G2 cherry oval and the G1 bean outline by the last frame, matching 01 frame 0's composition (cherry on G2).

### Camera

Locked at zoom 1.

### Enter and exit

From the snap zoom onto the cherry (G2). Exits through the loop seam into 01 frame 0 (the inked cherry on G2).

### Subject

Every cup starts as a seed in a cherry.

### Sound

T 42.75: cut, kick, the kalimba motif returns (F#5 A5 B5 D6 on 8ths from T 42.75).
T 43.50: the wordmark, a soft pad bloom (Dmaj9).
T 44.25: the final embryo pulse, fmBell D6; the mix settles to the level of T 0 for a clean loop.

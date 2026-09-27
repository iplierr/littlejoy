# Tutorial illustrations

Every tutorial step already has a built-in hand-drawn sketch (made in `sketch.js`). To use your own illustration instead, drop a PNG here. No code changes are needed.

```
assets/tutorials/<project id>/step<number>.png
```

For example, `assets/tutorials/mini-character/step1.png` replaces step 1 of Mini Character Design. Steps without a PNG keep their built-in sketch, so you can add pictures one at a time.

- To use a different name or location for one step, set that step's `image` in `data.js`, for example `image: "assets/tutorials/character/step1.png"`.
- To stop looking for drop-in files, set `autoDetect: false` in `TUTORIAL_IMAGES` at the top of `sketch.js`.

## Size

- Landscape, about **3:2** (for example 1440 × 980 px).
- The frame is sized for that shape, so other shapes are fitted inside with a little empty paper around them.
- Keep files under ~500 KB so tutorials load fast on phones.

## Projects and step counts

| Folder | Project | Steps |
|---|---|---|
| mini-character | Mini Character Design | 6 |
| creature-design | Creature Design Challenge | 6 |
| tiny-comic | Tiny Comic Strip | 6 |
| sticker-sheet | Character Sticker Sheet | 5 |
| blind-contour | Blind Contour Drawing | 5 |
| doodle-garden | Doodle Garden | 5 |
| marker-pattern | Marker Pattern Tiles | 5 |
| pixel-art | Pixel Art on Paper | 4 |
| perspective-city | Two-Point Perspective Building | 6 |
| paper-flower | Paper Flowers | 6 |
| mini-collage | Mini Collage | 6 |
| paper-landscape | Layered Paper Landscape | 6 |
| fortune-teller | Origami Fortune Teller | 6 |
| popup-card | Pop-Up Card | 6 |
| watercolor-galaxy | Watercolor Galaxy | 6 |
| abstract-color | Abstract Color Study | 5 |
| yarn-bracelet | Braided Yarn Bracelet | 6 |
| pom-pom | Cardboard Pom-Pom | 6 |
| nature-mandala | Nature Mandala | 6 |
| cardboard-sculpture | Cardboard Slot Sculpture | 6 |
| paper-sculpture | Paper Strip Sculpture | 5 |
| found-object-face | Found-Object Face | 5 |
| color-hunt | Color Hunt Photo Walk | 4 |
| shadow-photo | Shadow Still Life Photo | 5 |
| six-word-story | Six-Word Story | 4 |
| window-haiku | Window Haiku | 4 |

## Style guide (so every tutorial looks like one sketchbook)

These rules match the built-in sketches:

- **Background:** plain white. No paper texture, grid, colors or gradients.
- **Lines:** black, hand-drawn and slightly wobbly, so they look drawn rather than traced.
- **What's new in this step:** black lines.
- **What was drawn in earlier steps:** light grey, so the change between steps is obvious.
- **Arrows and notes:** black, with curved hand-drawn arrows and short handwritten notes ("one loop!").
- **No decoration:** no colors, no shading, no extra doodles. Keep only what explains the step.
- **Content:** show the *process* for this one step. Keep it minimal, beginner-readable and centered, with plenty of empty space. Never show a polished finished artwork.
- **Same subject every step:** each step's picture is the previous one plus one change.

A starting prompt for an image generator (add the step's instruction at the end):

> Simple black-and-white hand-drawn tutorial sketch on a plain white background. Slightly imperfect black line art, minimal detail, beginner-friendly drawing guide. Lines from earlier steps in light grey, the new part for this step in black. A small curved black arrow and a short handwritten note if needed. No colors, no shading, no textures, no decorations. Shows one step of the process, not a finished artwork. Step: …

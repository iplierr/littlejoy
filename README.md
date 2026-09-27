# LittleJoy 🌱

**Make something today.** LittleJoy helps you find a small creative project you can actually finish, then walks you through it one step at a time.

## What it does

1. **Discover:** answer four quick questions: what kind of art, how much time you have, your experience level, and what materials are nearby (paper and pencils, a screen, or both).
2. **Choose:** LittleJoy recommends 3 projects you can really do. It never suggests a project that needs something you don't have. Where it can, it adapts the project instead ("No scissors? Tearing works!").
3. **Learn and make:** step-by-step tutorials with a simple hand-drawn sketch for every step, a progress bar and beginner tips.
4. **Rate and save:** finish, add a photo, give it 1–5 stars and a note, and it's saved to **My Journey**, your personal scrapbook.
5. **Get personalized picks:** your ratings teach LittleJoy what you enjoy, so you get **"Because you liked…"** suggestions.
6. **Community:** share what you made, like and comment on others' creations, and tap **Try this project**.

## Features

- **36 art projects:** drawing, paper crafts, painting, crafts, 3D/sculpting, photography, creative writing, and **Digital Art** (phone, tablet or computer, with any free drawing app).
- **Recommendations that respect your materials, time and level**, and learn from your ratings.
- **Adapts projects** when you're missing a material.
- **Tutorial sketches** that build step by step: earlier lines in grey, the new step in black. Digital projects show a drawing-app screen with the right tool and layer highlighted.
- **Saves automatically** in your browser, with **backup download and restore** on the Profile page.
- **A Frutiger Aero / Windows Vista-inspired design** mixed with handmade scrapbook details.
- **Works on desktop, tablet and phone.**

## Try it

- **Online:** *(add your GitHub Pages link here)*
- **On your computer:** download this repository and double-click `index.html`. No installation needed.

## Built with

Plain **HTML, CSS and JavaScript**, with no frameworks and no build step.

| File | What it does |
|---|---|
| `index.html` | All the screens |
| `style.css` | The design |
| `data.js` | The project library (every project, step, tip and material) |
| `engine.js` | Recommendations, project adapting and personalization |
| `sketch.js` | Draws the tutorial sketches |
| `store.js` | Saving: the journey, Community and backups |
| `app.js` | Connects the screens together |

The code is also ready for AI-powered recommendations and generated tutorial images: connection points are in `engine.js` and explained in `SETUP.md`. Optional Google sign-in with Firebase is included too, but it's switched off (`FIREBASE_ENABLED` in `firebase-config.js`).

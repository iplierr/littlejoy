# LittleJoy

Make something today. LittleJoy helps you find a small creative project you can actually finish, then walks you through it one step at a time.

## The Challenge Concept: What is Missing?

Most digital tools today overwhelm us with endless feeds, or they try to solve every problem with a generic chat window. For beginners trying to learn a new craft, this creates a major barrier. Chatbots require you to know exactly what questions to ask, and they often give long, text-heavy answers that do not help you work with your hands.

LittleJoy fixes this missing link in creative technology. It is a structured, visual creation assistant designed around real physical limitations. Instead of making you type into a chatbot, the app adapts entirely to you, your immediate environment, and your available time, guiding you from an initial spark of an idea to a fully finished physical or digital piece of art.

## What it Does

1. Discover: You start by answering four quick questions about the kind of art you want to make, how much time you have, your experience level, and what materials you have nearby like paper, pencils, a screen, or both.
2. Choose: LittleJoy looks at your answers and recommends three projects you can actually finish. It filters out anything requiring materials you do not have, and it even adapts the steps on the fly, like suggesting you tear the paper if you do not have scissors.
3. Learn and Make: You get clean, step-by-step tutorials paired with a live sketch engine that draws along with you, a progress bar, and friendly tips for beginners.
4. Rate and Save: When you finish a project, you can log your work with a photo, a star rating, and your own personal notes. Everything gets saved directly into a digital scrapbook called My Journey.
5. Get Personalized Picks: The app learns from your star ratings over time, unlocking tailored project suggestions based on what you actually enjoyed making.
6. Community: You can share your finished pieces, look at what other creators made, leave likes or comments, and immediately try out their projects with a single click.

## Core Features Built for the Challenge

- Beyond the Chatbot: The user never interacts with a chat bubble or a text-input box. The website itself is the interface, responding dynamically and adapting content based on your physical materials.
- Real Task Accomplishment: The application is built to guide someone through making a physical or digital asset from start to finish, showing a clear, tangible outcome.
- Built-In Project Library: You get 36 distinct art projects covering drawing, paper crafts, painting, sculpting, photography, creative writing, and digital art designed for any free drawing app.
- Smart Material Filtering: The app gives you recommendations that completely respect your real-world constraints like your materials, time, and current skill level.
- Dynamic Project Adaptation: The system intelligently rewrites project steps on the spot if you are missing a tool, so you never get stuck or frustrated.
- Progressive Sketch Engine: The code renders tutorial sketches that build line-by-line, showing new steps in solid black while keeping your previous lines in a light gray. For digital projects, it overlays a mock interface showing you exactly which tool and layer to use.
- Robust Local Storage: Your progress saves automatically in your web browser, and you can easily download a manual backup file to restore your scrapbook on the Profile page.
- Cohesive Aesthetic: The interface blends a nostalgic Frutiger Aero and Windows Vista design style with tactile, handmade scrapbook elements.
- Responsive Architecture: Everything is built to work beautifully whether you are using a desktop computer, a tablet, or a mobile phone browser.

## How to Run the Project

- Online Deployment: (Insert your GitHub Pages link here)
- Local Environment: You can download or clone this repository and open index.html directly in any modern web browser. There are no installations, packages, or build steps required to make it run.

## Architecture and Tech Stack

The entire application is written using standard vanilla HTML, CSS, and JavaScript. This keeps the codebase incredibly fast, clean, and portable without relying on heavy external frameworks.

| Source File | Structural Component Responsibility |
|---|---|
| index.html | Handles all the single-page application screen transitions and layouts. |
| style.css | Controls the visual design, typography, and responsive layouts. |
| data.js | Stores the entire local dataset of projects, steps, tips, and materials. |
| engine.js | Runs the core logic for recommendations, material adaptation, and personalization. |
| sketch.js | Programmatically draws the step-by-step vector canvas sketches. |
| store.js | Connects with browser local storage to save your journey and handle file backups. |
| app.js | Links all the screens together and coordinates the UI button clicks. |

## Future-Ready Extensibility

The architecture is fully prepared for cloud scaling and AI features. The recommendation engine and canvas rendering pipelines include open hook connection points inside engine.js, which are detailed in SETUP.md. The codebase also includes pre-configured Firebase files that are currently turned off but ready to go if you want to enable secure Google authentication down the road.

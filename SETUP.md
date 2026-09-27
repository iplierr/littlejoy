# LittleJoy setup

## Run it

LittleJoy is plain HTML, CSS and JavaScript. There's no build step.

- **Quickest:** double-click `index.html`. Everything works in guest mode: projects, tutorials, ratings, your journey and a local Community. Data is saved in this browser.
- **Recommended:** serve the folder so it behaves like a real website. Google sign-in needs this.
  - VS Code: install the **Live Server** extension, right-click `index.html` and choose **Open with Live Server**.
  - Or in a terminal inside this folder: `npx serve .`, then open the address it prints.

## Publish it (so anyone can use it and sign in)

The site is set up for **Firebase Hosting**. It publishes to `https://joylab-413f2.web.app`, which is already allowed for Google sign-in.

1. Install **Node.js** (the "LTS" version) from <https://nodejs.org>. Restart VS Code afterwards.
2. In VS Code, open a terminal (**Terminal → New Terminal**) in this folder and run these commands one at a time:
   ```
   npm install -g firebase-tools
   firebase login
   firebase deploy --only hosting,firestore
   ```
   - `firebase login` opens your browser. Sign in with the Google account that owns the Firebase project.
   - `firestore` publishes the database rules from `firestore.rules` too. It only works after you've created the Firestore database in the console. Until then, use `firebase deploy --only hosting`.
   - Once Storage is switched on, `firebase deploy --only storage` publishes `storage.rules`.
3. Open **https://joylab-413f2.web.app**. After any change to the site, run `firebase deploy --only hosting` again to update it.

`firebase.json` and `.firebaserc` hold these settings. They also keep the rules files and notes like this one off the public site.

## Files

| File | What it does |
|---|---|
| `index.html` | All the screens (home, discover, results, overview, tutorial, done, journey, community, profile) |
| `style.css` | The Frutiger Aero look |
| `sketch.js` | Helpers that draw the instructional line-art sketches |
| `data.js` | The project library: materials, categories and every project with its steps |
| `engine.js` | Recommendations, "I don't have this" adapting, personalization, AI hooks |
| `store.js` | Saving and loading: this browser by default, Firebase when configured |
| `firebase-config.js` | Your Firebase keys (empty means guest mode) |
| `app.js` | Connects the screens to everything above |

## Turning on Google sign-in, cloud saving and the shared Community (Firebase)

Firebase is free for a project this size (the "Spark" plan).

1. Go to <https://console.firebase.google.com> and click **Add project**. Analytics isn't needed.
2. **Add a web app:** on the project page click the **</>** icon, give it a name and register it. Firebase shows a `firebaseConfig` object. Copy its values into `firebase-config.js`.
3. **Google sign-in:** go to **Build → Authentication → Get started → Sign-in method → Google → Enable**, pick a support email and save.
   - Under **Authentication → Settings → Authorized domains**, make sure the address you open the site from is listed. `localhost` is already there. When you publish the site, add its domain too.
4. **Database:** go to **Build → Firestore Database → Create database** and pick a location. Then open the **Rules** tab, paste the contents of `firestore.rules` and click **Publish**.
5. **Photo uploads:** go to **Build → Storage → Get started**, open the **Rules** tab, paste `storage.rules` and click **Publish**.
   - Note: new Firebase projects may need the pay-as-you-go "Blaze" plan to turn on Storage. The free allowance still applies. If you skip Storage, sign-in and saving still work, but photo uploads will fail.
6. Serve the site (see "Run it" above), open **Profile** and click **Sign in with Google**.

How the security works: Google handles the password, so LittleJoy never sees or stores it. The keys in `firebase-config.js` are meant to be public. The rules files are what keep each person's journey private and stop people from editing each other's posts.

Once Firebase is on:
- Signed in: your journey, ratings, notes and photos save to your account and follow you to any device.
- Signed out: the journey keeps saving in the browser, the Community is view-only, and you need to sign in to post, like or comment.
- Entries saved in guest mode stay in the browser. They aren't copied into your account automatically.

## Connecting AI later (optional)

LittleJoy already recommends projects with built-in rules (`engine.js`). To have an AI model choose instead:

1. Create a small server endpoint, for example a Firebase Cloud Function, that calls the AI model with **your API key stored on the server**. Never put an API key in the website files, because anyone can read them.
2. Put its address in `AI_CONFIG.recommendEndpoint` in `engine.js`.
3. The endpoint receives `{ prefs, taste, candidates }` and must reply `{ "ids": ["project-id", …] }`.
   - The candidates have already passed the material, time and level checks, so the AI can only pick projects the person can actually do.
   - If the server fails, LittleJoy falls back to its own picks automatically.

Tutorial images work the same way. Steps without an `image` in `data.js` call `AI_CONFIG.stepImageEndpoint`, which should reply `{ "url": "https://…" }`. You can also set any step's `image` to an image file path, such as `"art/mini-character-1.png"`.

## Adding a new project

Copy a project in `data.js` and change it. Each step looks like this:

```js
{ instruction: "What to do.", tip: "A friendly hint.", image: 0 }
```

`image` can be:
- a number: which layer of the project's `sketch` to highlight
- a list of `S.` shapes: a one-off diagram
- an image path

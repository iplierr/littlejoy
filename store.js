// Store — where LittleJoy saves things.
//
// The screens only talk to these functions, so they don't care WHERE data lives:
//   Store.getJourney() / Store.addJourneyEntry(entry, photo)
//   Store.getPosts() / Store.addPost(post) / Store.toggleLike(post) / Store.addComment(postId, text)
//   Store.signIn() / Store.signOut() / Store.user() / Store.onUserChange(fn)
//
// Two backends:
//   • local — this browser only (localStorage). Works with no setup at all.
//   • cloud — Firebase: Google sign-in + Firestore + Storage. Turns on when firebase-config.js is filled in.
// When cloud is on but nobody is signed in, the journey still saves locally.

const Store = (() => {
  const JOURNEY_KEY = "littlejoy-journey"; // same key the original app used, so old entries survive
  const POSTS_KEY = "littlejoy-posts";
  const COMMENTS_KEY = "littlejoy-comments";
  const LIKES_KEY = "littlejoy-liked";
  const FIREBASE_VERSION = "10.12.2";

  let fb = null; // { auth, db, storage } once Firebase has loaded
  let currentUser = null;
  const listeners = [];

  // ---------- Setup ----------
  const cloudConfigured = () =>
    typeof FIREBASE_ENABLED !== "undefined" && FIREBASE_ENABLED &&
    typeof FIREBASE_CONFIG !== "undefined" && !!FIREBASE_CONFIG.apiKey;

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = resolve;
      s.onerror = () => reject(new Error("Couldn't load " + src));
      document.head.appendChild(s);
    });
  }

  async function init() {
    if (!cloudConfigured()) return;
    try {
      const base = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
      for (const file of ["firebase-app-compat.js", "firebase-auth-compat.js", "firebase-firestore-compat.js", "firebase-storage-compat.js"]) {
        await loadScript(base + file);
      }
      firebase.initializeApp(FIREBASE_CONFIG);
      fb = { auth: firebase.auth(), db: firebase.firestore(), storage: firebase.storage() };
      fb.auth.onAuthStateChanged((u) => {
        currentUser = u ? { uid: u.uid, name: u.displayName || "LittleJoy maker", email: u.email, photo: u.photoURL } : null;
        listeners.forEach((fn) => fn(currentUser));
      });
    } catch (err) {
      console.warn("LittleJoy: Firebase didn't load — staying in local mode.", err);
      fb = null;
    }
  }

  const cloudOn = () => !!fb;
  const signedIn = () => !!(fb && currentUser);

  function requireSignIn() {
    if (!signedIn()) throw new Error("Please sign in with Google first.");
  }

  // ---------- Auth ----------
  async function signIn() {
    if (!fb) throw new Error("Google sign-in isn't set up yet.");
    const result = await fb.auth.signInWithPopup(new firebase.auth.GoogleAuthProvider());
    return result.user; // the Firebase user (displayName, email, photoURL, uid)
  }
  async function signOut() {
    if (fb) await fb.auth.signOut();
  }

  // ---------- localStorage helpers ----------
  function readLocal(key, fallback) {
    try {
      return JSON.parse(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  }
  function writeLocal(key, value, shrink) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Storage full — drop older photos and try again.
      if (shrink) shrink(value);
      try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
    }
  }

  // Upload a photo (a data: URL from the camera/file picker) and return its web address.
  async function uploadPhoto(dataUrl, folder) {
    if (!dataUrl) return null;
    const ref = fb.storage.ref(`users/${currentUser.uid}/${folder}/${Date.now()}.jpg`);
    await ref.putString(dataUrl, "data_url");
    return ref.getDownloadURL();
  }

  // Firebase calls can hang (instead of failing) when a service like Firestore or Storage
  // isn't set up yet. Give up after a few seconds so the page never gets stuck.
  function withTimeout(promise, ms = 8000) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Firebase didn't answer in time.")), ms)),
    ]);
  }

  // ---------- Journey ----------
  async function getJourney() {
    if (signedIn()) {
      try {
        const snap = await withTimeout(fb.db.collection("users").doc(currentUser.uid).collection("journey").orderBy("date", "desc").get());
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn("LittleJoy: couldn't load your account's journey (is the Firestore database set up?) — showing this browser's journey.", err);
      }
    }
    return readLocal(JOURNEY_KEY, []);
  }

  async function addJourneyEntry(entry, photoDataUrl) {
    if (signedIn()) {
      try {
        const photo = await withTimeout(uploadPhoto(photoDataUrl, "journey"), 20000);
        await withTimeout(fb.db.collection("users").doc(currentUser.uid).collection("journey").add({ ...entry, photo }));
        return;
      } catch (err) {
        console.warn("LittleJoy: couldn't save to your account (are Firestore/Storage set up?) — saved in this browser instead.", err);
      }
    }
    const journey = readLocal(JOURNEY_KEY, []);
    journey.unshift({ ...entry, photo: photoDataUrl || null });
    writeLocal(JOURNEY_KEY, journey, (j) => j.slice(5).forEach((x) => (x.photo = null)));
  }

  // Removes one finished project from the journey.
  // Browser-saved entries have no id, so they're matched by their completion date + name.
  async function removeJourneyEntry(entry) {
    if (signedIn() && entry.id) {
      await withTimeout(fb.db.collection("users").doc(currentUser.uid).collection("journey").doc(entry.id).delete());
      return;
    }
    const journey = readLocal(JOURNEY_KEY, []);
    const i = journey.findIndex((x) => x.date === entry.date && x.name === entry.name);
    if (i === -1) return;
    journey.splice(i, 1);
    writeLocal(JOURNEY_KEY, journey);
  }

  // ---------- Community ----------
  // Example posts so the Community page isn't empty before anyone shares.
  function examplePosts() {
    return ["mini-character", "paper-flower", "watercolor-galaxy", "doodle-garden"].map((id, i) => ({
      id: "example-" + id,
      example: true,
      userName: "LittleJoy team",
      projectId: id,
      caption: `An example ${projectById(id).name.toLowerCase()} — share yours!`,
      photo: null,
      createdAt: Date.now() - (i + 1) * 86400000,
    }));
  }

  async function getPosts() {
    if (cloudOn()) {
      const snap = await withTimeout(fb.db.collection("posts").orderBy("createdAt", "desc").limit(50).get());
      return Promise.all(snap.docs.map(async (d) => {
        const p = d.data();
        const comments = await withTimeout(d.ref.collection("comments").orderBy("createdAt").limit(50).get());
        const likes = p.likes || [];
        return {
          id: d.id,
          userName: p.userName,
          userPhoto: p.userPhoto,
          projectId: p.projectId,
          caption: p.caption,
          photo: p.photo,
          createdAt: p.createdAt ? p.createdAt.toMillis() : Date.now(),
          likes: likes.length,
          liked: !!currentUser && likes.includes(currentUser.uid),
          comments: comments.docs.map((c) => c.data()).map((c) => ({ userName: c.userName, text: c.text })),
        };
      }));
    }

    const liked = readLocal(LIKES_KEY, []);
    const comments = readLocal(COMMENTS_KEY, {});
    return [...readLocal(POSTS_KEY, []), ...examplePosts()].map((p) => ({
      ...p,
      likes: liked.includes(p.id) ? 1 : 0,
      liked: liked.includes(p.id),
      comments: comments[p.id] || [],
    }));
  }

  async function addPost({ projectId, caption, photo }) {
    if (cloudOn()) {
      requireSignIn();
      const url = await withTimeout(uploadPhoto(photo, "posts"), 20000);
      await withTimeout(fb.db.collection("posts").add({
        uid: currentUser.uid,
        userName: currentUser.name,
        userPhoto: currentUser.photo || null,
        projectId,
        caption,
        photo: url,
        likes: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      }));
      return;
    }
    const posts = readLocal(POSTS_KEY, []);
    posts.unshift({ id: "local-" + Date.now(), userName: "You", projectId, caption, photo: photo || null, createdAt: Date.now() });
    writeLocal(POSTS_KEY, posts, (p) => p.slice(3).forEach((x) => (x.photo = null)));
  }

  async function toggleLike(post) {
    if (cloudOn()) {
      requireSignIn();
      const change = post.liked
        ? firebase.firestore.FieldValue.arrayRemove(currentUser.uid)
        : firebase.firestore.FieldValue.arrayUnion(currentUser.uid);
      await withTimeout(fb.db.collection("posts").doc(post.id).update({ likes: change }));
      return;
    }
    const liked = readLocal(LIKES_KEY, []);
    writeLocal(LIKES_KEY, liked.includes(post.id) ? liked.filter((x) => x !== post.id) : [...liked, post.id]);
  }

  async function addComment(postId, text) {
    if (cloudOn()) {
      requireSignIn();
      await withTimeout(fb.db.collection("posts").doc(postId).collection("comments").add({
        uid: currentUser.uid,
        userName: currentUser.name,
        text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      }));
      return;
    }
    const all = readLocal(COMMENTS_KEY, {});
    all[postId] = [...(all[postId] || []), { userName: "You", text }];
    writeLocal(COMMENTS_KEY, all);
  }

  // ---------- Backup (journey saved in this browser) ----------
  // A backup is a small JSON file with your finished projects, ratings, notes and photos.
  function exportJourney() {
    return { app: "LittleJoy", version: 1, exportedAt: new Date().toISOString(), journey: readLocal(JOURNEY_KEY, []) };
  }

  // Adds the projects from a backup to this browser's journey (skipping ones you already have).
  // Returns how many were added.
  function importJourney(data) {
    if (!data || data.app !== "LittleJoy" || !Array.isArray(data.journey)) {
      throw new Error("That file isn't a LittleJoy backup.");
    }
    const text = (v) => (typeof v === "string" ? v.slice(0, 300) : "");
    const clean = (x) => ({
      projectId: text(x.projectId),
      name: text(x.name),
      emoji: text(x.emoji),
      category: text(x.category),
      minutes: Math.max(0, Math.min(10000, Number(x.minutes) || 0)),
      rating: Math.max(0, Math.min(5, Math.round(Number(x.rating) || 0))),
      review: text(x.review),
      date: text(x.date),
      photo: typeof x.photo === "string" && x.photo.startsWith("data:image/") ? x.photo : null,
    });
    const key = (x) => `${x.projectId || x.name}|${x.date}`;
    const current = readLocal(JOURNEY_KEY, []);
    const have = new Set(current.map(key));
    const added = data.journey.filter((x) => x && typeof x === "object").map(clean).filter((x) => x.name && !have.has(key(x)));
    const merged = [...current, ...added].sort((a, b) => (new Date(b.date) || 0) - (new Date(a.date) || 0));
    writeLocal(JOURNEY_KEY, merged, (j) => j.slice(5).forEach((x) => (x.photo = null)));
    return added.length;
  }

  return {
    init, cloudConfigured, cloudOn, signedIn,
    user: () => currentUser,
    onUserChange: (fn) => listeners.push(fn),
    signIn, signOut,
    getJourney, addJourneyEntry, removeJourneyEntry,
    getPosts, addPost, toggleLike, addComment,
    exportJourney, importJourney,
  };
})();

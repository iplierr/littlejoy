// LittleJoy — screens and state.

const state = {
  prefs: { categories: [], time: 15, experience: "beginner", materials: ["paper", "pencil"] },
  results: [],
  activity: null, // the project they picked (possibly adapted)
  from: "home", // where to go back to from the project overview
  step: 0,
  startedAt: null,
  minutes: 0,
  photo: null,
  rating: 0,
  journey: [], // completed projects, loaded from Store
  postPhoto: null,
};

const $ = (id) => document.getElementById(id);

// Anything a person typed (captions, comments, reviews) must go through esc()
// before it's put into HTML, so nobody can inject code into the page.
const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// Only allow picture addresses we expect: uploads (https), data: images,
// or image files inside this project (like assets/tutorials/...).
const safeImg = (url) =>
  typeof url === "string" && /^(https:\/\/|data:image\/|(\.\/)?[\w-]+\/[\w./-]+$)/.test(url) ? esc(url) : "";

// ---------- Navigation ----------
const NAV_FOR = {
  discover: "discover", loading: "discover", results: "discover", prep: "discover", tutorial: "discover", done: "discover",
  journey: "journey", community: "community", profile: "profile",
};

function go(screenId) {
  document.querySelectorAll(".screen").forEach((s) => (s.hidden = s.id !== screenId));
  document.querySelectorAll("[data-nav]").forEach((b) => {
    const on = b.dataset.nav === NAV_FOR[screenId];
    b.classList.toggle("active", on);
    if (on) b.setAttribute("aria-current", "page");
    else b.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  if (screenId === "home") renderHome();
  if (screenId === "journey") renderJourney();
  if (screenId === "community") renderCommunity();
  if (screenId === "profile") renderProfile();
}
const currentScreen = () => document.querySelector(".screen:not([hidden])")?.id || "home";

document.addEventListener("click", (e) => {
  const target = e.target.closest("[data-go]");
  if (target) go(target.dataset.go);
});

// ---------- Choice chips ----------
function chips(containerId, options, { multi = false, selected, onChange }) {
  const box = $(containerId);
  box.innerHTML = "";
  const refresh = () =>
    box.querySelectorAll(".chip").forEach((c, i) => {
      const on = multi ? selected().includes(options[i].id) : selected() === options[i].id;
      c.classList.toggle("on", on);
      c.setAttribute("aria-pressed", on);
    });
  options.forEach((opt) => {
    const b = document.createElement("button");
    b.className = "chip";
    b.type = "button";
    b.innerHTML =
      (opt.emoji ? `<span class="e">${opt.emoji}</span>` : "") +
      `<span class="l">${opt.label}</span>` +
      (opt.sub ? `<small>${opt.sub}</small>` : "");
    b.addEventListener("click", () => {
      onChange(opt.id);
      refresh();
    });
    box.appendChild(b);
  });
  refresh();
}

// ---------- Screen: Discover (preferences) ----------
function toggleIn(list, id) {
  return list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
}

chips("category-choices", CATEGORIES, {
  multi: true,
  selected: () => state.prefs.categories,
  onChange: (id) => (state.prefs.categories = toggleIn(state.prefs.categories, id)),
});
chips(
  "time-choices",
  [
    { id: 5, label: "5 minutes" },
    { id: 15, label: "15 minutes" },
    { id: 30, label: "30 minutes" },
    { id: 60, label: "1 hour+" },
  ],
  { selected: () => state.prefs.time, onChange: (id) => (state.prefs.time = id) }
);
chips(
  "level-choices",
  [
    { id: "beginner", label: "Complete beginner", emoji: "🌱", sub: "Never really tried" },
    { id: "some", label: "Some experience", emoji: "🌿", sub: "I've made a few things" },
    { id: "advanced", label: "Advanced", emoji: "🌳", sub: "Give me a challenge" },
  ],
  { selected: () => state.prefs.experience, onChange: (id) => (state.prefs.experience = id) }
);
// Question 4 has two rows that share state.prefs.materials:
// art supplies (+ "Nothing"), and digital & devices.
const SUPPLIES = MATERIALS.filter((m) => !m.group);
const DIGITAL = MATERIALS.filter((m) => m.group === "digital");

chips("material-choices", [...SUPPLIES, { id: "nothing", label: "Nothing", emoji: "🙌" }], {
  multi: true,
  selected: () => state.prefs.materials,
  onChange: (id) => {
    const isSupply = (m) => SUPPLIES.some((s) => s.id === m);
    const others = state.prefs.materials.filter((m) => !isSupply(m) && m !== "nothing");
    // "Nothing" clears the art supplies (digital choices stay).
    if (id === "nothing") state.prefs.materials = state.prefs.materials.includes("nothing") ? others : [...others, "nothing"];
    else state.prefs.materials = toggleIn(state.prefs.materials.filter((m) => m !== "nothing"), id);
  },
});
chips("digital-choices", DIGITAL, {
  multi: true,
  selected: () => state.prefs.materials,
  onChange: (id) => {
    state.prefs.materials = toggleIn(state.prefs.materials, id);
    $("digital-hint").hidden = !state.prefs.materials.includes("digital");
  },
});

$("find").addEventListener("click", async () => {
  $("loading-text").textContent = "Finding projects for you…";
  go("loading");
  state.results = await recommend(state.prefs, state.journey);
  renderResults();
  go("results");
});

$("surprise").addEventListener("click", () => {
  const easy = ACTIVITIES.filter((a) => a.difficulty === "Beginner");
  pick(easy[Math.floor(Math.random() * easy.length)]);
});

// ---------- Project cards (used everywhere) ----------
function fmtTime(min) {
  return min >= 60 ? "1 hour+" : `${min} min`;
}

function levelBadge(difficulty) {
  const n = LEVELS[difficulty] || 1;
  return `<span class="level lvl-${n}" title="${difficulty}"><i></i><i></i><i></i>${difficulty}</span>`;
}

function catTag(id) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? `${c.emoji} ${c.label}` : id;
}

function materialsText(ids) {
  if (!ids.length) return "Nothing needed ✨";
  return ids.map((id) => {
    const m = MATERIALS.find((x) => x.id === id);
    return m ? `${m.emoji} ${m.need || m.label}` : id;
  }).join(" · ");
}

function projectCard(a) {
  const card = document.createElement("article");
  card.className = "card glass";
  card.innerHTML = `
    <div class="card-art">${finalSketch(a)}<span class="orb-icon" aria-hidden="true">${a.emoji}</span></div>
    <div class="card-body">
      <span class="cat-tag">${catTag(a.category)}</span>
      <h3>${a.name}</h3>
      <div class="meta"><span>⏱ ${fmtTime(a.time)}</span>${levelBadge(a.difficulty)}</div>
      <p class="mats">${materialsText(a.materials)}</p>
      <p class="desc">${a.description}</p>
      ${a.why ? `<p class="why">${esc(a.why)}</p>` : ""}
      <button class="btn primary">Try it</button>
    </div>`;
  card.querySelector("button").addEventListener("click", () => pick(a));
  return card;
}

function fillCards(containerId, list) {
  const box = $(containerId);
  box.innerHTML = "";
  list.forEach((a) => box.appendChild(projectCard(a)));
}

// ---------- Screen: Home ----------
function renderHome() {
  const featured = todaysDiscoveries(4, state.journey);
  fillCards("featured", featured);

  // Three taped polaroids, captioned by hand.
  $("hero-art").innerHTML = featured.slice(0, 3)
    .map((a, i) => `<figure class="hero-card hc-${i}">${finalSketch(a)}<figcaption>${a.name}</figcaption></figure>`)
    .join("");

  showLiked("home-liked", "home-liked-names", "home-liked-cards");
}

function showLiked(sectionId, namesId, cardsId) {
  const liked = becauseYouLiked(state.journey);
  $(sectionId).hidden = !liked;
  if (!liked) return;
  $(namesId).textContent = liked.basedOn.join(" & ");
  fillCards(cardsId, liked.projects);
}

// ---------- Screen: Results ----------
function renderResults() {
  const n = state.results.length;
  $("results-title").textContent = n
    ? `We found ${n} project${n === 1 ? "" : "s"} for you`
    : "Hmm, nothing fits just yet";
  const box = $("cards");
  box.innerHTML = "";
  if (!n) {
    box.innerHTML = `<div class="glass panel"><p>Try a bit more time, a different level, or tap a few more materials.</p></div>`;
    return;
  }
  state.results.forEach((a) => box.appendChild(projectCard(a)));
}

// ---------- Screen: Project overview / "I don't have that" ----------
function pick(activity) {
  state.from = currentScreen();
  state.activity = activity;
  renderPrep();
  go("prep");
}

$("prep-back").addEventListener("click", () => go(state.from === "prep" ? "home" : state.from));

function renderPrep() {
  const a = state.activity;
  $("prep-preview").innerHTML = finalSketch(a) + `<span class="orb-icon big" aria-hidden="true">${a.emoji}</span>`;
  $("prep-cat").textContent = catTag(a.category);
  $("prep-name").textContent = a.name;
  $("prep-meta").innerHTML = `<span>⏱ ${fmtTime(a.time)}</span>${levelBadge(a.difficulty)}<span>📋 ${a.steps.length} steps</span>`;
  $("prep-desc").textContent = a.description;

  const box = $("prep-materials");
  box.innerHTML = "";
  if (!a.materials.length) box.innerHTML = `<p>Nothing! Just you. ✨</p>`;
  a.materials.forEach((id) => {
    const m = MATERIALS.find((x) => x.id === id);
    const b = document.createElement("button");
    b.className = "have";
    b.innerHTML = `<span>${m.emoji} ${m.need || m.label}</span><span class="nope">I don't have this</span>`;
    b.addEventListener("click", () => handleMissing(id));
    box.appendChild(b);
  });

  $("prep-tips").innerHTML = (a.adaptations || [])
    .map((ad) => `<div class="tip-box">💡 ${esc(ad.tip)}</div>`)
    .join("");
}

async function handleMissing(materialId) {
  const back = state.from;
  $("loading-text").textContent = "Adapting this for what you have…";
  go("loading");
  state.activity = await adapt(state.activity, materialId);
  renderPrep();
  state.from = back;
  go("prep");
}

// ---------- Screen: Tutorial ----------
$("start").addEventListener("click", () => {
  state.step = 0;
  state.startedAt = Date.now();
  renderStep();
  go("tutorial");
});

$("exit-tut").addEventListener("click", () => {
  if (confirm("Leave the tutorial? You can continue it later from My Journey → Still making.")) go("prep");
});

// Remember this tutorial as "Still making" (which step you're on), so it can be
// continued or removed from My Journey. Cleared once the project is saved as finished.
function rememberProgress() {
  const a = state.activity;
  const before = Store.getInProgress().find((p) => p.projectId === a.id);
  Store.saveInProgress({ projectId: a.id, step: state.step, startedOn: before ? before.startedOn : Date.now() });
}

function renderStep() {
  rememberProgress();
  const a = state.activity;
  const s = a.steps[state.step];
  const n = a.steps.length;
  const last = state.step === n - 1;

  $("tut-name").textContent = a.name;
  $("step-count").textContent = `Step ${state.step + 1} of ${n}`;
  $("bar").style.width = `${((state.step + 1) / n) * 100}%`;
  $("step-dots").innerHTML = a.steps
    .map((_, i) => `<span class="${i < state.step ? "done" : i === state.step ? "on" : ""}"></span>`)
    .join("");

  // Show the built-in drawing right away, then swap in a better picture if there is one.
  // Digital projects get a screen-style frame instead of the taped sketchbook page.
  $("step-visual").classList.toggle("digital", isDigital(a));
  const picture = stepImage(a, state.step);
  $("step-visual").innerHTML = picture || `<div class="emoji-art">${a.emoji}</div>`;
  const stepNow = state.step;
  const showPicture = (url) => {
    if (url && state.activity === a && state.step === stepNow) {
      $("step-visual").innerHTML = `<img class="step-photo" src="${safeImg(url)}" alt="Step ${stepNow + 1} of ${esc(a.name)}">`;
    }
  };
  // 1. A PNG dropped into assets/tutorials/<project id>/ (unless data.js already names a picture).
  if (typeof s.image !== "string") findDroppedImage(a, stepNow).then(showPicture);
  // 2. No drawing at all for this step — ask the image generator (if one is connected).
  if (!picture) generateStepImage(a, stepNow).then(showPicture);

  $("step-text").textContent = s.instruction;
  $("step-tip").hidden = !s.tip;
  $("step-tip").innerHTML = s.tip ? `<b>💡 Tip</b><span>${esc(s.tip)}</span>` : "";
  $("step-adapted").hidden = !s.adapted;

  $("prev").textContent = state.step === 0 ? "← Overview" : "← Back";
  $("next").textContent = last ? "I finished it! 🎉" : "Next →";
  $("next").classList.toggle("finish", last);
}

$("prev").addEventListener("click", () => {
  if (state.step === 0) return go("prep");
  state.step--;
  renderStep();
});
$("next").addEventListener("click", () => {
  if (state.step < state.activity.steps.length - 1) {
    state.step++;
    renderStep();
    window.scrollTo({ top: 0, behavior: "smooth" });
  } else {
    finish();
  }
});

// ---------- Screen: Done ----------
function finish() {
  state.minutes = Math.max(1, Math.round((Date.now() - state.startedAt) / 60000));
  state.photo = null;
  state.rating = 0;
  $("photo-input").value = "";
  $("photo-preview").hidden = true;
  $("photo-placeholder").hidden = false;
  $("review").value = "";
  $("share-community").checked = false;
  $("done-name").textContent = state.activity.name;
  $("done-time").textContent = `Completed in ${state.minutes} minute${state.minutes === 1 ? "" : "s"}`;
  renderStars();
  go("done");
}

function renderStars() {
  const box = $("stars");
  box.innerHTML = "";
  for (let i = 1; i <= 5; i++) {
    const b = document.createElement("button");
    b.type = "button";
    b.textContent = "★";
    b.className = i <= state.rating ? "on" : "";
    b.setAttribute("aria-label", `${i} star${i === 1 ? "" : "s"}`);
    b.setAttribute("aria-pressed", i === state.rating);
    b.addEventListener("click", () => {
      state.rating = i;
      renderStars();
    });
    box.appendChild(b);
  }
  $("save").disabled = state.rating === 0;
  $("save-hint").hidden = state.rating > 0;
}

// Photo pickers: shrink the photo, then show a preview.
function photoPicker(inputId, previewId, placeholderId, onPhoto) {
  $(inputId).addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const photo = await shrinkImage(file, 900);
    onPhoto(photo);
    $(previewId).src = photo;
    $(previewId).hidden = false;
    $(placeholderId).hidden = true;
  });
}
photoPicker("photo-input", "photo-preview", "photo-placeholder", (p) => (state.photo = p));

// Keep photos small so they fit in browser storage and upload quickly.
function shrinkImage(file, maxSize) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = img.width * scale;
      c.height = img.height * scale;
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL("image/jpeg", 0.8));
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(file);
  });
}

$("save").addEventListener("click", async () => {
  const a = state.activity;
  const review = $("review").value.trim();
  $("save").disabled = true;
  $("save").textContent = "Saving…";
  try {
    await Store.addJourneyEntry(
      {
        projectId: a.id,
        name: a.name,
        emoji: a.emoji,
        category: a.category,
        minutes: state.minutes,
        rating: state.rating,
        review,
        date: new Date().toISOString(),
      },
      state.photo
    );
    Store.removeInProgress(a.id); // finished, so it's no longer "Still making"
    if ($("share-community").checked) {
      await Store.addPost({ projectId: a.id, caption: review || `I made ${a.name} with LittleJoy!`, photo: state.photo });
    }
  } catch (err) {
    alert(err.message || "Something went wrong while saving. Please try again.");
  }
  $("save").textContent = "🌱 Save to my journey";
  await refreshJourney();
  go("journey");
});

// ---------- Screen: My Journey ----------
async function refreshJourney() {
  try {
    state.journey = (await Store.getJourney()).map(normalizeEntry);
  } catch (err) {
    console.warn("LittleJoy: couldn't load journey", err);
    state.journey = [];
  }
  $("journey-count").textContent = state.journey.length;
}

// Older saved entries don't have a projectId — match them up by name
// (including the names projects had in the first version of LittleJoy).
const OLD_NAMES = {
  "Paper Flower": "paper-flower",
  "Blind Contour Portrait": "blind-contour",
  "Calm Pattern Tiles": "marker-pattern",
  "Twisted Yarn Bracelet": "yarn-bracelet",
};
function normalizeEntry(x) {
  const project = x.projectId
    ? projectById(x.projectId)
    : ACTIVITIES.find((a) => a.name === x.name) || projectById(OLD_NAMES[x.name]);
  return { ...x, projectId: project ? project.id : x.projectId, category: project ? project.category : x.category };
}

function fmtDate(value) {
  const d = new Date(value);
  return isNaN(d) ? value : d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}
function fmtMinutes(total) {
  if (total < 60) return `${total} min`;
  const h = Math.floor(total / 60), m = total % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
const starText = (n) => "★".repeat(n) + "☆".repeat(5 - n);

function journeyStats() {
  const j = state.journey;
  const rated = j.filter((x) => x.rating);
  return {
    count: j.length,
    minutes: j.reduce((sum, x) => sum + (x.minutes || 0), 0),
    avg: rated.length ? (rated.reduce((s, x) => s + x.rating, 0) / rated.length).toFixed(1) : "–",
  };
}

function renderJourney() {
  const j = state.journey;
  const stats = journeyStats();
  $("stat-count").textContent = stats.count;
  $("stat-time").textContent = fmtMinutes(stats.minutes);
  $("stat-rating").textContent = stats.avg === "–" ? "–" : `${stats.avg} ★`;
  $("journey-where").textContent = Store.signedIn()
    ? "Saved to your account."
    : Store.cloudOn()
      ? "Saved in this browser. Sign in on your Profile to keep it in your account."
      : "Saved automatically in this browser. Download a backup from your Profile to keep it safe.";

  const tried = new Set(j.map((x) => x.category));
  $("stamps").innerHTML = CATEGORIES.map(
    (c) => `<div class="stamp ${tried.has(c.id) ? "got" : ""}"><span>${c.emoji}</span>${c.label}</div>`
  ).join("");
  const untried = CATEGORIES.filter((c) => !tried.has(c.id));
  $("next-discovery").textContent = untried.length
    ? `🔓 Next discovery: try some ${untried[0].label.toLowerCase()} ${untried[0].emoji}`
    : "🏅 You've tried every kind of LittleJoy art!";

  showLiked("journey-liked", "journey-liked-names", "journey-liked-cards");

  // Still making: tutorials started but not saved as finished yet.
  const unfinished = Store.getInProgress().filter((p) => projectById(p.projectId));
  $("progress-block").hidden = !unfinished.length;
  $("progress-gallery").innerHTML = unfinished.map((p) => {
    const project = projectById(p.projectId);
    const step = Math.min(p.step + 1, project.steps.length);
    return `
    <figure class="creation glass">
      <div class="creation-art">${finalSketch(project)}</div>
      <figcaption>
        <b>${esc(project.name)}</b>
        <span class="cat-tag small">${catTag(project.category)}</span>
        <small>On step ${step} of ${project.steps.length} · started ${esc(fmtDate(p.startedOn))}</small>
        <div class="creation-actions">
          <button class="btn small primary continue-progress" data-id="${esc(p.projectId)}">Continue</button>
          <button class="btn small remove-entry remove-progress" data-id="${esc(p.projectId)}" aria-label="Remove ${esc(project.name)} from Still making">Remove</button>
        </div>
      </figcaption>
    </figure>`;
  }).join("");

  $("gallery").innerHTML = j.length
    ? j.map((x, i) => {
        const project = projectById(x.projectId);
        const art = safeImg(x.photo)
          ? `<img src="${safeImg(x.photo)}" alt="${esc(x.name)}">`
          : project ? finalSketch(project) : `<div class="emoji-art">${esc(x.emoji)}</div>`;
        return `
        <figure class="creation glass">
          <div class="creation-art">${art}</div>
          <figcaption>
            <b>${esc(x.name)}</b>
            <span class="cat-tag small">${catTag(x.category)}</span>
            <span class="stars-small" aria-label="${x.rating || 0} out of 5 stars">${starText(x.rating || 0)}</span>
            <small>Completed ${esc(fmtDate(x.date))}${x.minutes ? ` · ${x.minutes} min` : ""}</small>
            ${x.review ? `<q>${esc(x.review)}</q>` : ""}
            <button class="btn small remove-entry" data-index="${i}" aria-label="Remove ${esc(x.name)} from my journey">Remove</button>
          </figcaption>
        </figure>`;
      }).join("")
    : `<div class="glass panel empty">Nothing here yet — your finished projects will show up here like a scrapbook.</div>`;
}

// Still making cards: "Continue" reopens the tutorial on the saved step; "Remove" forgets it.
$("progress-gallery").addEventListener("click", (e) => {
  const button = e.target.closest(".continue-progress, .remove-progress");
  if (!button) return;
  const saved = Store.getInProgress().find((p) => p.projectId === button.dataset.id);
  const project = saved && projectById(saved.projectId);
  if (!project) return;
  if (button.classList.contains("remove-progress")) {
    if (!confirm(`Remove "${project.name}" from Still making?`)) return;
    Store.removeInProgress(project.id);
    renderJourney();
    return;
  }
  state.from = "journey";
  state.activity = project;
  state.step = Math.min(saved.step, project.steps.length - 1);
  state.startedAt = Date.now();
  renderPrep(); // so "Overview" / Exit lead back to this project
  renderStep();
  go("tutorial");
});

// "Remove" on a My Journey card → confirm, delete it, then redraw (stats, stamps and picks update too).
$("gallery").addEventListener("click", async (e) => {
  const button = e.target.closest(".remove-entry");
  if (!button) return;
  const entry = state.journey[Number(button.dataset.index)];
  if (!entry) return;
  if (!confirm(`Remove "${entry.name}" from your journey?\n\nThis can't be undone (unless you have a backup from your Profile).`)) return;
  button.disabled = true;
  try {
    await Store.removeJourneyEntry(entry);
  } catch (err) {
    alert("Couldn't remove it. Please try again.");
  }
  await refreshJourney();
  renderJourney();
});

// ---------- Screen: Community ----------
$("post-project").innerHTML = ACTIVITIES.map((a) => `<option value="${a.id}">${a.emoji} ${a.name}</option>`).join("");
photoPicker("post-photo", "post-photo-preview", "post-photo-placeholder", (p) => (state.postPhoto = p));

function timeAgo(ms) {
  const mins = Math.round((Date.now() - ms) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  return fmtDate(ms);
}

async function renderCommunity() {
  const needsSignIn = Store.cloudOn() && !Store.signedIn();
  $("post-signin").hidden = !needsSignIn;
  $("post-signin").textContent = "Sign in with Google (on your Profile) to post, like and comment.";
  $("post-submit").disabled = needsSignIn;

  const feed = $("feed");
  feed.innerHTML = `<p class="hint center">Loading creations…</p>`;
  let posts;
  try {
    posts = await Store.getPosts();
  } catch (err) {
    feed.innerHTML = `<div class="glass panel">Couldn't load the Community right now.</div>`;
    return;
  }
  feed.innerHTML = "";
  if (!posts.length) feed.innerHTML = `<div class="glass panel empty">No posts yet — be the first to share!</div>`;
  posts.forEach((p) => feed.appendChild(postCard(p)));
}

function postCard(p) {
  const project = projectById(p.projectId);
  const el = document.createElement("article");
  el.className = "post glass";
  const avatar = safeImg(p.userPhoto)
    ? `<img src="${safeImg(p.userPhoto)}" alt="">`
    : esc((p.userName || "?").charAt(0).toUpperCase());
  const art = safeImg(p.photo)
    ? `<img src="${safeImg(p.photo)}" alt="${esc(p.caption)}">`
    : project ? finalSketch(project) : "";

  el.innerHTML = `
    <header class="post-head">
      <span class="avatar">${avatar}</span>
      <div><b>${esc(p.userName)}</b><small>${timeAgo(p.createdAt)}</small></div>
      ${p.example ? `<span class="badge">Example</span>` : ""}
    </header>
    <div class="post-art">${art}</div>
    <p class="caption">${esc(p.caption)}</p>
    ${project ? `<p class="post-project">${project.emoji} ${project.name} · ${fmtTime(project.time)}</p>` : ""}
    <div class="post-actions">
      <button class="like ${p.liked ? "on" : ""}" aria-pressed="${p.liked}" aria-label="Like">${p.liked ? "♥" : "♡"} ${p.likes}</button>
      <span class="count">💬 ${p.comments.length}</span>
      ${project ? `<button class="btn primary small try">Try this project</button>` : ""}
    </div>
    <div class="comments">
      ${p.comments.map((c) => `<p><b>${esc(c.userName)}</b> ${esc(c.text)}</p>`).join("")}
    </div>
    <form class="comment-form">
      <input type="text" maxlength="300" placeholder="Say something kind…" aria-label="Write a comment" required>
      <button class="btn glassy small" type="submit">Send</button>
    </form>`;

  el.querySelector(".like").addEventListener("click", async () => {
    try {
      await Store.toggleLike(p);
      renderCommunity();
    } catch (err) {
      alert(err.message);
    }
  });
  const tryBtn = el.querySelector(".try");
  if (tryBtn) tryBtn.addEventListener("click", () => pick(project));
  el.querySelector(".comment-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const text = e.target.querySelector("input").value.trim();
    if (!text) return;
    try {
      await Store.addComment(p.id, text);
      renderCommunity();
    } catch (err) {
      alert(err.message);
    }
  });
  return el;
}

$("post-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const caption = $("post-caption").value.trim();
  if (!caption && !state.postPhoto) return alert("Add a photo or a caption first.");
  $("post-submit").disabled = true;
  try {
    await Store.addPost({ projectId: $("post-project").value, caption, photo: state.postPhoto });
    state.postPhoto = null;
    $("post-caption").value = "";
    $("post-photo").value = "";
    $("post-photo-preview").hidden = true;
    $("post-photo-placeholder").hidden = false;
  } catch (err) {
    alert(err.message);
  }
  $("post-submit").disabled = false;
  renderCommunity();
});

// ---------- Screen: Profile ----------
function renderProfile() {
  const u = Store.user();
  $("profile-avatar").innerHTML = u && safeImg(u.photo) ? `<img src="${safeImg(u.photo)}" alt="">` : "🌱";
  $("profile-name").textContent = u ? u.name : "Guest maker";
  $("profile-email").textContent = u ? u.email : "";
  // Google sign-in only shows when Firebase is switched on (FIREBASE_ENABLED in firebase-config.js).
  $("signin").hidden = !Store.cloudOn() || !!u;
  $("signout").hidden = !u;
  $("profile-note").textContent = u
    ? "Your journey, ratings and photos are saved to your account."
    : Store.cloudOn()
      ? "Sign in with Google to save your projects to your account and join the Community. LittleJoy never sees your Google password."
      : "Everything you make is saved automatically in this browser. Download a backup below to keep it safe.";

  const s = journeyStats();
  const counts = {};
  state.journey.forEach((x) => (counts[x.category] = (counts[x.category] || 0) + 1));
  const fav = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  $("profile-stats").innerHTML = `
    <div class="glass stat"><b>${s.count}</b><span>Projects completed</span></div>
    <div class="glass stat"><b>${fmtMinutes(s.minutes)}</b><span>Time creating</span></div>
    <div class="glass stat"><b>${fav ? catTag(fav[0]) : "–"}</b><span>Favorite kind of art</span></div>`;
}

// Profile "Sign in with Google" button → signInWithGoogle() (bottom of this file).
// After a successful sign-in, Store.onUserChange (below) refreshes the profile, avatar and journey.
$("signin").addEventListener("click", async () => {
  if (!Store.cloudOn()) {
    console.info("LittleJoy: add your Firebase keys to firebase-config.js to turn on Google sign-in (see SETUP.md).");
    alert("Google sign-in isn't switched on yet.");
    return;
  }
  await signInWithGoogle();
});
$("signout").addEventListener("click", () => Store.signOut());

// ---------- Backup: download / load the journey as a file ----------
$("backup-download").addEventListener("click", () => {
  const data = Store.exportJourney();
  if (!data.journey.length) return alert("There's nothing to back up yet — finish a project first!");
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `littlejoy-projects-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
});

// The "Load a backup" label opens the hidden file picker (Enter/Space work too).
$("backup-load").addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") { e.preventDefault(); $("backup-file").click(); }
});
$("backup-file").addEventListener("change", async (e) => {
  const file = e.target.files[0];
  e.target.value = ""; // so the same file can be picked again later
  if (!file) return;
  try {
    const added = Store.importJourney(JSON.parse(await file.text()));
    await refreshJourney();
    renderProfile();
    alert(added ? `Loaded ${added} project${added === 1 ? "" : "s"} into your journey! 🌱` : "Those projects are already in your journey.");
  } catch (err) {
    alert(err instanceof SyntaxError ? "That file isn't a LittleJoy backup." : err.message);
  }
});

function updateAvatar() {
  const u = Store.user();
  $("nav-avatar").innerHTML = u && safeImg(u.photo) ? `<img src="${safeImg(u.photo)}" alt="">` : "🙂";
}

// When someone signs in or out, reload their journey and refresh the screen they're on.
Store.onUserChange(async () => {
  const redraw = () => {
    const screen = currentScreen();
    if (["home", "journey", "community", "profile"].includes(screen)) go(screen);
  };
  // Show the signed-in name/photo right away, then load the journey (which may take a moment).
  updateAvatar();
  redraw();
  await refreshJourney();
  redraw();
});

// ---------- Start ----------
(async function start() {
  updateAvatar();
  await refreshJourney();
  go("home");
  await Store.init(); // loads Firebase only if firebase-config.js is filled in
})();

// ---------- Google Sign-In ----------
// Opens the Google sign-in popup (Firebase Authentication) and logs who signed in.
// It uses the same Firebase sign-in as the Profile page, so the journey, photos and
// Community recognise the user. Needs firebase-config.js filled in (see SETUP.md).
async function signInWithGoogle() {
  // Google's popup can't run on a page opened straight from a file (file:///…).
  if (location.protocol === "file:") {
    alert("Google sign-in needs the site to be opened through a local web server.\n\nIn VS Code: right-click index.html → \"Open with Live Server\", then use http://localhost:5500 in the address bar.");
    return null;
  }
  try {
    const user = await Store.signIn();
    console.log("Signed in with Google:", user.displayName, user.email);
    return user;
  } catch (err) {
    console.error("Google sign-in failed:", err.code || "", err.message);
    // Closing the popup isn't an error worth a message.
    if (err.code !== "auth/popup-closed-by-user" && err.code !== "auth/cancelled-popup-request") {
      const reasons = {
        "auth/configuration-not-found": "Google sign-in isn't enabled in Firebase yet (Authentication → Sign-in method → Google).",
        "auth/operation-not-allowed": "Google sign-in isn't enabled in Firebase yet (Authentication → Sign-in method → Google).",
        "auth/unauthorized-domain": `This address (${location.hostname}) isn't allowed yet. Add it in Firebase: Authentication → Settings → Authorized domains.`,
        "auth/popup-blocked": "Your browser blocked the sign-in popup. Allow popups for this site and try again.",
        "auth/operation-not-supported-in-this-environment": "Google sign-in can't run here. Open the site in a normal browser (Chrome, Edge…) through Live Server.",
        "auth/web-storage-unsupported": "This browser window blocks the storage sign-in needs. Open the site in a normal Chrome or Edge window (not a private or built-in preview window).",
        "auth/network-request-failed": "Couldn't reach Google. Check your internet connection and try again.",
      };
      // Unknown problems show their code, so it's easy to look up.
      alert(reasons[err.code] || `Google sign-in didn't work (${err.code || err.message}). Please try again.`);
    }
    return null;
  }
}

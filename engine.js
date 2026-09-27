// The "engine" — the smart parts of LittleJoy.
//
//   recommend(prefs, history)         → 3 projects that fit time, interests, level and materials
//   adapt(project, missingMaterial)   → the same project rewritten without that material
//   becauseYouLiked(history)          → projects similar to the ones you rated highly
//   todaysDiscoveries(count, history) → a few featured projects that change every day
//
// Right now these are rules over ACTIVITIES (data.js). AI can be switched on
// through AI_CONFIG below — the screens call these functions the same way either way.

// ---------- Optional AI connection ----------
// Point `recommendEndpoint` at YOUR OWN server route (for example a Firebase Cloud
// Function or a small Node server) that calls an AI model. Never put an AI API key
// in this file — anything in the browser can be read by anyone.
//
// The server receives:  { prefs, taste, candidates: [{ id, name, category, time, difficulty, materials, tags }] }
// and should answer:    { ids: ["project-id", "project-id", "project-id"] }
// The AI only chooses from `candidates`, which have already passed the material,
// time and level checks — so it can never suggest something you can't do.
const AI_CONFIG = {
  recommendEndpoint: "", // e.g. "https://your-server.example.com/recommend"
  stepImageEndpoint: "", // e.g. "https://your-server.example.com/step-image"
};

const fakeThinking = (ms = 900) => new Promise((r) => setTimeout(r, ms));

const LEVELS = { Beginner: 1, Intermediate: 2, Advanced: 3 };
const USER_LEVELS = { beginner: 1, some: 2, advanced: 3 };

// ---------- Recommend ----------
async function recommend(prefs, history = []) {
  // prefs = { categories: [], time, experience, materials: [] }
  const started = Date.now();
  const candidates = rankProjects(prefs, history);

  let picked = candidates.slice(0, 3);
  if (AI_CONFIG.recommendEndpoint && candidates.length > 3) {
    try {
      const ids = await askAI(prefs, history, candidates.slice(0, 12));
      const fromAI = ids.map((id) => candidates.find((c) => c.activity.id === id)).filter(Boolean);
      if (fromAI.length) picked = [...new Set([...fromAI, ...candidates])].slice(0, 3);
    } catch (err) {
      console.warn("LittleJoy: AI recommendation failed, using built-in picks.", err);
    }
  }

  // Keep the little "thinking" pause so the screen doesn't flash.
  await fakeThinking(Math.max(0, 900 - (Date.now() - started)));

  return picked.map(({ activity, missing }) => {
    // Pre-adapt so every card is doable with what they actually have.
    let a = activity;
    for (const m of missing) a = adaptSync(a, m);
    return { ...a, why: explain(activity, prefs, missing, history) };
  });
}

// What someone can actually use, from what they tapped.
//   • any phone, tablet or computer counts as a "device" (a screen to draw on)
//   • choosing Digital Art means they want to draw on a screen — they're using one right now,
//     and free drawing apps exist for every device, so we count both as available
function expandMaterials(materials) {
  const have = new Set(materials.filter((m) => m !== "nothing"));
  if (have.has("digital") || ["phone", "tablet", "computer"].some((d) => have.has(d))) have.add("device");
  if (have.has("digital")) have.add("drawingapp");
  return have;
}

const wantsDigital = (prefs) => prefs.materials.includes("digital") || prefs.categories.includes("digital");

// Every project that passes the hard rules, best first.
function rankProjects(prefs, history) {
  const have = expandMaterials(prefs.materials);
  const digital = wantsDigital(prefs);
  const userLevel = USER_LEVELS[prefs.experience] || 1;
  const taste = tasteProfile(history);
  const done = completedIds(history);
  const disliked = new Set(history.filter((h) => h.rating && h.rating <= 2).map((h) => h.projectId));

  return ACTIVITIES
    .filter((a) => prefs.time >= 60 || a.time <= prefs.time)
    .filter((a) => LEVELS[a.difficulty] <= userLevel + 1) // at most one step above your level
    .map((a) => {
      const missing = a.materials.filter((m) => !have.has(m));
      return { activity: a, missing, adaptable: missing.every((m) => canSwap(a, m, have)) };
    })
    .filter((x) => x.adaptable) // never suggest something you don't have the materials for
    .map((x) => {
      const a = x.activity;
      let score = 0;
      if (prefs.categories.includes(a.category)) score += 6;
      // Digital Art chosen → digital projects first. (Physical ones only get this far if
      // the person also picked the supplies they need.)
      if (digital) score += a.category === "digital" ? 7 : -2;
      score -= Math.abs(LEVELS[a.difficulty] - userLevel) * 1.5;
      score -= x.missing.length * 1.5; // prefer projects that need no changes
      score += a.materials.filter((m) => have.has(m)).length * 0.8; // prefer projects that use what they picked
      score += Math.min(a.time, prefs.time) / prefs.time; // use the time they have
      score += tasteScore(a, taste);
      if (done.has(a.id)) score -= 8; // don't repeat things they've already made
      if (disliked.has(a.id)) score -= 20;
      score += Math.random() * 0.8; // a little variety each time
      return { ...x, score };
    })
    .sort((a, b) => b.score - a.score);
}

// A missing material can be swapped only if the replacement is something they have
// (or isn't a material at all — like "tearing" or "your hands").
function canSwap(activity, materialId, have) {
  const swap = activity.swaps[materialId];
  if (!swap) return false;
  const isMaterial = MATERIALS.some((m) => m.id === swap.use);
  return !isMaterial || have.has(swap.use);
}

async function askAI(prefs, history, candidates) {
  const res = await fetch(AI_CONFIG.recommendEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prefs,
      taste: tasteProfile(history),
      candidates: candidates.map(({ activity: a }) => ({
        id: a.id, name: a.name, category: a.category, time: a.time,
        difficulty: a.difficulty, materials: a.materials, tags: a.tags,
      })),
    }),
  });
  if (!res.ok) throw new Error(`AI server answered ${res.status}`);
  const data = await res.json();
  return Array.isArray(data.ids) ? data.ids : [];
}

// ---------- Adapt ----------
async function adapt(activity, missingMaterial) {
  await fakeThinking(700);
  return adaptSync(activity, missingMaterial);
}

function adaptSync(activity, missingMaterial) {
  const swap = activity.swaps[missingMaterial];
  const steps = activity.steps.map((s, i) =>
    swap && swap.steps[i] ? { ...s, instruction: swap.steps[i], adapted: true } : s
  );
  const materials = activity.materials.filter((m) => m !== missingMaterial);
  // If the replacement is a real material (e.g. pencil), list it instead.
  if (swap && MATERIALS.some((m) => m.id === swap.use) && !materials.includes(swap.use)) {
    materials.push(swap.use);
  }
  const tip = swap
    ? swap.tip
    : `No ${labelOf(missingMaterial).toLowerCase()}? Improvise with anything similar nearby — the goal is to make something, not to make it perfect.`;
  return {
    ...activity,
    materials,
    steps,
    adaptations: [...(activity.adaptations || []), { missing: missingMaterial, use: swap ? swap.use : null, tip }],
  };
}

// ---------- Personalization ----------
// Turns ratings into likes/dislikes for categories and tags.
// 5 stars → +2, 4 → +1, 3 → 0, 2 → −1, 1 → −2
function tasteProfile(history) {
  const taste = { categories: {}, tags: {} };
  for (const h of history) {
    const a = projectById(h.projectId);
    if (!a || !h.rating) continue;
    const w = h.rating - 3;
    taste.categories[a.category] = (taste.categories[a.category] || 0) + w;
    for (const t of a.tags) taste.tags[t] = (taste.tags[t] || 0) + w;
  }
  return taste;
}

function tasteScore(activity, taste) {
  let s = (taste.categories[activity.category] || 0) * 1.2;
  for (const t of activity.tags) s += (taste.tags[t] || 0) * 0.6;
  return s;
}

function completedIds(history) {
  return new Set(history.map((h) => h.projectId).filter(Boolean));
}

// "Because you liked these…" — returns null until they've rated something 4★ or higher.
function becauseYouLiked(history, count = 3) {
  const liked = history.filter((h) => h.rating >= 4 && projectById(h.projectId));
  if (!liked.length) return null;

  const taste = tasteProfile(history);
  const done = completedIds(history);
  const projects = ACTIVITIES
    .filter((a) => !done.has(a.id))
    .map((a) => ({ a, score: tasteScore(a, taste) }))
    .filter((x) => x.score > 0)
    .sort((x, y) => y.score - x.score)
    .slice(0, count)
    .map((x) => ({ ...x.a, why: `Similar to ${bestMatch(x.a, liked)}` }));

  if (!projects.length) return null;
  const names = [...new Set(liked.sort((x, y) => y.rating - x.rating).map((h) => projectById(h.projectId).name))];
  return { basedOn: names.slice(0, 2), projects };
}

// Which liked project does this one resemble most?
function bestMatch(activity, liked) {
  let best = liked[0], bestShared = -1;
  for (const h of liked) {
    const a = projectById(h.projectId);
    const shared = a.tags.filter((t) => activity.tags.includes(t)).length + (a.category === activity.category ? 1 : 0);
    if (shared > bestShared) { best = h; bestShared = shared; }
  }
  return projectById(best.projectId).name;
}

// ---------- Featured ----------
// A few beginner-friendly picks that change each day (same for the whole day).
function todaysDiscoveries(count = 4, history = []) {
  const done = completedIds(history);
  const today = new Date();
  let seed = today.getFullYear() * 400 + today.getMonth() * 32 + today.getDate();
  const random = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);

  const pool = ACTIVITIES.filter((a) => a.difficulty !== "Advanced" && !done.has(a.id));
  const list = pool.length >= count ? pool : ACTIVITIES;
  return [...list].sort(() => random() - 0.5).slice(0, count);
}

// ---------- Step images ----------
// Hook for AI-generated tutorial sketches. Tutorial steps that already have an
// `image` in data.js never call this. Return an image URL, or null for "no image".
async function generateStepImage(project, stepIndex) {
  if (!AI_CONFIG.stepImageEndpoint) return null;
  try {
    const step = project.steps[stepIndex];
    const res = await fetch(AI_CONFIG.stepImageEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        project: project.name,
        step: stepIndex + 1,
        instruction: step.instruction,
        style: "simple instructional line-art sketch, clean black lines on white, minimal detail, beginner friendly diagram",
      }),
    });
    const data = await res.json();
    return typeof data.url === "string" ? data.url : null;
  } catch {
    return null;
  }
}

// ---------- Helpers ----------
function explain(activity, prefs, missing, history) {
  const bits = [];
  if (prefs.categories.includes(activity.category)) bits.push(`it's ${catLabel(activity.category).toLowerCase()}`);
  bits.push(prefs.time >= 60 ? "fits your free time" : `fits in ${prefs.time} minutes`);
  if (activity.difficulty === "Beginner" && prefs.experience === "beginner") bits.push("great for beginners");
  if (activity.category === "digital" && wantsDigital(prefs)) bits.push("no art supplies needed");
  let s = "Picked because " + bits.join(", ") + ".";

  const liked = history.filter((h) => h.rating >= 4 && projectById(h.projectId) && h.projectId !== activity.id);
  if (liked.length && tasteScore(activity, tasteProfile(history)) > 0) s += ` You enjoyed ${bestMatch(activity, liked)}.`;
  if (missing.length) s += ` Tweaked to work without ${missing.map((m) => labelOf(m).toLowerCase()).join(" or ")}.`;
  return s;
}

function projectById(id) {
  return ACTIVITIES.find((a) => a.id === id);
}
function labelOf(materialId) {
  const m = MATERIALS.find((x) => x.id === materialId);
  return m ? m.label : materialId;
}
function catLabel(id) {
  const c = CATEGORIES.find((x) => x.id === id);
  return c ? c.label : id;
}

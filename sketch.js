// Tutorial illustrations — simple black-and-white, hand-drawn line art.
//
// Every sketch uses the same 240 × 160 drawing area and is built from the
// small helpers in `S` below (each one returns a bit of SVG). The look —
// slightly wobbly black lines on white, handwritten labels — is added
// automatically by sketchSVG() and style.css.
//
// A project can describe its drawing as LAYERS:  project.sketch = [layer0, layer1, ...]
// Then each step's `image` says what to show:
//   image: 2                 → layers 0–1 in light grey (already drawn) + layer 2 in black (draw this now)
//   image: [S.circle(...)]   → a one-off diagram just for this step
//   image: "assets/tutorials/mini-character/step1.png"  → your own picture instead of a drawing
// A step can also have `marks: [...]` — arrows and notes that only appear on that step
// (like "draw it in one loop!"), so they don't pile up in later steps.
//
// DROP-IN PICTURES: put a file at  assets/tutorials/<project id>/step<number>.png
// (e.g. assets/tutorials/mini-character/step1.png) and it replaces that step's
// drawing automatically — no code changes. See assets/tutorials/README.md.
const TUTORIAL_IMAGES = {
  folder: "assets/tutorials",
  extension: "png",
  autoDetect: true, // set to false to stop looking for drop-in pictures
};

const S = {
  circle: (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`,
  ellipse: (cx, cy, rx, ry) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}"/>`,
  rect: (x, y, w, h, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`,
  line: (x1, y1, x2, y2) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`,
  path: (d) => `<path d="${d}"/>`,
  dot: (cx, cy, r = 3) => `<circle class="solid" cx="${cx}" cy="${cy}" r="${r}"/>`,
  // Dashed lines mean "fold here" or "cut here".
  dashed: (d) => `<path class="dashed" d="${d}"/>`,
  dashCircle: (cx, cy, r) => `<circle class="dashed" cx="${cx}" cy="${cy}" r="${r}"/>`,
  label: (x, y, text) => `<text x="${x}" y="${y}">${text}</text>`,

  // A hand-drawn arrow showing movement or direction (gently curved).
  arrow(x1, y1, x2, y2) {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const cx = (x1 + x2) / 2 - ((y2 - y1) / len) * len * 0.14;
    const cy = (y1 + y2) / 2 + ((x2 - x1) / len) * len * 0.14;
    const a = Math.atan2(y2 - cy, x2 - cx);
    const head = (turn) => `${(x2 - 9 * Math.cos(a + turn)).toFixed(1)},${(y2 - 9 * Math.sin(a + turn)).toFixed(1)}`;
    return `<path class="arrow" d="M${x1},${y1} Q${cx.toFixed(1)},${cy.toFixed(1)} ${x2},${y2} M${head(0.5)} L${x2},${y2} L${head(-0.5)}"/>`;
  },

  // A curved arrow that follows part of a circle — shows a "draw around" motion.
  // Angles in degrees: 0 = right, 90 = down.
  curl(cx, cy, r, fromDeg, toDeg) {
    const pt = (deg) => [cx + r * Math.cos((deg * Math.PI) / 180), cy + r * Math.sin((deg * Math.PI) / 180)];
    let d = "";
    for (let i = 0; i <= 24; i++) {
      const [x, y] = pt(fromDeg + ((toDeg - fromDeg) * i) / 24);
      d += `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)} `;
    }
    const [ex, ey] = pt(toDeg);
    const dir = ((toDeg + (toDeg > fromDeg ? 90 : -90)) * Math.PI) / 180; // travel direction at the end
    const head = (turn) => `${(ex - 8 * Math.cos(dir + turn)).toFixed(1)},${(ey - 8 * Math.sin(dir + turn)).toFixed(1)}`;
    return `<path class="arrow" d="${d} M${head(0.5)} L${ex.toFixed(1)},${ey.toFixed(1)} L${head(-0.5)}"/>`;
  },

  // Diagonal shading lines inside a circle (for "color this in").
  hatch(cx, cy, r, gap = 7) {
    let d = "";
    for (let off = -r + gap / 2; off < r; off += gap) {
      const half = Math.sqrt(r * r - off * off);
      const mx = cx + off * 0.7071, my = cy + off * 0.7071;
      d += `M${(mx - half * 0.7071).toFixed(1)},${(my + half * 0.7071).toFixed(1)} L${(mx + half * 0.7071).toFixed(1)},${(my - half * 0.7071).toFixed(1)} `;
    }
    return `<path class="thin" d="${d}"/>`;
  },

  // Diagonal shading lines inside a rectangle.
  hatchRect(x, y, w, h, gap = 7) {
    let d = "";
    for (let k = gap; k < w + h; k += gap) {
      const x1 = x + Math.max(0, k - h), y1 = y + Math.min(h, k);
      const x2 = x + Math.min(w, k), y2 = y + Math.max(0, k - w);
      d += `M${x1},${y1} L${x2},${y2} `;
    }
    return `<path class="thin" d="${d}"/>`;
  },

  stripes(x, y, w, h, gap = 8) {
    let d = "";
    for (let yy = y + gap / 2; yy < y + h; yy += gap) d += `M${x + 4},${yy} L${x + w - 4},${yy} `;
    return `<path class="thin" d="${d}"/>`;
  },

  dots(x, y, w, h, gap = 10) {
    let out = "";
    for (let yy = y + gap / 2; yy < y + h; yy += gap)
      for (let xx = x + gap / 2; xx < x + w; xx += gap) out += S.dot(xx, yy, 1.8);
    return out;
  },

  waves(x, y, w, h, gap = 10) {
    let d = "";
    for (let yy = y + gap / 2; yy < y + h; yy += gap) {
      d += `M${x + 4},${yy} `;
      for (let xx = x + 4; xx < x + w - 8; xx += 8) d += `q4,-4 8,0 `;
    }
    return `<path class="thin" d="${d}"/>`;
  },

  zigzag(x, y, w, h, gap = 10) {
    let d = "";
    for (let yy = y + gap / 2 + 2; yy < y + h; yy += gap) {
      d += `M${x + 4},${yy} `;
      for (let xx = x + 4; xx < x + w - 6; xx += 6) d += `l3,-4 l3,4 `;
    }
    return `<path class="thin" d="${d}"/>`;
  },

  // A spiral from the outside in (paper flowers, galaxies).
  spiral(cx, cy, rMax, turns = 3, dashed = false) {
    let d = "";
    const steps = turns * 36;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const ang = t * turns * Math.PI * 2;
      const r = rMax * (1 - t * 0.85);
      d += `${i ? "L" : "M"}${(cx + r * Math.cos(ang)).toFixed(1)},${(cy + r * Math.sin(ang)).toFixed(1)} `;
    }
    return `<path class="${dashed ? "dashed" : ""}" d="${d}"/>`;
  },

  // A simple round-petal flower.
  flower(cx, cy, r, petals = 6) {
    let out = S.circle(cx, cy, r * 0.45);
    for (let i = 0; i < petals; i++) {
      const a = (i / petals) * Math.PI * 2;
      out += S.circle((cx + r * Math.cos(a)).toFixed(1), (cy + r * Math.sin(a)).toFixed(1), (r * 0.55).toFixed(1));
    }
    return out;
  },

  // A 4-point sparkle star.
  sparkle(cx, cy, s = 8) {
    return S.path(`M${cx},${cy - s} L${cx},${cy + s} M${cx - s},${cy} L${cx + s},${cy}`) + S.dot(cx, cy, 1.5);
  },

  // A grid of squares (pixel art, pattern tiles).
  grid(x, y, cols, rows, size) {
    let d = "";
    for (let c = 0; c <= cols; c++) d += `M${x + c * size},${y} L${x + c * size},${y + rows * size} `;
    for (let r = 0; r <= rows; r++) d += `M${x},${y + r * size} L${x + cols * size},${y + r * size} `;
    return `<path class="thin" d="${d}"/>`;
  },

  // Filled squares on a grid: cells = [[col, row], ...]
  pixels(x, y, size, cells) {
    return cells.map(([c, r]) => `<rect class="solid" x="${x + c * size + 1}" y="${y + r * size + 1}" width="${size - 2}" height="${size - 2}"/>`).join("");
  },

  // Hatched squares on a grid (a lighter "fill").
  pixelsLight(x, y, size, cells) {
    return cells.map(([c, r]) => S.hatchRect(x + c * size, y + r * size, size, size, 5)).join("");
  },

  // `count` shapes spaced evenly around a circle. kind: "dot" | "circle" | "ray"
  ring(cx, cy, radius, count, size, kind = "dot") {
    let out = "";
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2;
      const x = +(cx + radius * Math.cos(a)).toFixed(1), y = +(cy + radius * Math.sin(a)).toFixed(1);
      if (kind === "dot") out += S.dot(x, y, size);
      else if (kind === "circle") out += S.circle(x, y, size);
      else out += S.line(x, y, +(x + size * Math.cos(a)).toFixed(1), +(y + size * Math.sin(a)).toFixed(1));
    }
    return out;
  },

  // Filled areas (digital fill-bucket / color layer). Shown as outlines only, to keep the sketch black and white.
  flat: (shapes) => `<g class="flat">${shapes}</g>`,
  // A white shine dot (eye highlights, glossy spots).
  shine: (cx, cy, r = 3) => `<circle class="shine" cx="${cx}" cy="${cy}" r="${r}"/>`,
  heart: (x, y, s) => `<path d="M${x},${y + s * 0.8} C${x - s * 1.5},${y - s * 0.1} ${x - s * 0.6},${y - s * 1.1} ${x},${y - s * 0.35} C${x + s * 0.6},${y - s * 1.1} ${x + s * 1.5},${y - s * 0.1} ${x},${y + s * 0.8} Z"/>`,
  // A stylus pointing at (x, y) — use in `marks` to show where to draw.
  stylus: (x, y) => `<path class="stylus" d="M${x},${y} l3,-9 l18,-18 l6,6 l-18,18 Z M${x + 3},${y - 9} l6,6"/>`,
  // A row of cursive "e" loops starting at (x, y).
  loops(x, y, count, size) {
    let d = `M${x},${y}`;
    for (let i = 0; i < count; i++) d += ` c${size * 1.2},${-size * 1.6} ${-size * 0.2},${-size * 1.6} ${size * 0.6},0`;
    return `<path d="${d}"/>`;
  },

  // A simple stick figure standing with its head at (x, y).
  stick(x, y) {
    return S.circle(x, y, 10) + S.path(`M${x},${y + 10} L${x},${y + 35} M${x},${y + 35} L${x - 8},${y + 52} M${x},${y + 35} L${x + 8},${y + 52} M${x},${y + 18} L${x - 10},${y + 28} M${x},${y + 18} L${x + 10},${y + 28}`);
  },
};

// ---------- The sketch style ----------
// Black line art on white. What you already drew is light grey; what to draw
// in THIS step is black. Colors live in style.css (.sketch), not here.

// The wobbly "hand-drawn" filter, added to the page once and shared by every sketch.
(function addSketchFilter() {
  document.body.insertAdjacentHTML(
    "afterbegin",
    `<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>
      <filter id="lj-hand" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.055" numOctaves="2" seed="7" result="noise"/>
        <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.6" xChannelSelector="R" yChannelSelector="G"/>
      </filter></defs></svg>`
  );
})();

// ---------- Turning image data into HTML ----------

// Layers: `was` = light grey (already drawn), `now` = black (draw this now),
// `marks` = arrows/notes just for this step.
function sketchSVG(oldShapes, newShapes, { cls = "", marks = "", step = null } = {}) {
  return `<svg class="sketch ${cls}" viewBox="-12 -16 264 188" role="img" aria-label="${step ? `Step ${step} sketch` : "Project sketch"}">
    <g filter="url(#lj-hand)">
      <g class="was">${oldShapes}</g>
      <g class="now">${newShapes}</g>
      <g class="marks">${marks}</g>
    </g>
    ${step ? `<text class="step-tag" x="-6" y="-3">step ${step}</text>` : ""}
  </svg>`;
}

// ---------- Digital projects: the same drawings, shown inside a simple drawing-app screen ----------
// Earlier strokes look like a blue "sketch layer", new strokes are clean ink, and the
// toolbar + Layers panel show which tool and layer each step uses
// (set `tool` and `layer` on a step, and `layers` on the project, top layer first).

const isDigital = (project) => project.category === "digital";

const TOOL_ICONS = {
  brush: (x, y) => `M${x - 5},${y + 5} L${x + 2},${y - 2} M${x},${y - 4} l4,-4 l3,3 l-4,4 Z`,
  eraser: (x, y) => `M${x - 6},${y + 1} l6,-6 l6,6 l-6,6 Z M${x - 3},${y - 2} l6,6`,
  fill: (x, y) => `M${x - 6},${y - 1} l5,-5 l6,6 l-5,5 Z M${x + 6},${y + 2} q2,3 0,4 q-2,-1 0,-4`,
  select: (x, y) => `M${x - 6},${y - 5} h12 v10 h-12 Z`,
  text: (x, y) => `M${x - 5},${y - 5} h10 M${x},${y - 5} v11`,
  eyedropper: (x, y) => `M${x - 6},${y + 6} l9,-9 M${x + 1},${y - 5} l4,4 M${x + 2},${y - 7} l5,5`,
};

// `pieces` = [{ shapes, kind }] in stacking order, bottom first.
// kind: "sketch" (faint sketch layer), "kept" (finished lines from earlier steps), "now" (this step)
function digitalSVG(pieces, { cls = "", marks = "", step = null, layers = [], layer = null, tool = null } = {}) {
  const hasPanel = layers.length > 0;
  const toolbar = Object.keys(TOOL_ICONS).map((t, i) => {
    const y = 14 + i * 22;
    return (t === tool ? `<rect class="ui-active" x="-13" y="${y - 9}" width="17" height="18" rx="5"/>` : "") +
      `<path class="ui-icon${t === "select" ? " ui-dash" : ""}" d="${TOOL_ICONS[t](-4.5, y)}"/>`;
  }).join("");
  const panel = hasPanel
    ? `<path class="ui-line" d="M196,-3 V171"/><text class="ui-text" x="202" y="13">Layers</text>` +
      layers.map((name, i) => {
        const y = 19 + i * 17;
        return `<rect class="${name === layer ? "ui-active" : "ui-row"}" x="200" y="${y}" width="53" height="14" rx="4"/>` +
          `<text class="ui-text" x="205" y="${y + 10}">${name}</text>`;
      }).join("")
    : "";
  // Fit the 240 × 160 drawing into the canvas area (narrower when the Layers panel is showing).
  const place = hasPanel ? "translate(12 23.5) scale(0.758)" : "translate(14 6) scale(0.975)";
  const title = step ? `step ${step}${layer ? " · " + layer + " layer" : ""}` : "";
  return `<svg class="sketch digital ${cls}" viewBox="-24 -20 288 196" role="img" aria-label="${step ? `Step ${step} on a digital canvas` : "Digital project preview"}">
    <rect class="ui-frame" x="-17" y="-15" width="274" height="186" rx="12"/>
    <path class="ui-line" d="M-17,-3 H257 M8,-3 V171"/>
    <circle class="ui-dot" cx="-8" cy="-9" r="2.2"/><circle class="ui-dot" cx="-1" cy="-9" r="2.2"/><circle class="ui-dot" cx="6" cy="-9" r="2.2"/>
    ${title ? `<text class="ui-text ui-title" x="120" y="-6">${title}</text>` : ""}
    ${toolbar}
    <rect class="ui-canvas" x="12" y="3" width="${hasPanel ? 181 : 241}" height="164" rx="3"/>
    ${panel}
    <g transform="${place}">
      ${pieces.map((p) => `<g class="${p.kind === "now" ? "now" : p.kind === "sketch" ? "was" : "kept"}">${p.shapes}</g>`).join("")}
      <g class="marks">${marks}</g>
    </g>
  </svg>`;
}

// Which app layer each drawing layer belongs to (from the first step that shows it).
function appLayerOf(project, sketchIndex) {
  const step = project.steps.find((s) => s.image === sketchIndex);
  return step ? step.layer : undefined;
}

// Stack a digital project's drawing layers the way the app would: lower app layers first,
// so a Color layer sits under the Ink instead of covering it.
function digitalPieces(project, upTo, currentIndex) {
  const order = project.layers || [];
  const rank = (name) => (order.includes(name) ? order.length - order.indexOf(name) : order.length + 1); // bigger = higher
  return project.sketch.slice(0, upTo + 1)
    .map((shapes, i) => {
      const name = appLayerOf(project, i);
      const kind = i === currentIndex ? "now" : name === "Sketch" ? "sketch" : "kept";
      return { shapes: shapes.join(""), kind, rank: rank(name), i };
    })
    .sort((a, b) => a.rank - b.rank || a.i - b.i);
}

// Layers that exist by this step (a layer appears from the first step that uses it).
function layersAt(project, stepIndex) {
  return (project.layers || []).filter((name) => {
    const first = project.steps.findIndex((s) => s.layer === name);
    return first === -1 || first <= stepIndex;
  });
}

// The built-in drawing for one tutorial step. Returns "" if the step has no picture.
function stepImage(project, stepIndex) {
  const step = project.steps[stepIndex];
  const img = step.image;
  if (typeof img === "string") {
    return `<img class="step-photo" src="${img}" alt="Step ${stepIndex + 1} of ${project.name}">`;
  }
  const options = {
    marks: (step.marks || []).join(""),
    step: stepIndex + 1,
    layers: layersAt(project, stepIndex),
    layer: step.layer,
    tool: step.tool,
  };
  if (isDigital(project)) {
    if (typeof img === "number" && project.sketch) return digitalSVG(digitalPieces(project, img, img), options);
    if (Array.isArray(img)) return digitalSVG([{ shapes: img.join(""), kind: "now" }], options);
    return "";
  }
  if (typeof img === "number" && project.sketch) {
    const old = project.sketch.slice(0, img).flat().join("");
    const now = (project.sketch[img] || []).join("");
    return sketchSVG(old, now, options);
  }
  if (Array.isArray(img)) return sketchSVG("", img.join(""), options);
  return "";
}

// A small "what you'll make" drawing for cards and previews.
function finalSketch(project) {
  const options = { cls: "done" };
  const lastDrawn = [...project.steps].reverse().find((s) => Array.isArray(s.image));
  if (isDigital(project)) {
    // The finished piece: every layer except the Sketch (artists hide it at the end).
    if (project.sketch) {
      const pieces = digitalPieces(project, project.sketch.length - 1, -1).filter((p) => p.kind !== "sketch");
      return digitalSVG(pieces.map((p) => ({ ...p, kind: "kept" })), options);
    }
    if (lastDrawn) return digitalSVG([{ shapes: lastDrawn.image.join(""), kind: "kept" }], options);
  }
  if (project.sketch) return sketchSVG("", project.sketch.flat().join(""), options);
  if (lastDrawn) return sketchSVG("", lastDrawn.image.join(""), options);
  return `<div class="emoji-art">${project.emoji}</div>`;
}

// ---------- Drop-in pictures ----------

function droppedImagePath(project, stepIndex) {
  return `${TUTORIAL_IMAGES.folder}/${project.id}/step${stepIndex + 1}.${TUTORIAL_IMAGES.extension}`;
}

// Resolves to the picture's path if the file exists, otherwise null. Each file is only checked once.
const droppedImageChecks = new Map();
function findDroppedImage(project, stepIndex) {
  if (!TUTORIAL_IMAGES.autoDetect) return Promise.resolve(null);
  const path = droppedImagePath(project, stepIndex);
  if (!droppedImageChecks.has(path)) {
    droppedImageChecks.set(path, new Promise((resolve) => {
      const probe = new Image();
      probe.onload = () => resolve(path);
      probe.onerror = () => resolve(null);
      probe.src = path;
    }));
  }
  return droppedImageChecks.get(path);
}

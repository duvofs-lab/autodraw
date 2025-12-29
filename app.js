const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadSvgBtn = document.getElementById("downloadSvgBtn");
const thickerBtn = document.getElementById("thickerBtn");
const thinnerBtn = document.getElementById("thinnerBtn");
const colorPicker = document.getElementById("colorPicker");

const suggestionsEl = document.getElementById("suggestions");
const suggestionList = document.getElementById("suggestionList");

let drawing = false;
let currentPath = [];
let elements = [];
let undoneElements = [];

let currentStrokeWidth = 4;
let currentColor = colorPicker.value;

const MIN_WIDTH = 2;
const MAX_WIDTH = 14;

const ICONS = [
  { file: "icons/line.svg", type: "straight" },
  { file: "icons/curve.svg", type: "curve" },
  { file: "icons/circle.svg", type: "closed" },
  { file: "icons/square.svg", type: "closed" },
  { file: "icons/arrow.svg", type: "straight" },
  { file: "icons/cloud.svg", type: "curve" }
];

/* ================= CANVAS ================= */

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  redraw();
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ================= DRAWING ================= */

canvas.addEventListener("pointerdown", e => {
  drawing = true;
  currentPath = [{ x: e.offsetX, y: e.offsetY }];
});

canvas.addEventListener("pointermove", e => {
  if (!drawing) return;
  currentPath.push({ x: e.offsetX, y: e.offsetY });
  redraw();
  drawStroke({
    path: currentPath,
    width: currentStrokeWidth,
    color: currentColor
  });
});

canvas.addEventListener("pointerup", finishStroke);
canvas.addEventListener("pointerleave", finishStroke);

function finishStroke() {
  if (!drawing) return;
  drawing = false;

  elements.push({
    type: "stroke",
    path: currentPath,
    width: currentStrokeWidth,
    color: currentColor
  });

  undoneElements = [];
  analyzeAndSuggest();
}

/* ================= ANALYSIS ================= */

function analyzeAndSuggest() {
  let isClosed = false;
  let curveScore = 0;

  elements.forEach(el => {
    if (el.type !== "stroke") return;
    const p = el.path;
    if (p.length > 10) {
      const d = Math.hypot(
        p[0].x - p[p.length - 1].x,
        p[0].y - p[p.length - 1].y
      );
      if (d < 20) isClosed = true;
      curveScore += p.length;
    }
  });

  let type = "straight";
  if (isClosed) type = "closed";
  else if (curveScore > 40) type = "curve";

  showSuggestions(type);
}

/* ================= SUGGESTIONS ================= */

function showSuggestions(type) {
  suggestionList.innerHTML = "";
  suggestionsEl.style.display = "block";

  ICONS.filter(i => i.type === type).forEach(icon => {
    const div = document.createElement("div");
    div.className = "suggestion";
    div.innerHTML = `<img src="${icon.file}">`;
    div.onclick = () => addIcon(icon.file);
    suggestionList.appendChild(div);
  });
}

function addIcon(src) {
  // remove last stroke
  for (let i = elements.length - 1; i >= 0; i--) {
    if (elements[i].type === "stroke") {
      elements.splice(i, 1);
      break;
    }
  }

  const size = Math.min(canvas.width, canvas.height) * 0.4;
  const x = Math.round((canvas.width - size) / 2);
  const y = Math.round((canvas.height - size) / 2);

  elements.push({ type: "icon", src, x, y, size });
  undoneElements = [];
  redraw();
}

/* ================= RENDER ================= */

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  elements.forEach(el => {
    if (el.type === "stroke") drawStroke(el);
    if (el.type === "icon") {
      const img = new Image();
      img.src = el.src;
      img.onload = () => ctx.drawImage(img, el.x, el.y, el.size, el.size);
    }
  });
}

function drawStroke(stroke) {
  ctx.beginPath();
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.strokeStyle = stroke.color;
  stroke.path.forEach((p, i) =>
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
  );
  ctx.stroke();
}

/* ================= CONTROLS ================= */

undoBtn.onclick = () => {
  if (!elements.length) return;
  undoneElements.push(elements.pop());
  redraw();
};

redoBtn.onclick = () => {
  if (!undoneElements.length) return;
  elements.push(undoneElements.pop());
  redraw();
};

clearBtn.onclick = () => {
  elements = [];
  undoneElements = [];
  suggestionsEl.style.display = "none";
  redraw();
};

thickerBtn.onclick = () =>
  (currentStrokeWidth = Math.min(MAX_WIDTH, currentStrokeWidth + 2));
thinnerBtn.onclick = () =>
  (currentStrokeWidth = Math.max(MIN_WIDTH, currentStrokeWidth - 2));

colorPicker.onchange = e => (currentColor = e.target.value);

/* ================= EXPORT ================= */

downloadBtn.onclick = () => {
  const a = document.createElement("a");
  a.download = `duvofs-draw-${Date.now()}.png`;
  a.href = canvas.toDataURL("image/png");
  a.click();
};

downloadSvgBtn.onclick = () => {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`;

  elements.forEach(el => {
    if (el.type === "stroke") {
      const d = el.path
        .map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`)
        .join(" ");
      svg += `<path d="${d}" fill="none" stroke="${el.color}" stroke-width="${el.width}" stroke-linecap="round"/>`;
    }
    if (el.type === "icon") {
      svg += `<image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.size}" height="${el.size}"/>`;
    }
  });

  svg += "</svg>";

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `duvofs-draw-${Date.now()}.svg`;
  a.click();
  URL.revokeObjectURL(url);
};

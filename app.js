const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const thickerBtn = document.getElementById("thickerBtn");
const thinnerBtn = document.getElementById("thinnerBtn");

const downloadSvgBtn = document.getElementById("downloadSvgBtn");

const suggestionsEl = document.getElementById("suggestions");
const suggestionList = document.getElementById("suggestionList");

let drawing = false;
let currentPath = [];
let elements = [];
let undoneElements = [];

let currentStrokeWidth = 4;
const MIN_WIDTH = 2;
const MAX_WIDTH = 12;

const ICONS = [
  { file: "icons/line.svg", type: "straight" },
  { file: "icons/curve.svg", type: "curve" },
  { file: "icons/circle.svg", type: "closed" },
  { file: "icons/square.svg", type: "closed" },
  { file: "icons/arrow.svg", type: "straight" },
  { file: "icons/cloud.svg", type: "curve" }
];

function drawPreviewStroke(path) {
  if (path.length < 2) return;

  ctx.beginPath();
  ctx.lineWidth = currentStrokeWidth;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3b82f6";

  path.forEach((p, i) => {
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  });

  ctx.stroke();
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width;
  canvas.height = rect.height;
  redraw();
}

window.addEventListener("resize", resizeCanvas);
resizeCanvas();

canvas.addEventListener("pointerdown", startDraw);
canvas.addEventListener("pointermove", draw);
canvas.addEventListener("pointerup", endDraw);
canvas.addEventListener("pointerleave", endDraw);

/* ================= DRAWING ================= */

function startDraw(e) {
  drawing = true;
  currentPath = [{ x: e.offsetX, y: e.offsetY }];
}

function draw(e) {
  if (!drawing) return;

  currentPath.push({ x: e.offsetX, y: e.offsetY });
  redraw();
  drawPreviewStroke(currentPath);
}

function endDraw() {
  if (!drawing) return;
  drawing = false;

  elements.push({
    type: "stroke",
    path: currentPath,
    width: currentStrokeWidth
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
    const path = el.path;
    if (path.length > 10) {
      const start = path[0];
      const end = path[path.length - 1];
      if (Math.hypot(end.x - start.x, end.y - start.y) < 20) {
        isClosed = true;
      }
      curveScore += path.length;
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
    div.innerHTML = `<img src="${icon.file}" />`;
    div.onclick = () => addIcon(icon.file);
    suggestionList.appendChild(div);
  });
}

function addIcon(src) {
  // Remove last stroke (the one that triggered suggestions)
  for (let i = elements.length - 1; i >= 0; i--) {
    if (elements[i].type === "stroke") {
      elements.splice(i, 1);
      break;
    }
  }

  const size = Math.min(canvas.width, canvas.height) * 0.4;

  elements.push({
    type: "icon",
    src,
    x: (canvas.width - size) / 2,
    y: (canvas.height - size) / 2,
    size
  });

  undoneElements = [];
  redraw();
}

/* ================= RENDER ================= */

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  elements.forEach(el => {
    if (el.type === "stroke") {
      drawStroke(el);
    } else if (el.type === "icon") {
      const img = new Image();
      img.src = el.src;
      img.onload = () => {
        ctx.drawImage(img, el.x, el.y, el.size, el.size);
      };
    }
  });
}

function drawStroke(stroke) {
  ctx.beginPath();
  ctx.lineWidth = stroke.width;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3b82f6";

  stroke.path.forEach((p, i) => {
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
  });
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
  redraw();
  suggestionsEl.style.display = "none";
};

/* ================= STROKE SIZE ================= */

thickerBtn.onclick = () => {
  currentStrokeWidth = Math.min(MAX_WIDTH, currentStrokeWidth + 2);
};

thinnerBtn.onclick = () => {
  currentStrokeWidth = Math.max(MIN_WIDTH, currentStrokeWidth - 2);
};

/* ================= DOWNLOAD ================= */

downloadBtn.onclick = () => {
  const link = document.createElement("a");
  link.download = `duvofs-draw-${Date.now()}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
};

const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

/* ===== UI ELEMENTS ===== */
const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const downloadSvgBtn = document.getElementById("downloadSvgBtn");

const drawToolBtn = document.getElementById("drawToolBtn");
const selectToolBtn = document.getElementById("selectToolBtn");

const thickerBtn = document.getElementById("thickerBtn");
const thinnerBtn = document.getElementById("thinnerBtn");
const colorPicker = document.getElementById("colorPicker");

const suggestionsEl = document.getElementById("suggestions");
const suggestionList = document.getElementById("suggestionList");

/* ===== STATE ===== */
let tool = "draw";
let drawing = false;
let currentPath = [];
let elements = [];
let undone = [];
let selectedIndex = null;

let strokeWidth = 4;
let strokeColor = colorPicker.value;

/* ===== ICON LIBRARY ===== */
const ICONS = [
  { file: "icons/line.svg", type: "line" },
  { file: "icons/arrow.svg", type: "line" },
  { file: "icons/circle.svg", type: "circle" },
  { file: "icons/square.svg", type: "square" },
  { file: "icons/curve.svg", type: "curve" },
  { file: "icons/cloud.svg", type: "cloud" }
];

/* ===== CANVAS ===== */
function resize() {
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width;
  canvas.height = r.height;
  redraw();
}
window.addEventListener("resize", resize);
resize();

/* ===== TOOLS ===== */
drawToolBtn.onclick = () => tool = "draw";
selectToolBtn.onclick = () => tool = "select";

/* ===== DRAWING ===== */
canvas.onpointerdown = e => {
  if (tool !== "draw") return;
  drawing = true;
  currentPath = [{ x: e.offsetX, y: e.offsetY }];
};

canvas.onpointermove = e => {
  if (!drawing || tool !== "draw") return;
  currentPath.push({ x: e.offsetX, y: e.offsetY });
  redraw();
  drawStroke({ path: currentPath, width: strokeWidth, color: strokeColor });
};

canvas.onpointerup = finishStroke;
canvas.onpointerleave = finishStroke;

function finishStroke() {
  if (!drawing) return;
  drawing = false;

  elements.push({
    type: "stroke",
    path: currentPath,
    width: strokeWidth,
    color: strokeColor
  });

  undone = [];
  analyzeAndSuggest(currentPath);
}

/* ===== SHAPE ANALYSIS ===== */
function analyzeAndSuggest(path) {
  suggestionList.innerHTML = "";
  suggestionsEl.style.display = "block";

  const start = path[0];
  const end = path[path.length - 1];
  const closed = distance(start, end) < 20;

  const bounds = getStrokeBounds({ path });
  const aspect = bounds.width / bounds.height;

  let detected;

  if (!closed && bounds.width > bounds.height * 2) {
    detected = "line";
  } else if (closed && aspect > 0.8 && aspect < 1.2) {
    detected = "circle";
  } else if (closed && (aspect < 0.8 || aspect > 1.2)) {
    detected = "square";
  } else if (!closed) {
    detected = "curve";
  } else {
    detected = "cloud";
  }

  ICONS.filter(i => i.type === detected || (detected === "line" && i.type === "arrow"))
    .forEach(icon => {
      const d = document.createElement("div");
      d.className = "suggestion";
      d.innerHTML = `<img src="${icon.file}">`;
      d.onclick = () => replaceWithIcon(icon.file);
      suggestionList.appendChild(d);
    });
}

/* ===== HELPERS ===== */
function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function getStrokeBounds(stroke) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  stroke.path.forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  return {
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
    width: maxX - minX,
    height: maxY - minY,
    size: Math.max(maxX - minX, maxY - minY) * 1.3
  };
}

/* ===== ICON REPLACEMENT ===== */
function replaceWithIcon(src) {
  let lastStroke;

  for (let i = elements.length - 1; i >= 0; i--) {
    if (elements[i].type === "stroke") {
      lastStroke = elements[i];
      elements.splice(i, 1);
      break;
    }
  }

  if (!lastStroke) return;

  const b = getStrokeBounds(lastStroke);
  const size = Math.max(40, b.size);

  elements.push({
    type: "icon",
    src,
    x: b.centerX - size / 2,
    y: b.centerY - size / 2,
    size
  });

  redraw();
}

/* ===== RENDER ===== */
function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  elements.forEach((el, i) => {
    if (el.type === "stroke") drawStroke(el);
    if (el.type === "icon") {
      const img = new Image();
      img.src = el.src;
      img.onload = () => ctx.drawImage(img, el.x, el.y, el.size, el.size);
    }
  });
}

function drawStroke(s) {
  ctx.beginPath();
  ctx.lineWidth = s.width;
  ctx.strokeStyle = s.color;
  ctx.lineCap = "round";
  s.path.forEach((p, i) =>
    i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)
  );
  ctx.stroke();
}

/* ===== CONTROLS ===== */
thickerBtn.onclick = () => strokeWidth = Math.min(14, strokeWidth + 2);
thinnerBtn.onclick = () => strokeWidth = Math.max(2, strokeWidth - 2);
colorPicker.onchange = e => strokeColor = e.target.value;

undoBtn.onclick = () => { if (elements.length) { undone.push(elements.pop()); redraw(); } };
redoBtn.onclick = () => { if (undone.length) { elements.push(undone.pop()); redraw(); } };
clearBtn.onclick = () => { elements = []; undone = []; redraw(); };

/* ===== EXPORT ===== */
downloadBtn.onclick = () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL("image/png");
  a.download = `duvofs-draw-${Date.now()}.png`;
  a.click();
};

downloadSvgBtn.onclick = () => {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`;
  elements.forEach(el => {
    if (el.type === "stroke") {
      const d = el.path.map((p,i)=>`${i?"L":"M"}${p.x} ${p.y}`).join(" ");
      svg += `<path d="${d}" stroke="${el.color}" stroke-width="${el.width}" fill="none" stroke-linecap="round"/>`;
    }
    if (el.type === "icon") {
      svg += `<image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.size}" height="${el.size}"/>`;
    }
  });
  svg += "</svg>";

  const blob = new Blob([svg], { type: "image/svg+xml" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `duvofs-draw-${Date.now()}.svg`;
  a.click();
};

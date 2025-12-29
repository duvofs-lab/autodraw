const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");

const suggestionsEl = document.getElementById("suggestions");
const suggestionList = document.getElementById("suggestionList");

let drawing = false;
let paths = [];
let undonePaths = [];
let currentPath = [];

const ICONS = [
  { name: "line", file: "icons/line.svg", type: "straight" },
  { name: "curve", file: "icons/curve.svg", type: "curve" },
  { name: "circle", file: "icons/circle.svg", type: "closed" },
  { name: "square", file: "icons/square.svg", type: "box" },
  { name: "arrow", file: "icons/arrow.svg", type: "straight" },
  { name: "cloud", file: "icons/cloud.svg", type: "curve" }
];

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

function startDraw(e) {
  drawing = true;
  currentPath = [];
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
  currentPath.push({ x: e.offsetX, y: e.offsetY });
}

function draw(e) {
  if (!drawing) return;
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3b82f6";
  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();
  currentPath.push({ x: e.offsetX, y: e.offsetY });
}

function endDraw() {
  if (!drawing) return;
  drawing = false;
  paths.push(currentPath);
  undonePaths = [];
  analyzeAndSuggest();
}

function analyzeAndSuggest() {
  if (!paths.length) return;

  let isClosed = false;
  let curveScore = 0;

  paths.forEach(path => {
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

function showSuggestions(type) {
  suggestionList.innerHTML = "";
  suggestionsEl.style.display = "block";

  ICONS.filter(i => i.type === type).forEach(icon => {
    const div = document.createElement("div");
    div.className = "suggestion";
    div.innerHTML = `<img src="${icon.file}" />`;
    div.onclick = () => replaceWithIcon(icon.file);
    suggestionList.appendChild(div);
  });
}

function replaceWithIcon(src) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  paths = [];

  const img = new Image();
  img.onload = () => {
    const size = Math.min(canvas.width, canvas.height) * 0.6;
    ctx.drawImage(
      img,
      (canvas.width - size) / 2,
      (canvas.height - size) / 2,
      size,
      size
    );
  };
  img.src = src;
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3b82f6";

  paths.forEach(path => {
    ctx.beginPath();
    path.forEach((p, i) => {
      i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();
  });
}

/* ================= DOWNLOAD ================= */

downloadBtn.addEventListener("click", () => {
  const link = document.createElement("a");
  link.download = "duvofs-draw.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
});

/* ================= CONTROLS ================= */

undoBtn.addEventListener("click", () => {
  if (!paths.length) return;
  undonePaths.push(paths.pop());
  redraw();
});

redoBtn.addEventListener("click", () => {
  if (!undonePaths.length) return;
  paths.push(undonePaths.pop());
  redraw();
});

clearBtn.addEventListener("click", () => {
  paths = [];
  undonePaths = [];
  redraw();
  suggestionsEl.style.display = "none";
});

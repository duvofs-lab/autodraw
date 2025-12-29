const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

const undoBtn = document.getElementById("undoBtn");
const redoBtn = document.getElementById("redoBtn");
const clearBtn = document.getElementById("clearBtn");

let drawing = false;
let paths = [];
let undonePaths = [];
let currentPath = [];

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
  currentPath = [];
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
  currentPath.push({ x: e.offsetX, y: e.offsetY, t: Date.now() });
}

function draw(e) {
  if (!drawing) return;

  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3b82f6";

  ctx.lineTo(e.offsetX, e.offsetY);
  ctx.stroke();

  currentPath.push({ x: e.offsetX, y: e.offsetY, t: Date.now() });
}

function endDraw() {
  if (!drawing) return;
  drawing = false;
  paths.push(currentPath);
  undonePaths = [];

  analyzeDrawing(); // 👈 SMART PART
}

/* ================= ANALYSIS ================= */

function analyzeDrawing() {
  const analysis = {
    strokeCount: paths.length,
    totalPoints: 0,
    boundingBox: getBoundingBox(),
    curvatureScore: 0,
    closedShapes: 0
  };

  paths.forEach(path => {
    analysis.totalPoints += path.length;
    analysis.curvatureScore += getCurvature(path);
    if (isClosed(path)) analysis.closedShapes++;
  });

  analysis.curvatureScore = Number(
    (analysis.curvatureScore / paths.length).toFixed(2)
  );

  console.clear();
  console.log("🧠 Drawing Analysis:", analysis);
}

/* ================= HELPERS ================= */

function getBoundingBox() {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  paths.flat().forEach(p => {
    minX = Math.min(minX, p.x);
    minY = Math.min(minY, p.y);
    maxX = Math.max(maxX, p.x);
    maxY = Math.max(maxY, p.y);
  });

  return {
    width: Math.round(maxX - minX),
    height: Math.round(maxY - minY)
  };
}

function getCurvature(path) {
  let curve = 0;
  for (let i = 1; i < path.length - 1; i++) {
    const a = path[i - 1];
    const b = path[i];
    const c = path[i + 1];

    const angle = Math.abs(
      Math.atan2(c.y - b.y, c.x - b.x) -
      Math.atan2(a.y - b.y, a.x - b.x)
    );

    curve += angle;
  }
  return curve;
}

function isClosed(path) {
  if (path.length < 10) return false;
  const start = path[0];
  const end = path[path.length - 1];
  const distance = Math.hypot(end.x - start.x, end.y - start.y);
  return distance < 20;
}

/* ================= REDRAW ================= */

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
  console.clear();
});

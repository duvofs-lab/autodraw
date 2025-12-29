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
}

function redraw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.strokeStyle = "#3b82f6";

  paths.forEach(path => {
    ctx.beginPath();
    path.forEach((point, index) => {
      if (index === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    });
    ctx.stroke();
  });
}

undoBtn.addEventListener("click", () => {
  if (paths.length === 0) return;
  undonePaths.push(paths.pop());
  redraw();
});

redoBtn.addEventListener("click", () => {
  if (undonePaths.length === 0) return;
  paths.push(undonePaths.pop());
  redraw();
});

clearBtn.addEventListener("click", () => {
  paths = [];
  undonePaths = [];
  redraw();
});


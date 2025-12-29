const canvas = document.getElementById("drawCanvas");
const ctx = canvas.getContext("2d");

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

let tool = "draw";
let drawing = false;
let currentPath = [];
let elements = [];
let undone = [];
let selectedIndex = null;

let strokeWidth = 4;
let strokeColor = colorPicker.value;

const ICONS = [
  { file: "icons/curve.svg", type: "curve" },
  { file: "icons/cloud.svg", type: "curve" }
];

function resize() {
  const r = canvas.getBoundingClientRect();
  canvas.width = r.width;
  canvas.height = r.height;
  redraw();
}
window.onresize = resize;
resize();

/* ================= TOOLS ================= */

drawToolBtn.onclick = () => tool = "draw";
selectToolBtn.onclick = () => tool = "select";

/* ================= DRAW ================= */

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

canvas.onpointerup = () => {
  if (!drawing) return;
  drawing = false;

  elements.push({
    type: "stroke",
    path: currentPath,
    width: strokeWidth,
    color: strokeColor
  });

  undone = [];
  analyze();
};

/* ================= SELECT ================= */

canvas.onclick = e => {
  if (tool !== "select") return;
  selectedIndex = elements.findIndex(el => hitTest(el, e.offsetX, e.offsetY));
  redraw();
};

function hitTest(el, x, y) {
  if (el.type === "icon") {
    return x >= el.x && x <= el.x + el.size &&
           y >= el.y && y <= el.y + el.size;
  }
  return false;
}

/* ================= ANALYZE ================= */

function analyze() {
  showSuggestions("curve");
}

function showSuggestions(type) {
  suggestionList.innerHTML = "";
  suggestionsEl.style.display = "block";

  ICONS.forEach(icon => {
    const d = document.createElement("div");
    d.className = "suggestion";
    d.innerHTML = `<img src="${icon.file}">`;
    d.onclick = () => replaceWithIcon(icon.file);
    suggestionList.appendChild(d);
  });
}

function replaceWithIcon(src) {
  // remove last stroke
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

  redraw();
}

/* ================= RENDER ================= */

function redraw() {
  ctx.clearRect(0,0,canvas.width,canvas.height);
  elements.forEach((el,i) => {
    if (el.type === "stroke") drawStroke(el);
    if (el.type === "icon") {
      const img = new Image();
      img.src = el.src;
      img.onload = () => ctx.drawImage(img, el.x, el.y, el.size, el.size);
    }
    if (i === selectedIndex) {
      ctx.strokeStyle = "red";
      ctx.strokeRect(el.x-4, el.y-4, el.size+8, el.size+8);
    }
  });
}

function drawStroke(s) {
  ctx.beginPath();
  ctx.lineWidth = s.width;
  ctx.strokeStyle = s.color;
  ctx.lineCap = "round";
  s.path.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));
  ctx.stroke();
}

/* ================= CONTROLS ================= */

thickerBtn.onclick = () => strokeWidth = Math.min(14, strokeWidth + 2);
thinnerBtn.onclick = () => strokeWidth = Math.max(2, strokeWidth - 2);
colorPicker.onchange = e => strokeColor = e.target.value;

undoBtn.onclick = () => { if(elements.length){ undone.push(elements.pop()); redraw(); } };
redoBtn.onclick = () => { if(undone.length){ elements.push(undone.pop()); redraw(); } };
clearBtn.onclick = () => { elements=[]; undone=[]; redraw(); };

/* ================= KEYBOARD ================= */

document.onkeydown = e => {
  if (e.ctrlKey && e.key === "z") undoBtn.click();
  if (e.ctrlKey && e.key === "y") redoBtn.click();
  if (e.key === "Delete" && selectedIndex !== null) {
    elements.splice(selectedIndex,1);
    selectedIndex = null;
    redraw();
  }
};

/* ================= EXPORT ================= */

downloadBtn.onclick = () => {
  const a = document.createElement("a");
  a.href = canvas.toDataURL();
  a.download = `duvofs-draw-${Date.now()}.png`;
  a.click();
};

downloadSvgBtn.onclick = () => {
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${canvas.width}" height="${canvas.height}">`;
  elements.forEach(el=>{
    if(el.type==="stroke"){
      const d=el.path.map((p,i)=>`${i?"L":"M"}${p.x} ${p.y}`).join(" ");
      svg+=`<path d="${d}" stroke="${el.color}" stroke-width="${el.width}" fill="none" stroke-linecap="round"/>`;
    }
    if(el.type==="icon"){
      svg+=`<image href="${el.src}" x="${el.x}" y="${el.y}" width="${el.size}" height="${el.size}"/>`;
    }
  });
  svg+="</svg>";
  const blob=new Blob([svg],{type:"image/svg+xml"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`duvofs-draw-${Date.now()}.svg`;
  a.click();
};

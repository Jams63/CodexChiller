const SVG_NS = "http://www.w3.org/2000/svg";

const state = {
  boundaryPoints: [],
  boundaryClosed: false,
  units: [],
  scale: 35,
};

const demoLayout = {
  boundaryPoints: [
    { x: 90, y: 120 },
    { x: 880, y: 120 },
    { x: 900, y: 520 },
    { x: 260, y: 610 },
    { x: 70, y: 560 },
  ],
  boundaryClosed: true,
  units: [
    { name: "CH-01", width: 8, depth: 3, x: 3, y: 4 },
    { name: "CH-02", width: 8, depth: 3, x: 12, y: 4 },
    { name: "CH-03", width: 8, depth: 3, x: 21, y: 4 },
  ],
  scale: 30,
};

const el = {
  svg: document.getElementById("planCanvas"),
  status: document.getElementById("status"),
  closeBoundaryBtn: document.getElementById("closeBoundaryBtn"),
  clearBoundaryBtn: document.getElementById("clearBoundaryBtn"),
  nameInput: document.getElementById("nameInput"),
  widthInput: document.getElementById("widthInput"),
  depthInput: document.getElementById("depthInput"),
  xInput: document.getElementById("xInput"),
  yInput: document.getElementById("yInput"),
  addUnitBtn: document.getElementById("addUnitBtn"),
  clearUnitsBtn: document.getElementById("clearUnitsBtn"),
  scaleInput: document.getElementById("scaleInput"),
  redrawBtn: document.getElementById("redrawBtn"),
  downloadSvgBtn: document.getElementById("downloadSvgBtn"),
  downloadJsonBtn: document.getElementById("downloadJsonBtn"),
  loadJsonInput: document.getElementById("loadJsonInput"),
  loadDemoBtn: document.getElementById("loadDemoBtn"),
  printBtn: document.getElementById("printBtn"),
};

function updateStatus(message) {
  el.status.textContent = message;
}

function meterToPx(value) {
  return value * state.scale;
}

function pxToMeter(value) {
  return value / state.scale;
}

function createSvgElement(tag, attrs = {}) {
  const node = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => node.setAttribute(k, String(v)));
  return node;
}

function renderBoundary() {
  if (!state.boundaryPoints.length) return;

  const points = state.boundaryPoints.map((p) => `${p.x},${p.y}`).join(" ");
  if (state.boundaryClosed && state.boundaryPoints.length >= 3) {
    const polygon = createSvgElement("polygon", {
      points,
      fill: "#f7fbff",
      stroke: "#0f2e5e",
      "stroke-width": 2,
    });
    el.svg.appendChild(polygon);
  } else {
    const polyline = createSvgElement("polyline", {
      points,
      fill: "none",
      stroke: "#0f2e5e",
      "stroke-width": 2,
      "stroke-dasharray": "6 4",
    });
    el.svg.appendChild(polyline);
  }

  state.boundaryPoints.forEach((point, idx) => {
    const dot = createSvgElement("circle", {
      cx: point.x,
      cy: point.y,
      r: 4,
      fill: "#0056d6",
    });
    const label = createSvgElement("text", {
      x: point.x + 8,
      y: point.y - 8,
      "font-size": 11,
      fill: "#17345f",
    });
    label.textContent = `P${idx + 1}`;

    el.svg.appendChild(dot);
    el.svg.appendChild(label);
  });
}

function renderUnits() {
  state.units.forEach((unit, index) => {
    const x = meterToPx(unit.x);
    const y = meterToPx(unit.y);
    const w = meterToPx(unit.width);
    const h = meterToPx(unit.depth);

    const rect = createSvgElement("rect", {
      x,
      y,
      width: w,
      height: h,
      fill: "rgba(0, 86, 214, 0.1)",
      stroke: "#003b95",
      "stroke-width": 2,
    });

    const title = createSvgElement("text", {
      x: x + 6,
      y: y + 16,
      "font-size": 13,
      fill: "#001f4f",
      "font-weight": "bold",
    });
    title.textContent = unit.name;

    const size = createSvgElement("text", {
      x: x + 6,
      y: y + 32,
      "font-size": 12,
      fill: "#143564",
    });
    size.textContent = `${unit.width}m × ${unit.depth}m`;

    const bottomDim = createSvgElement("text", {
      x: x + w / 2,
      y: y + h + 18,
      "font-size": 11,
      fill: "#3b4f72",
      "text-anchor": "middle",
    });
    bottomDim.textContent = `${unit.width} m`;

    const rightDim = createSvgElement("text", {
      x: x + w + 12,
      y: y + h / 2,
      "font-size": 11,
      fill: "#3b4f72",
      transform: `rotate(90 ${x + w + 12} ${y + h / 2})`,
    });
    rightDim.textContent = `${unit.depth} m`;

    const number = createSvgElement("text", {
      x: x + w - 10,
      y: y + 16,
      "font-size": 10,
      "text-anchor": "end",
      fill: "#4f6072",
    });
    number.textContent = `#${index + 1}`;

    el.svg.append(rect, title, size, bottomDim, rightDim, number);
  });
}

function drawGrid() {
  const width = 1000;
  const height = 700;
  const major = state.scale;

  for (let x = 0; x <= width; x += major) {
    el.svg.appendChild(
      createSvgElement("line", {
        x1: x,
        y1: 0,
        x2: x,
        y2: height,
        stroke: x % (major * 5) === 0 ? "#d5e2f5" : "#eaf0fb",
        "stroke-width": 1,
      }),
    );
  }

  for (let y = 0; y <= height; y += major) {
    el.svg.appendChild(
      createSvgElement("line", {
        x1: 0,
        y1: y,
        x2: width,
        y2: y,
        stroke: y % (major * 5) === 0 ? "#d5e2f5" : "#eaf0fb",
        "stroke-width": 1,
      }),
    );
  }
}

function redraw() {
  state.scale = Number(el.scaleInput.value) || 35;
  while (el.svg.firstChild) {
    el.svg.removeChild(el.svg.firstChild);
  }
  drawGrid();
  renderBoundary();
  renderUnits();

  updateStatus(
    `Boundary points: ${state.boundaryPoints.length} | Units: ${state.units.length} | Scale: ${state.scale} px/m`,
  );
}

function getSvgCoordinates(evt) {
  const rect = el.svg.getBoundingClientRect();
  const x = evt.clientX - rect.left;
  const y = evt.clientY - rect.top;
  return { x, y };
}

function addBoundaryPoint(evt) {
  if (state.boundaryClosed) {
    updateStatus("Boundary already closed. Clear it to draw a new one.");
    return;
  }
  const point = getSvgCoordinates(evt);
  state.boundaryPoints.push({ x: point.x, y: point.y });
  redraw();
}

function closeBoundary() {
  if (state.boundaryPoints.length < 3) {
    updateStatus("Need at least 3 points to close a boundary.");
    return;
  }
  state.boundaryClosed = true;
  redraw();
}

function addUnit() {
  const name = el.nameInput.value.trim() || `CH-${String(state.units.length + 1).padStart(2, "0")}`;
  const width = Number(el.widthInput.value);
  const depth = Number(el.depthInput.value);
  const x = Number(el.xInput.value);
  const y = Number(el.yInput.value);

  if ([width, depth, x, y].some((value) => Number.isNaN(value) || value <= 0)) {
    updateStatus("Enter valid positive values for width, depth, x, and y.");
    return;
  }

  state.units.push({ name, width, depth, x, y });
  redraw();
}

function clearBoundary() {
  state.boundaryPoints = [];
  state.boundaryClosed = false;
  redraw();
}

function clearUnits() {
  state.units = [];
  redraw();
}

function loadDemoPreview() {
  state.boundaryPoints = demoLayout.boundaryPoints.map((point) => ({ ...point }));
  state.boundaryClosed = demoLayout.boundaryClosed;
  state.units = demoLayout.units.map((unit) => ({ ...unit }));
  state.scale = demoLayout.scale;
  el.scaleInput.value = String(state.scale);
  redraw();
  updateStatus("Demo preview loaded. Edit points/units as needed.");
}

function downloadSvg() {
  const serializer = new XMLSerializer();
  const svgText = serializer.serializeToString(el.svg);
  const blob = new Blob([svgText], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chiller-layout.svg";
  a.click();
  URL.revokeObjectURL(url);
}

function downloadJson() {
  const payload = {
    version: 1,
    createdAt: new Date().toISOString(),
    state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "chiller-layout.json";
  a.click();
  URL.revokeObjectURL(url);
}

function loadJson(evt) {
  const file = evt.target.files?.[0];
  if (!file) return;

  file.text()
    .then((content) => JSON.parse(content))
    .then((payload) => {
      if (!payload.state) throw new Error("Invalid file");
      state.boundaryPoints = payload.state.boundaryPoints || [];
      state.boundaryClosed = Boolean(payload.state.boundaryClosed);
      state.units = payload.state.units || [];
      state.scale = Number(payload.state.scale) || state.scale;
      el.scaleInput.value = String(state.scale);
      redraw();
    })
    .catch(() => {
      updateStatus("Invalid JSON file.");
    });
}

el.svg.addEventListener("click", addBoundaryPoint);
el.closeBoundaryBtn.addEventListener("click", closeBoundary);
el.clearBoundaryBtn.addEventListener("click", clearBoundary);
el.addUnitBtn.addEventListener("click", addUnit);
el.clearUnitsBtn.addEventListener("click", clearUnits);
el.redrawBtn.addEventListener("click", redraw);
el.scaleInput.addEventListener("change", redraw);
el.downloadSvgBtn.addEventListener("click", downloadSvg);
el.downloadJsonBtn.addEventListener("click", downloadJson);
el.loadJsonInput.addEventListener("change", loadJson);
el.loadDemoBtn.addEventListener("click", loadDemoPreview);
el.printBtn.addEventListener("click", () => window.print());

loadDemoPreview();

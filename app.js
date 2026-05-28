class WeightedQuickUnionUF {
  constructor(size) {
    this.parent = Array.from({ length: size }, (_, index) => index);
    this.treeSize = Array(size).fill(1);
  }

  find(node) {
    let current = node;
    while (current !== this.parent[current]) {
      this.parent[current] = this.parent[this.parent[current]];
      current = this.parent[current];
    }
    return current;
  }

  union(a, b) {
    const rootA = this.find(a);
    const rootB = this.find(b);
    if (rootA === rootB) {
      return;
    }

    if (this.treeSize[rootA] < this.treeSize[rootB]) {
      this.parent[rootA] = rootB;
      this.treeSize[rootB] += this.treeSize[rootA];
    } else {
      this.parent[rootB] = rootA;
      this.treeSize[rootA] += this.treeSize[rootB];
    }
  }

  connected(a, b) {
    return this.find(a) === this.find(b);
  }
}

class PercolationModel {
  constructor(size) {
    this.size = size;
    this.openSites = 0;
    this.grid = Array.from({ length: size }, () => Array(size).fill(false));
    this.virtualTop = size * size;
    this.virtualBottom = size * size + 1;
    this.uf = new WeightedQuickUnionUF(size * size + 2);
    this.fullnessUf = new WeightedQuickUnionUF(size * size + 1);
  }

  index(row, col) {
    return row * this.size + col;
  }

  inBounds(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size;
  }

  isOpen(row, col) {
    return this.grid[row][col];
  }

  isFull(row, col) {
    if (!this.isOpen(row, col)) {
      return false;
    }
    return this.fullnessUf.connected(this.index(row, col), this.virtualTop);
  }

  numberOfOpenSites() {
    return this.openSites;
  }

  percolates() {
    return this.uf.connected(this.virtualTop, this.virtualBottom);
  }

  connectIfOpen(row, col, neighborRow, neighborCol) {
    if (!this.inBounds(neighborRow, neighborCol) || !this.isOpen(neighborRow, neighborCol)) {
      return;
    }

    const current = this.index(row, col);
    const neighbor = this.index(neighborRow, neighborCol);
    this.uf.union(current, neighbor);
    this.fullnessUf.union(current, neighbor);
  }

  open(row, col) {
    if (!this.inBounds(row, col) || this.isOpen(row, col)) {
      return false;
    }

    this.grid[row][col] = true;
    this.openSites += 1;

    const current = this.index(row, col);
    if (row === 0) {
      this.uf.union(current, this.virtualTop);
      this.fullnessUf.union(current, this.virtualTop);
    }

    if (row === this.size - 1) {
      this.uf.union(current, this.virtualBottom);
    }

    this.connectIfOpen(row, col, row - 1, col);
    this.connectIfOpen(row, col, row + 1, col);
    this.connectIfOpen(row, col, row, col - 1);
    this.connectIfOpen(row, col, row, col + 1);
    return true;
  }

  openRandomBlockedSite() {
    const blocked = [];
    for (let row = 0; row < this.size; row += 1) {
      for (let col = 0; col < this.size; col += 1) {
        if (!this.isOpen(row, col)) {
          blocked.push([row, col]);
        }
      }
    }

    if (blocked.length === 0) {
      return false;
    }

    const [row, col] = blocked[Math.floor(Math.random() * blocked.length)];
    return this.open(row, col);
  }
}

const tabButtons = document.querySelectorAll("[data-tab-target]");
const tabPanels = document.querySelectorAll(".tab-panel");

const gridSizeInput = document.getElementById("grid-size");
const gridSizeValue = document.getElementById("grid-size-value");
const resetGridButton = document.getElementById("reset-grid");
const randomFillButton = document.getElementById("random-fill");
const openCount = document.getElementById("open-count");
const percolationStatus = document.getElementById("percolation-status");

const thresholdGridSizeInput = document.getElementById("threshold-grid-size");
const thresholdGridSizeValue = document.getElementById("threshold-grid-size-value");
const thresholdTrialsInput = document.getElementById("threshold-trials");
const thresholdTrialsValue = document.getElementById("threshold-trials-value");
const thresholdProgress = document.getElementById("threshold-progress");
const thresholdPreviewOpen = document.getElementById("threshold-preview-open");
const thresholdPreviewValue = document.getElementById("threshold-preview-value");
const resultMean = document.getElementById("result-mean");
const resultStddev = document.getElementById("result-stddev");
const resultLow = document.getElementById("result-low");
const resultHigh = document.getElementById("result-high");
const runThresholdButton = document.getElementById("run-threshold");
const rerunPreviewButton = document.getElementById("rerun-preview");

const canvas = document.getElementById("percolation-canvas");
const context = canvas.getContext("2d");
const thresholdCanvas = document.getElementById("threshold-canvas");
const thresholdContext = thresholdCanvas.getContext("2d");

const COLORS = {
  blocked: "#050505",
  open: "#ffffff",
  full: "#65b5e4",
  line: "rgba(255, 255, 255, 0.18)"
};

let model = new PercolationModel(Number(gridSizeInput.value));
let pendingVisualizationDraw = null;
let pendingThresholdDraw = null;
let thresholdRunId = 0;

function scheduleDraw(kind, drawFn) {
  if (kind === "visualization" && pendingVisualizationDraw !== null) {
    window.cancelAnimationFrame(pendingVisualizationDraw);
  }
  if (kind === "threshold" && pendingThresholdDraw !== null) {
    window.cancelAnimationFrame(pendingThresholdDraw);
  }

  const firstFrame = window.requestAnimationFrame(() => {
    const secondFrame = window.requestAnimationFrame(() => {
      if (kind === "visualization") {
        pendingVisualizationDraw = null;
      } else {
        pendingThresholdDraw = null;
      }
      drawFn();
    });

    if (kind === "visualization") {
      pendingVisualizationDraw = secondFrame;
    } else {
      pendingThresholdDraw = secondFrame;
    }
  });

  if (kind === "visualization") {
    pendingVisualizationDraw = firstFrame;
  } else {
    pendingThresholdDraw = firstFrame;
  }
}

function activateTab(targetId) {
  tabButtons.forEach((button) => {
    const isActive = button.dataset.tabTarget === targetId;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-selected", String(isActive));
  });

  tabPanels.forEach((panel) => {
    panel.classList.toggle("active", panel.id === targetId);
  });

  if (targetId === "visualization") {
    scheduleDraw("visualization", drawGrid);
  }

  if (targetId === "threshold") {
    scheduleDraw("threshold", drawThresholdPreview);
  }
}

function resizeCanvasForDisplay(targetCanvas) {
  const displayWidth = targetCanvas.clientWidth;
  const scale = window.devicePixelRatio || 1;
  const nextWidth = Math.max(1, Math.round(displayWidth * scale));

  if (targetCanvas.width !== nextWidth || targetCanvas.height !== nextWidth) {
    targetCanvas.width = nextWidth;
    targetCanvas.height = nextWidth;
  }
}

function drawModel(targetCanvas, targetContext, sourceModel) {
  resizeCanvasForDisplay(targetCanvas);

  const size = sourceModel.size;
  const cellSize = targetCanvas.width / size;

  targetContext.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
  targetContext.fillStyle = COLORS.blocked;
  targetContext.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (sourceModel.isFull(row, col)) {
        targetContext.fillStyle = COLORS.full;
      } else if (sourceModel.isOpen(row, col)) {
        targetContext.fillStyle = COLORS.open;
      } else {
        targetContext.fillStyle = COLORS.blocked;
      }

      const x = col * cellSize;
      const y = row * cellSize;
      targetContext.fillRect(x, y, cellSize, cellSize);
      targetContext.strokeStyle = COLORS.line;
      targetContext.lineWidth = Math.max(1, targetCanvas.width / 700);
      targetContext.strokeRect(x, y, cellSize, cellSize);
    }
  }
}

function updateStatus() {
  openCount.textContent = `${model.numberOfOpenSites()} open sites`;
  percolationStatus.textContent = model.percolates() ? "percolates" : "does not percolate";
}

function drawGrid() {
  drawModel(canvas, context, model);
  updateStatus();
}

function resetModel(size = Number(gridSizeInput.value)) {
  model = new PercolationModel(size);
  gridSizeValue.textContent = `${size} × ${size}`;
  drawGrid();
}

function openCellFromPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  const col = Math.floor(x / (canvas.width / model.size));
  const row = Math.floor(y / (canvas.height / model.size));

  if (model.open(row, col)) {
    drawGrid();
  }
}

let thresholdPreviewModel = new PercolationModel(Number(thresholdGridSizeInput.value));

function drawThresholdPreview() {
  drawModel(thresholdCanvas, thresholdContext, thresholdPreviewModel);
}

function updateThresholdOutputs(size, trials) {
  thresholdGridSizeValue.textContent = `${size} × ${size}`;
  thresholdTrialsValue.textContent = `${trials} trials`;
}

function performThresholdTrial(size) {
  const trialModel = new PercolationModel(size);
  while (!trialModel.percolates()) {
    trialModel.openRandomBlockedSite();
  }

  return {
    threshold: trialModel.numberOfOpenSites() / (size * size),
    openSites: trialModel.numberOfOpenSites(),
    model: trialModel
  };
}

function mean(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stddev(values, avg) {
  if (values.length <= 1) {
    return 0;
  }

  const variance = values.reduce((sum, value) => {
    const diff = value - avg;
    return sum + diff * diff;
  }, 0) / (values.length - 1);

  return Math.sqrt(variance);
}

function updateThresholdResults(avg, deviation, low, high) {
  resultMean.textContent = avg.toFixed(4);
  resultStddev.textContent = deviation.toFixed(4);
  resultLow.textContent = low.toFixed(4);
  resultHigh.textContent = high.toFixed(4);
}

async function runThresholdSimulation(trials, size) {
  thresholdRunId += 1;
  const runId = thresholdRunId;
  runThresholdButton.disabled = true;
  rerunPreviewButton.disabled = true;
  thresholdProgress.textContent = `Running ${trials} trials on a ${size} × ${size} grid...`;

  const thresholds = [];

  for (let trialIndex = 0; trialIndex < trials; trialIndex += 1) {
    if (runId !== thresholdRunId) {
      return;
    }

    const trial = performThresholdTrial(size);
    thresholds.push(trial.threshold);
    thresholdPreviewModel = trial.model;
    thresholdPreviewOpen.textContent = `${trial.openSites} open sites`;
    thresholdPreviewValue.textContent = `threshold ${trial.threshold.toFixed(4)}`;
    drawThresholdPreview();
    thresholdProgress.textContent = `Completed ${trialIndex + 1} of ${trials} trials...`;

    if ((trialIndex + 1) % 5 === 0) {
      await new Promise((resolve) => window.setTimeout(resolve, 0));
    }
  }

  const avg = mean(thresholds);
  const deviation = stddev(thresholds, avg);
  const margin = 1.96 * deviation / Math.sqrt(trials);

  updateThresholdResults(avg, deviation, avg - margin, avg + margin);
  thresholdProgress.textContent = `Finished ${trials} trials.`;
  runThresholdButton.disabled = false;
  rerunPreviewButton.disabled = false;
}

function runSinglePreviewTrial(size) {
  const trial = performThresholdTrial(size);
  thresholdPreviewModel = trial.model;
  thresholdPreviewOpen.textContent = `${trial.openSites} open sites`;
  thresholdPreviewValue.textContent = `threshold ${trial.threshold.toFixed(4)}`;
  drawThresholdPreview();
  thresholdProgress.textContent = "Preview updated from one trial.";
}

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activateTab(button.dataset.tabTarget);
  });
});

gridSizeInput.addEventListener("input", () => {
  gridSizeValue.textContent = `${gridSizeInput.value} × ${gridSizeInput.value}`;
});

gridSizeInput.addEventListener("change", () => {
  resetModel(Number(gridSizeInput.value));
});

resetGridButton.addEventListener("click", () => {
  resetModel();
});

randomFillButton.addEventListener("click", () => {
  if (model.openRandomBlockedSite()) {
    drawGrid();
  }
});

canvas.addEventListener("click", openCellFromPointer);

thresholdGridSizeInput.addEventListener("input", () => {
  updateThresholdOutputs(Number(thresholdGridSizeInput.value), Number(thresholdTrialsInput.value));
});

thresholdTrialsInput.addEventListener("input", () => {
  updateThresholdOutputs(Number(thresholdGridSizeInput.value), Number(thresholdTrialsInput.value));
});

thresholdGridSizeInput.addEventListener("change", () => {
  const size = Number(thresholdGridSizeInput.value);
  thresholdPreviewModel = new PercolationModel(size);
  thresholdPreviewOpen.textContent = "0 open sites";
  thresholdPreviewValue.textContent = "threshold 0.0000";
  scheduleDraw("threshold", drawThresholdPreview);
});

runThresholdButton.addEventListener("click", () => {
  runThresholdSimulation(Number(thresholdTrialsInput.value), Number(thresholdGridSizeInput.value));
});

rerunPreviewButton.addEventListener("click", () => {
  runSinglePreviewTrial(Number(thresholdGridSizeInput.value));
});

window.addEventListener("resize", () => {
  if (document.getElementById("visualization").classList.contains("active")) {
    drawGrid();
  }
  if (document.getElementById("threshold").classList.contains("active")) {
    drawThresholdPreview();
  }
});

window.addEventListener("load", () => {
  updateThresholdOutputs(Number(thresholdGridSizeInput.value), Number(thresholdTrialsInput.value));
  activateTab("home");
  resetModel(Number(gridSizeInput.value));
  thresholdPreviewModel = new PercolationModel(Number(thresholdGridSizeInput.value));
  drawThresholdPreview();
});

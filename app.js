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

const canvas = document.getElementById("percolation-canvas");
const context = canvas.getContext("2d");

const COLORS = {
  blocked: "#050505",
  open: "#ffffff",
  full: "#65b5e4",
  line: "rgba(255, 255, 255, 0.18)"
};

let model = new PercolationModel(Number(gridSizeInput.value));

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
    window.requestAnimationFrame(drawGrid);
  }
}

function updateStatus() {
  openCount.textContent = `${model.numberOfOpenSites()} open sites`;
  percolationStatus.textContent = model.percolates() ? "percolates" : "does not percolate";
}

function resizeCanvasForDisplay() {
  const displayWidth = canvas.clientWidth;
  const scale = window.devicePixelRatio || 1;
  const nextWidth = Math.round(displayWidth * scale);

  if (canvas.width !== nextWidth || canvas.height !== nextWidth) {
    canvas.width = nextWidth;
    canvas.height = nextWidth;
  }
}

function drawGrid() {
  resizeCanvasForDisplay();

  const size = model.size;
  const cellSize = canvas.width / size;

  context.clearRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = COLORS.blocked;
  context.fillRect(0, 0, canvas.width, canvas.height);

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      if (model.isFull(row, col)) {
        context.fillStyle = COLORS.full;
      } else if (model.isOpen(row, col)) {
        context.fillStyle = COLORS.open;
      } else {
        context.fillStyle = COLORS.blocked;
      }

      const x = col * cellSize;
      const y = row * cellSize;
      context.fillRect(x, y, cellSize, cellSize);
      context.strokeStyle = COLORS.line;
      context.lineWidth = Math.max(1, canvas.width / 700);
      context.strokeRect(x, y, cellSize, cellSize);
    }
  }

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

window.addEventListener("resize", drawGrid);

activateTab("home");
resetModel(Number(gridSizeInput.value));

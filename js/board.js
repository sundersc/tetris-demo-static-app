import { COLORS } from './piece.js';

const COLS = 10;
const ROWS = 22;
const VISIBLE_ROWS = 20;
const CELL_SIZE = 30;

export class Board {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.canvas.width = COLS * CELL_SIZE;
    this.canvas.height = VISIBLE_ROWS * CELL_SIZE;
    this.grid = this.createGrid();
    this.clearAnimation = null;
  }

  createGrid() {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  reset() {
    this.grid = this.createGrid();
    this.clearAnimation = null;
  }

  isColliding(piece, offsetX = 0, offsetY = 0, rotation = piece.rotation) {
    const cells = piece.getCells(offsetX, offsetY, rotation);
    for (const { x, y } of cells) {
      if (x < 0 || x >= COLS || y >= ROWS) return true;
      if (y >= 0 && this.grid[y][x]) return true;
    }
    return false;
  }

  lockPiece(piece) {
    const cells = piece.getCells();
    for (const { x, y } of cells) {
      if (y >= 0 && y < ROWS) {
        this.grid[y][x] = piece.type;
      }
    }
  }

  getFullRows() {
    const rows = [];
    for (let r = 0; r < ROWS; r++) {
      if (this.grid[r].every(cell => cell !== null)) {
        rows.push(r);
      }
    }
    return rows;
  }

  clearRows(rows) {
    for (const row of rows.sort((a, b) => b - a)) {
      this.grid.splice(row, 1);
    }
    while (this.grid.length < ROWS) {
      this.grid.unshift(Array(COLS).fill(null));
    }
  }

  startClearAnimation(rows, callback) {
    this.clearAnimation = { rows, progress: 0, callback };
  }

  updateClearAnimation(dt) {
    if (!this.clearAnimation) return;
    this.clearAnimation.progress += dt / 300;
    if (this.clearAnimation.progress >= 1) {
      const { rows, callback } = this.clearAnimation;
      this.clearRows(rows);
      this.clearAnimation = null;
      callback();
    }
  }

  getGhostY(piece) {
    let offset = 0;
    while (!this.isColliding(piece, 0, offset + 1)) {
      offset++;
    }
    return offset;
  }

  render(piece, showGhost = true) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.drawBackground(ctx);
    this.drawGrid(ctx);
    this.drawLockedCells(ctx);

    if (piece && !this.clearAnimation) {
      if (showGhost) this.drawGhost(ctx, piece);
      this.drawPiece(ctx, piece);
    }

    if (this.clearAnimation) {
      this.drawClearEffect(ctx);
      if (piece) this.drawPiece(ctx, piece);
    }
  }

  drawBackground(ctx) {
    const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#0d0d1a');
    gradient.addColorStop(1, '#0a0a12');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawGrid(ctx) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 0.5;
    for (let r = 0; r < VISIBLE_ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        ctx.strokeRect(c * CELL_SIZE, r * CELL_SIZE, CELL_SIZE, CELL_SIZE);
      }
    }
  }

  drawLockedCells(ctx) {
    for (let r = 2; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.grid[r][c]) {
          const animRow = this.clearAnimation && this.clearAnimation.rows.includes(r);
          if (!animRow) {
            this.drawCell(ctx, c, r - 2, COLORS[this.grid[r][c]]);
          }
        }
      }
    }
  }

  drawPiece(ctx, piece) {
    const cells = piece.getCells();
    for (const { x, y } of cells) {
      if (y >= 2) {
        this.drawCell(ctx, x, y - 2, COLORS[piece.type]);
      }
    }
  }

  drawGhost(ctx, piece) {
    const ghostOffset = this.getGhostY(piece);
    if (ghostOffset === 0) return;
    const cells = piece.getCells(0, ghostOffset);
    const color = COLORS[piece.type];
    for (const { x, y } of cells) {
      if (y >= 2) {
        const px = x * CELL_SIZE;
        const py = (y - 2) * CELL_SIZE;
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash([4, 4]);
        ctx.strokeRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
        ctx.restore();
      }
    }
  }

  drawCell(ctx, col, row, color) {
    const x = col * CELL_SIZE;
    const y = row * CELL_SIZE;
    const padding = 1;

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = color + '80';

    ctx.fillStyle = color;
    ctx.beginPath();
    this.roundRect(ctx, x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, 4);
    ctx.fill();

    const gradient = ctx.createLinearGradient(x, y, x, y + CELL_SIZE);
    gradient.addColorStop(0, 'rgba(255,255,255,0.3)');
    gradient.addColorStop(0.5, 'rgba(255,255,255,0)');
    gradient.addColorStop(1, 'rgba(0,0,0,0.2)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    this.roundRect(ctx, x + padding, y + padding, CELL_SIZE - padding * 2, CELL_SIZE - padding * 2, 4);
    ctx.fill();

    ctx.restore();
  }

  drawClearEffect(ctx) {
    if (!this.clearAnimation) return;
    const { rows, progress } = this.clearAnimation;
    for (const r of rows) {
      const screenRow = r - 2;
      if (screenRow < 0) continue;
      const y = screenRow * CELL_SIZE;
      ctx.save();
      ctx.globalAlpha = 1 - progress;
      ctx.fillStyle = `rgba(255, 255, 255, ${0.8 * (1 - progress)})`;
      ctx.fillRect(0, y, COLS * CELL_SIZE, CELL_SIZE);
      ctx.restore();
    }
  }

  roundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}

export { COLS, ROWS, VISIBLE_ROWS, CELL_SIZE };

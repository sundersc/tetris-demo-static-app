import { Piece, BagRandomizer, ClassicRandomizer, COLORS } from './piece.js';
import { Board, CELL_SIZE, VISIBLE_ROWS } from './board.js';
import { InputHandler } from './input.js';
import { ScoreManager } from './score.js';
import { EffectsManager } from './effects.js';

class Game {
  constructor(mode = 'modern') {
    this.mode = mode;
    this.board = new Board(document.getElementById('game-canvas'));
    this.effects = new EffectsManager(document.getElementById('effects-canvas'));
    this.score = new ScoreManager();
    this.input = new InputHandler();
    this.nextCanvas = document.getElementById('next-canvas');
    this.nextCtx = this.nextCanvas.getContext('2d');
    this.container = document.getElementById('game-container');

    this.bag = mode === 'classic' ? new ClassicRandomizer() : new BagRandomizer();
    this.currentPiece = null;
    this.nextPieceType = null;
    this.state = 'playing';
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.maxLockResets = mode === 'classic' ? 0 : 15;
    this.lockDelay = mode === 'classic' ? 0 : 500;
    this.isLocking = false;
    this.softDropping = false;
    this.lastTime = 0;
    this.dropTrails = [];
    this.showGhost = mode !== 'classic';

    this.setupInput();
    this.spawnPiece();
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  setupInput() {
    this.input.bind('ArrowLeft', () => this.move(-1));
    this.input.bind('ArrowRight', () => this.move(1));
    this.input.bind('ArrowDown', () => this.softDrop());
    this.input.bind('ArrowUp', () => this.rotatePiece('cw'));
    this.input.bind('KeyX', () => this.rotatePiece('cw'));
    this.input.bind('KeyZ', () => this.rotatePiece('ccw'));
    this.input.bind('Space', () => this.hardDrop());
    this.input.bind('KeyP', () => this.togglePause());
    this.input.bind('KeyR', () => this.restart());
  }

  spawnPiece() {
    if (this.nextPieceType === null) {
      this.nextPieceType = this.bag.next();
    }
    this.currentPiece = new Piece(this.nextPieceType);
    this.nextPieceType = this.bag.next();
    this.renderNext();
    this.dropTimer = 0;
    this.lockTimer = 0;
    this.lockResets = 0;
    this.isLocking = false;

    if (this.board.isColliding(this.currentPiece)) {
      this.state = 'gameover';
      document.getElementById('game-over').style.display = 'flex';
    }
  }

  move(dir) {
    if (this.state !== 'playing' || !this.currentPiece) return;
    if (!this.board.isColliding(this.currentPiece, dir, 0)) {
      this.currentPiece.x += dir;
      this.resetLock();
    }
  }

  softDrop() {
    if (this.state !== 'playing' || !this.currentPiece) return;
    if (!this.board.isColliding(this.currentPiece, 0, 1)) {
      this.currentPiece.y++;
      this.score.addSoftDrop(1);
      this.dropTimer = 0;
    }
  }

  hardDrop() {
    if (this.state !== 'playing' || !this.currentPiece) return;
    let dist = 0;
    while (!this.board.isColliding(this.currentPiece, 0, dist + 1)) {
      dist++;
    }
    if (dist > 0) {
      this.addDropTrail(this.currentPiece, dist);
      this.currentPiece.y += dist;
      this.score.addHardDrop(dist);
    }
    this.lock();
  }

  addDropTrail(piece, distance) {
    const cells = piece.getCells();
    for (const { x, y } of cells) {
      for (let i = 0; i < distance; i += 2) {
        this.dropTrails.push({
          x, y: y + i, color: COLORS[piece.type], life: 1,
        });
      }
    }
  }

  rotatePiece(dir) {
    if (this.state !== 'playing' || !this.currentPiece) return;
    if (this.currentPiece.rotate(dir, this.board)) {
      this.resetLock();
    }
  }

  resetLock() {
    if (this.isLocking && this.lockResets < this.maxLockResets) {
      this.lockTimer = 0;
      this.lockResets++;
    }
  }

  lock() {
    this.board.lockPiece(this.currentPiece);
    const fullRows = this.board.getFullRows();
    if (fullRows.length > 0) {
      this.score.addLineClear(fullRows.length);
      this.effects.onLineClear(fullRows, fullRows.length);
      this.currentPiece = null;
      this.board.startClearAnimation(fullRows, () => {
        this.spawnPiece();
      });
    } else {
      this.score.resetCombo();
      this.spawnPiece();
    }
  }

  togglePause() {
    if (this.state === 'playing') {
      this.state = 'paused';
      document.getElementById('pause-overlay').style.display = 'flex';
    } else if (this.state === 'paused') {
      this.state = 'playing';
      document.getElementById('pause-overlay').style.display = 'none';
      this.lastTime = performance.now();
    }
  }

  restart() {
    this.state = 'stopped';
    document.getElementById('game-over').style.display = 'none';
    document.getElementById('pause-overlay').style.display = 'none';
    showModeSelect();
  }

  loop(time) {
    if (this.state === 'stopped') return;

    const dt = time - this.lastTime;
    this.lastTime = time;

    if (this.state === 'playing') {
      this.update(dt);
    }

    this.effects.update(dt);
    this.render();
    this.applyShake();

    requestAnimationFrame((t) => this.loop(t));
  }

  update(dt) {
    this.board.updateClearAnimation(dt);

    if (!this.currentPiece) return;

    this.dropTimer += dt;
    const interval = this.score.getDropInterval();

    if (this.dropTimer >= interval) {
      this.dropTimer = 0;
      if (!this.board.isColliding(this.currentPiece, 0, 1)) {
        this.currentPiece.y++;
        this.isLocking = false;
      } else {
        this.isLocking = true;
      }
    }

    if (this.isLocking) {
      this.lockTimer += dt;
      if (this.lockTimer >= this.lockDelay) {
        this.lock();
      }
    } else {
      if (this.board.isColliding(this.currentPiece, 0, 1)) {
        this.isLocking = true;
        this.lockTimer = 0;
      }
    }

    for (let i = this.dropTrails.length - 1; i >= 0; i--) {
      this.dropTrails[i].life -= dt * 0.005;
      if (this.dropTrails[i].life <= 0) {
        this.dropTrails.splice(i, 1);
      }
    }
  }

  render() {
    this.board.render(this.currentPiece, this.showGhost);
    this.renderDropTrails();
    this.effects.render();
    this.score.render();
  }

  renderDropTrails() {
    const ctx = this.board.ctx;
    for (const trail of this.dropTrails) {
      if (trail.y < 2) continue;
      ctx.save();
      ctx.globalAlpha = trail.life * 0.4;
      ctx.fillStyle = trail.color;
      ctx.fillRect(
        trail.x * CELL_SIZE + CELL_SIZE * 0.3,
        (trail.y - 2) * CELL_SIZE,
        CELL_SIZE * 0.4,
        CELL_SIZE
      );
      ctx.restore();
    }
  }

  applyShake() {
    const shake = this.effects.getShake();
    this.container.style.transform = `translate(${shake.x}px, ${shake.y}px)`;
  }

  renderNext() {
    const ctx = this.nextCtx;
    const size = 20;
    ctx.clearRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);

    const piece = new Piece(this.nextPieceType);
    const shape = piece.getShape(0);
    const rows = shape.length;
    const cols = shape[0].length;
    const offsetX = (this.nextCanvas.width - cols * size) / 2;
    const offsetY = (this.nextCanvas.height - rows * size) / 2;
    const color = COLORS[this.nextPieceType];

    ctx.shadowBlur = 6;
    ctx.shadowColor = color + '80';

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (shape[r][c]) {
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.roundRect(offsetX + c * size + 1, offsetY + r * size + 1, size - 2, size - 2, 3);
          ctx.fill();
        }
      }
    }
    ctx.shadowBlur = 0;
  }
}

let currentGame = null;

function showModeSelect() {
  document.getElementById('mode-select').style.display = 'flex';
}

function startGame(mode) {
  document.getElementById('mode-select').style.display = 'none';
  currentGame = new Game(mode);
}

document.getElementById('btn-classic').addEventListener('click', () => startGame('classic'));
document.getElementById('btn-modern').addEventListener('click', () => startGame('modern'));

showModeSelect();

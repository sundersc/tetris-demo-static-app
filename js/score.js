export class ScoreManager {
  constructor() {
    this.reset();
    this.scoreEl = document.getElementById('score-value');
    this.levelEl = document.getElementById('level-value');
    this.linesEl = document.getElementById('lines-value');
  }

  reset() {
    this.score = 0;
    this.level = 1;
    this.lines = 0;
    this.combo = -1;
  }

  addLineClear(count) {
    const points = [0, 100, 300, 500, 800];
    this.score += points[count] * this.level;
    this.combo++;
    if (this.combo > 0) {
      this.score += 50 * this.combo * this.level;
    }
    this.lines += count;
    this.level = Math.floor(this.lines / 10) + 1;
  }

  addSoftDrop(cells) {
    this.score += cells;
  }

  addHardDrop(cells) {
    this.score += cells * 2;
  }

  resetCombo() {
    this.combo = -1;
  }

  getDropInterval() {
    return Math.max(50, 1000 - (this.level - 1) * 95);
  }

  render() {
    this.scoreEl.textContent = this.score.toLocaleString();
    this.levelEl.textContent = this.level;
    this.linesEl.textContent = this.lines;
  }
}

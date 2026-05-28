export const COLORS = {
  I: '#00f5ff',
  O: '#ffd700',
  T: '#b000ff',
  S: '#00ff41',
  Z: '#ff0040',
  J: '#0080ff',
  L: '#ff8000',
};

const SHAPES = {
  I: [
    [[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    [[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],
    [[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],
    [[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]],
  ],
  O: [
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
    [[1,1],[1,1]],
  ],
  T: [
    [[0,1,0],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,0],[0,1,0]],
  ],
  S: [
    [[0,1,1],[1,1,0],[0,0,0]],
    [[0,1,0],[0,1,1],[0,0,1]],
    [[0,0,0],[0,1,1],[1,1,0]],
    [[1,0,0],[1,1,0],[0,1,0]],
  ],
  Z: [
    [[1,1,0],[0,1,1],[0,0,0]],
    [[0,0,1],[0,1,1],[0,1,0]],
    [[0,0,0],[1,1,0],[0,1,1]],
    [[0,1,0],[1,1,0],[1,0,0]],
  ],
  J: [
    [[1,0,0],[1,1,1],[0,0,0]],
    [[0,1,1],[0,1,0],[0,1,0]],
    [[0,0,0],[1,1,1],[0,0,1]],
    [[0,1,0],[0,1,0],[1,1,0]],
  ],
  L: [
    [[0,0,1],[1,1,1],[0,0,0]],
    [[0,1,0],[0,1,0],[0,1,1]],
    [[0,0,0],[1,1,1],[1,0,0]],
    [[1,1,0],[0,1,0],[0,1,0]],
  ],
};

const WALL_KICKS = {
  normal: {
    '0>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '1>0': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    '1>2': [[0,0],[1,0],[1,-1],[0,2],[1,2]],
    '2>1': [[0,0],[-1,0],[-1,1],[0,-2],[-1,-2]],
    '2>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
    '3>2': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '3>0': [[0,0],[-1,0],[-1,-1],[0,2],[-1,2]],
    '0>3': [[0,0],[1,0],[1,1],[0,-2],[1,-2]],
  },
  I: {
    '0>1': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    '1>0': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    '1>2': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
    '2>1': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    '2>3': [[0,0],[2,0],[-1,0],[2,1],[-1,-2]],
    '3>2': [[0,0],[-2,0],[1,0],[-2,-1],[1,2]],
    '3>0': [[0,0],[1,0],[-2,0],[1,-2],[-2,1]],
    '0>3': [[0,0],[-1,0],[2,0],[-1,2],[2,-1]],
  },
};

export class Piece {
  constructor(type) {
    this.type = type;
    this.rotation = 0;
    this.shape = SHAPES[type][0];
    const size = this.shape.length;
    this.x = Math.floor((10 - size) / 2);
    this.y = type === 'I' ? -1 : 0;
  }

  getShape(rotation = this.rotation) {
    return SHAPES[this.type][rotation];
  }

  getCells(offsetX = 0, offsetY = 0, rotation = this.rotation) {
    const shape = this.getShape(rotation);
    const cells = [];
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (shape[r][c]) {
          cells.push({ x: this.x + c + offsetX, y: this.y + r + offsetY });
        }
      }
    }
    return cells;
  }

  getWallKicks(fromRot, toRot) {
    const table = this.type === 'I' ? WALL_KICKS.I : WALL_KICKS.normal;
    const key = `${fromRot}>${toRot}`;
    return table[key] || [[0,0]];
  }

  rotate(direction, board) {
    const fromRot = this.rotation;
    const toRot = (this.rotation + (direction === 'cw' ? 1 : 3)) % 4;
    const kicks = this.getWallKicks(fromRot, toRot);

    for (const [dx, dy] of kicks) {
      if (!board.isColliding(this, dx, dy, toRot)) {
        this.x += dx;
        this.y += dy;
        this.rotation = toRot;
        this.shape = SHAPES[this.type][toRot];
        return true;
      }
    }
    return false;
  }
}

export class BagRandomizer {
  constructor() {
    this.bag = [];
    this.types = Object.keys(SHAPES);
  }

  next() {
    if (this.bag.length === 0) {
      this.bag = [...this.types];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }
}

export class ClassicRandomizer {
  constructor() {
    this.types = Object.keys(SHAPES);
  }

  next() {
    return this.types[Math.floor(Math.random() * this.types.length)];
  }
}

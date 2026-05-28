export class InputHandler {
  constructor() {
    this.keys = {};
    this.actions = {};
    this.dasTimers = {};
    this.dasDelay = 170;
    this.dasRepeat = 50;

    document.addEventListener('keydown', (e) => this.onKeyDown(e));
    document.addEventListener('keyup', (e) => this.onKeyUp(e));
  }

  onKeyDown(e) {
    const gameKeys = ['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', 'Space', 'KeyZ', 'KeyX', 'KeyP', 'KeyR'];
    if (gameKeys.includes(e.code)) {
      e.preventDefault();
    }

    if (this.keys[e.code]) return;
    this.keys[e.code] = true;

    if (this.actions[e.code]) {
      this.actions[e.code]();
    }

    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      this.startDAS(e.code);
    }
  }

  onKeyUp(e) {
    this.keys[e.code] = false;
    this.stopDAS(e.code);
  }

  startDAS(code) {
    this.stopDAS(code);
    this.dasTimers[code] = setTimeout(() => {
      this.dasTimers[code] = setInterval(() => {
        if (this.actions[code]) this.actions[code]();
      }, this.dasRepeat);
    }, this.dasDelay);
  }

  stopDAS(code) {
    if (this.dasTimers[code]) {
      clearTimeout(this.dasTimers[code]);
      clearInterval(this.dasTimers[code]);
      this.dasTimers[code] = null;
    }
  }

  bind(code, action) {
    this.actions[code] = action;
  }

  isDown(code) {
    return !!this.keys[code];
  }
}

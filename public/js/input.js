// Input Handler - Captures keyboard input and sends to server
const InputHandler = {
  keys: {},
  lastSentInput: null,

  init() {
    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
  },

  onKeyDown(e) {
    // Prevent default for game keys
    if (['w', 'a', 's', 'd', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'e', ' ', 'Shift', 'q'].includes(e.key)) {
      e.preventDefault();
    }

    this.keys[e.key.toLowerCase()] = true;

    // Handle single-press actions
    if (e.key.toLowerCase() === 'e' || e.key === ' ') {
      this.sendInput({ interact: true });
    }
    if (e.key.toLowerCase() === 'q') {
      this.sendInput({ drop: true });
    }
    if (e.key === 'Shift' && GameState.myRole === 'DASH') {
      this.sendInput({ dash: true });
    }
  },

  onKeyUp(e) {
    this.keys[e.key.toLowerCase()] = false;
  },

  getDirection() {
    let x = 0;
    let y = 0;

    if (this.keys['w'] || this.keys['arrowup']) y -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) y += 1;
    if (this.keys['a'] || this.keys['arrowleft']) x -= 1;
    if (this.keys['d'] || this.keys['arrowright']) x += 1;

    return { x, y };
  },

  isSprinting() {
    return this.keys['shift'] === true;
  },

  update() {
    // Only send input if we have a role and game is playing
    if (!GameState.myRole || GameState.gameState?.phase !== 'playing') return;

    const input = {
      direction: this.getDirection(),
      sprint: this.isSprinting(),
      interact: false,
      drop: false,
      dash: false
    };

    // Only send if input changed
    const inputStr = JSON.stringify(input);
    if (inputStr !== this.lastSentInput) {
      this.sendInput(input);
      this.lastSentInput = inputStr;
    }
  },

  sendInput(input) {
    SocketManager.emit('player-input', input);
  },

  reset() {
    this.keys = {};
    this.lastSentInput = null;
  }
};

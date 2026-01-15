// Game Screen Logic
const GameScreen = {
  animationFrame: null,
  inputInterval: null,

  init() {
    this.bindEvents();
    this.setupSocketListeners();
  },

  bindEvents() {
    // Vote buttons
    document.getElementById('vote-give').addEventListener('click', () => {
      SocketManager.emit('vote', 'give');
    });

    document.getElementById('vote-refuse').addEventListener('click', () => {
      SocketManager.emit('vote', 'refuse');
    });

    // Results buttons
    document.getElementById('play-again-btn').addEventListener('click', () => {
      SocketManager.emit('play-again');
    });

    document.getElementById('lobby-btn').addEventListener('click', () => {
      SocketManager.emit('play-again');
    });
  },

  setupSocketListeners() {
    SocketManager.on('game-state', (state) => {
      GameState.gameState = state;
    });

    SocketManager.on('role-swap', (data) => {
      // Find my new role
      const myRole = data.roles.find(r => r.id === GameState.playerId);
      if (myRole) {
        GameState.myRole = myRole.role;
        UI.showRoleSwapOverlay(myRole.role);
        UI.updateRole(myRole.role);
      }
    });

    SocketManager.on('npc-caught', (data) => {
      UI.showNPCOverlay(data.demand, data.hasItem);
    });

    SocketManager.on('vote-update', (data) => {
      UI.updateVoteStatus(data.giveVotes, data.refuseVotes, data.timeLeft);
    });

    SocketManager.on('vote-resolved', (data) => {
      UI.hideNPCOverlay();
    });

    SocketManager.on('game-ended', (data) => {
      this.stop();
      UI.showResultsOverlay(data.won, data.stats, GameState.isHost);
    });
  },

  start() {
    // Initialize renderer with map data
    Renderer.init();
    Renderer.setMapData({
      width: 700,
      height: 550,
      rooms: [
        { id: 'start', name: 'Start Room', x: 50, y: 50, width: 180, height: 140, color: '#2a4858' },
        { id: 'kitchen', name: 'Kitchen', x: 260, y: 50, width: 180, height: 140, color: '#3d5a5a' },
        { id: 'bedroom', name: 'Bedroom', x: 470, y: 50, width: 180, height: 140, color: '#4a3f55' },
        { id: 'hallway', name: 'Hallway', x: 50, y: 220, width: 180, height: 140, color: '#2d3436' },
        { id: 'storage', name: 'Storage', x: 260, y: 220, width: 180, height: 140, color: '#4a4a4a' },
        { id: 'fuse', name: 'Fuse Room', x: 470, y: 220, width: 180, height: 140, color: '#5a3a3a' },
        { id: 'exit', name: 'Exit', x: 470, y: 390, width: 180, height: 120, color: '#1a5a3a' }
      ],
      walls: [
        { x: 40, y: 40, width: 620, height: 10 },
        { x: 40, y: 40, width: 10, height: 330 },
        { x: 40, y: 360, width: 420, height: 10 },
        { x: 450, y: 200, width: 10, height: 170 },
        { x: 650, y: 40, width: 10, height: 330 },
        { x: 460, y: 380, width: 10, height: 140 },
        { x: 460, y: 510, width: 200, height: 10 },
        { x: 650, y: 370, width: 10, height: 150 },
        { x: 230, y: 40, width: 10, height: 100 },
        { x: 230, y: 160, width: 10, height: 40 },
        { x: 440, y: 40, width: 10, height: 100 },
        { x: 440, y: 160, width: 10, height: 40 },
        { x: 230, y: 200, width: 10, height: 100 },
        { x: 230, y: 320, width: 10, height: 50 },
        { x: 440, y: 200, width: 10, height: 100 },
        { x: 440, y: 320, width: 10, height: 50 },
        { x: 40, y: 200, width: 100, height: 10 },
        { x: 160, y: 200, width: 80, height: 10 },
        { x: 240, y: 200, width: 100, height: 10 },
        { x: 360, y: 200, width: 90, height: 10 },
        { x: 450, y: 200, width: 100, height: 10 },
        { x: 570, y: 200, width: 90, height: 10 },
        { x: 450, y: 370, width: 100, height: 10 },
        { x: 570, y: 370, width: 90, height: 10 }
      ],
      exitZone: { x: 520, y: 430, width: 80, height: 60 },
      exitPanel: { x: 480, y: 400, width: 40, height: 80 }
    });

    // Initialize input
    InputHandler.init();

    // Update initial HUD
    UI.updateRole(GameState.myRole);

    // Start game loop
    this.gameLoop();

    // Start input polling
    this.inputInterval = setInterval(() => {
      InputHandler.update();
    }, 50);
  },

  gameLoop() {
    // Render current state
    if (GameState.gameState) {
      Renderer.render(GameState.gameState);

      // Update HUD
      UI.updateTimer(GameState.gameState.timeRemaining);
      UI.updateSwapTimer(GameState.gameState.swapTimer);
      UI.updateInventory(GameState.gameState.inventory);
      UI.updateExitChecklist(GameState.gameState.installedParts);
    }

    this.animationFrame = requestAnimationFrame(() => this.gameLoop());
  },

  stop() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.inputInterval) {
      clearInterval(this.inputInterval);
      this.inputInterval = null;
    }
    InputHandler.reset();
  }
};

// Lobby Screen Logic
const LobbyScreen = {
  init() {
    this.bindEvents();
    this.setupSocketListeners();
  },

  bindEvents() {
    const readyBtn = document.getElementById('ready-btn');
    const startBtn = document.getElementById('start-btn');

    readyBtn.addEventListener('click', () => {
      SocketManager.emit('player-ready');
    });

    startBtn.addEventListener('click', () => {
      SocketManager.emit('start-game');
    });
  },

  setupSocketListeners() {
    SocketManager.on('player-joined', (data) => {
      GameState.players = data.players;
      this.update();
    });

    SocketManager.on('player-left', (data) => {
      GameState.players = data.players;
      GameState.isHost = data.hostId === GameState.playerId;
      this.update();
    });

    SocketManager.on('player-list-update', (data) => {
      GameState.players = data.players;
      this.update();
    });

    SocketManager.on('game-started', (data) => {
      GameState.gameState = data.gameState;
      GameState.roles = data.roles;

      // Find my role
      const myRole = data.roles.find(r => r.id === GameState.playerId);
      GameState.myRole = myRole ? myRole.role : null;

      UI.showScreen('game');
      GameScreen.start();
    });

    SocketManager.on('return-to-lobby', (data) => {
      GameState.players = data.players;
      GameState.gameState = null;
      GameState.myRole = null;
      UI.showScreen('lobby');
      this.update();
    });
  },

  update() {
    // Update room code display
    document.getElementById('room-code-display').textContent = GameState.roomId;

    // Update player list
    const playerList = document.getElementById('player-list');
    playerList.innerHTML = '';

    GameState.players.forEach(player => {
      const div = document.createElement('div');
      div.className = 'player-item';

      const nameSpan = document.createElement('span');
      nameSpan.className = 'player-name';
      nameSpan.textContent = player.name;

      const statusSpan = document.createElement('span');
      statusSpan.className = 'player-status';

      if (player.id === GameState.playerId) {
        nameSpan.textContent += ' (You)';
      }

      // Show CPU indicator for bot players
      if (player.isBot) {
        statusSpan.textContent = 'CPU';
        statusSpan.classList.add('cpu');
      } else if (player.ready) {
        statusSpan.textContent = 'READY';
        statusSpan.classList.add('ready');
      } else {
        statusSpan.textContent = 'Waiting...';
        statusSpan.classList.add('waiting');
      }

      div.appendChild(nameSpan);
      div.appendChild(statusSpan);
      playerList.appendChild(div);
    });

    // Update buttons
    const readyBtn = document.getElementById('ready-btn');
    const startBtn = document.getElementById('start-btn');
    const lobbyMessage = document.getElementById('lobby-message');

    // Find current player
    const me = GameState.players.find(p => p.id === GameState.playerId);
    if (me && me.ready) {
      readyBtn.textContent = 'Not Ready';
      readyBtn.classList.remove('btn-secondary');
      readyBtn.classList.add('btn-primary');
    } else {
      readyBtn.textContent = 'Ready';
      readyBtn.classList.remove('btn-primary');
      readyBtn.classList.add('btn-secondary');
    }

    // Show start button only for host
    if (GameState.isHost) {
      startBtn.classList.remove('hidden');
      // Only check human players for ready status (bots are always ready)
      const humanPlayers = GameState.players.filter(p => !p.isBot);
      const allHumansReady = humanPlayers.every(p => p.ready);
      startBtn.disabled = !allHumansReady;

      if (!allHumansReady) {
        lobbyMessage.textContent = 'Click Ready to start...';
      } else {
        lobbyMessage.textContent = 'Ready to start!';
      }
    } else {
      startBtn.classList.add('hidden');
      lobbyMessage.textContent = 'Waiting for host to start the game...';
    }
  }
};

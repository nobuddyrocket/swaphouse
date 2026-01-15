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

      if (player.id === GameState.players.find(p => GameState.isHost && p.id === GameState.playerId)?.id ||
        (GameState.players[0] && player.id === GameState.players[0].id)) {
        if (player.id === (GameState.players[0]?.id)) {
          // Check if this player is actually the host
          const hostPlayer = GameState.players.find(p => p.id === GameState.playerId && GameState.isHost);
          if (!hostPlayer || hostPlayer.id !== player.id) {
            // This is another player who might be host
          }
        }
      }

      if (player.ready) {
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
      const allReady = GameState.players.every(p => p.ready);
      startBtn.disabled = !allReady || GameState.players.length < 2;

      if (GameState.players.length < 2) {
        lobbyMessage.textContent = 'Need at least 2 players to start';
      } else if (!allReady) {
        lobbyMessage.textContent = 'Waiting for all players to be ready...';
      } else {
        lobbyMessage.textContent = 'Ready to start!';
      }
    } else {
      startBtn.classList.add('hidden');
      lobbyMessage.textContent = 'Waiting for host to start the game...';
    }
  }
};

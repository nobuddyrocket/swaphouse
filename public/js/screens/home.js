// Home Screen Logic
const HomeScreen = {
  init() {
    this.bindEvents();
    this.setupSocketListeners();
  },

  bindEvents() {
    const createBtn = document.getElementById('create-room-btn');
    const joinBtn = document.getElementById('join-room-btn');
    const confirmJoinBtn = document.getElementById('confirm-join-btn');
    const joinForm = document.getElementById('join-form');

    createBtn.addEventListener('click', () => {
      const name = document.getElementById('player-name').value.trim();
      if (!name) {
        this.showError('Please enter your name');
        return;
      }
      GameState.playerName = name;
      SocketManager.emit('create-room', name);
    });

    joinBtn.addEventListener('click', () => {
      joinForm.classList.toggle('hidden');
    });

    confirmJoinBtn.addEventListener('click', () => {
      const name = document.getElementById('player-name').value.trim();
      const roomCode = document.getElementById('room-code').value.trim().toUpperCase();

      if (!name) {
        this.showError('Please enter your name');
        return;
      }
      if (!roomCode) {
        this.showError('Please enter a room code');
        return;
      }

      GameState.playerName = name;
      SocketManager.emit('join-room', { roomId: roomCode, playerName: name });
    });
  },

  setupSocketListeners() {
    SocketManager.on('room-created', (data) => {
      GameState.roomId = data.roomId;
      GameState.playerId = data.playerId;
      GameState.isHost = true;
      GameState.players = data.players;
      UI.showScreen('lobby');
      LobbyScreen.update();
    });

    SocketManager.on('room-joined', (data) => {
      GameState.roomId = data.roomId;
      GameState.playerId = data.playerId;
      GameState.isHost = data.hostId === data.playerId;
      GameState.players = data.players;
      UI.showScreen('lobby');
      LobbyScreen.update();
    });

    SocketManager.on('room-error', (error) => {
      this.showError(error);
    });
  },

  showError(message) {
    const errorEl = document.getElementById('error-message');
    errorEl.textContent = message;
    errorEl.classList.remove('hidden');
    setTimeout(() => {
      errorEl.classList.add('hidden');
    }, 3000);
  }
};

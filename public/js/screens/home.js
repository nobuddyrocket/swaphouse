// Home Screen Logic
const HomeScreen = {
  selectedPlayerCount: 2,

  init() {
    this.bindEvents();
    this.setupSocketListeners();
  },

  bindEvents() {
    const createBtn = document.getElementById('create-room-btn');
    const joinBtn = document.getElementById('join-room-btn');
    const confirmJoinBtn = document.getElementById('confirm-join-btn');
    const confirmCreateBtn = document.getElementById('confirm-create-btn');
    const cancelCreateBtn = document.getElementById('cancel-create-btn');
    const joinForm = document.getElementById('join-form');
    const playerCountSelect = document.getElementById('player-count-select');
    const mainButtons = document.getElementById('main-buttons');
    const countBtns = document.querySelectorAll('.count-btn');

    // Show player count selection when clicking Create Room
    createBtn.addEventListener('click', () => {
      const name = document.getElementById('player-name').value.trim();
      if (!name) {
        this.showError('Please enter your name');
        return;
      }
      mainButtons.classList.add('hidden');
      joinForm.classList.add('hidden');
      playerCountSelect.classList.remove('hidden');
    });

    // Player count buttons
    countBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        countBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        this.selectedPlayerCount = parseInt(btn.dataset.count);
      });
    });

    // Select default (2 players)
    countBtns[1].classList.add('selected');

    // Confirm create room
    confirmCreateBtn.addEventListener('click', () => {
      const name = document.getElementById('player-name').value.trim();
      GameState.playerName = name;
      SocketManager.emit('create-room', {
        playerName: name,
        totalPlayers: this.selectedPlayerCount
      });
    });

    // Cancel create
    cancelCreateBtn.addEventListener('click', () => {
      playerCountSelect.classList.add('hidden');
      mainButtons.classList.remove('hidden');
    });

    joinBtn.addEventListener('click', () => {
      playerCountSelect.classList.add('hidden');
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
      GameState.totalPlayers = data.totalPlayers;
      UI.showScreen('lobby');
      LobbyScreen.update();
    });

    SocketManager.on('room-joined', (data) => {
      GameState.roomId = data.roomId;
      GameState.playerId = data.playerId;
      GameState.isHost = data.hostId === data.playerId;
      GameState.players = data.players;
      GameState.totalPlayers = data.totalPlayers;
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

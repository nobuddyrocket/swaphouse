// Main Entry Point - Initialize all modules

// Global Game State
const GameState = {
  playerId: null,
  playerName: null,
  roomId: null,
  isHost: false,
  players: [],
  myRole: null,
  roles: [],
  gameState: null
};

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Initialize socket connection
  SocketManager.init();

  // Initialize screens
  HomeScreen.init();
  LobbyScreen.init();
  GameScreen.init();

  // Show home screen
  UI.showScreen('home');

  console.log('SwapHouse initialized!');
});

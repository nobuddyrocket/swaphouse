const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');
const RoomManager = require('./roomManager');
const GameLoop = require('./gameLoop');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Serve shared constants
app.use('/shared', express.static(path.join(__dirname, '../shared')));

// Initialize managers
const roomManager = new RoomManager();
const gameLoops = new Map(); // roomId -> GameLoop instance

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Player connected: ${socket.id}`);

  // Create room
  socket.on('create-room', (data) => {
    // Support both old format (string) and new format (object)
    const playerName = typeof data === 'string' ? data : data.playerName;
    const totalPlayers = typeof data === 'object' ? data.totalPlayers : 2;

    const room = roomManager.createRoom(socket.id, playerName, totalPlayers);
    socket.join(room.roomId);
    socket.emit('room-created', {
      roomId: room.roomId,
      playerId: socket.id,
      players: room.players,
      totalPlayers: room.totalPlayers
    });
    console.log(`Room created: ${room.roomId} by ${playerName} (${totalPlayers} players)`);
  });

  // Join room
  socket.on('join-room', ({ roomId, playerName }) => {
    const result = roomManager.joinRoom(roomId, socket.id, playerName);

    if (result.error) {
      socket.emit('room-error', result.error);
      return;
    }

    socket.join(roomId);
    socket.emit('room-joined', {
      roomId: roomId,
      playerId: socket.id,
      players: result.room.players,
      hostId: result.room.hostId,
      totalPlayers: result.room.totalPlayers
    });

    // Notify others in room
    socket.to(roomId).emit('player-joined', {
      players: result.room.players
    });

    console.log(`${playerName} joined room: ${roomId}`);
  });

  // Player ready toggle
  socket.on('player-ready', () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return;

    roomManager.toggleReady(socket.id);
    io.to(room.roomId).emit('player-list-update', {
      players: room.players
    });
  });

  // Start game (host only)
  socket.on('start-game', () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return;
    if (room.hostId !== socket.id) return;

    // Check if all HUMAN players are ready (bots are always ready)
    const humanPlayers = room.players.filter(p => !p.isBot);
    const allHumansReady = humanPlayers.every(p => p.ready);
    if (!allHumansReady) {
      socket.emit('room-error', 'All players must be ready');
      return;
    }

    // Start the game
    const gameState = roomManager.startGame(room.roomId);

    // Create game loop for this room
    const gameLoop = new GameLoop(room, io, roomManager, () => {
      // Cleanup callback when game ends
      gameLoops.delete(room.roomId);
    });
    gameLoops.set(room.roomId, gameLoop);
    gameLoop.start();

    // Notify all players
    io.to(room.roomId).emit('game-started', {
      gameState: gameState,
      roles: room.players.map(p => ({ id: p.id, role: p.role }))
    });

    console.log(`Game started in room: ${room.roomId}`);
  });

  // Player input
  socket.on('player-input', (input) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room || room.phase !== 'playing') return;

    const gameLoop = gameLoops.get(room.roomId);
    if (gameLoop) {
      gameLoop.handleInput(socket.id, input);
    }
  });

  // Vote on NPC demand
  socket.on('vote', (vote) => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return;

    const gameLoop = gameLoops.get(room.roomId);
    if (gameLoop) {
      gameLoop.handleVote(socket.id, vote);
    }
  });

  // Play again (host only)
  socket.on('play-again', () => {
    const room = roomManager.getRoomByPlayer(socket.id);
    if (!room) return;
    if (room.hostId !== socket.id) return;

    // Reset room to lobby
    roomManager.resetRoom(room.roomId);

    io.to(room.roomId).emit('return-to-lobby', {
      players: room.players
    });
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log(`Player disconnected: ${socket.id}`);
    const room = roomManager.getRoomByPlayer(socket.id);

    if (room) {
      const wasHost = room.hostId === socket.id;
      roomManager.removePlayer(socket.id);

      // If game is running and too few players, end it
      if (room.phase === 'playing' && room.players.length < 2) {
        const gameLoop = gameLoops.get(room.roomId);
        if (gameLoop) {
          gameLoop.endGame('not-enough-players');
          gameLoops.delete(room.roomId);
        }
      } else if (room.players.length > 0) {
        // Notify remaining players
        io.to(room.roomId).emit('player-left', {
          players: room.players,
          hostId: room.hostId,
          wasHost: wasHost
        });

        // If game is running, recalculate roles
        if (room.phase === 'playing') {
          const gameLoop = gameLoops.get(room.roomId);
          if (gameLoop) {
            gameLoop.recalculateRoles();
          }
        }
      } else {
        // Room is empty, clean up
        gameLoops.delete(room.roomId);
        roomManager.deleteRoom(room.roomId);
      }
    }
  });
});

server.listen(PORT, () => {
  console.log(`SwapHouse server running on http://localhost:${PORT}`);
});

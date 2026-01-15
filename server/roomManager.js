const CONSTANTS = require('../shared/constants');
const RoleManager = require('./roleManager');
const { createInitialGameState } = require('./gameLoop');

class RoomManager {
  constructor() {
    this.rooms = new Map();
    this.playerRoomMap = new Map(); // playerId -> roomId
  }

  generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    // Make sure code is unique
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }

  createRoom(hostId, hostName) {
    const roomId = this.generateRoomCode();
    const room = {
      roomId: roomId,
      players: [{
        id: hostId,
        name: hostName || 'Player 1',
        connected: true,
        ready: false,
        role: null
      }],
      hostId: hostId,
      phase: CONSTANTS.PHASES.LOBBY,
      gameState: null,
      stats: {
        timesCaught: 0,
        itemsSacrificed: 0
      }
    };

    this.rooms.set(roomId, room);
    this.playerRoomMap.set(hostId, roomId);

    return room;
  }

  joinRoom(roomId, playerId, playerName) {
    const room = this.rooms.get(roomId.toUpperCase());

    if (!room) {
      return { error: 'Room not found' };
    }

    if (room.phase !== CONSTANTS.PHASES.LOBBY) {
      return { error: 'Game already in progress' };
    }

    if (room.players.length >= 5) {
      return { error: 'Room is full (max 5 players)' };
    }

    // Check if player name is taken
    const existingNames = room.players.map(p => p.name.toLowerCase());
    let finalName = playerName || `Player ${room.players.length + 1}`;
    if (existingNames.includes(finalName.toLowerCase())) {
      finalName = `${finalName}${room.players.length + 1}`;
    }

    room.players.push({
      id: playerId,
      name: finalName,
      connected: true,
      ready: false,
      role: null
    });

    this.playerRoomMap.set(playerId, roomId.toUpperCase());

    return { room };
  }

  toggleReady(playerId) {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.ready = !player.ready;
    }

    return room;
  }

  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.phase = CONSTANTS.PHASES.PLAYING;

    // Assign roles
    RoleManager.assignRoles(room.players);

    // Create initial game state
    room.gameState = createInitialGameState();

    // Reset stats
    room.stats = {
      timesCaught: 0,
      itemsSacrificed: 0,
      startTime: Date.now()
    };

    return room.gameState;
  }

  getRoomByPlayer(playerId) {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return null;
    return this.rooms.get(roomId);
  }

  getRoom(roomId) {
    return this.rooms.get(roomId);
  }

  removePlayer(playerId) {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return;

    const room = this.rooms.get(roomId);
    if (!room) return;

    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) return;

    room.players.splice(playerIndex, 1);
    this.playerRoomMap.delete(playerId);

    // If host left, assign new host
    if (room.hostId === playerId && room.players.length > 0) {
      room.hostId = room.players[0].id;
    }

    return room;
  }

  resetRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.phase = CONSTANTS.PHASES.LOBBY;
    room.gameState = null;
    room.players.forEach(p => {
      p.ready = false;
      p.role = null;
    });

    return room;
  }

  deleteRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (room) {
      room.players.forEach(p => {
        this.playerRoomMap.delete(p.id);
      });
      this.rooms.delete(roomId);
    }
  }

  updateRoles(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    RoleManager.assignRoles(room.players);
    return room.players.map(p => ({ id: p.id, role: p.role }));
  }
}

module.exports = RoomManager;

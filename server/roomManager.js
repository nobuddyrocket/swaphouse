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

  generateBotId() {
    return 'bot_' + Math.random().toString(36).substr(2, 9);
  }

  createRoom(hostId, hostName, totalPlayers = 2) {
    const roomId = this.generateRoomCode();
    const room = {
      roomId: roomId,
      players: [{
        id: hostId,
        name: hostName || 'Player 1',
        connected: true,
        ready: false,
        role: null,
        isBot: false
      }],
      hostId: hostId,
      phase: CONSTANTS.PHASES.LOBBY,
      gameState: null,
      totalPlayers: totalPlayers,
      stats: {
        timesCaught: 0,
        itemsSacrificed: 0
      }
    };

    // Add CPU bots if single player mode
    if (totalPlayers === 1) {
      // Solo mode: 1 human + 1 CPU
      const botId = this.generateBotId();
      room.players.push({
        id: botId,
        name: 'CPU Partner',
        connected: true,
        ready: true,
        role: null,
        isBot: true
      });
      room.totalPlayers = 2; // Actually 2 players (1 human + 1 bot)
    }

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

    // Count human players
    const humanPlayers = room.players.filter(p => !p.isBot).length;
    if (humanPlayers >= room.totalPlayers) {
      return { error: 'Room is full' };
    }

    if (room.players.length >= 5) {
      return { error: 'Room is full (max 5 players)' };
    }

    // Check if player name is taken
    const existingNames = room.players.map(p => p.name.toLowerCase());
    let finalName = playerName || `Player ${humanPlayers + 1}`;
    if (existingNames.includes(finalName.toLowerCase())) {
      finalName = `${finalName}${humanPlayers + 1}`;
    }

    room.players.push({
      id: playerId,
      name: finalName,
      connected: true,
      ready: false,
      role: null,
      isBot: false
    });

    this.playerRoomMap.set(playerId, roomId.toUpperCase());

    return { room };
  }

  addBotsToFillRoom(room) {
    // Add bots to fill remaining slots based on totalPlayers setting
    const humanCount = room.players.filter(p => !p.isBot).length;
    const botsNeeded = room.totalPlayers - humanCount;

    // Remove existing bots first
    room.players = room.players.filter(p => !p.isBot);

    // Add new bots
    for (let i = 0; i < botsNeeded; i++) {
      const botId = this.generateBotId();
      room.players.push({
        id: botId,
        name: `CPU ${i + 1}`,
        connected: true,
        ready: true,
        role: null,
        isBot: true
      });
    }
  }

  toggleReady(playerId) {
    const roomId = this.playerRoomMap.get(playerId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const player = room.players.find(p => p.id === playerId);
    if (player && !player.isBot) {
      player.ready = !player.ready;
    }

    return room;
  }

  startGame(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    // Add bots to fill room before starting
    this.addBotsToFillRoom(room);

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

    // If host left, assign new host (only from human players)
    if (room.hostId === playerId && room.players.length > 0) {
      const newHost = room.players.find(p => !p.isBot);
      if (newHost) {
        room.hostId = newHost.id;
      }
    }

    return room;
  }

  resetRoom(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    room.phase = CONSTANTS.PHASES.LOBBY;
    room.gameState = null;

    // Remove bots and reset human players
    room.players = room.players.filter(p => !p.isBot);
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
        if (!p.isBot) {
          this.playerRoomMap.delete(p.id);
        }
      });
      this.rooms.delete(roomId);
    }
  }

  updateRoles(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return;

    RoleManager.assignRoles(room.players);
    return room.players.map(p => ({ id: p.id, role: p.role, isBot: p.isBot }));
  }

  getBots(roomId) {
    const room = this.rooms.get(roomId);
    if (!room) return [];
    return room.players.filter(p => p.isBot);
  }
}

module.exports = RoomManager;

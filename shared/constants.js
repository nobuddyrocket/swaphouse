// Game Constants - Shared between server and client

const CONSTANTS = {
  // Roles
  ROLES: {
    MOVE: 'MOVE',
    INTERACT: 'INTERACT',
    DASH: 'DASH',
    SPRINT: 'SPRINT',
    DROP: 'DROP'
  },

  // Role assignments by player count
  ROLE_ASSIGNMENTS: {
    2: ['MOVE', 'INTERACT'],
    3: ['MOVE', 'INTERACT', 'DASH'],
    4: ['MOVE', 'INTERACT', 'DASH', 'SPRINT'],
    5: ['MOVE', 'INTERACT', 'DASH', 'SPRINT', 'DROP']
  },

  // Items
  ITEMS: {
    BATTERY: 'BATTERY',
    BULB: 'BULB',
    SWITCH_HANDLE: 'SWITCH_HANDLE'
  },

  // Timing (in milliseconds)
  MATCH_DURATION: 360000,    // 6 minutes
  SWAP_INTERVAL: 90000,      // 90 seconds
  TICK_RATE: 20,             // 20 ticks per second
  TICK_INTERVAL: 50,         // 50ms per tick
  VOTE_DURATION: 5000,       // 5 seconds to vote
  NPC_PENALTY_TIME: 15000,   // -15 seconds penalty

  // Physics
  PLAYER_SPEED: 3,
  PLAYER_SPRINT_SPEED: 5,
  PLAYER_DASH_SPEED: 12,
  PLAYER_DASH_DURATION: 150, // ms
  NPC_SPEED: 2,

  // Distances
  PICKUP_RADIUS: 35,
  CATCH_RADIUS: 40,
  EXIT_RADIUS: 50,

  // Inventory
  INVENTORY_SIZE: 2,

  // Game phases
  PHASES: {
    LOBBY: 'lobby',
    PLAYING: 'playing',
    CAUGHT: 'caught',
    VOTING: 'voting',
    WON: 'won',
    LOST: 'lost',
    ENDED: 'ended'
  },

  // Map dimensions
  MAP: {
    TILE_SIZE: 50,
    ROOM_WIDTH: 200,
    ROOM_HEIGHT: 150
  }
};

// Export for Node.js (server)
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CONSTANTS;
}

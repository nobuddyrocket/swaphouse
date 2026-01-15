// Map Data - Room layouts and spawn points
const CONSTANTS = require('../shared/constants');

const MAP_DATA = {
  // Map dimensions
  width: 700,
  height: 550,

  // Rooms definition
  rooms: [
    { id: 'start', name: 'Start Room', x: 50, y: 50, width: 180, height: 140, color: '#2a4858' },
    { id: 'kitchen', name: 'Kitchen', x: 260, y: 50, width: 180, height: 140, color: '#3d5a5a' },
    { id: 'bedroom', name: 'Bedroom', x: 470, y: 50, width: 180, height: 140, color: '#4a3f55' },
    { id: 'hallway', name: 'Hallway', x: 50, y: 220, width: 180, height: 140, color: '#2d3436' },
    { id: 'storage', name: 'Storage', x: 260, y: 220, width: 180, height: 140, color: '#4a4a4a' },
    { id: 'fuse', name: 'Fuse Room', x: 470, y: 220, width: 180, height: 140, color: '#5a3a3a' },
    { id: 'exit', name: 'Exit', x: 470, y: 390, width: 180, height: 120, color: '#1a5a3a' }
  ],

  // Walls (outer boundaries and internal walls)
  walls: [
    // Outer walls
    { x: 40, y: 40, width: 620, height: 10 },      // Top wall row 1
    { x: 40, y: 40, width: 10, height: 330 },      // Left wall col 1
    { x: 40, y: 360, width: 420, height: 10 },     // Bottom wall row 1-2
    { x: 450, y: 200, width: 10, height: 170 },    // Middle-bottom divider
    { x: 650, y: 40, width: 10, height: 330 },     // Right wall rows 1-2
    { x: 460, y: 380, width: 10, height: 140 },    // Exit left wall
    { x: 460, y: 510, width: 200, height: 10 },    // Exit bottom wall
    { x: 650, y: 370, width: 10, height: 150 },    // Exit right wall

    // Internal walls - Row 1 dividers
    { x: 230, y: 40, width: 10, height: 100 },     // Start-Kitchen wall top
    { x: 230, y: 160, width: 10, height: 40 },     // Start-Kitchen wall bottom
    { x: 440, y: 40, width: 10, height: 100 },     // Kitchen-Bedroom wall top
    { x: 440, y: 160, width: 10, height: 40 },     // Kitchen-Bedroom wall bottom

    // Internal walls - Row 2 dividers
    { x: 230, y: 200, width: 10, height: 100 },    // Hallway-Storage wall top
    { x: 230, y: 320, width: 10, height: 50 },     // Hallway-Storage wall bottom
    { x: 440, y: 200, width: 10, height: 100 },    // Storage-Fuse wall top
    { x: 440, y: 320, width: 10, height: 50 },     // Storage-Fuse wall bottom

    // Horizontal dividers between rows
    { x: 40, y: 200, width: 100, height: 10 },     // Start-Hallway wall left
    { x: 160, y: 200, width: 80, height: 10 },     // Start-Hallway wall right
    { x: 240, y: 200, width: 100, height: 10 },    // Kitchen-Storage wall left
    { x: 360, y: 200, width: 90, height: 10 },     // Kitchen-Storage wall right
    { x: 450, y: 200, width: 100, height: 10 },    // Bedroom-Fuse wall left
    { x: 570, y: 200, width: 90, height: 10 },     // Bedroom-Fuse wall right

    // Fuse to Exit divider
    { x: 450, y: 370, width: 100, height: 10 },    // Fuse-Exit wall left
    { x: 570, y: 370, width: 90, height: 10 }      // Fuse-Exit wall right
  ],

  // Doors (gaps in walls for passage)
  doors: [
    // Row 1 horizontal doors
    { x: 230, y: 100, width: 10, height: 60, connects: ['start', 'kitchen'] },
    { x: 440, y: 100, width: 10, height: 60, connects: ['kitchen', 'bedroom'] },

    // Row 2 horizontal doors
    { x: 230, y: 220, width: 10, height: 80, connects: ['hallway', 'storage'] },
    { x: 440, y: 220, width: 10, height: 80, connects: ['storage', 'fuse'] },

    // Vertical doors (row 1 to row 2)
    { x: 100, y: 200, width: 60, height: 10, connects: ['start', 'hallway'] },
    { x: 300, y: 200, width: 60, height: 10, connects: ['kitchen', 'storage'] },
    { x: 510, y: 200, width: 60, height: 10, connects: ['bedroom', 'fuse'] },

    // Exit door
    { x: 510, y: 370, width: 60, height: 10, connects: ['fuse', 'exit'] }
  ],

  // Item spawn points
  spawnPoints: [
    { x: 100, y: 100, room: 'start', allowedItems: ['BATTERY', 'BULB'] },
    { x: 300, y: 100, room: 'kitchen', allowedItems: ['BATTERY', 'SWITCH_HANDLE'] },
    { x: 510, y: 100, room: 'bedroom', allowedItems: ['BULB', 'SWITCH_HANDLE'] },
    { x: 100, y: 280, room: 'hallway', allowedItems: ['BATTERY', 'BULB'] },
    { x: 300, y: 280, room: 'storage', allowedItems: ['BATTERY', 'BULB', 'SWITCH_HANDLE'] },
    { x: 510, y: 280, room: 'fuse', allowedItems: ['SWITCH_HANDLE', 'BULB'] }
  ],

  // Player start position
  playerStart: { x: 140, y: 120 },

  // Exit zone (where player needs to go after installing all parts)
  exitZone: { x: 520, y: 430, width: 80, height: 60 },

  // Exit panel (where parts are installed)
  exitPanel: { x: 480, y: 400, width: 40, height: 80 },

  // NPC patrol path
  npcPath: [
    { x: 300, y: 100 },   // Kitchen
    { x: 510, y: 100 },   // Bedroom
    { x: 510, y: 280 },   // Fuse Room
    { x: 300, y: 280 },   // Storage
    { x: 100, y: 280 },   // Hallway
    { x: 100, y: 100 },   // Start
    { x: 300, y: 100 }    // Back to Kitchen
  ],

  // NPC start position
  npcStart: { x: 300, y: 280, pathIndex: 3 }
};

// Helper functions
function getRandomSpawnPoints() {
  const items = ['BATTERY', 'BULB', 'SWITCH_HANDLE'];
  const itemPositions = [];
  const usedSpawns = new Set();

  items.forEach(item => {
    // Find valid spawn points for this item
    const validSpawns = MAP_DATA.spawnPoints.filter((sp, idx) =>
      sp.allowedItems.includes(item) && !usedSpawns.has(idx)
    );

    if (validSpawns.length > 0) {
      const randomIndex = Math.floor(Math.random() * validSpawns.length);
      const spawn = validSpawns[randomIndex];
      const spawnIdx = MAP_DATA.spawnPoints.indexOf(spawn);
      usedSpawns.add(spawnIdx);

      itemPositions.push({
        type: item,
        x: spawn.x + (Math.random() * 40 - 20),
        y: spawn.y + (Math.random() * 40 - 20),
        isCollected: false
      });
    }
  });

  return itemPositions;
}

function getRandomSpawnPoint() {
  const idx = Math.floor(Math.random() * MAP_DATA.spawnPoints.length);
  const spawn = MAP_DATA.spawnPoints[idx];
  return {
    x: spawn.x + (Math.random() * 40 - 20),
    y: spawn.y + (Math.random() * 40 - 20)
  };
}

module.exports = {
  MAP_DATA,
  getRandomSpawnPoints,
  getRandomSpawnPoint
};

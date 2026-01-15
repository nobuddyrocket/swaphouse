// NPC - The Collector patrol and catch logic
const CONSTANTS = require('../shared/constants');
const { MAP_DATA } = require('./mapData');

const NPC = {
  update(npc, delta) {
    const path = MAP_DATA.npcPath;
    const target = path[npc.currentPathIndex];

    // Calculate direction to target
    const dx = target.x - npc.x;
    const dy = target.y - npc.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < 5) {
      // Reached target, move to next waypoint
      npc.currentPathIndex = (npc.currentPathIndex + 1) % path.length;
    } else {
      // Move toward target
      const speed = CONSTANTS.NPC_SPEED;
      npc.x += (dx / dist) * speed;
      npc.y += (dy / dist) * speed;
    }
  },

  checkCatch(npc, player) {
    const dist = Math.sqrt(
      Math.pow(npc.x - player.x, 2) +
      Math.pow(npc.y - player.y, 2)
    );

    return dist < CONSTANTS.CATCH_RADIUS;
  },

  resetPosition(npc) {
    npc.x = MAP_DATA.npcStart.x;
    npc.y = MAP_DATA.npcStart.y;
    npc.currentPathIndex = MAP_DATA.npcStart.pathIndex;
  }
};

module.exports = NPC;
